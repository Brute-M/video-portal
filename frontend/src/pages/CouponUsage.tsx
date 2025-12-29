import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { getCouponUsage } from "@/apihelper/coupon";

type UsedByUser = {
    _id: string;
    fname?: string;
    lname?: string;
    email?: string;
    mobile?: string;
    createdAt?: string;
    couponCodeUsed?: string;
};

type CouponItem = {
    _id: string;
    code: string;
    isActive: boolean;
    usedCount: number;
    usedBy: UsedByUser[];
    createdAt: string;
};

const CouponUsage = () => {
    const { toast } = useToast();

    const [isLoading, setIsLoading] = useState(true);
    const [items, setItems] = useState<CouponItem[]>([]);
    const [code, setCode] = useState("");

    const [page, setPage] = useState(1);
    const limit = 10;

    const fetchUsage = async (nextPage: number) => {
        setIsLoading(true);
        try {
            const res = await getCouponUsage({
                page: nextPage,
                limit,
                code: code.trim() ? code.trim() : undefined,
            });

            const nextItems = res?.data?.items || [];
            setItems(nextItems);
            setPage(res?.data?.pagination?.page || nextPage);
        } catch (error: any) {
            console.error("Failed to fetch coupon usage", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to fetch coupon usage.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsage(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const totalUsed = useMemo(() => {
        return items.reduce((sum, c) => sum + (c.usedCount || 0), 0);
    }, [items]);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-foreground">Coupon Usage</h1>
                    <p className="text-muted-foreground mt-1">See which users used which coupon code.</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg self-start sm:self-auto">
                    <span className="font-medium">Total Uses (current page): {totalUsed}</span>
                </div>
            </div>

            <Card className="glass-card">
                <CardHeader>
                    <CardTitle className="text-base">Filter</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Input
                            placeholder="Filter by coupon code (e.g. EARNXXXX2025)"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && fetchUsage(1)}
                        />
                        <div className="flex gap-2">
                            <Button onClick={() => fetchUsage(1)} disabled={isLoading}>
                                Apply
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setCode("");
                                    fetchUsage(1);
                                }}
                                disabled={isLoading}
                            >
                                Clear
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {isLoading ? (
                <div className="p-8 text-center text-muted-foreground">Loading coupon usage...</div>
            ) : items.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">No coupon usage found.</div>
            ) : (
                <div className="space-y-6">
                    {items.map((coupon) => (
                        <Card key={coupon._id} className="glass-card">
                            <CardHeader>
                                <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                    <span className="font-mono text-lg">{coupon.code}</span>
                                    <span className="text-sm text-muted-foreground">
                                        Used: {coupon.usedCount || 0} | Active: {coupon.isActive ? "Yes" : "No"}
                                    </span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {coupon.usedBy?.length ? (
                                    <div className="rounded-md border overflow-x-auto">
                                        <Table>
                                            <TableHeader className="bg-muted/50">
                                                <TableRow>
                                                    <TableHead>Name</TableHead>
                                                    <TableHead>Email</TableHead>
                                                    <TableHead>Mobile</TableHead>
                                                    <TableHead>Registered</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {coupon.usedBy.map((u) => (
                                                    <TableRow key={u._id} className="hover:bg-muted/30 transition-colors">
                                                        <TableCell className="font-medium">
                                                            {(u.fname || "").trim()} {(u.lname || "").trim()}
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground">{u.email || "-"}</TableCell>
                                                        <TableCell className="text-muted-foreground">{u.mobile || "-"}</TableCell>
                                                        <TableCell className="text-muted-foreground text-sm">
                                                            {u.createdAt ? new Date(u.createdAt).toLocaleString() : "-"}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                ) : (
                                    <div className="text-muted-foreground">No users have used this coupon yet.</div>
                                )}
                            </CardContent>
                        </Card>
                    ))}

                    <div className="flex items-center justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => fetchUsage(Math.max(1, page - 1))}
                            disabled={isLoading || page <= 1}
                        >
                            Prev
                        </Button>
                        <Button variant="outline" onClick={() => fetchUsage(page + 1)} disabled={isLoading}>
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CouponUsage;
