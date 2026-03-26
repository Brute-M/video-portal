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
import { Plus, Trash, Download, Pencil, Eye, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
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

interface CampaignUser {
    _id: string;
    fname: string;
    lname: string;
    email: string;
    mobile: string;
    city: string;
    state: string;
    isPaid: boolean;
    createdAt: string;
}

const AdminCampaigns = () => {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const userRole = localStorage.getItem("userRole") || "user";

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const [newItem, setNewItem] = useState({
        title: "",
        targetUrl: window.location.origin + "/registration",
        description: "",
    });

    const [editItem, setEditItem] = useState<Campaign | null>(null);
    const [editFormData, setEditFormData] = useState({
        title: "",
        targetUrl: "",
        description: "",
    });

    // View users state
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [viewCampaign, setViewCampaign] = useState<Campaign | null>(null);
    const [campaignUsers, setCampaignUsers] = useState<CampaignUser[]>([]);
    const [isFetchingCampaignUsers, setIsFetchingCampaignUsers] = useState(false);
    const [viewPage, setViewPage] = useState(1);
    const [viewTotalPages, setViewTotalPages] = useState(1);
    const [viewTotal, setViewTotal] = useState(0);

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

    // View campaign users
    const fetchCampaignUsers = async (code: string, page: number = 1) => {
        setIsFetchingCampaignUsers(true);
        try {
            const response = await apiClient.get(`/api/campaigns/users/${code}?page=${page}&limit=10`);
            if (response.data.success) {
                setCampaignUsers(response.data.data);
                setViewPage(response.data.pagination.page);
                setViewTotalPages(response.data.pagination.totalPages);
                setViewTotal(response.data.pagination.total);
            }
        } catch (error) {
            toast.error("Failed to fetch users");
        } finally {
            setIsFetchingCampaignUsers(false);
        }
    };

    const handleViewClick = (campaign: Campaign) => {
        setViewCampaign(campaign);
        setCampaignUsers([]);
        setViewPage(1);
        setViewTotalPages(1);
        setViewTotal(0);
        setIsViewDialogOpen(true);
        fetchCampaignUsers(campaign.code, 1);
    };

    const handleViewPageChange = (page: number) => {
        if (viewCampaign) {
            fetchCampaignUsers(viewCampaign.code, page);
        }
    };

    // Pagination for campaigns list
    const totalPages = Math.ceil(campaigns.length / itemsPerPage);
    const paginatedCampaigns = campaigns.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

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

                {/* View Registered Users Dialog */}
                <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                    <DialogContent className="max-w-5xl w-[90vw] max-h-[85vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Registered Users — {viewCampaign?.title}</DialogTitle>
                            <DialogDescription>
                                Campaign Code: <span className="font-mono font-semibold">{viewCampaign?.code}</span> &nbsp;|&nbsp; Total Registrations: <span className="font-semibold text-blue-600">{viewTotal}</span>
                            </DialogDescription>
                        </DialogHeader>

                        {isFetchingCampaignUsers ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                            </div>
                        ) : campaignUsers.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">No users registered via this QR campaign yet.</div>
                        ) : (
                            <>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>#</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Mobile</TableHead>
                                            <TableHead>City</TableHead>
                                            <TableHead>Paid</TableHead>
                                            <TableHead>Date</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {campaignUsers.map((user, idx) => (
                                            <TableRow key={user._id}>
                                                <TableCell className="text-gray-500">{(viewPage - 1) * 10 + idx + 1}</TableCell>
                                                <TableCell className="font-medium">{user.fname} {user.lname}</TableCell>
                                                <TableCell className="text-sm">{user.email}</TableCell>
                                                <TableCell className="text-sm">{user.mobile}</TableCell>
                                                <TableCell className="text-sm">{user.city || '-'}</TableCell>
                                                <TableCell>
                                                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${user.isPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {user.isPaid ? 'Paid' : 'Unpaid'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-sm text-gray-500">{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>

                                {/* View Users Pagination */}
                                {viewTotalPages > 1 && (
                                    <div className="flex items-center justify-between pt-4">
                                        <span className="text-sm text-gray-500">
                                            Page {viewPage} of {viewTotalPages} ({viewTotal} users)
                                        </span>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={viewPage <= 1}
                                                onClick={() => handleViewPageChange(viewPage - 1)}
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={viewPage >= viewTotalPages}
                                                onClick={() => handleViewPageChange(viewPage + 1)}
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
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
                        <>
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
                                    {paginatedCampaigns.map((campaign) => (
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
                                                        onClick={() => handleViewClick(campaign)}
                                                        className="hover:bg-green-50 hover:text-green-600"
                                                    >
                                                        <Eye className="w-4 h-4 mr-2" />
                                                        View
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

                            {/* Campaigns Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between pt-4 border-t mt-4">
                                    <span className="text-sm text-gray-500">
                                        Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, campaigns.length)} of {campaigns.length} campaigns
                                    </span>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={currentPage <= 1}
                                            onClick={() => setCurrentPage(p => p - 1)}
                                        >
                                            <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={currentPage >= totalPages}
                                            onClick={() => setCurrentPage(p => p + 1)}
                                        >
                                            Next <ChevronRight className="w-4 h-4 ml-1" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminCampaigns;
