import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, X, Play, Trash2 } from "lucide-react";
import api from "@/apihelper/api";
import { getImageUrl } from "@/utils/imageHelper";

const AdminAboutUs = () => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);

    // Banner State
    const [isSubmittingBanner, setIsSubmittingBanner] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [existingImage, setExistingImage] = useState<string | null>(null);
    const [isDeletingBanner, setIsDeletingBanner] = useState(false);

    // Video State
    const [isSubmittingVideo, setIsSubmittingVideo] = useState(false);
    const [videoUrl, setVideoUrl] = useState("");
    const [videoTitle, setVideoTitle] = useState("");
    const [videoDescription, setVideoDescription] = useState("");
    const [isDeletingVideo, setIsDeletingVideo] = useState(false);

    useEffect(() => {
        fetchData();
        return () => {
            if (preview && preview.startsWith('blob:')) {
                URL.revokeObjectURL(preview);
            }
        };
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/api/cms/about-us');
            const data = response.data.data;
            if (data) {
                setExistingImage(data.bannerImage || null);
                setVideoUrl(data.videoUrl || "");
                setVideoTitle(data.videoTitle || "");
                setVideoDescription(data.videoDescription || "");
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // --- Banner Handlers ---

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
        }
    };

    const removeFile = () => {
        setFile(null);
        if (preview && preview.startsWith('blob:')) {
            URL.revokeObjectURL(preview);
        }
        setPreview(null);
    };

    const handleBannerSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!file && !existingImage) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Please upload an image.",
            });
            return;
        }

        if (!file) {
            toast({
                title: "Info",
                description: "No new banner image to save.",
            });
            return;
        }

        setIsSubmittingBanner(true);

        const formData = new FormData();
        if (file) {
            formData.append("bannerImage", file);
        }

        try {
            await api.post('/api/cms/about-us/banner', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast({
                title: "Success",
                description: "Banner updated successfully.",
            });
            // Refresh data to ensure sync
            const response = await api.get('/api/cms/about-us');
            if (response.data.data) {
                setExistingImage(response.data.data.bannerImage);
            }
            removeFile();
        } catch (error) {
            console.error("Error updating banner:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to update banner.",
            });
        } finally {
            setIsSubmittingBanner(false);
        }
    };

    const handleDeleteBanner = async () => {
        if (!confirm("Are you sure you want to remove the banner image?")) return;
        setIsDeletingBanner(true);
        try {
            const formData = new FormData();
            formData.append('remove', 'true');
            await api.post('/api/cms/about-us/banner', formData);
            toast({ title: "Success", description: "Banner removed successfully." });
            setExistingImage(null);
            setPreview(null);
            setFile(null);
        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Error", description: "Failed to remove banner." });
        } finally {
            setIsDeletingBanner(false);
        }
    };

    // --- Video Handlers ---

    const handleVideoSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmittingVideo(true);

        try {
            await api.post('/api/cms/about-us/video', {
                videoUrl,
                videoTitle,
                videoDescription
            });

            toast({
                title: "Success",
                description: "Video details updated successfully.",
            });
        } catch (error) {
            console.error("Error updating video:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to update video details.",
            });
        } finally {
            setIsSubmittingVideo(false);
        }
    };

    const handleDeleteVideo = async () => {
        if (!confirm("Are you sure you want to remove the video content?")) return;
        setIsDeletingVideo(true);
        try {
            await api.post('/api/cms/about-us/video', { remove: true });
            toast({ title: "Success", description: "Video removed successfully." });
            setVideoUrl("");
            setVideoTitle("");
            setVideoDescription("");
        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Error", description: "Failed to remove video." });
        } finally {
            setIsDeletingVideo(false);
        }
    };

    if (isLoading) return <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div>;

    const getEmbedUrl = (url: string) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        if (match && match[2].length === 11) {
            return `https://www.youtube.com/embed/${match[2]}`;
        }
        return url;
    };

    const embedUrl = getEmbedUrl(videoUrl);

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8">
            <h1 className="text-3xl font-bold font-display">Manage About Us Banner</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Banner Section */}
                <Card className="h-fit">
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                            <span>Banner Photo</span>
                            {existingImage && (
                                <Button variant="destructive" size="sm" onClick={handleDeleteBanner} disabled={isDeletingBanner}>
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Remove
                                </Button>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleBannerSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label>Banner Image</Label>
                                <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center relative bg-gray-50 h-64">
                                    {preview || existingImage ? (
                                        <div className="relative w-full h-full rounded overflow-hidden">
                                            <img
                                                src={preview || getImageUrl(existingImage) || ""}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                                loading="lazy"
                                                decoding="async"
                                            />
                                            {preview && (
                                                <button
                                                    type="button"
                                                    onClick={removeFile}
                                                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                                            <p className="text-sm text-muted-foreground">Click to upload Banner Image</p>
                                        </div>
                                    )}
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">Recommended size: 1920x400px</p>
                            </div>

                            <div className="pt-2">
                                <Button type="submit" disabled={isSubmittingBanner} className="w-full md:w-auto">
                                    {isSubmittingBanner ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving Banner...
                                        </>
                                    ) : (
                                        "Update Banner"
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Video Section */}
                <Card className="h-fit">
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                            <span>Video Content</span>
                            {(videoUrl || videoTitle) && (
                                <Button variant="destructive" size="sm" onClick={handleDeleteVideo} disabled={isDeletingVideo}>
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Remove
                                </Button>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleVideoSubmit} className="space-y-6">

                            <div className="space-y-2">
                                <Label htmlFor="videoUrl">Video URL (YouTube/Vimeo)</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="videoUrl"
                                        value={videoUrl}
                                        onChange={(e) => setVideoUrl(e.target.value)}
                                        placeholder="https://www.youtube.com/watch?v=..."
                                    />
                                    {videoUrl && (
                                        <Button type="button" variant="outline" size="icon" onClick={() => window.open(videoUrl, '_blank')}>
                                            <Play className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground">Enter the full URL of the video.</p>
                            </div>

                            {embedUrl && embedUrl.includes('youtube.com/embed') && (
                                <div className="aspect-video w-full rounded-lg overflow-hidden bg-black/5 border border-border">
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        src={embedUrl}
                                        title="Video Preview"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    ></iframe>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="videoTitle">Video Title (Optional)</Label>
                                <Input
                                    id="videoTitle"
                                    value={videoTitle}
                                    onChange={(e) => setVideoTitle(e.target.value)}
                                    placeholder="E.g. Our Story"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="videoDescription">Video Description (Optional)</Label>
                                <Textarea
                                    id="videoDescription"
                                    value={videoDescription}
                                    onChange={(e) => setVideoDescription(e.target.value)}
                                    placeholder="Brief description of the video..."
                                    rows={4}
                                />
                            </div>

                            <div className="pt-2">
                                <Button type="submit" disabled={isSubmittingVideo} className="w-full md:w-auto">
                                    {isSubmittingVideo ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving Video...
                                        </>
                                    ) : (
                                        "Update Video"
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AdminAboutUs;
