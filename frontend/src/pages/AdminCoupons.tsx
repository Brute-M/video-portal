import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getAllCoupons, createCoupon, updateCoupon, deleteCoupon } from "@/apihelper/coupon";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";

type CouponItem = {
    _id: string;
    code: string;
    type: string;
    value: number;
    minOrder: number;
    maxDiscount: number | null;
    usageLimit: number | null;
    perUserLimit: number;
    expiryDate: string;
    description: string;
    isActive: boolean;
    usedCount: number;
    usedBy: { userId: { _id: string; fname?: string; lname?: string; email?: string; mobile?: string } | null; usedAt: string }[];
    createdAt: string;
};

const defaultForm = {
    code: "",
    type: "percentage",
    value: "",
    minOrder: "0",
    maxDiscount: "",
    usageLimit: "",
    perUserLimit: "1",
    expiryDate: "",
    description: "",
    isActive: true,
};

const AdminCoupons = () => {
    const { toast } = useToast();
    const [coupons, setCoupons] = useState<CouponItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState(defaultForm);

    const fetchCoupons = async () => {
        setIsLoading(true);
        try {
            const res = await getAllCoupons();
            setCoupons(res?.data || []);
        } catch {
            toast({ variant: "destructive", title: "Error", description: "Failed to fetch coupons." });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCoupons();
    }, []);

    const openCreate = () => {
        setEditId(null);
        setForm(defaultForm);
        setShowModal(true);
    };

    const openEdit = (coupon: CouponItem) => {
        setEditId(coupon._id);
        setForm({
            code: coupon.code,
            type: coupon.type,
            value: String(coupon.value),
            minOrder: String(coupon.minOrder || 0),
            maxDiscount: coupon.maxDiscount ? String(coupon.maxDiscount) : "",
            usageLimit: coupon.usageLimit ? String(coupon.usageLimit) : "",
            perUserLimit: String(coupon.perUserLimit || 1),
            expiryDate: coupon.expiryDate ? new Date(coupon.expiryDate).toISOString().split("T")[0] : "",
            description: coupon.description || "",
            isActive: coupon.isActive,
        });
        setShowModal(true);
    };

    const handleSubmit = async () => {
        if (!form.code.trim() || !form.value || !form.expiryDate) {
            toast({ variant: "destructive", title: "Missing Fields", description: "Code, value, and expiry date are required." });
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                code: form.code.trim(),
                type: form.type,
                value: Number(form.value),
                minOrder: Number(form.minOrder) || 0,
                maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
                usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
                perUserLimit: Number(form.perUserLimit) || 1,
                expiryDate: form.expiryDate,
                description: form.description,
                isActive: form.isActive,
            };

            if (editId) {
                await updateCoupon(editId, payload);
                toast({ title: "Updated", description: "Coupon updated successfully." });
            } else {
                await createCoupon(payload);
                toast({ title: "Created", description: "Coupon created successfully." });
            }

            setShowModal(false);
            setEditId(null);
            setForm(defaultForm);
            fetchCoupons();
        } catch (error: any) {
            const msg = error.response?.data?.data?.message || error.response?.data?.message || "Something went wrong.";
            toast({ variant: "destructive", title: "Error", description: msg });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this coupon?")) return;
        try {
            await deleteCoupon(id);
            toast({ title: "Deleted", description: "Coupon deleted successfully." });
            fetchCoupons();
        } catch {
            toast({ variant: "destructive", title: "Error", description: "Failed to delete coupon." });
        }
    };

    const getStatus = (coupon: CouponItem) => {
        if (!coupon.isActive) return "Inactive";
        if (new Date() > new Date(coupon.expiryDate)) return "Expired/Inactive";
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return "Limit Reached";
        return "Active";
    };

    const getStatusColor = (status: string) => {
        if (status === "Active") return "bg-green-100 text-green-700";
        return "bg-red-100 text-red-700";
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-2">
                        <Tag className="w-7 h-7" /> Coupons
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                    </p>
                </div>
                <Button onClick={openCreate} className="gap-2">
                    <Plus className="w-4 h-4" /> Create Coupon
                </Button>
            </div>

            <Card className="glass-card">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Tag className="w-5 h-5" /> Coupons
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="p-8 text-center text-muted-foreground">Loading coupons...</div>
                    ) : coupons.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">No coupons found. Create one to get started.</div>
                    ) : (
                        <div className="rounded-md border overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead>CODE</TableHead>
                                        <TableHead>TYPE</TableHead>
                                        <TableHead>VALUE</TableHead>
                                        <TableHead>USED / LIMIT</TableHead>
                                        <TableHead>EXPIRES</TableHead>
                                        <TableHead>STATUS</TableHead>
                                        <TableHead className="text-right">ACTIONS</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {coupons.map((coupon) => {
                                        const status = getStatus(coupon);
                                        return (
                                            <TableRow key={coupon._id} className="hover:bg-muted/30 transition-colors">
                                                <TableCell>
                                                    <span className="font-mono font-semibold text-primary">{coupon.code}</span>
                                                </TableCell>
                                                <TableCell className="capitalize">{coupon.type === "percentage" ? "Percentage" : "Fixed"}</TableCell>
                                                <TableCell>
                                                    {coupon.type === "percentage" ? `%${coupon.value}` : `₹${coupon.value}`}
                                                </TableCell>
                                                <TableCell>
                                                    {coupon.usedCount} / {coupon.usageLimit || "∞"}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {new Date(coupon.expiryDate).toLocaleDateString("en-GB")}
                                                </TableCell>
                                                <TableCell>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                                                        {status}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button variant="ghost" size="icon" onClick={() => openEdit(coupon)} title="Edit">
                                                            <Pencil className="w-4 h-4 text-blue-500" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(coupon._id)} title="Delete">
                                                            <Trash2 className="w-4 h-4 text-red-500" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create / Edit Modal */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editId ? "Update" : "Create"} Coupon</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 mt-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Coupon Code *</Label>
                                <Input
                                    placeholder="e.g. SAVE20"
                                    value={form.code}
                                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Type *</Label>
                                <Select value={form.type} onValueChange={(val) => setForm({ ...form, type: val })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                                        <SelectItem value="fixed">Fixed (₹)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Value *</Label>
                                <Input
                                    type="number"
                                    placeholder={form.type === "percentage" ? "20 (%)" : "100 (₹)"}
                                    value={form.value}
                                    onChange={(e) => setForm({ ...form, value: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Min Order (₹)</Label>
                                <Input
                                    type="number"
                                    placeholder="0"
                                    value={form.minOrder}
                                    onChange={(e) => setForm({ ...form, minOrder: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Max Discount (₹)</Label>
                                <Input
                                    type="number"
                                    placeholder="Optional cap"
                                    value={form.maxDiscount}
                                    onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Usage Limit</Label>
                                <Input
                                    type="number"
                                    placeholder="Unlimited"
                                    value={form.usageLimit}
                                    onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Per User Limit</Label>
                                <Input
                                    type="number"
                                    placeholder="1"
                                    value={form.perUserLimit}
                                    onChange={(e) => setForm({ ...form, perUserLimit: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Expiry Date *</Label>
                                <Input
                                    type="date"
                                    value={form.expiryDate}
                                    onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Input
                                placeholder="Internal description"
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <Label>Active</Label>
                            <Switch
                                checked={form.isActive}
                                onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <Button variant="outline" onClick={() => setShowModal(false)} disabled={isSubmitting}>
                                Cancel
                            </Button>
                            <Button onClick={handleSubmit} disabled={isSubmitting}>
                                {isSubmitting ? "Saving..." : editId ? "Update" : "Create Coupon"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminCoupons;
