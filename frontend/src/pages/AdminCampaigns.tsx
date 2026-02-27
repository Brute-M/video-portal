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
import { Plus, Trash, Download, QrCode, Pencil } from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/apihelper/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface Campaign {
    _id: string;
    title: string;
    code: string;
    targetUrl: string;
    description: string;
    userCount: number;
    qrCode: string;
    createdAt: string;
}

const AdminCampaigns = () => {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const userRole = localStorage.getItem("userRole") || "user";

    const [newItem, setNewItem] = useState({
        title: "",
        targetUrl: window.location.origin + "/registration", // Default to registration page
        description: "",
    });

    const [editItem, setEditItem] = useState<Campaign | null>(null);
    const [editFormData, setEditFormData] = useState({
        title: "",
        targetUrl: "",
        description: "",
    });

    const fetchCampaigns = async () => {
        setIsLoading(true);
        try {
            const response = await apiClient.get("/api/campaigns");
            if (response.data.success) {
                setCampaigns(response.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch campaigns", error);
            toast.error("Failed to load campaigns");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await apiClient.post("/api/campaigns/create", newItem);
            toast.success("Campaign created successfully");
            setNewItem({
                title: "",
                targetUrl: window.location.origin + "/registration",
                description: "",
            });
            setIsDialogOpen(false);
            fetchCampaigns();
        } catch (error: any) {
            console.error("Failed to create campaign", error);
            toast.error(error.response?.data?.message || "Failed to create campaign");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditClick = (campaign: Campaign) => {
        setEditItem(campaign);
        setEditFormData({
            title: campaign.title,
            targetUrl: campaign.targetUrl,
            description: campaign.description,
        });
        setIsEditDialogOpen(true);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editItem) return;

        setIsSubmitting(true);
        try {
            await apiClient.put(`/api/campaigns/${editItem._id}`, editFormData);
            toast.success("Campaign updated successfully");
            setIsEditDialogOpen(false);
            setEditItem(null);
            fetchCampaigns();
        } catch (error: any) {
            console.error("Failed to update campaign", error);
            toast.error(error.response?.data?.message || "Failed to update campaign");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this campaign? This cannot be undone.")) return;
        try {
            await apiClient.delete(`/api/campaigns/${id}`);
            toast.success("Campaign deleted successfully");
            fetchCampaigns();
        } catch (error) {
            console.error("Failed to delete campaign", error);
            toast.error("Failed to delete campaign");
        }
    };

    const downloadQR = (qrDataUrl: string, filename: string) => {
        const link = document.createElement("a");
        link.href = qrDataUrl;
        link.download = `${filename}-qr.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                        QR Campaigns
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Create and track QR code campaigns for user registration
                    </p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 transition-all hover:scale-105">
                            <Plus className="mr-2 h-4 w-4" /> Create New Campaign
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New QR Campaign</DialogTitle>
                            <DialogDescription>
                                Generate a trackable QR code. Users scanning this will be tracked.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreate} className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Campaign Title</Label>
                                <Input
                                    id="title"
                                    placeholder="e.g. College Fest 2026"
                                    value={newItem.title}
                                    onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="targetUrl">Target URL</Label>
                                <Input
                                    id="targetUrl"
                                    placeholder="https://..."
                                    value={newItem.targetUrl}
                                    onChange={(e) => setNewItem({ ...newItem, targetUrl: e.target.value })}
                                    required
                                />
                                <p className="text-xs text-muted-foreground">
                                    The QR code will point to this URL with a tracking parameter attached.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description (Optional)</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Internal notes about this campaign..."
                                    value={newItem.description}
                                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? "Creating..." : "Create Campaign"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Edit Dialog */}
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Campaign</DialogTitle>
                            <DialogDescription>
                                Update the campaign details. Note: Changing the URL might affect already printed QR codes if the structure changes significantly, but the code tracking should persist.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleUpdate} className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-title">Campaign Title</Label>
                                <Input
                                    id="edit-title"
                                    value={editFormData.title}
                                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-targetUrl">Target URL</Label>
                                <Input
                                    id="edit-targetUrl"
                                    value={editFormData.targetUrl}
                                    onChange={(e) => setEditFormData({ ...editFormData, targetUrl: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-description">Description (Optional)</Label>
                                <Textarea
                                    id="edit-description"
                                    value={editFormData.description}
                                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? "Updating..." : "Update Campaign"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Active Campaigns</CardTitle>
                    <CardDescription>Manage your active QR code tracking sources.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center p-8">Loading...</div>
                    ) : campaigns.length === 0 ? (
                        <div className="text-center p-8 text-gray-500">No campaigns created yet.</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px]">QR Code</TableHead>
                                    <TableHead>Details</TableHead>
                                    <TableHead>Stats</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {campaigns.map((campaign) => (
                                    <TableRow key={campaign._id}>
                                        <TableCell>
                                            <div className="group relative w-16 h-16 cursor-pointer" onClick={() => downloadQR(campaign.qrCode, campaign.title)}>
                                                <img
                                                    src={campaign.qrCode}
                                                    alt="QR"
                                                    className="w-full h-full object-contain border rounded p-1"
                                                    loading="lazy"
                                                    decoding="async"
                                                />
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded transition-opacity">
                                                    <Download className="w-6 h-6 text-white" />
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-semibold text-lg">{campaign.title}</div>
                                            <div className="text-sm text-gray-500">Code: <span className="font-mono bg-gray-100 px-1 rounded">{campaign.code}</span></div>
                                            <div className="text-xs text-gray-400 mt-1 truncate max-w-[300px]">{campaign.targetUrl}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm font-medium">Registrations</span>
                                                <span className="text-2xl font-bold text-blue-600">{campaign.userCount}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => downloadQR(campaign.qrCode, campaign.title)}
                                                    className="hover:bg-blue-50 hover:text-blue-600"
                                                >
                                                    <Download className="w-4 h-4 mr-2" />
                                                    Download QR
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleEditClick(campaign)}
                                                    className="hover:bg-yellow-50 hover:text-yellow-600"
                                                >
                                                    <Pencil className="w-4 h-4 mr-2" />
                                                    Edit
                                                </Button>
                                                {userRole === 'admin' && (
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => handleDelete(campaign._id)}
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

export default AdminCampaigns;
