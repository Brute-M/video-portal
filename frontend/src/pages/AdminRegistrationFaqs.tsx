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
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash, Edit, Loader2, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/apihelper/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface RegistrationFaq {
    _id: string;
    question: string;
    answer: string;
    order: number;
    isActive: boolean;
    createdAt: string;
}

const emptyForm = { question: "", answer: "", order: 0, isActive: true };

const AdminRegistrationFaqs = () => {
    const [faqs, setFaqs] = useState<RegistrationFaq[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingItem, setEditingItem] = useState<RegistrationFaq | null>(null);
    const [form, setForm] = useState(emptyForm);

    // Settings
    const [settingsForm, setSettingsForm] = useState({ titleBefore: "FREQUENTLY ASKED", titleHighlight: "QUESTIONS" });
    const [isSavingSettings, setIsSavingSettings] = useState(false);

    const fetchFaqs = async () => {
        setIsLoading(true);
        try {
            const res = await apiClient.get("/api/registration-faqs/all");
            if (res.data.success) {
                setFaqs(res.data.data);
                if (res.data.settings) {
                    setSettingsForm({
                        titleBefore: res.data.settings.titleBefore || "FREQUENTLY ASKED",
                        titleHighlight: res.data.settings.titleHighlight || "QUESTIONS"
                    });
                }
            }
        } catch {
            toast.error("Failed to load FAQs");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchFaqs(); }, []);

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingSettings(true);
        try {
            const res = await apiClient.put("/api/registration-faqs/settings", settingsForm);
            if (res.data.success) toast.success("Section title updated");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to update settings");
        } finally {
            setIsSavingSettings(false);
        }
    };

    const openCreate = () => { setEditingItem(null); setForm(emptyForm); setIsDialogOpen(true); };

    const openEdit = (item: RegistrationFaq) => {
        setEditingItem(item);
        setForm({
            question: item.question || "",
            answer: item.answer || "",
            order: item.order ?? 0,
            isActive: item.isActive,
        });
        setIsDialogOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.question.trim()) { toast.error("Question is required"); return; }
        if (!form.answer.trim()) { toast.error("Answer is required"); return; }

        setIsSubmitting(true);
        try {
            if (editingItem) {
                await apiClient.put(`/api/registration-faqs/${editingItem._id}`, form);
                toast.success("FAQ updated successfully");
            } else {
                await apiClient.post("/api/registration-faqs", form);
                toast.success("FAQ added successfully");
            }
            setIsDialogOpen(false);
            fetchFaqs();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to save");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this FAQ?")) return;
        try {
            await apiClient.delete(`/api/registration-faqs/${id}`);
            toast.success("Deleted successfully");
            fetchFaqs();
        } catch {
            toast.error("Failed to delete");
        }
    };

    const toggleStatus = async (item: RegistrationFaq) => {
        try {
            await apiClient.put(`/api/registration-faqs/${item._id}`, { isActive: !item.isActive });
            toast.success(`FAQ ${!item.isActive ? "activated" : "hidden"}`);
            fetchFaqs();
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
                        Registration FAQs
                    </h1>
                    <p className="text-gray-500 mt-1">Manage the FAQ accordion on the Registration page.</p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 transition-all hover:scale-105 flex-shrink-0" onClick={openCreate}>
                    <Plus className="mr-2 h-4 w-4" /> Add FAQ
                </Button>
            </div>

            {/* Title Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>Section Title Settings</CardTitle>
                    <CardDescription>Customize the heading displayed above the FAQ accordion.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSaveSettings} className="flex flex-col sm:flex-row gap-4 items-end">
                        <div className="space-y-2 w-full sm:w-1/3">
                            <Label htmlFor="faqTitleBefore">Text before highlight</Label>
                            <Input id="faqTitleBefore" value={settingsForm.titleBefore} onChange={e => setSettingsForm({ ...settingsForm, titleBefore: e.target.value })} placeholder="e.g. FREQUENTLY ASKED" />
                        </div>
                        <div className="space-y-2 w-full sm:w-1/3">
                            <Label htmlFor="faqTitleHL">Highlighted Text (Yellow)</Label>
                            <Input id="faqTitleHL" value={settingsForm.titleHighlight} onChange={e => setSettingsForm({ ...settingsForm, titleHighlight: e.target.value })} placeholder="e.g. QUESTIONS" />
                        </div>
                        <Button type="submit" disabled={isSavingSettings} className="w-full sm:w-auto">
                            {isSavingSettings ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving...</> : "Save Title"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* FAQs Table */}
            <Card>
                <CardHeader>
                    <CardTitle>FAQ List</CardTitle>
                    <CardDescription>Sorted by Order. Only Active FAQs appear on the website. The number prefix is auto-generated from display order.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
                    ) : faqs.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <HelpCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>No FAQs yet. Click "Add FAQ" to get started.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-16">Order</TableHead>
                                    <TableHead>Question</TableHead>
                                    <TableHead>Answer</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {faqs.map((item) => (
                                    <TableRow key={item._id}>
                                        <TableCell className="font-mono text-sm text-center">{item.order}</TableCell>
                                        <TableCell className="font-semibold max-w-[250px] truncate">{item.question}</TableCell>
                                        <TableCell className="text-gray-500 text-sm max-w-[300px] truncate">{item.answer}</TableCell>
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
                        <DialogTitle>{editingItem ? "Edit FAQ" : "Add New FAQ"}</DialogTitle>
                        <DialogDescription>Enter the question and answer for the Registration page FAQ section.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSave} className="space-y-4 pt-2">
                        {/* Question */}
                        <div className="space-y-2">
                            <Label htmlFor="rfaq-q">Question <span className="text-red-500">*</span></Label>
                            <Input id="rfaq-q" placeholder="e.g. Is this Leather Ball or Tennis Ball?" value={form.question} onChange={e => setForm({ ...form, question: e.target.value })} required />
                        </div>

                        {/* Answer */}
                        <div className="space-y-2">
                            <Label htmlFor="rfaq-a">Answer <span className="text-red-500">*</span></Label>
                            <Textarea id="rfaq-a" placeholder="Type the answer here..." value={form.answer} onChange={e => setForm({ ...form, answer: e.target.value })} rows={4} required />
                        </div>

                        {/* Order */}
                        <div className="space-y-2">
                            <Label htmlFor="rfaq-order">Display Order</Label>
                            <Input id="rfaq-order" type="number" min={0} value={form.order} onChange={e => setForm({ ...form, order: parseInt(e.target.value) || 0 })} />
                        </div>

                        {/* Active */}
                        <div className="flex items-center gap-3">
                            <Switch id="rfaq-active" checked={form.isActive} onCheckedChange={v => setForm({ ...form, isActive: v })} />
                            <Label htmlFor="rfaq-active">{form.isActive ? "Active - visible on website" : "Hidden"}</Label>
                        </div>

                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</> : (editingItem ? "Update FAQ" : "Add FAQ")}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminRegistrationFaqs;
