import React, { useState, useEffect } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash, Edit, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/apihelper/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

interface FAQ {
    _id: string;
    question: string;
    answer: string;
    isActive: boolean;
    createdAt: string;
}

const AdminFAQs = () => {
    const [faqs, setFaqs] = useState<FAQ[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingItem, setEditingItem] = useState<FAQ | null>(null);
    const userRole = localStorage.getItem("userRole") || "user";

    const [newItem, setNewItem] = useState({
        question: "",
        answer: "",
        isActive: true
    });

    const fetchFAQs = async () => {
        setIsLoading(true);
        try {
            const response = await apiClient.get("/api/faqs");
            if (response.data.success) {
                setFaqs(response.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch FAQs", error);
            toast.error("Failed to load FAQs");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchFAQs();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingItem) {
                await apiClient.put(`/api/faqs/${editingItem._id}`, newItem);
                toast.success("FAQ updated successfully");
            } else {
                await apiClient.post("/api/faqs/create", newItem);
                toast.success("FAQ created successfully");
            }

            setNewItem({ question: "", answer: "", isActive: true });
            setEditingItem(null);
            setIsDialogOpen(false);
            fetchFAQs();
        } catch (error: any) {
            console.error("Failed to save FAQ", error);
            toast.error(error.response?.data?.message || "Failed to save FAQ");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this FAQ?")) return;
        try {
            await apiClient.delete(`/api/faqs/${id}`);
            toast.success("FAQ deleted successfully");
            fetchFAQs();
        } catch (error) {
            console.error("Failed to delete FAQ", error);
            toast.error("Failed to delete FAQ");
        }
    };

    const openEditDialog = (faq: FAQ) => {
        setEditingItem(faq);
        setNewItem({
            question: faq.question,
            answer: faq.answer,
            isActive: faq.isActive
        });
        setIsDialogOpen(true);
    };

    const openCreateDialog = () => {
        setEditingItem(null);
        setNewItem({ question: "", answer: "", isActive: true });
        setIsDialogOpen(true);
    }

    const toggleStatus = async (faq: FAQ) => {
        try {
            await apiClient.put(`/api/faqs/${faq._id}`, { ...faq, isActive: !faq.isActive });
            toast.success(`FAQ ${!faq.isActive ? 'activated' : 'deactivated'}`);
            fetchFAQs();
        } catch (error) {
            toast.error("Failed to update status");
        }
    }


    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                        Manage FAQs
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Create, edit, and manage frequently asked questions for the website.
                    </p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 transition-all hover:scale-105" onClick={openCreateDialog}>
                            <Plus className="mr-2 h-4 w-4" /> Add New FAQ
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingItem ? 'Edit FAQ' : 'Create New FAQ'}</DialogTitle>
                            <DialogDescription>
                                Add a common question and answer to help users.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreate} className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="question">Question</Label>
                                <Input
                                    id="question"
                                    placeholder="e.g. How do I register?"
                                    value={newItem.question}
                                    onChange={(e) => setNewItem({ ...newItem, question: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="answer">Answer</Label>
                                <Textarea
                                    id="answer"
                                    placeholder="Detailed answer..."
                                    value={newItem.answer}
                                    onChange={(e) => setNewItem({ ...newItem, answer: e.target.value })}
                                    className="min-h-[100px]"
                                    required
                                />
                            </div>

                            <div className="flex items-center space-x-2">
                                <Label htmlFor="isActive">Active Status</Label>
                                <Switch
                                    id="isActive"
                                    checked={newItem.isActive}
                                    onCheckedChange={(checked) => setNewItem({ ...newItem, isActive: checked })}
                                />
                                <span className="text-sm text-gray-500">{newItem.isActive ? 'Visible on website' : 'Hidden'}</span>
                            </div>

                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? "Saving..." : (editingItem ? "Update FAQ" : "Create FAQ")}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>FAQ List</CardTitle>
                    <CardDescription>All questions currently in the system.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center p-8">Loading...</div>
                    ) : faqs.length === 0 ? (
                        <div className="text-center p-8 text-gray-500">No FAQs created yet.</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[300px]">Question</TableHead>
                                    <TableHead>Answer</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {faqs.map((faq) => (
                                    <TableRow key={faq._id}>
                                        <TableCell className="font-medium align-top">
                                            {faq.question}
                                        </TableCell>
                                        <TableCell className="text-gray-600 align-top whitespace-pre-wrap max-w-md">
                                            {faq.answer}
                                        </TableCell>
                                        <TableCell className="align-top">
                                            <div
                                                className={`flex items-center gap-1 px-2 py-1 rounded-full w-fit text-xs font-medium cursor-pointer ${faq.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                                                onClick={() => toggleStatus(faq)}
                                            >
                                                {faq.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                {faq.isActive ? 'Active' : 'Hidden'}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right align-top">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => openEditDialog(faq)}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                {userRole === 'admin' && (
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => handleDelete(faq._id)}
                                                    >
                                                        <Trash className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminFAQs;
