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
import {
    Plus, Trash, Edit, Loader2, FileText, Smartphone, Search, Trophy,
    Star, Heart, Zap, Shield, Target, Award, Crown, Flame, Gem, Globe,
    Megaphone, Rocket, ThumbsUp, TrendingUp, Users, Bot, Timer, Tv, Circle,
    Upload, X, Link as LinkIcon,
    type LucideIcon
} from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/apihelper/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const ICON_MAP: Record<string, LucideIcon> = {
    FileText, Smartphone, Search, Trophy,
    Star, Heart, Zap, Shield, Target, Award, Crown, Flame, Gem, Globe,
    Megaphone, Rocket, ThumbsUp, TrendingUp, Users, Bot, Timer, Tv, Circle,
};

const ICON_OPTIONS = Object.keys(ICON_MAP);

interface RoadmapItem {
    _id: string;
    icon: string;
    headline: string;
    description: string;
    order: number;
    isActive: boolean;
    createdAt: string;
}

const emptyForm = { icon: "FileText", headline: "", description: "", order: 0, isActive: true };

const AdminRoadmap = () => {
    const [items, setItems] = useState<RoadmapItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingItem, setEditingItem] = useState<RoadmapItem | null>(null);
    const [form, setForm] = useState(emptyForm);

    // Settings State
    const [settingsForm, setSettingsForm] = useState({ titleBefore: "YOUR JOURNEY TO", titleHighlight: "GLORY", backgroundImage: "/banner.png" });
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

    const fetchItems = async () => {
        setIsLoading(true);
        try {
            const res = await apiClient.get("/api/roadmap/all");
            if (res.data.success) {
                setItems(res.data.data);
                if (res.data.settings) {
                    setSettingsForm({
                        titleBefore: res.data.settings.titleBefore || "YOUR JOURNEY TO",
                        titleHighlight: res.data.settings.titleHighlight || "GLORY",
                        backgroundImage: res.data.settings.backgroundImage || "/banner.png"
                    });
                }
            }
        } catch {
            toast.error("Failed to load items");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchItems(); }, []);

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingSettings(true);
        try {
            const formData = new FormData();
            formData.append("titleBefore", settingsForm.titleBefore);
            formData.append("titleHighlight", settingsForm.titleHighlight);

            if (bgMode === "upload" && bgFile) {
                formData.append("backgroundImageFile", bgFile);
            } else {
                formData.append("backgroundImage", settingsForm.backgroundImage);
            }

            const res = await apiClient.put("/api/roadmap/settings", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            if (res.data.success) {
                toast.success("Settings updated successfully");
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

    const openCreate = () => {
        setEditingItem(null);
        setForm(emptyForm);
        setIsDialogOpen(true);
    };

    const openEdit = (item: RoadmapItem) => {
        setEditingItem(item);
        setForm({
            icon: item.icon || "FileText",
            headline: item.headline || "",
            description: item.description || "",
            order: item.order ?? 0,
            isActive: item.isActive,
        });
        setIsDialogOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.headline.trim()) { toast.error("Headline is required"); return; }
        if (!form.description.trim()) { toast.error("Description is required"); return; }

        setIsSubmitting(true);
        try {
            if (editingItem) {
                await apiClient.put(`/api/roadmap/${editingItem._id}`, form);
                toast.success("Step updated successfully");
            } else {
                await apiClient.post("/api/roadmap", form);
                toast.success("Step added successfully");
            }
            setIsDialogOpen(false);
            fetchItems();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to save");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this step?")) return;
        try {
            await apiClient.delete(`/api/roadmap/${id}`);
            toast.success("Deleted successfully");
            fetchItems();
        } catch {
            toast.error("Failed to delete");
        }
    };

    const toggleStatus = async (item: RoadmapItem) => {
        try {
            await apiClient.put(`/api/roadmap/${item._id}`, { isActive: !item.isActive });
            toast.success(`Step ${!item.isActive ? "activated" : "hidden"}`);
            fetchItems();
        } catch {
            toast.error("Failed to update status");
        }
    };

    const renderIcon = (iconName: string, className = "w-5 h-5") => {
        const IconComp = ICON_MAP[iconName] || FileText;
        return <IconComp className={className} />;
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                        Journey Roadmap Section
                    </h1>
                    <p className="text-gray-500 mt-1">Manage the step cards shown in the "Your Journey to Glory" section on the Registration page.</p>
                </div>
                <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 transition-all hover:scale-105 flex-shrink-0"
                    onClick={openCreate}
                >
                    <Plus className="mr-2 h-4 w-4" /> Add Step
                </Button>
            </div>

            {/* Section Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>Section Settings</CardTitle>
                    <CardDescription>Customize the heading and background image displayed on the website.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSaveSettings} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="titleBefore">Text before highlight</Label>
                                <Input id="titleBefore" value={settingsForm.titleBefore} onChange={(e) => setSettingsForm({ ...settingsForm, titleBefore: e.target.value })} placeholder="e.g. YOUR JOURNEY TO" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="titleHighlight">Highlighted Text (Yellow)</Label>
                                <Input id="titleHighlight" value={settingsForm.titleHighlight} onChange={(e) => setSettingsForm({ ...settingsForm, titleHighlight: e.target.value })} placeholder="e.g. GLORY" />
                            </div>
                        </div>

                        {/* Background Image */}
                        <div className="space-y-2">
                            <Label>Background Image</Label>
                            <div className="flex gap-2 p-1 bg-gray-100 rounded-lg w-fit">
                                <button type="button" onClick={() => setBgMode("upload")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${bgMode === "upload" ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-700"}`}>
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
                                    <Input value={settingsForm.backgroundImage} onChange={e => setSettingsForm({ ...settingsForm, backgroundImage: e.target.value })} placeholder="e.g. /banner.png or https://..." />
                                    {settingsForm.backgroundImage && (
                                        <img src={settingsForm.backgroundImage} alt="Background preview" className="w-full h-32 object-cover rounded border mt-1" onError={e => (e.currentTarget.style.display = 'none')} />
                                    )}
                                </div>
                            )}
                        </div>

                        <Button type="submit" disabled={isSavingSettings} className="w-full sm:w-auto">
                            {isSavingSettings ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving...</> : "Save Settings"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Steps List</CardTitle>
                    <CardDescription>Steps are sorted by Order then by creation date. Only Active steps appear on the website. The step number shown on the website is derived from the display order.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
                    ) : items.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>No steps yet. Click "Add Step" to get started.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-16">Order</TableHead>
                                    <TableHead className="w-16">Icon</TableHead>
                                    <TableHead>Headline</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map((item) => (
                                    <TableRow key={item._id}>
                                        <TableCell className="font-mono text-sm text-center">{item.order}</TableCell>
                                        <TableCell>
                                            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-600">
                                                {renderIcon(item.icon)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-semibold">{item.headline}</TableCell>
                                        <TableCell className="text-gray-500 text-sm max-w-[250px] truncate">{item.description}</TableCell>
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
                        <DialogTitle>{editingItem ? "Edit Step" : "Add New Step"}</DialogTitle>
                        <DialogDescription>
                            Configure the step card for the Journey Roadmap section.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSave} className="space-y-4 pt-2">

                        {/* Icon Picker */}
                        <div className="space-y-2">
                            <Label>Icon</Label>
                            <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto">
                                {ICON_OPTIONS.map((iconName) => (
                                    <button
                                        key={iconName}
                                        type="button"
                                        onClick={() => setForm({ ...form, icon: iconName })}
                                        className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all text-xs ${
                                            form.icon === iconName
                                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                                : "border-gray-200 hover:border-gray-300 text-gray-500"
                                        }`}
                                    >
                                        {renderIcon(iconName, "w-5 h-5")}
                                        <span className="truncate w-full text-center">{iconName}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Headline */}
                        <div className="space-y-2">
                            <Label htmlFor="rm-headline">Headline <span className="text-red-500">*</span></Label>
                            <Input
                                id="rm-headline"
                                placeholder="e.g. SIGN UP & PAY"
                                value={form.headline}
                                onChange={e => setForm({ ...form, headline: e.target.value })}
                                required
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="rm-desc">Description <span className="text-red-500">*</span></Label>
                            <Textarea
                                id="rm-desc"
                                placeholder="e.g. Fill your details and pay the one-time entry fee..."
                                value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                                rows={3}
                                required
                            />
                        </div>

                        {/* Order */}
                        <div className="space-y-2">
                            <Label htmlFor="rm-order">Display Order (also used as step number)</Label>
                            <Input
                                id="rm-order"
                                type="number"
                                min={0}
                                value={form.order}
                                onChange={e => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
                            />
                        </div>

                        {/* Active Toggle */}
                        <div className="flex items-center gap-3">
                            <Switch id="rm-active" checked={form.isActive} onCheckedChange={v => setForm({ ...form, isActive: v })} />
                            <Label htmlFor="rm-active">{form.isActive ? "Active - visible on website" : "Hidden"}</Label>
                        </div>

                        {/* Preview */}
                        <div className="space-y-2">
                            <Label>Preview</Label>
                            <div className="bg-[#0f172a] rounded-xl p-8 flex justify-center">
                                <div className="relative bg-white/5 backdrop-blur-md rounded-2xl p-8 pt-12 flex flex-col items-center text-center border border-white/10 w-56">
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 bg-gradient-to-br from-[#FF5555] to-[#D92020] rounded-full flex items-center justify-center border-4 border-[#0f172a] shadow-[0_0_20px_rgba(255,85,85,0.6)]">
                                        <span className="text-2xl font-black text-white">{form.order || 1}</span>
                                    </div>
                                    <div className="mt-4 mb-4 p-3 rounded-full bg-white/5 border border-white/10">
                                        {renderIcon(form.icon, "w-8 h-8 text-white/80")}
                                    </div>
                                    <h3 className="text-base font-bold text-white mb-3 uppercase tracking-wide">
                                        {form.headline || "HEADLINE"}
                                    </h3>
                                    <div className="w-10 h-1 bg-white/20 rounded-full mb-3"></div>
                                    <p className="text-gray-300 text-xs leading-relaxed">
                                        {form.description || "Step description goes here..."}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</> : (editingItem ? "Update Step" : "Add Step")}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminRoadmap;
