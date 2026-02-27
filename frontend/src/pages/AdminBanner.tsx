import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, Upload, X, Play } from "lucide-react";
import { getImageUrl } from "@/utils/imageHelper";
import api from "@/apihelper/api";

interface Banner {
    _id: string;
    background: string;
    backgroundSize: string;
    videoUrl?: string;
    title?: string;
    subtitle?: string;
    isActive: boolean;
}

const AdminBanner = () => {
    const { toast } = useToast();
    const [banners, setBanners] = useState<Banner[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [videoUrl, setVideoUrl] = useState("");
    const [title, setTitle] = useState("");
    const [subtitle, setSubtitle] = useState("");
    const [isActive, setIsActive] = useState(true);

    // File State
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    useEffect(() => {
        fetchBanners();
        return () => {
            if (preview && preview.startsWith('blob:')) {
                URL.revokeObjectURL(preview);
            }
        };
    }, []);

    const fetchBanners = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/api/cms/banners');
            setBanners(response.data.data);
        } catch (error) {
            console.error("Error fetching banners:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to fetch banners.",
            });
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

        if (!file) {
            toast({
                variant: "destructive",
                title: "Validation Error",
                description: "Please upload a banner image.",
            });
            return;
        }

        setIsSubmitting(true);
        const formData = new FormData();
        formData.append("background", file);
        formData.append("videoUrl", videoUrl);
        formData.append("title", title);
        formData.append("subtitle", subtitle);
        formData.append("isActive", String(isActive));

        try {
            await api.post('/api/cms/banners', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast({
                title: "Success",
                description: "Banner created successfully.",
            });

            // Reset form
            setVideoUrl("");
            setTitle("");
            setSubtitle("");
            setIsActive(true);
            removeFile();
            fetchBanners();
        } catch (error) {
            console.error("Error creating banner:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to create banner.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this banner?")) return;

        try {
            await api.delete(`/api/cms/banners/${id}`);
            toast({
                title: "Deleted",
                description: "Banner deleted successfully.",
            });
            fetchBanners();
        } catch (error) {
            console.error("Error deleting banner:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to delete banner.",
            });
        }
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold font-display">Manage Banners</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Create Form */}
                <Card className="lg:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle>Add New Banner</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">

                            <div className="space-y-2">
                                <Label>Banner Image *</Label>
                                {!preview ? (
                                    <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors relative h-40 flex flex-col items-center justify-center">
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                        <p className="text-xs text-gray-500">Click to upload</p>
                                    </div>
                                ) : (
                                    <div className="relative rounded-lg overflow-hidden border border-gray-200 h-40 bg-gray-50">
                                        <img
                                            src={preview}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                            decoding="async"
                                        />
                                        <button
                                            type="button"
                                            onClick={removeFile}
                                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="videoUrl">Video URL (for Play Button)</Label>
                                <Input
                                    id="videoUrl"
                                    value={videoUrl}
                                    onChange={(e) => setVideoUrl(e.target.value)}
                                    placeholder="https://..."
                                />
                            </div>

                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="isActive"
                                    checked={isActive}
                                    onCheckedChange={setIsActive}
                                />
                                <Label htmlFor="isActive">Active</Label>
                            </div>

                            <Button type="submit" disabled={isSubmitting} className="w-full">
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    "Create Banner"
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* List */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Existing Banners</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Image</TableHead>
                                        <TableHead>Size</TableHead>
                                        <TableHead>Video</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {banners.map((banner) => (
                                        <TableRow key={banner._id}>
                                            <TableCell>
                                                <img
                                                    src={getImageUrl(banner.background)}
                                                    alt="Banner"
                                                    className="w-20 h-12 object-cover rounded border"
                                                    loading="lazy"
                                                    decoding="async"
                                                />
                                            </TableCell>
                                            <TableCell className="font-mono text-xs">{banner.backgroundSize}</TableCell>
                                            <TableCell>
                                                {banner.videoUrl ? (
                                                    <a href={banner.videoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-500 hover:text-blue-700">
                                                        <Play className="w-4 h-4 mr-1" /> View
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {banner.isActive ? (
                                                    <span className="text-green-600 text-xs font-bold px-2 py-1 bg-green-100 rounded-full">Active</span>
                                                ) : (
                                                    <span className="text-gray-500 text-xs font-bold px-2 py-1 bg-gray-100 rounded-full">Inactive</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(banner._id)}
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {banners.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                No banners found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AdminBanner;
