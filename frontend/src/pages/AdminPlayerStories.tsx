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
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash, Edit, Loader2, Quote, Star, User, Upload, X, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/apihelper/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface PlayerStory {
    _id: string;
    quote: string;
    name: string;
    role: string;
    highlight: string;
    order: number;
    isActive: boolean;
    createdAt: string;
}

const emptyForm = { quote: "", name: "", role: "", highlight: "", order: 0, isActive: true };

const AdminPlayerStories = () => {
    const [stories, setStories] = useState<PlayerStory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingItem, setEditingItem] = useState<PlayerStory | null>(null);
    const [form, setForm] = useState(emptyForm);

    // Settings
    const [settingsForm, setSettingsForm] = useState({
        badgeText: "Player Stories",
        titleBefore: "LIVES CHANGED BY",
        titleHighlight: "BRPL",
        subtitle: "Real stories from real players across India who found their stage.",
        backgroundImage: "/artist.png"
    });
    const [isSavingSettings, setIsSavingSettings] = useState(false);

    // Background image upload
    const [bgMode, setBgMode] = useState<"url" | "upload">("url");
    const [bgFile, setBgFile] = useState<File | null>(null);
    const [bgPreview, setBgPreview] = useState<string | null>(null);
    const bgFileInputRef = useRef<HTMLInputElement>(null);

    const resetBgFile = () => {
        setBgFile(null);
        if (bgPreview?.startsWith("blob:")) URL.revokeObjectURL(bgPreview);
        setBgPreview(null);
        if (bgFileInputRef.current) bgFileInputRef.current.value = "";
    };

    const handleBgFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setBgFile(file);
        setBgPreview(URL.createObjectURL(file));
    };

    const fetchStories = async () => {
        setIsLoading(true);
        try {
            const res = await apiClient.get("/api/player-stories/all");
            if (res.data.success) {
                setStories(res.data.data);
                if (res.data.settings) {
                    const s = res.data.settings;
                    setSettingsForm({
                        badgeText: s.badgeText || "Player Stories",
                        titleBefore: s.titleBefore || "LIVES CHANGED BY",
                        titleHighlight: s.titleHighlight || "BRPL",
                        subtitle: s.subtitle || "",
                        backgroundImage: s.backgroundImage || "/artist.png"
                    });
                }
            }
        } catch {
            toast.error("Failed to load stories");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchStories(); }, []);

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingSettings(true);
        try {
            const formData = new FormData();
            formData.append("badgeText", settingsForm.badgeText);
            formData.append("titleBefore", settingsForm.titleBefore);
            formData.append("titleHighlight", settingsForm.titleHighlight);
            formData.append("subtitle", settingsForm.subtitle);

            if (bgMode === "upload" && bgFile) {
                formData.append("backgroundImageFile", bgFile);
            } else {
                formData.append("backgroundImage", settingsForm.backgroundImage);
            }

            const res = await apiClient.put("/api/player-stories/settings", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            if (res.data.success) {
                toast.success("Section settings updated");
                if (res.data.data?.backgroundImage) {
                    setSettingsForm(prev => ({ ...prev, backgroundImage: res.data.data.backgroundImage }));
                }
                resetBgFile();
                setBgMode("url");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to update settings");
        } finally {
            setIsSavingSettings(false);
        }
    };

    const openCreate = () => { setEditingItem(null); setForm(emptyForm); setIsDialogOpen(true); };

    const openEdit = (item: PlayerStory) => {
        setEditingItem(item);
        setForm({
            quote: item.quote || "",
            name: item.name || "",
            role: item.role || "",
            highlight: item.highlight || "",
            order: item.order ?? 0,
            isActive: item.isActive,
        });
        setIsDialogOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.quote.trim()) { toast.error("Quote is required"); return; }
        if (!form.name.trim()) { toast.error("Name is required"); return; }
        if (!form.role.trim()) { toast.error("Role/Location is required"); return; }

        setIsSubmitting(true);
        try {
            if (editingItem) {
                await apiClient.put(`/api/player-stories/${editingItem._id}`, form);
                toast.success("Story updated successfully");
            } else {
                await apiClient.post("/api/player-stories", form);
                toast.success("Story added successfully");
            }
            setIsDialogOpen(false);
            fetchStories();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to save");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this story?")) return;
        try {
            await apiClient.delete(`/api/player-stories/${id}`);
            toast.success("Deleted successfully");
            fetchStories();
        } catch {
            toast.error("Failed to delete");
        }
    };

    const toggleStatus = async (item: PlayerStory) => {
        try {
            await apiClient.put(`/api/player-stories/${item._id}`, { isActive: !item.isActive });
            toast.success(`Story ${!item.isActive ? "activated" : "hidden"}`);
            fetchStories();
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
                        Player Stories Section
                    </h1>
                    <p className="text-gray-500 mt-1">Manage testimonial cards in the "Lives Changed by BRPL" carousel on the Registration page.</p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 transition-all hover:scale-105 flex-shrink-0" onClick={openCreate}>
                    <Plus className="mr-2 h-4 w-4" /> Add Story
                </Button>
            </div>

            {/* Title Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>Section Settings</CardTitle>
                    <CardDescription>Customize the badge, title, and subtitle displayed above the stories carousel.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSaveSettings} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="ps-badge">Badge Text</Label>
                                <Input id="ps-badge" value={settingsForm.badgeText} onChange={e => setSettingsForm({ ...settingsForm, badgeText: e.target.value })} placeholder="e.g. Player Stories" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ps-titleBefore">Title (before highlight)</Label>
                                <Input id="ps-titleBefore" value={settingsForm.titleBefore} onChange={e => setSettingsForm({ ...settingsForm, titleBefore: e.target.value })} placeholder="e.g. LIVES CHANGED BY" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ps-titleHL">Title (highlighted - yellow)</Label>
                                <Input id="ps-titleHL" value={settingsForm.titleHighlight} onChange={e => setSettingsForm({ ...settingsForm, titleHighlight: e.target.value })} placeholder="e.g. BRPL" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ps-subtitle">Subtitle</Label>
                            <Input id="ps-subtitle" value={settingsForm.subtitle} onChange={e => setSettingsForm({ ...settingsForm, subtitle: e.target.value })} placeholder="e.g. Real stories from real players..." />
                        </div>

                        {/* Background Image */}
                        <div className="space-y-2">
                            <Label>Background Image</Label>
                            <div className="flex gap-2 p-1 bg-gray-100 rounded-lg w-fit">
                                <button type="button" onClick={() => { setBgMode("upload"); }} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${bgMode === "upload" ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-700"}`}>
                                    <Upload className="w-3.5 h-3.5" /> Upload Image
                                </button>
                                <button type="button" onClick={() => { setBgMode("url"); resetBgFile(); }} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${bgMode === "url" ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-700"}`}>
                                    <LinkIcon className="w-3.5 h-3.5" /> Enter URL
                                </button>
                            </div>

                            {bgMode === "upload" && (
                                <div>
                                    {!bgPreview ? (
                                        <div className="border-2 border-dashed border-gray-300 rounded-lg h-32 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors" onClick={() => bgFileInputRef.current?.click()}>
                                            <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                            <p className="text-sm text-gray-500">Click to upload background image</p>
                                            <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP up to 10MB</p>
                                            <input ref={bgFileInputRef} type="file" accept="image/*" className="hidden" onChange={handleBgFileChange} />
                                        </div>
                                    ) : (
                                        <div className="relative rounded-lg overflow-hidden border border-gray-200 h-32 bg-gray-50">
                                            <img src={bgPreview} alt="Background preview" className="w-full h-full object-cover" />
                                            <button type="button" onClick={resetBgFile} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors">
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {bgMode === "url" && (
                                <div className="space-y-2">
                                    <Input value={settingsForm.backgroundImage} onChange={e => setSettingsForm({ ...settingsForm, backgroundImage: e.target.value })} placeholder="e.g. /artist.png or https://..." />
                                    {settingsForm.backgroundImage && (
                                        <img src={settingsForm.backgroundImage} alt="Background preview" className="w-full h-32 object-cover rounded border mt-1" onError={e => (e.currentTarget.style.display = 'none')} />
                                    )}
                                </div>
                            )}
                        </div>

                        <Button type="submit" disabled={isSavingSettings}>
                            {isSavingSettings ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving...</> : "Save Settings"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Stories Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Stories List</CardTitle>
                    <CardDescription>Sorted by Order. Only Active stories appear in the carousel on the website.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
                    ) : stories.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <Quote className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>No stories yet. Click "Add Story" to get started.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-16">Order</TableHead>
                                    <TableHead>Quote</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Role / Location</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {stories.map((item) => (
                                    <TableRow key={item._id}>
                                        <TableCell className="font-mono text-sm text-center">{item.order}</TableCell>
                                        <TableCell className="max-w-[300px]">
                                            <p className="text-sm italic text-gray-600 line-clamp-2">"{item.quote}"</p>
                                        </TableCell>
                                        <TableCell className="font-semibold">{item.name}</TableCell>
                                        <TableCell className="text-xs text-[#FFC928] font-bold uppercase tracking-wider">{item.role}</TableCell>
                                        <TableCell>
                                            <div
                                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium cursor-pointer ${item.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                                                onClick={() => toggleStatus(item)}
                                            >
                                                <span className={`w-2 h-2 rounded-full ${item.isActive ? "bg-green-500" : "bg-gray-400"}`} />
                                                {item.isActive ? "Active" : "Hidden"}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="outline" size="sm" onClick={() => openEdit(item)}>
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button variant="destructive" size="sm" onClick={() => handleDelete(item._id)}>
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
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingItem ? "Edit Story" : "Add New Story"}</DialogTitle>
                        <DialogDescription>Add a player testimonial for the carousel.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSave} className="space-y-4 pt-2">
                        {/* Quote */}
                        <div className="space-y-2">
                            <Label htmlFor="ps-quote">Quote <span className="text-red-500">*</span></Label>
                            <Textarea id="ps-quote" placeholder="e.g. I played district cricket 20 years ago..." value={form.quote} onChange={e => setForm({ ...form, quote: e.target.value })} rows={4} required />
                        </div>

                        {/* Name + Role */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="ps-name">Name <span className="text-red-500">*</span></Label>
                                <Input id="ps-name" placeholder="e.g. VIJAY SINGH" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ps-role">Role / Location <span className="text-red-500">*</span></Label>
                                <Input id="ps-role" placeholder="e.g. 25, TAMIL NADU" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} required />
                            </div>
                        </div>

                        {/* Highlight + Order */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="ps-hl">Highlight Tag <span className="text-gray-400 text-xs">(optional)</span></Label>
                                <Input id="ps-hl" placeholder="e.g. Dream Realized" value={form.highlight} onChange={e => setForm({ ...form, highlight: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ps-order">Display Order</Label>
                                <Input id="ps-order" type="number" min={0} value={form.order} onChange={e => setForm({ ...form, order: parseInt(e.target.value) || 0 })} />
                            </div>
                        </div>

                        {/* Active */}
                        <div className="flex items-center gap-3">
                            <Switch id="ps-active" checked={form.isActive} onCheckedChange={v => setForm({ ...form, isActive: v })} />
                            <Label htmlFor="ps-active">{form.isActive ? "Active - visible on website" : "Hidden"}</Label>
                        </div>

                        {/* Preview */}
                        <div className="space-y-2">
                            <Label>Preview</Label>
                            <div className="bg-[#020617] rounded-xl p-6">
                                <div className="bg-[#0f1629] border border-gray-800 p-6 rounded-2xl">
                                    <div className="flex gap-1 mb-4">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className="w-4 h-4 text-[#FFC928] fill-[#FFC928]" />
                                        ))}
                                    </div>
                                    <p className="text-gray-200 text-sm italic mb-4">"{form.quote || "Quote text..."}"</p>
                                    <div className="pt-4 border-t border-gray-800 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FFC928] to-amber-600 flex items-center justify-center">
                                            <User className="w-5 h-5 text-[#020617]" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white text-sm uppercase">{form.name || "PLAYER NAME"}</h4>
                                            <p className="text-[#FFC928] text-xs font-bold uppercase tracking-wider">{form.role || "ROLE"}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</> : (editingItem ? "Update Story" : "Add Story")}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminPlayerStories;
