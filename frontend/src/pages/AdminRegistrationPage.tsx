import React, { useState, useEffect, useRef } from "react";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash, Edit, Video, Play, Loader2, Upload, X, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/apihelper/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getImageUrl } from "@/utils/imageHelper";

interface RegistrationVideo {
    _id: string;
    title: string;
    thumbnail: string;
    duration: string;
    videoSrc: string;
    order: number;
    isActive: boolean;
    createdAt: string;
}

const emptyForm = { title: "", thumbnail: "", duration: "", videoSrc: "", order: 0, isActive: true };

const AdminRegistrationPage = () => {
    const [videos, setVideos] = useState<RegistrationVideo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingItem, setEditingItem] = useState<RegistrationVideo | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [previewVideo, setPreviewVideo] = useState<RegistrationVideo | null>(null);

    // Settings State
    const [settingsForm, setSettingsForm] = useState({ titleBefore: "Latest", titleHighlight: "Videos" });
    const [isSavingSettings, setIsSavingSettings] = useState(false);

    // Thumbnail upload state
    const [thumbnailMode, setThumbnailMode] = useState<"url" | "upload">("url");
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchVideos = async () => {
        setIsLoading(true);
        try {
            const res = await apiClient.get("/api/registration-videos/all");
            if (res.data.success) {
                setVideos(res.data.data);
                if (res.data.settings) {
                    setSettingsForm({
                        titleBefore: res.data.settings.titleBefore || "Latest",
                        titleHighlight: res.data.settings.titleHighlight || "Videos"
                    });
                }
            }
        } catch {
            toast.error("Failed to load videos");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchVideos(); }, []);

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingSettings(true);
        try {
            const res = await apiClient.put("/api/registration-videos/settings", settingsForm);
            if (res.data.success) {
                toast.success("Section title updated successfully");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to update settings");
        } finally {
            setIsSavingSettings(false);
        }
    };

    const resetThumbnail = () => {
        setThumbnailFile(null);
        if (thumbnailPreview?.startsWith("blob:")) URL.revokeObjectURL(thumbnailPreview);
        setThumbnailPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setThumbnailFile(file);
        setThumbnailPreview(URL.createObjectURL(file));
        setForm(prev => ({ ...prev, thumbnail: "" })); // clear URL field
    };

    const openCreate = () => {
        setEditingItem(null);
        setForm(emptyForm);
        setThumbnailMode("url");
        resetThumbnail();
        setIsDialogOpen(true);
    };

    const openEdit = (v: RegistrationVideo) => {
        setEditingItem(v);
        setForm({
            title: v.title || "",
            thumbnail: v.thumbnail || "",
            duration: v.duration || "",
            videoSrc: v.videoSrc || "",
            order: v.order ?? 0,
            isActive: v.isActive,
        });
        setThumbnailMode("url");
        resetThumbnail();
        setIsDialogOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        const hasUrl = thumbnailMode === "url" && form.thumbnail.trim();
        const hasFile = thumbnailMode === "upload" && thumbnailFile;

        if (!hasUrl && !hasFile) {
            toast.error("Please provide a thumbnail (upload an image or enter a URL)");
            return;
        }
        if (!form.videoSrc) {
            toast.error("Video URL is required");
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("title", form.title);
            formData.append("duration", form.duration);
            formData.append("videoSrc", form.videoSrc);
            formData.append("order", String(form.order));
            formData.append("isActive", String(form.isActive));

            if (thumbnailMode === "upload" && thumbnailFile) {
                formData.append("thumbnailFile", thumbnailFile);
            } else {
                formData.append("thumbnail", form.thumbnail);
            }

            if (editingItem) {
                await apiClient.put(`/api/registration-videos/${editingItem._id}`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                toast.success("Video updated successfully");
            } else {
                await apiClient.post("/api/registration-videos", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                toast.success("Video added successfully");
            }
            setIsDialogOpen(false);
            resetThumbnail();
            fetchVideos();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to save");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this video?")) return;
        try {
            await apiClient.delete(`/api/registration-videos/${id}`);
            toast.success("Deleted successfully");
            fetchVideos();
        } catch {
            toast.error("Failed to delete");
        }
    };

    const toggleStatus = async (v: RegistrationVideo) => {
        try {
            await apiClient.put(`/api/registration-videos/${v._id}`, { isActive: !v.isActive });
            toast.success(`Video ${!v.isActive ? "activated" : "hidden"}`);
            fetchVideos();
        } catch {
            toast.error("Failed to update status");
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                        Registration Page — Latest Videos
                    </h1>
                    <p className="text-gray-500 mt-1">Manage the video clips shown in the "Latest Videos" section on the Registration page.</p>
                </div>
                <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 transition-all hover:scale-105 flex-shrink-0"
                    onClick={openCreate}
                >
                    <Plus className="mr-2 h-4 w-4" /> Add Video
                </Button>
            </div>

            {/* Title Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>Section Title Settings</CardTitle>
                    <CardDescription>Customize the dynamic title displayed above the videos on the website.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSaveSettings} className="flex flex-col sm:flex-row gap-4 items-end">
                        <div className="space-y-2 w-full sm:w-1/3">
                            <Label htmlFor="titleBefore">Text before highlight</Label>
                            <Input 
                                id="titleBefore" 
                                value={settingsForm.titleBefore} 
                                onChange={(e) => setSettingsForm({ ...settingsForm, titleBefore: e.target.value })} 
                                placeholder="e.g. Latest" 
                            />
                        </div>
                        <div className="space-y-2 w-full sm:w-1/3">
                            <Label htmlFor="titleHighlight">Highlighted Text (Yellow)</Label>
                            <Input 
                                id="titleHighlight" 
                                value={settingsForm.titleHighlight} 
                                onChange={(e) => setSettingsForm({ ...settingsForm, titleHighlight: e.target.value })} 
                                placeholder="e.g. Videos" 
                            />
                        </div>
                        <Button type="submit" disabled={isSavingSettings} className="w-full sm:w-auto">
                            {isSavingSettings ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving...</> : "Save Title"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Video List</CardTitle>
                    <CardDescription>Videos are sorted by Order then by creation date. Only Active videos appear on the website.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
                    ) : videos.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <Video className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>No videos yet. Click "Add Video" to get started.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-16">Order</TableHead>
                                    <TableHead className="w-20">Preview</TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Duration</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {videos.map((v) => (
                                    <TableRow key={v._id}>
                                        <TableCell className="font-mono text-sm text-center">{v.order}</TableCell>
                                        <TableCell>
                                            <div
                                                className="relative w-16 h-10 rounded overflow-hidden bg-gray-200 cursor-pointer group"
                                                onClick={() => setPreviewVideo(v)}
                                            >
                                                <img src={getImageUrl(v.thumbnail)} alt="" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Play className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium max-w-[150px] truncate">{v.title || <span className="text-gray-400 italic">No title</span>}</TableCell>
                                        <TableCell className="text-gray-600">{v.duration || "—"}</TableCell>
                                        <TableCell>
                                            <div
                                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium cursor-pointer ${v.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                                                onClick={() => toggleStatus(v)}
                                            >
                                                <span className={`w-2 h-2 rounded-full ${v.isActive ? "bg-green-500" : "bg-gray-400"}`} />
                                                {v.isActive ? "Active" : "Hidden"}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="outline" size="sm" onClick={() => openEdit(v)}>
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button variant="destructive" size="sm" onClick={() => handleDelete(v._id)}>
                                                    <Trash className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetThumbnail(); }}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingItem ? "Edit Video" : "Add New Video"}</DialogTitle>
                        <DialogDescription>
                            Enter the video details. Thumbnail and Video URL are required.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSave} className="space-y-4 pt-2">

                        {/* Title */}
                        <div className="space-y-2">
                            <Label htmlFor="rv-title">Title <span className="text-gray-400 text-xs">(optional)</span></Label>
                            <Input id="rv-title" placeholder="e.g. Season 2025 Highlights" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                        </div>

                        {/* Thumbnail toggle */}
                        <div className="space-y-2">
                            <Label>Thumbnail <span className="text-red-500">*</span></Label>

                            {/* Mode Toggle */}
                            <div className="flex gap-2 p-1 bg-gray-100 rounded-lg w-fit">
                                <button
                                    type="button"
                                    onClick={() => { setThumbnailMode("upload"); setForm(f => ({ ...f, thumbnail: "" })); }}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${thumbnailMode === "upload" ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
                                >
                                    <Upload className="w-3.5 h-3.5" /> Upload Image
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setThumbnailMode("url"); resetThumbnail(); }}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${thumbnailMode === "url" ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
                                >
                                    <LinkIcon className="w-3.5 h-3.5" /> Enter URL
                                </button>
                            </div>

                            {/* Upload Mode */}
                            {thumbnailMode === "upload" && (
                                <div>
                                    {!thumbnailPreview ? (
                                        <div
                                            className="border-2 border-dashed border-gray-300 rounded-lg h-36 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors relative"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                            <p className="text-sm text-gray-500">Click to upload thumbnail</p>
                                            <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP up to 10MB</p>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleFileChange}
                                            />
                                        </div>
                                    ) : (
                                        <div className="relative rounded-lg overflow-hidden border border-gray-200 h-36 bg-gray-50">
                                            <img src={thumbnailPreview} alt="Thumbnail preview" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => { resetThumbnail(); }}
                                                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                            <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                                                {thumbnailFile?.name}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* URL Mode */}
                            {thumbnailMode === "url" && (
                                <div className="space-y-2">
                                    <Input
                                        id="rv-thumbnail"
                                        placeholder="https://... or /banner.jpg"
                                        value={form.thumbnail}
                                        onChange={e => setForm({ ...form, thumbnail: e.target.value })}
                                    />
                                    {form.thumbnail && (
                                        <img
                                            src={getImageUrl(form.thumbnail)}
                                            alt="preview"
                                            className="w-full h-28 object-cover rounded border mt-1"
                                            onError={e => (e.currentTarget.style.display = 'none')}
                                        />
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Video URL */}
                        <div className="space-y-2">
                            <Label htmlFor="rv-video">Video URL <span className="text-red-500">*</span></Label>
                            <Input id="rv-video" placeholder="https://brpl.net/api/..." value={form.videoSrc} onChange={e => setForm({ ...form, videoSrc: e.target.value })} required />
                        </div>

                        {/* Duration + Order */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="rv-duration">Duration <span className="text-gray-400 text-xs">(e.g. 10:24)</span></Label>
                                <Input id="rv-duration" placeholder="05:30" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="rv-order">Display Order</Label>
                                <Input id="rv-order" type="number" min={0} value={form.order} onChange={e => setForm({ ...form, order: parseInt(e.target.value) || 0 })} />
                            </div>
                        </div>

                        {/* Active Toggle */}
                        <div className="flex items-center gap-3">
                            <Switch id="rv-active" checked={form.isActive} onCheckedChange={v => setForm({ ...form, isActive: v })} />
                            <Label htmlFor="rv-active">{form.isActive ? "Active – visible on website" : "Hidden"}</Label>
                        </div>

                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</> : (editingItem ? "Update Video" : "Add Video")}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Preview Dialog */}
            <Dialog open={!!previewVideo} onOpenChange={open => !open && setPreviewVideo(null)}>
                <DialogContent className="sm:max-w-[700px] bg-black border-white/20 p-0 overflow-hidden">
                    <div className="aspect-video bg-black">
                        {previewVideo && (
                            <video src={previewVideo.videoSrc} controls autoPlay className="w-full h-full object-contain">
                                Your browser does not support video.
                            </video>
                        )}
                    </div>
                    {previewVideo?.title && (
                        <div className="p-4 bg-[#1a1a1a]">
                            <p className="text-white font-semibold">{previewVideo.title}</p>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminRegistrationPage;
