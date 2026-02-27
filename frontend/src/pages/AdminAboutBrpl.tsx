// Admin About BRPL Page - Management Component
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, X, Trash2 } from "lucide-react";
import api from "@/apihelper/api";
import { getImageUrl } from "@/utils/imageHelper";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const AdminAboutBrpl = () => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeletingImage, setIsDeletingImage] = useState(false);

    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [existingImage, setExistingImage] = useState<string | null>(null);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");

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
                setExistingImage(data.aboutBrplImage || null);
                setTitle(data.aboutBrplTitle || "");
                setDescription(data.aboutBrplDescription || "");
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setIsLoading(false);
        }
    };

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

    const handleDeleteImage = async () => {
        if (!confirm("Are you sure you want to remove the image?")) return;
        setIsDeletingImage(true);
        try {
            const formData = new FormData();
            formData.append('removeImage', 'true');
            await api.post('/api/cms/about-us/about-brpl', formData);
            toast({ title: "Success", description: "Image removed successfully." });
            setExistingImage(null);
            setPreview(null);
            setFile(null);
        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Error", description: "Failed to remove image." });
        } finally {
            setIsDeletingImage(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData();
        formData.append("aboutBrplTitle", title);
        formData.append("aboutBrplDescription", description);
        if (file) {
            formData.append("aboutBrplImage", file);
        }

        try {
            await api.post('/api/cms/about-us/about-brpl', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast({
                title: "Success",
                description: "Updated successfully.",
            });

            // Refresh
            const response = await api.get('/api/cms/about-us');
            if (response.data.data) {
                setExistingImage(response.data.data.aboutBrplImage);
            }
            removeFile();

        } catch (error) {
            console.error("Error updating:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to update details.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div>;

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8">
            <h1 className="text-3xl font-bold font-display">Manage About BRPL Section</h1>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column: Image Upload */}
                    <Card className="h-fit">
                        <CardHeader>
                            <CardTitle className="flex justify-between items-center">
                                <span>Section Image</span>
                                {existingImage && (
                                    <Button type="button" variant="destructive" size="sm" onClick={handleDeleteImage} disabled={isDeletingImage}>
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Remove
                                    </Button>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center relative bg-gray-50 h-[400px]">
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
                                            <p className="text-sm text-muted-foreground">Click to upload Image</p>
                                        </div>
                                    )}
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">Recommended: High quality vertical or square image.</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Right Column: Title and Description */}
                    <Card className="h-fit">
                        <CardHeader>
                            <CardTitle>Content Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title</Label>
                                <Input
                                    id="title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. About BRPL"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <div className="h-64 mb-12">
                                    <ReactQuill
                                        theme="snow"
                                        value={description}
                                        onChange={setDescription}
                                        className="h-56"
                                    />
                                </div>
                            </div>

                            <div className="pt-6">
                                <Button type="submit" disabled={isSubmitting} className="w-full">
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving Changes...
                                        </>
                                    ) : (
                                        "Update Content"
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </form>
        </div>
    );
};

export default AdminAboutBrpl;
