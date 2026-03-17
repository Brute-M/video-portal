import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, Link as LinkIcon, Copy, BarChart3 } from "lucide-react";
import api from "@/apihelper/api";

const API_BASE = "/api/influencer-links";

interface InfluencerLinkRow {
    _id: string;
    name: string;
    slug: string;
    targetUrl: string;
    description?: string;
    originalPrice: number;
    discountPrice: number;
    status: string;
    totalClicks: number;
    totalRegistrations: number;
    totalPayments: number;
    totalRevenue: number;
    createdAt: string;
}

interface AnalyticsRow extends InfluencerLinkRow {
    conversionRate: string;
}

const getLinks = async (params?: { page?: number; limit?: number; status?: string }) => {
    const p = new URLSearchParams();
    if (params?.page) p.set("page", String(params.page));
    if (params?.limit) p.set("limit", String(params.limit));
    if (params?.status) p.set("status", params.status);
    const res = await api.get(`${API_BASE}?${p.toString()}`);
    return res.data?.data ?? res.data;
};

const getAnalytics = async (sortBy?: string, order?: string) => {
    const p = new URLSearchParams();
    if (sortBy) p.set("sortBy", sortBy);
    if (order) p.set("order", order);
    const res = await api.get(`${API_BASE}/analytics?${p.toString()}`);
    return res.data?.data ?? res.data;
};

const createLink = async (body: Record<string, unknown>) => {
    const res = await api.post(API_BASE, body);
    return res.data?.data ?? res.data;
};

const updateLink = async (id: string, body: Record<string, unknown>) => {
    const res = await api.put(`${API_BASE}/${id}`, body);
    return res.data?.data ?? res.data;
};

const deleteLink = async (id: string) => {
    await api.delete(`${API_BASE}/${id}`);
};

const AdminInfluencerLinks = () => {
    const { toast } = useToast();
    const [links, setLinks] = useState<InfluencerLinkRow[]>([]);
    const [analytics, setAnalytics] = useState<AnalyticsRow[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [view, setView] = useState<"list" | "analytics">("list");

    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [targetUrl, setTargetUrl] = useState("/registration");
    const [description, setDescription] = useState("");
    const [originalPrice, setOriginalPrice] = useState(1499);
    const [discountPrice, setDiscountPrice] = useState(999);
    const [status, setStatus] = useState<"active" | "inactive">("active");

    useEffect(() => {
        fetchLinks();
    }, []);

    useEffect(() => {
        if (view === "analytics") fetchAnalytics();
    }, [view]);

    const fetchLinks = async () => {
        setIsLoading(true);
        try {
            const data = await getLinks({ limit: 100 });
            setLinks(data?.items ?? data ?? []);
        } catch (e) {
            console.error(e);
            toast({ variant: "destructive", title: "Error", description: "Failed to fetch influencer links." });
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAnalytics = async () => {
        try {
            const rows = await getAnalytics("totalClicks", "desc");
            setAnalytics(Array.isArray(rows) ? rows : []);
        } catch (e) {
            console.error(e);
            toast({ variant: "destructive", title: "Error", description: "Failed to fetch analytics." });
        }
    };

    const fullShortUrl = (s: string) => {
        const base = window.location.origin;
        return `${base}/i/${s}`;
    };

    const copyUrl = (s: string) => {
        navigator.clipboard.writeText(fullShortUrl(s));
        toast({ title: "Copied", description: "Influencer link copied to clipboard." });
    };

    const handleEdit = (row: InfluencerLinkRow) => {
        setEditId(row._id);
        setName(row.name);
        setSlug(row.slug);
        setTargetUrl(row.targetUrl || "/registration");
        setDescription(row.description || "");
        setOriginalPrice(row.originalPrice ?? 1499);
        setDiscountPrice(row.discountPrice ?? 999);
        setStatus((row.status as "active" | "inactive") || "active");
    };

    const handleCancelEdit = () => {
        setEditId(null);
        setName("");
        setSlug("");
        setTargetUrl("/registration");
        setDescription("");
        setOriginalPrice(1499);
        setDiscountPrice(999);
        setStatus("active");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            toast({ variant: "destructive", title: "Validation", description: "Name is required." });
            return;
        }
        setIsSubmitting(true);
        try {
            const body: Record<string, unknown> = {
                name: name.trim(),
                targetUrl: targetUrl || "/registration",
                description: description.trim() || undefined,
                originalPrice: Number(originalPrice) || 1499,
                discountPrice: Number(discountPrice) || 999,
                status,
            };
            if (slug.trim()) body.slug = slug.trim().toLowerCase().replace(/\s+/g, "-");
            if (editId) {
                await updateLink(editId, body);
                toast({ title: "Updated", description: "Influencer link updated." });
            } else {
                await createLink(body);
                toast({ title: "Created", description: "Influencer link created." });
            }
            handleCancelEdit();
            fetchLinks();
            if (view === "analytics") fetchAnalytics();
        } catch (err: any) {
            const msg = err.response?.data?.data?.message || err.response?.data?.message || "Failed to save.";
            toast({ variant: "destructive", title: "Error", description: msg });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Delete this influencer link? This cannot be undone.")) return;
        try {
            await deleteLink(id);
            toast({ title: "Deleted", description: "Influencer link deleted." });
            fetchLinks();
            if (view === "analytics") setAnalytics((a) => a.filter((x) => x._id !== id));
            if (editId === id) handleCancelEdit();
        } catch (e) {
            toast({ variant: "destructive", title: "Error", description: "Failed to delete." });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <h1 className="text-3xl font-bold font-display">Influencer Links</h1>
                <div className="flex gap-2">
                    <Button variant={view === "list" ? "default" : "outline"} size="sm" onClick={() => setView("list")}>
                        <LinkIcon className="w-4 h-4 mr-2" />
                        Links
                    </Button>
                    <Button variant={view === "analytics" ? "default" : "outline"} size="sm" onClick={() => setView("analytics")}>
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Analytics
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{editId ? "Edit Influencer Link" : "Add Influencer Link"}</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Influencer Name *</Label>
                                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rohit Fit" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="slug">Slug / Code (unique)</Label>
                                <Input
                                    id="slug"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value.replace(/[^a-z0-9_-]/gi, "").toLowerCase())}
                                    placeholder="e.g. rohitfit"
                                    disabled={!!editId}
                                />
                                {editId && <p className="text-xs text-muted-foreground">Slug cannot be changed after creation.</p>}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="targetUrl">Target URL</Label>
                            <Input id="targetUrl" value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} placeholder="/registration" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description (optional)</Label>
                            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[80px]" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="originalPrice">Original Price (₹)</Label>
                                <Input id="originalPrice" type="number" min={0} value={originalPrice} onChange={(e) => setOriginalPrice(Number(e.target.value) || 0)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="discountPrice">Discount Price (₹)</Label>
                                <Input id="discountPrice" type="number" min={0} value={discountPrice} onChange={(e) => setDiscountPrice(Number(e.target.value) || 0)} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={status} onValueChange={(v) => setStatus(v as "active" | "inactive")}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex gap-4 mt-6">
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                {editId ? "Update" : "Create"}
                            </Button>
                            {editId && (
                                <Button type="button" variant="outline" onClick={handleCancelEdit} disabled={isSubmitting}>
                                    Cancel
                                </Button>
                            )}
                        </div>
                    </form>
                </CardContent>
            </Card>

            {view === "list" && (
                <Card>
                    <CardHeader>
                        <CardTitle>All Influencer Links</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Slug</TableHead>
                                        <TableHead>Link</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {links.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                                                No influencer links yet. Create one above.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        links.map((row) => (
                                            <TableRow key={row._id}>
                                                <TableCell className="font-medium">{row.name}</TableCell>
                                                <TableCell>{row.slug}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <code className="text-xs bg-muted px-2 py-1 rounded">{fullShortUrl(row.slug)}</code>
                                                        <Button variant="ghost" size="icon" onClick={() => copyUrl(row.slug)} title="Copy">
                                                            <Copy className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                                <TableCell>₹{row.originalPrice} → ₹{row.discountPrice}</TableCell>
                                                <TableCell>
                                                    <span className={row.status === "active" ? "text-green-600" : "text-muted-foreground"}>{row.status}</span>
                                                </TableCell>
                                                <TableCell>{new Date(row.createdAt).toLocaleDateString()}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" onClick={() => handleEdit(row)}>Edit</Button>
                                                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(row._id)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            )}

            {view === "analytics" && (
                <Card>
                    <CardHeader>
                        <CardTitle>Influencer Analytics</CardTitle>
                        <p className="text-sm text-muted-foreground">Clicks, registrations, conversion rate, and revenue per link.</p>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Influencer</TableHead>
                                    <TableHead>Slug</TableHead>
                                    <TableHead>Clicks</TableHead>
                                    <TableHead>Registrations</TableHead>
                                    <TableHead>Conversion</TableHead>
                                    <TableHead>Payments</TableHead>
                                    <TableHead>Revenue</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {analytics.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                                            No data yet.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    analytics.map((row) => (
                                        <TableRow key={row._id}>
                                            <TableCell className="font-medium">{row.name}</TableCell>
                                            <TableCell>{row.slug}</TableCell>
                                            <TableCell>{row.totalClicks}</TableCell>
                                            <TableCell>{row.totalRegistrations}</TableCell>
                                            <TableCell>{row.conversionRate}</TableCell>
                                            <TableCell>{row.totalPayments}</TableCell>
                                            <TableCell>₹{row.totalRevenue?.toLocaleString() ?? 0}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default AdminInfluencerLinks;
