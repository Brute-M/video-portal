import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
    Trash2,
    CreditCard,
    Loader2,
    Upload,
    Plus,
    Video,
    Check,
    Eye,
    FileText,
    RefreshCw,
    Lock as LockIcon,
    Info,
    Activity,
    Download
} from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SelectGroup,
    SelectLabel,
} from "@/components/ui/select";
import { uploadVideo, getVideos, deleteVideo, getVideoById, saveVideoAnalysis } from "@/apihelper/video";
import { verifyPayment, downloadInvoiceAPI, createRazorpayOrder, verifyRazorpayPayment } from "@/apihelper/payment";
import { getProfile } from "@/apihelper/auth";
import { analyzeVideo } from "@/apihelper/analysis";
import { v4 as uuidv4 } from "uuid";
import { loadRazorpay } from "@/utils/loadRazorpay";
import { AnalysisResult } from "@/components/AnalysisResult";
import { useTranslation } from "react-i18next";

interface VideoFile {
    id: string;
    name: string;
    size: number;
    progress: number;
    status: "uploading" | "completed" | "pending-payment" | "analyzing";
    analysis?: any;
    role?: string;
}

const Videos = () => {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [videos, setVideos] = useState<VideoFile[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [selectedVideo, setSelectedVideo] = useState<any | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [showAnalysisModal, setShowAnalysisModal] = useState(false);
    const [selectedAnalysis, setSelectedAnalysis] = useState<any>(null);
    const [role, setRole] = useState<string>("");

    const navigate = useNavigate();

    const changeVideoInputRef = useRef<HTMLInputElement>(null);
    const analysisRef = useRef<HTMLDivElement>(null);
    const [videoToChangeId, setVideoToChangeId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [isProfileLoading, setIsProfileLoading] = useState(true);

    // Define Role Categories
    useEffect(() => {
        fetchVideos();
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        setIsProfileLoading(true);
        try {
            const response = await getProfile();
            const profile = response.data?.data || response.data;
            setUserProfile(profile);

            // Set role from profile if available
            if (profile?.playerRole) {
                setRole(profile.playerRole);
            } else {
                setRole("Batsman"); // Default fallback
            }
        } catch (error) {
            console.error("Failed to fetch profile", error);
            setRole("Batsman"); // Fallback on error
        } finally {
            setIsProfileLoading(false);
        }
    };

    // Cleanup video URLs on unmount
    useEffect(() => {
        return () => {
            if (selectedVideo?.path && selectedVideo.path.startsWith('blob:')) {
                URL.revokeObjectURL(selectedVideo.path);
            }
        };
    }, [selectedVideo]);

    const fetchVideos = async () => {
        setIsLoading(true);
        try {
            const response = await getVideos();
            const list = Array.isArray(response) ? response : (response.videos || response.data || []);

            const mappedVideos: VideoFile[] = list.map((v: any) => ({
                id: v._id || v.id,
                name: v.originalName || v.title || v.name || v.filename || "Untitled Video",
                size: v.size || 0,
                progress: 100,
                status: v.status === 'pending_payment' ? 'pending-payment' : (v.status || "completed"),
                analysis: v.analysis,
                role: v.role
            }));

            setVideos(prev => {
                const uploading = prev.filter(p => p.status === 'uploading' || p.status === 'analyzing');
                const existingIds = new Set(uploading.map(v => v.id));
                const uniqueMapped = mappedVideos.filter(v => !existingIds.has(v.id));
                return [...uploading, ...uniqueMapped];
            });
        } catch (error) {
            console.error("Failed to fetch videos", error);
            toast({
                variant: "destructive",
                title: "Fetch Failed",
                description: "Could not load your videos. Please refresh the page.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const validateFile = (file: File): boolean => {
        const maxSize = 1024 * 1024 * 1024; // 1GB

        if (!file.type.startsWith('video/')) {
            toast({
                variant: "destructive",
                title: "Invalid File Type",
                description: "Please upload a valid video file.",
            });
            return false;
        }

        if (file.size > maxSize) {
            toast({
                variant: "destructive",
                title: "File Too Large",
                description: "Video must be under 1GB in size.",
            });
            return false;
        }

        return true;
    };

    const handleDeleteVideo = async (id: string) => {
        try {
            await deleteVideo(id);
            setVideos(prev => prev.filter(v => v.id !== id));
            toast({
                title: "Video Deleted",
                description: "The video has been successfully removed.",
            });
        } catch (error: any) {
            console.error("Delete failed", error);
            toast({
                variant: "destructive",
                title: "Delete Failed",
                description: error?.response?.data?.message || "Could not delete the video. Please try again.",
            });
        }
    };

    const handleViewVideo = async (id: string) => {
        try {
            const response = await getVideoById(id);
            const videoData = response.data || response;
            setSelectedVideo(videoData);
            setIsPreviewOpen(true);
        } catch (error: any) {
            console.error("Failed to fetch video details", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: error?.response?.data?.message || "Could not fetch video details.",
            });
        }
    };

    const handleViewAnalysis = (video: VideoFile) => {
        if (!video.analysis) {
            toast({
                title: "No Analysis Found",
                description: "This video has not been analyzed yet.",
            });
            return;
        }
        // Normalize object structure if needed, matching AnalysisResult expectation
        const analysisData = {
            role: video.role,
            analysis: video.analysis
        };
        setSelectedAnalysis(analysisData);
        // Scroll to analysis section with a slight delay to ensure render
        setTimeout(() => {
            analysisRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    const handleDownloadReport = (video: VideoFile) => {
        // Ensure this video's analysis is showing
        handleViewAnalysis(video);

        // Wait for render/scroll then print
        setTimeout(() => {
            window.print();
        }, 500);
    };

    // Auto-show analysis for the latest analyzed video
    useEffect(() => {
        if (!isLoading && videos.length > 0 && !selectedAnalysis) {
            // Find first video with analysis (assuming sorted recent first? usually logic is reversed in display but let's check sorting)
            // Backend returns sort({ createdAt: -1 }), so first item is latest.
            const latestAnalyzed = videos.find(v => v.analysis);
            if (latestAnalyzed) {
                const analysisData = {
                    role: latestAnalyzed.role,
                    analysis: latestAnalyzed.analysis
                };
                setSelectedAnalysis(analysisData);
            }
        }
    }, [isLoading, videos]);

    const handleChangeVideo = (id: string) => {
        setVideoToChangeId(id);
        if (changeVideoInputRef.current) {
            changeVideoInputRef.current.click();
        }
    };

    const handleRetryAnalysis = (id: string) => {
        toast({
            title: "Retry Analysis",
            description: "Please select the video file again to restart the upload and analysis process.",
        });
        handleChangeVideo(id);
    };

    const handleFileChangeForUpdate = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0 && videoToChangeId) {
            const file = files[0];

            if (!validateFile(file)) {
                e.target.value = "";
                setVideoToChangeId(null);
                return;
            }

            try {
                await deleteVideo(videoToChangeId);
                setVideos(prev => prev.filter(v => v.id !== videoToChangeId));

                toast({
                    title: "Updating Video",
                    description: "Old video removed. Uploading new video...",
                });

                handleUpload(file);
            } catch (error: any) {
                console.error("Failed to change video", error);
                toast({
                    variant: "destructive",
                    title: "Change Failed",
                    description: error?.response?.data?.message || "Could not remove the old video.",
                });
            } finally {
                setVideoToChangeId(null);
                e.target.value = "";
            }
        }
    };

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleUpload = async (file: File) => {
        if (!validateFile(file)) return;

        const newVideo: VideoFile = {
            id: uuidv4(),
            name: file.name,
            size: file.size,
            progress: 0,
            status: "uploading",
            role: role
        };

        setVideos((prev) => [...prev, newVideo]);

        const formData = new FormData();
        formData.append('video', file);

        try {
            // 1. Upload Video
            const response = await uploadVideo(formData, (progressEvent) => {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
                setVideos((prev) =>
                    prev.map((v) =>
                        v.id === newVideo.id ? { ...v, progress: percentCompleted } : v
                    )
                );
            });

            const serverId = response.id || response._id ||
                response.video?.id || response.video?._id ||
                response.data?.id || response.data?._id ||
                response.data?.videoId ||
                response.newItem?._id || response.createdVideo?._id ||
                response.upload?._id;

            if (!serverId) {
                console.error("CRITICAL: Could not find video ID in upload response. Response:", response);
                throw new Error("Server did not return a valid video ID");
            }

            const serverStatus = response.status || response.data?.status || 'pending-payment';
            const isLandingPageUser = response.isFromLandingPage || response.data?.isFromLandingPage;

            toast({
                title: "Upload Successful",
                description: "Video uploaded. Starting analysis...",
            });

            // Update status to analyzing
            setVideos((prev) =>
                prev.map((v) =>
                    v.id === newVideo.id ? { ...v, status: 'analyzing', id: serverId, progress: 100 } : v
                )
            );

            // 2. Analyze Video
            try {
                // Determine generic category for analysis API
                let analysisCategory = "batsman";
                // Simple mapping based on the new 4 roles
                const r = role || "";
                if (r === "Bowler") analysisCategory = "bowler";
                else if (r === "Wicket Keeper") analysisCategory = "wicket_keeper";
                else analysisCategory = "batsman"; // Covers Batsman and All-Rounder

                const analysisFormData = new FormData();
                analysisFormData.append("video", file);
                analysisFormData.append("role", analysisCategory);

                const analysisRes = await analyzeVideo(analysisFormData);

                if (analysisRes.success && analysisRes.data) {
                    // 3. Save Analysis
                    // The analysis structure from API seems to be { success: true, data: { role, analysis: {...} } }
                    // We only want to save the 'analysis' part often, but let's save what the API returns or just the analysis object
                    const analysisToSave = analysisRes.data.analysis || analysisRes.data;

                    await saveVideoAnalysis(serverId, {
                        analysis: analysisToSave,
                        role: role
                    });

                    toast({
                        title: "Analysis Complete",
                        description: "Video analysis has been completed and saved.",
                    });

                    setVideos((prev) =>
                        prev.map((v) =>
                            v.id === serverId ? {
                                ...v,
                                status: serverStatus === 'completed' ? 'completed' : 'pending-payment',
                                analysis: analysisToSave,
                                role: role
                            } : v
                        )
                    );
                } else {
                    throw new Error("Analysis API returned unsuccessul response");
                }

            } catch (analysisError) {
                console.error("Analysis failed", analysisError);
                toast({
                    variant: "destructive",
                    title: "Analysis Failed",
                    description: "Video uploaded but analysis failed. You can try again later.",
                });

                // Still mark video as uploaded
                setVideos((prev) =>
                    prev.map((v) =>
                        v.id === serverId ? { ...v, status: serverStatus === 'completed' ? 'completed' : 'pending-payment' } : v
                    )
                );
            }

            setCurrentVideoId(serverId);
            if (!userProfile?.isPaid) {
                setShowPaymentModal(true);
            }

        } catch (error: any) {
            console.error("Upload failed", error);
            toast({
                variant: "destructive",
                title: "Upload Failed",
                description: error?.response?.data?.message || error.message || "There was an error uploading your video.",
            });
            setVideos((prev) => prev.filter(v => v.id !== newVideo.id));
        }
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files).filter((file) =>
            file.type.startsWith("video/")
        );

        if (files.length === 0) {
            toast({
                variant: "destructive",
                title: "No Video Files",
                description: "Please drop valid video files.",
            });
            return;
        }

        files.forEach((file) => {
            handleUpload(file);
        });
    }, [role]); // Dependent on role state

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []).filter((file) =>
            file.type.startsWith("video/")
        );

        if (files.length === 0) {
            toast({
                variant: "destructive",
                title: "No Video Files",
                description: "Please select valid video files.",
            });
            return;
        }

        files.forEach((file) => {
            handleUpload(file);
        });

        e.target.value = "";
    };

    const handleRazorpayPayment = async () => {
        if (!currentVideoId) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "No video selected for payment.",
            });
            return;
        }
        // Meta Pixel: InitiateCheckout — fire once on button click, before payment completes
        import('react-facebook-pixel').then((x) => x.default.track('InitiateCheckout', {
            value: 1499,
            currency: 'INR',
            content_name: 'Video Upload Fee',
            content_type: 'product',
        }));
        setIsProcessingPayment(true);
        try {
            const [order, Razorpay] = await Promise.all([createRazorpayOrder(1499), loadRazorpay()]);

            const options: any = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_live_RsBsR05m5SGbtT",
                amount: order.amount,
                currency: order.currency,
                name: "Beyond Reach Premier League",
                description: "Video Upload Fee",
                order_id: order.id,
                handler: async (response: any) => {
                    try {
                        await verifyRazorpayPayment({
                            ...response,
                            videoId: currentVideoId
                        });

                        // Track Facebook Pixel Purchase Event
                        import('react-facebook-pixel').then((x) => x.default.track('Purchase', {
                            value: 1499,
                            currency: 'INR',
                            content_name: 'Video Upload Fee',
                            content_type: 'product',
                            order_id: response.razorpay_order_id,
                            payment_id: response.razorpay_payment_id,
                            user_id: userProfile?._id || userProfile?.id
                        }));

                        setVideos((prev) =>
                            prev.map((v) =>
                                v.id === currentVideoId ? { ...v, status: "completed" } : v
                            )
                        );

                        setShowPaymentModal(false);
                        toast({
                            title: "Payment Successful",
                            description: "Razorpay payment verified successfully.",
                        });

                        await fetchVideos();
                        navigate("/payment-successfull");
                    } catch (verifyError: any) {
                        console.error("Verification failed", verifyError);
                        toast({
                            variant: "destructive",
                            title: "Verification Failed",
                            description: verifyError?.response?.data?.message || "Payment successful but verification failed.",
                        });
                    }
                },
                prefill: {
                    name: userProfile ? [userProfile.fname, userProfile.lname].filter(Boolean).join(' ') || "Creator Name" : "Creator Name",
                    email: userProfile?.email || "creator@example.com",
                    contact: userProfile?.mobile || "9999999999",
                },
                theme: {
                    color: "#3399cc",
                },
                modal: {
                    ondismiss: function () {
                        setIsProcessingPayment(false);
                    }
                }
            };

            const rzp1 = new Razorpay(options);
            rzp1.on("payment.failed", function (response: any) {
                toast({
                    variant: "destructive",
                    title: "Payment Failed",
                    description: response.error?.description || "Payment failed. Please try again.",
                });
                setIsProcessingPayment(false);
            });
            rzp1.open();

        } catch (error: any) {
            console.error("Razorpay init failed", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: error?.response?.data?.message || "Could not initiate Razorpay payment.",
            });
            setIsProcessingPayment(false);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const handleDownloadInvoice = async (videoId: string) => {
        try {
            const blob = await downloadInvoiceAPI(videoId);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `invoice-${videoId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast({
                title: "Invoice Downloaded",
                description: "Your invoice has been downloaded successfully.",
            });
        } catch (error: any) {
            console.error("Download failed", error);
            let errorMessage = "Could not download the invoice.";

            if (error.response && error.response.data instanceof Blob) {
                try {
                    const text = await error.response.data.text();
                    const json = JSON.parse(text);
                    if (json.message) {
                        errorMessage = json.message;
                    }
                } catch (e) {
                    // Fallback if parsing fails
                }
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }

            toast({
                variant: "destructive",
                title: "Download Failed",
                description: errorMessage,
            });
        }
    };

    const isPaid = userProfile?.isPaid || videos.length > 0;

    if (isProfileLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">{t('loading_videos')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8">
                <h1 className="text-3xl font-display font-bold text-foreground">{t('my_videos_title')}</h1>
                <p className="text-muted-foreground mt-1">
                    {t('my_videos_desc')}
                </p>
            </div>

            {/* Hidden Input for Updating Video */}
            <input
                type="file"
                accept="video/*"
                ref={changeVideoInputRef}
                className="hidden"
                onChange={handleFileChangeForUpdate}
            />

            {isPaid && !videos.some(v => v.status === 'completed' || v.status === 'uploading' || v.status === 'analyzing') && (
                <div className="space-y-6">
                    {/* Guidelines Section */}
                    <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/50 p-6 rounded-xl animate-in fade-in slide-in-from-top-4 duration-700">
                        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                            <Info className="w-5 h-5 text-blue-500" />
                            {t('video_upload_guidelines')}
                        </h3>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <h4 className="font-medium text-foreground text-sm flex items-center gap-2">
                                    <Video className="w-4 h-4 text-primary/70" />
                                    {t('recording_best_practices')}
                                </h4>
                                <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-4 marker:text-primary/50">
                                    <li><strong>{t('camera_angle')}:</strong> {t('camera_angle_desc')}</li>
                                    <li><strong>{t('steady_footage')}:</strong> {t('steady_footage_desc')}</li>
                                    <li><strong>{t('full_visibility')}:</strong> {t('full_visibility_desc')}</li>
                                    <li><strong>{t('lighting')}:</strong> {t('lighting_desc')}</li>
                                </ul>
                            </div>
                            <div className="space-y-3">
                                <h4 className="font-medium text-foreground text-sm flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-primary/70" />
                                    {t('technical_requirements')}
                                </h4>
                                <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-4 marker:text-primary/50">
                                    <li><strong>{t('formats')}:</strong> {t('formats_desc')}</li>
                                    <li><strong>{t('max_size')}:</strong> {t('max_size_desc')}</li>
                                    <li><strong>{t('duration')}:</strong> {t('duration_desc')}</li>
                                    <li><strong>{t('clarity')}:</strong> {t('clarity_desc')}</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end w-full max-w-xs ml-auto mb-4">
                        <div className="space-y-2 w-full">
                            <Label htmlFor="role">{t('role_for_analysis')}</Label>
                            <Select value={role} onValueChange={setRole}>
                                <SelectTrigger id="role" className="bg-background/50">
                                    <SelectValue placeholder={t('select_role')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {[
                                        "Batsman",
                                        "Bowler",
                                        "Wicket Keeper",
                                        "All-Rounder"
                                    ].map((r) => (
                                        <SelectItem key={r} value={r}>
                                            {r}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`glass-card p-12 border-2 border-dashed transition-all duration-300 ${isDragging
                            ? "border-primary bg-primary/5 scale-[1.02]"
                            : "border-border hover:border-primary/50"
                            }`}
                    >
                        <div className="flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                                <Upload className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="text-xl font-display font-semibold text-foreground mb-2">
                                {t('drop_videos_here')}
                            </h3>
                            <p className="text-muted-foreground mb-6">
                                {t('brows_files')}
                            </p>
                            <input
                                type="file"
                                accept="video/*"
                                multiple
                                onChange={handleFileSelect}
                                className="hidden"
                                id="video-upload"
                            />
                            <label htmlFor="video-upload">
                                <Button variant="hero" size="lg" asChild className="cursor-pointer">
                                    <span>
                                        <Plus className="w-5 h-5 mr-2" />
                                        {t('select_videos')}
                                    </span>
                                </Button>
                            </label>
                            <p className="text-xs text-muted-foreground mt-4">
                                {t('supports_format')}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {!isPaid && !isLoading && (
                <div className="glass-card p-12 text-center space-y-6 animate-in zoom-in-95 duration-500">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
                        <LockIcon className="w-8 h-8 text-primary" />
                    </div>
                    <div className="max-w-md mx-auto space-y-2">
                        <h3 className="text-2xl font-display font-bold">{t('payment_required')}</h3>
                        <p className="text-muted-foreground">
                            {t('payment_required_desc')}
                        </p>
                    </div>
                    <Button variant="hero" size="lg" onClick={() => navigate("/dashboard")} className="px-8">
                        {t('complete_payment_dashboard')}
                    </Button>
                </div>
            )}

            {isLoading && (
                <div className="flex justify-center items-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            )}

            {!isLoading && videos.length > 0 && (
                <div className="mt-8">
                    <h2 className="text-xl font-display font-semibold text-foreground mb-4">
                        {t('your_videos')}
                    </h2>
                    <div className="grid gap-4">
                        {videos.map((video) => (
                            <div
                                key={video.id}
                                className="glass-card p-4 flex flex-col sm:flex-row sm:items-center gap-4 transition-all hover:bg-secondary/40"
                            >
                                <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                                    <Video className="w-6 h-6 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="font-medium text-foreground truncate">
                                            {video.name}
                                        </h4>
                                        <span className="text-sm text-muted-foreground flex-shrink-0 ml-4">
                                            {formatFileSize(video.size)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Progress value={video.progress} className="flex-1 h-2" />
                                        <span className="text-sm text-muted-foreground w-12 text-right">
                                            {Math.round(video.progress)}%
                                        </span>
                                    </div>
                                    <div className="mt-2">
                                        {video.status === "uploading" && (
                                            <span className="text-xs text-primary animate-pulse">{t('uploading')}</span>
                                        )}
                                        {video.status === "analyzing" && (
                                            <span className="text-xs text-accent animate-pulse flex items-center gap-1">
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                {t('analyzing_video')}
                                            </span>
                                        )}
                                        {video.status === "pending-payment" && !userProfile?.isPaid && (
                                            <span className="text-xs text-accent flex items-center gap-1">
                                                <CreditCard className="w-3 h-3" />
                                                {t('awaiting_payment')}
                                            </span>
                                        )}
                                        {(video.status === "completed" || (video.status === "pending-payment" && userProfile?.isPaid)) && (
                                            <div className="flex gap-4">
                                                <span className="text-xs text-green-500 flex items-center gap-1">
                                                    <Check className="w-3 h-3" />
                                                    {t('upload_complete')}
                                                </span>
                                                {video.analysis && (
                                                    <span className="text-xs text-blue-500 flex items-center gap-1">
                                                        <Activity className="w-3 h-3" />
                                                        {t('analyzed')}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {video.status === "pending-payment" && !userProfile?.isPaid && (
                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-primary hover:text-primary/80 hover:bg-primary/10"
                                            onClick={() => handleViewVideo(video.id)}
                                            title={t('preview_video')}
                                        >
                                            <Eye className="w-5 h-5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-primary hover:text-primary/80 hover:bg-primary/10"
                                            onClick={() => handleChangeVideo(video.id)}
                                            title={t('change_video')}
                                        >
                                            <RefreshCw className="w-5 h-5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                                            onClick={() => handleDeleteVideo(video.id)}
                                            title={t('delete_video')}
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </Button>
                                        {!userProfile?.isPaid && (
                                            <Button
                                                variant="hero"
                                                size="sm"
                                                onClick={() => {
                                                    setCurrentVideoId(video.id);
                                                    setShowPaymentModal(true);
                                                }}
                                            >
                                                Pay Now
                                            </Button>
                                        )}
                                    </div>
                                )}

                                {((video.status === "completed") || (video.status === "pending-payment" && userProfile?.isPaid)) && (
                                    <div className="flex gap-2">
                                        {video.analysis && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-9 gap-1"
                                                onClick={() => handleDownloadReport(video)}
                                            >
                                                <Download className="w-4 h-4" />
                                                {t('download_report')}
                                            </Button>
                                        )}
                                        {!video.analysis && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-9 gap-1 text-primary hover:text-primary/80"
                                                onClick={() => handleRetryAnalysis(video.id)}
                                            >
                                                <RefreshCw className="w-4 h-4" />
                                                {t('analyze_again')}
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-primary hover:text-primary/80 hover:bg-primary/10"
                                            onClick={() => handleDownloadInvoice(video.id)}
                                            title={t('download_invoice')}
                                        >
                                            <FileText className="w-5 h-5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-primary hover:text-primary/80 hover:bg-primary/10"
                                            onClick={() => handleViewVideo(video.id)}
                                        >
                                            <Eye className="w-5 h-5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                                            onClick={() => handleDeleteVideo(video.id)}
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {!isLoading && videos.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    {t('no_videos_uploaded')}
                </div>
            )}

            <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
                <DialogContent className="glass-card border-border sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-display text-foreground">
                            {t('complete_your_upload')}
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            {t('pay_to_finalize')}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        <div className="glass-card p-4 bg-secondary/30">
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">{t('video_upload')}</span>
                                <span className="text-foreground font-medium">₹ 1</span>
                            </div>
                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-border">
                                <span className="text-foreground font-medium">{t('total')}</span>
                                <span className="text-xl font-display font-bold gradient-text">₹ 1</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="p-5 border border-primary/50 bg-primary/20 rounded-xl text-center shadow-sm animate-in fade-in slide-in-from-top-2">
                                <p className="text-base font-medium text-foreground/90">
                                    {t('redirect_razorpay')} <span className="font-bold text-primary">₹ 1</span>.
                                </p>
                            </div>
                        </div>

                        <Button
                            variant="hero"
                            size="lg"
                            className="w-full"
                            onClick={handleRazorpayPayment}
                            disabled={isProcessingPayment}
                        >
                            {isProcessingPayment ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                    {t('processing')}
                                </>
                            ) : (
                                <>
                                    <CreditCard className="w-5 h-5 mr-2" />
                                    {t('pay_now')} ₹ 1
                                </>
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogContent className="glass-card border-border sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-display text-foreground">
                            {selectedVideo?.originalName || selectedVideo?.filename || "Video Preview"}
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Preview your uploaded video.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {selectedVideo && (
                            <>
                                <div className="aspect-video w-full bg-black rounded-lg overflow-hidden flex items-center justify-center shadow-2xl">
                                    <video
                                        controls
                                        autoPlay
                                        className="w-full h-full"
                                        src={selectedVideo.path}
                                    >
                                        Your browser does not support the video tag.
                                    </video>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm glass-card p-4">
                                    <div>
                                        <span className="text-muted-foreground">Status:</span>
                                        <span className="ml-2 text-foreground font-medium capitalize">{selectedVideo.status}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Size:</span>
                                        <span className="ml-2 text-foreground font-medium">
                                            {selectedVideo.size ? formatFileSize(selectedVideo.size) : 'N/A'}
                                        </span>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="text-muted-foreground">ID:</span>
                                        <span className="ml-2 text-foreground font-mono text-xs">{selectedVideo._id}</span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {selectedAnalysis && (
                <div id="analysis-report-container" ref={analysisRef} className="mt-12 pt-8 border-t border-border animate-in slide-in-from-bottom-10 duration-700">
                    <div className="flex justify-between items-center mb-6 no-print">
                        <div>
                            <h2 className="text-2xl font-display font-bold text-foreground">{t('analysis_report')}</h2>
                            <p className="text-muted-foreground">Detailed performance analysis for {selectedAnalysis.role}</p>
                        </div>
                    </div>
                    <div className="bg-background/40 backdrop-blur-sm rounded-xl border border-border/50 p-1 shadow-lg">
                        <AnalysisResult data={selectedAnalysis} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Videos;