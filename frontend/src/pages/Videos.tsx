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
} from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadVideo, getVideos, deleteVideo, getVideoById } from "@/apihelper/video";
import { verifyPayment, downloadInvoiceAPI, createRazorpayOrder, verifyRazorpayPayment } from "@/apihelper/payment";
import { getProfile } from "@/apihelper/auth";
import { v4 as uuidv4 } from "uuid";
import { useRazorpay } from "react-razorpay";

interface VideoFile {
    id: string;
    name: string;
    size: number;
    progress: number;
    status: "uploading" | "completed" | "pending-payment";
}

const Videos = () => {
    const { toast } = useToast();
    const [videos, setVideos] = useState<VideoFile[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [selectedVideo, setSelectedVideo] = useState<any | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const navigate = useNavigate();
    const { Razorpay } = useRazorpay();

    const changeVideoInputRef = useRef<HTMLInputElement>(null);
    const [videoToChangeId, setVideoToChangeId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [userProfile, setUserProfile] = useState<any>(null);

    useEffect(() => {
        fetchVideos();
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await getProfile();
            setUserProfile(response.data?.data || response.data);
        } catch (error) {
            console.error("Failed to fetch profile", error);
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
                status: v.status === 'pending_payment' ? 'pending-payment' : (v.status || "completed")
            }));

            setVideos(prev => {
                const uploading = prev.filter(p => p.status === 'uploading');
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

    const handleChangeVideo = (id: string) => {
        setVideoToChangeId(id);
        if (changeVideoInputRef.current) {
            changeVideoInputRef.current.click();
        }
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
        };

        setVideos((prev) => [...prev, newVideo]);

        const formData = new FormData();
        formData.append('video', file);

        try {
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

            const serverStatus = response.status || response.data?.status || (response.data?.isFromLandingPage ? 'completed' : 'pending-payment');
            const isLandingPageUser = response.isFromLandingPage || response.data?.isFromLandingPage;

            toast({
                title: isLandingPageUser ? "Upload Successful" : "Upload Successful",
                description: isLandingPageUser ? "Video uploaded successfully and is now active." : "Video uploaded successfully. Please proceed to payment.",
            });

            setVideos((prev) =>
                prev.map((v) =>
                    v.id === newVideo.id ? { ...v, status: serverStatus === 'completed' ? 'completed' : 'pending-payment', id: serverId, progress: 100 } : v
                )
            );

            if (!isLandingPageUser) {
                setCurrentVideoId(serverId);
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
    }, []);

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

        setIsProcessingPayment(true);
        try {
            const order = await createRazorpayOrder(1499);

            const options: any = {
                key: "rzp_live_RsBsR05m5SGbtT",
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
                    name: "Creator Name",
                    email: "creator@example.com",
                    contact: "9999999999",
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

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8">
                <h1 className="text-3xl font-display font-bold text-foreground">My Videos</h1>
                <p className="text-muted-foreground mt-1">
                    Upload and manage your video content
                </p>
            </div>

            <input
                type="file"
                accept="video/*"
                ref={changeVideoInputRef}
                className="hidden"
                onChange={handleFileChangeForUpdate}
            />

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
                        Drop your videos here
                    </h3>
                    <p className="text-muted-foreground mb-6">
                        or click to browse from your computer
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
                                Select Videos
                            </span>
                        </Button>
                    </label>
                    <p className="text-xs text-muted-foreground mt-4">
                        Supports MP4, MOV, AVI, WMV up to 1GB
                    </p>
                </div>
            </div>

            {isLoading && (
                <div className="flex justify-center items-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            )}

            {!isLoading && videos.length > 0 && (
                <div className="mt-8">
                    <h2 className="text-xl font-display font-semibold text-foreground mb-4">
                        Your Videos
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
                                            <span className="text-xs text-primary animate-pulse">Uploading...</span>
                                        )}
                                        {video.status === "pending-payment" && !userProfile?.isFromLandingPage && (
                                            <span className="text-xs text-accent flex items-center gap-1">
                                                <CreditCard className="w-3 h-3" />
                                                Awaiting payment
                                            </span>
                                        )}
                                        {video.status === "pending-payment" && userProfile?.isFromLandingPage && (
                                            <span className="text-xs text-green-500 flex items-center gap-1">
                                                <Check className="w-3 h-3" />
                                                Processing (Registration included)
                                            </span>
                                        )}
                                        {video.status === "completed" && (
                                            <span className="text-xs text-green-500 flex items-center gap-1">
                                                <Check className="w-3 h-3" />
                                                Upload complete
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {video.status === "pending-payment" && (
                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-primary hover:text-primary/80 hover:bg-primary/10"
                                            onClick={() => handleViewVideo(video.id)}
                                            title="Preview Video"
                                        >
                                            <Eye className="w-5 h-5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-primary hover:text-primary/80 hover:bg-primary/10"
                                            onClick={() => handleChangeVideo(video.id)}
                                            title="Change Video"
                                        >
                                            <RefreshCw className="w-5 h-5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                                            onClick={() => handleDeleteVideo(video.id)}
                                            title="Delete Video"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </Button>
                                        {!userProfile?.isFromLandingPage && (
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

                                {video.status === "completed" && (
                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-primary hover:text-primary/80 hover:bg-primary/10"
                                            onClick={() => handleDownloadInvoice(video.id)}
                                            title="Download Invoice"
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
                    No videos uploaded yet. Start by uploading your first video!
                </div>
            )}

            <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
                <DialogContent className="glass-card border-border sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-display text-foreground">
                            Complete Your Upload
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Pay to finalize your video upload and make it live.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        <div className="glass-card p-4 bg-secondary/30">
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Video Upload</span>
                                <span className="text-foreground font-medium">₹ 1499</span>
                            </div>
                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-border">
                                <span className="text-foreground font-medium">Total</span>
                                <span className="text-xl font-display font-bold gradient-text">₹ 1499</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="p-5 border border-primary/50 bg-primary/20 rounded-xl text-center shadow-sm animate-in fade-in slide-in-from-top-2">
                                <p className="text-base font-medium text-foreground/90">
                                    You will be redirected to Razorpay secure checkout to complete your payment of <span className="font-bold text-primary">₹ 1499</span>.
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
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <CreditCard className="w-5 h-5 mr-2" />
                                    Pay ₹ 1499
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
        </div>
    );
};

export default Videos;