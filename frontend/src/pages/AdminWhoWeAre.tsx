import { useState, useEffect } from "react";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, X } from "lucide-react";
import api from "@/apihelper/api";
import { getImageUrl } from "@/utils/imageHelper";

const modules = {
    toolbar: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['link', 'clean']
    ],
};

const AdminWhoWeAre = () => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [title, setTitle] = useState("");
    const [titleHeadingLevel, setTitleHeadingLevel] = useState<"h1" | "h2" | "h3">("h1");
    const [titleColor, setTitleColor] = useState<string>("");
    const [subtitle, setSubtitle] = useState("");
    const [tagline, setTagline] = useState("");
    const [description, setDescription] = useState("");
    const [videoUrl, setVideoUrl] = useState("");

    // File State
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [existingImage, setExistingImage] = useState<string | null>(null);

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
            const response = await api.get('/api/cms/who-we-are');
            const data = response.data.data;
            if (data) {
                setTitle(data.title || "");
                setTitleHeadingLevel((data.titleHeadingLevel === "h2" || data.titleHeadingLevel === "h3") ? data.titleHeadingLevel : "h1");
                setTitleColor(data.titleColor || "");
                setSubtitle(data.subtitle || "");
                setTagline(data.tagline || "");
                setDescription(data.description || "");
                setVideoUrl(data.videoUrl || "");
                setExistingImage(data.image || null);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            // toast({
            //     variant: "destructive",
            //     title: "Error",
            //     description: "Failed to fetch content.",
            // });
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData();
        formData.append("title", title);
        formData.append("titleHeadingLevel", titleHeadingLevel);
        formData.append("titleColor", titleColor);
        formData.append("subtitle", subtitle);
        formData.append("tagline", tagline);
        formData.append("description", description);
        formData.append("videoUrl", videoUrl);
        if (file) {
            formData.append("image", file);
        }

        try {
            // Using POST to create or update (handled by backend or we can use PUT)
            await api.post('/api/cms/who-we-are', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast({
                title: "Success",
                description: "Content updated successfully.",
            });
            fetchData();
            removeFile();
        } catch (error) {
            console.error("Error updating content:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to update content.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <h1 className="text-3xl font-bold font-display">Manage "Who We Are" Section</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Content Editor</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="title">Main Title</Label>
                                <Input
                                    id="title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Who We Are"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Main Title Heading (SEO)</Label>
                                <Select value={titleHeadingLevel} onValueChange={(v: "h1" | "h2" | "h3") => setTitleHeadingLevel(v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choose H1, H2 or H3" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="h1">H1 (recommended for home page)</SelectItem>
                                        <SelectItem value="h2">H2</SelectItem>
                                        <SelectItem value="h3">H3</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">This section’s main title will render as this heading on the website.</p>
                            </div>
                            <div className="space-y-2">
                                <Label>Main title color</Label>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <input
                                        type="color"
                                        value={titleColor && /^#[0-9A-Fa-f]{6}$/.test(titleColor) ? titleColor : "#000000"}
                                        onChange={(e) => setTitleColor(e.target.value)}
                                        className="h-10 w-14 cursor-pointer rounded border border-input bg-background p-1"
                                    />
                                    <Input
                                        placeholder="e.g. #000000 (black)"
                                        value={titleColor}
                                        onChange={(e) => setTitleColor(e.target.value)}
                                        className="flex-1 min-w-[120px] max-w-[140px] font-mono text-sm"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">Choose a color for the main title. Leave empty for default (white + amber gradient).</p>
                                {titleColor && /^#[0-9A-Fa-f]{6}$/.test(titleColor) && (
                                    <p className="text-xs flex items-center gap-1.5 mt-1">
                                        <span>Preview:</span>
                                        <span style={{ color: titleColor }} className="font-semibold">Main title text</span>
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="subtitle">Subtitle / Badge</Label>
                                <Input
                                    id="subtitle"
                                    value={subtitle}
                                    onChange={(e) => setSubtitle(e.target.value)}
                                    placeholder="e.g. Beyond Reach Premier League"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tagline">Tagline</Label>
                                <Input
                                    id="tagline"
                                    value={tagline}
                                    onChange={(e) => setTagline(e.target.value)}
                                    placeholder="e.g. &quot;BRPL – Bharat ki League...&quot;"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Description (Rich Text)</Label>
                            <p className="text-xs text-muted-foreground">Tip: Use the <strong>"Quote"</strong> button ( “ ) to create the styled slogan with the vertical bar.</p>
                            <div className="h-64 mb-12">
                                <ReactQuill
                                    theme="snow"
                                    value={description}
                                    onChange={setDescription}
                                    modules={modules}
                                    className="h-full pb-10"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8">
                            <div className="space-y-2">
                                <Label>Right Side Image</Label>
                                <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center relative bg-gray-50">
                                    {preview || existingImage ? (
                                        <div className="relative w-full h-48 rounded overflow-hidden">
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
                                            <p className="text-sm text-muted-foreground">Upload Image</p>
                                        </div>
                                    )}
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="videoUrl">Video URL (Optional)</Label>
                                <Input
                                    id="videoUrl"
                                    value={videoUrl}
                                    onChange={(e) => setVideoUrl(e.target.value)}
                                    placeholder="https://..."
                                />
                                <p className="text-xs text-muted-foreground">Used for any video integration in this section.</p>
                            </div>
                        </div>

                        <div className="pt-4">
                            <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    "Update Content"
                                )}
                            </Button>
                        </div>

                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminWhoWeAre;
