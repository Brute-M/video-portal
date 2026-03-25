import React, { useState, useEffect } from "react";
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
import {
    Plus, Trash, Edit, Loader2, Trophy, Circle, Tv, Users, Bot, Timer,
    Star, Heart, Zap, Shield, Target, Award, Crown, Flame, Gem, Globe,
    Megaphone, Rocket, ThumbsUp, TrendingUp, type LucideIcon
} from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/apihelper/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// Icon map for rendering
const ICON_MAP: Record<string, LucideIcon> = {
    Trophy, Circle, Tv, Users, Bot, Timer,
    Star, Heart, Zap, Shield, Target, Award, Crown, Flame, Gem, Globe,
    Megaphone, Rocket, ThumbsUp, TrendingUp
};

const ICON_OPTIONS = Object.keys(ICON_MAP);

interface NumbersSpeakItem {
    _id: string;
    icon: string;
    hook: string;
    descriptor: string;
    order: number;
    isActive: boolean;
    createdAt: string;
}

const emptyForm = { icon: "Trophy", hook: "", descriptor: "", order: 0, isActive: true };

const AdminNumbersSpeak = () => {
    const [items, setItems] = useState<NumbersSpeakItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingItem, setEditingItem] = useState<NumbersSpeakItem | null>(null);
    const [form, setForm] = useState(emptyForm);

    // Settings State
    const [settingsForm, setSettingsForm] = useState({ title: "The Numbers Speak" });
    const [isSavingSettings, setIsSavingSettings] = useState(false);

    const fetchItems = async () => {
        setIsLoading(true);
        try {
            const res = await apiClient.get("/api/numbers-speak/all");
            if (res.data.success) {
                setItems(res.data.data);
                if (res.data.settings) {
                    setSettingsForm({ title: res.data.settings.title || "The Numbers Speak" });
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
            const res = await apiClient.put("/api/numbers-speak/settings", settingsForm);
            if (res.data.success) {
                toast.success("Section title updated successfully");
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

    const openEdit = (item: NumbersSpeakItem) => {
        setEditingItem(item);
        setForm({
            icon: item.icon || "Trophy",
            hook: item.hook || "",
            descriptor: item.descriptor || "",
            order: item.order ?? 0,
            isActive: item.isActive,
        });
        setIsDialogOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.hook.trim()) {
            toast.error("Hook text is required (e.g. '₹3 Crore')");
            return;
        }
        if (!form.descriptor.trim()) {
            toast.error("Descriptor is required (e.g. 'TOTAL PRIZE POOL')");
            return;
        }

        setIsSubmitting(true);
        try {
            if (editingItem) {
                await apiClient.put(`/api/numbers-speak/${editingItem._id}`, form);
                toast.success("Item updated successfully");
            } else {
                await apiClient.post("/api/numbers-speak", form);
                toast.success("Item added successfully");
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
        if (!confirm("Delete this item?")) return;
        try {
            await apiClient.delete(`/api/numbers-speak/${id}`);
            toast.success("Deleted successfully");
            fetchItems();
        } catch {
            toast.error("Failed to delete");
        }
    };

    const toggleStatus = async (item: NumbersSpeakItem) => {
        try {
            await apiClient.put(`/api/numbers-speak/${item._id}`, { isActive: !item.isActive });
            toast.success(`Item ${!item.isActive ? "activated" : "hidden"}`);
            fetchItems();
        } catch {
            toast.error("Failed to update status");
        }
    };

    const renderIcon = (iconName: string, className = "w-5 h-5") => {
        const IconComp = ICON_MAP[iconName] || Trophy;
        return <IconComp className={className} />;
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                        The Numbers Speak Section
                    </h1>
                    <p className="text-gray-500 mt-1">Manage the trust/stat cards shown in "The Numbers Speak" section on the home page.</p>
                </div>
                <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 transition-all hover:scale-105 flex-shrink-0"
                    onClick={openCreate}
                >
                    <Plus className="mr-2 h-4 w-4" /> Add Item
                </Button>
            </div>

            {/* Title Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>Section Title Settings</CardTitle>
                    <CardDescription>Customize the heading displayed above the cards on the website.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSaveSettings} className="flex flex-col sm:flex-row gap-4 items-end">
                        <div className="space-y-2 w-full sm:w-1/2">
                            <Label htmlFor="sectionTitle">Section Title</Label>
                            <Input
                                id="sectionTitle"
                                value={settingsForm.title}
                                onChange={(e) => setSettingsForm({ title: e.target.value })}
                                placeholder="e.g. The Numbers Speak"
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
                    <CardTitle>Items List</CardTitle>
                    <CardDescription>Items are sorted by Order then by creation date. Only Active items appear on the website.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
                    ) : items.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>No items yet. Click "Add Item" to get started.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-16">Order</TableHead>
                                    <TableHead className="w-16">Icon</TableHead>
                                    <TableHead>Hook Text</TableHead>
                                    <TableHead>Descriptor</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map((item) => (
                                    <TableRow key={item._id}>
                                        <TableCell className="font-mono text-sm text-center">{item.order}</TableCell>
                                        <TableCell>
                                            <div className="w-10 h-10 rounded-lg bg-[#111a45] flex items-center justify-center text-[#FFC928]">
                                                {renderIcon(item.icon)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-semibold text-[#FFC928]">{item.hook}</TableCell>
                                        <TableCell className="text-gray-600 text-xs uppercase tracking-wider">{item.descriptor}</TableCell>
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
                        <DialogTitle>{editingItem ? "Edit Item" : "Add New Item"}</DialogTitle>
                        <DialogDescription>
                            Configure the card details for the Numbers Speak section.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSave} className="space-y-4 pt-2">

                        {/* Icon Picker */}
                        <div className="space-y-2">
                            <Label>Icon</Label>
                            <div className="grid grid-cols-5 gap-2">
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

                        {/* Hook Text */}
                        <div className="space-y-2">
                            <Label htmlFor="ns-hook">Hook Text <span className="text-red-500">*</span></Label>
                            <Input
                                id="ns-hook"
                                placeholder="e.g. ₹3 Crore"
                                value={form.hook}
                                onChange={e => setForm({ ...form, hook: e.target.value })}
                                required
                            />
                        </div>

                        {/* Descriptor */}
                        <div className="space-y-2">
                            <Label htmlFor="ns-descriptor">Descriptor <span className="text-red-500">*</span></Label>
                            <Input
                                id="ns-descriptor"
                                placeholder="e.g. TOTAL PRIZE POOL"
                                value={form.descriptor}
                                onChange={e => setForm({ ...form, descriptor: e.target.value })}
                                required
                            />
                        </div>

                        {/* Order */}
                        <div className="space-y-2">
                            <Label htmlFor="ns-order">Display Order</Label>
                            <Input
                                id="ns-order"
                                type="number"
                                min={0}
                                value={form.order}
                                onChange={e => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
                            />
                        </div>

                        {/* Active Toggle */}
                        <div className="flex items-center gap-3">
                            <Switch id="ns-active" checked={form.isActive} onCheckedChange={v => setForm({ ...form, isActive: v })} />
                            <Label htmlFor="ns-active">{form.isActive ? "Active - visible on website" : "Hidden"}</Label>
                        </div>

                        {/* Preview */}
                        <div className="space-y-2">
                            <Label>Preview</Label>
                            <div className="bg-[#020617] rounded-xl p-6 flex justify-center">
                                <div className="relative rounded-2xl p-[2px] shadow-[0_0_20px_rgba(255,201,40,0.15)] min-h-[160px] w-48 overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-r from-gray-700 via-[#FFC928] to-gray-700"></div>
                                    <div className="relative bg-[#111a45] rounded-[14px] p-4 flex flex-col items-center justify-center text-center w-full h-full">
                                        <div className="text-[#FFC928] mb-3">
                                            {renderIcon(form.icon, "w-10 h-10")}
                                        </div>
                                        <h3 className="text-xl font-bold text-[#FFC928] leading-tight mb-1">
                                            {form.hook || "Hook Text"}
                                        </h3>
                                        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">
                                            {form.descriptor || "DESCRIPTOR"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</> : (editingItem ? "Update Item" : "Add Item")}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminNumbersSpeak;
