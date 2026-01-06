import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, ChevronLeft, ChevronRight, Video, Download, CreditCard, Loader2 } from "lucide-react";
import { UserDetailsDialog } from "./UserDetailsDialog";
import { downloadUserInvoice, updateUserPayment } from "@/apihelper/admin";
import { useToast } from "@/hooks/use-toast";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface User {
    _id: string;
    fname: string;
    lname: string;
    email: string;
    mobile?: string;
    playerRole?: string;
    videoCount: number;
    createdAt: string;
    lastPaymentId?: string;
    isPaid: boolean;
    paymentAmount: number;
    paymentId?: string;
    trail_video?: string;
    videos?: any[];
}

interface UserTableProps {
    users: User[];
    isLoading: boolean;
    type: 'paid' | 'unpaid';
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onRefresh?: () => void;
}

export const UserTable = ({ users, isLoading, type, page, totalPages, onPageChange, onRefresh }: UserTableProps) => {
    const { toast } = useToast();
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentUser, setPaymentUser] = useState<User | null>(null);
    const [transactionId, setTransactionId] = useState("");
    const [paymentAmount, setPaymentAmount] = useState("1499");
    const [isUpdating, setIsUpdating] = useState(false);

    const handleDownloadInvoice = async (userId: string, userName: string) => {
        try {
            const blob = await downloadUserInvoice(userId);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Invoice-${userName.replace(/\s+/g, '_')}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast({ title: "Success", description: "Invoice downloaded successfully." });
        } catch (error) {
            console.error("Download failed", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to download invoice." });
        }
    };

    const handleViewUser = (user: User) => {
        setSelectedUser(user);
    };

    const handleOpenPaymentModal = (user: User) => {
        setPaymentUser(user);
        setIsPaymentModalOpen(true);
        setTransactionId("");
    };

    const handleMarkAsPaid = async () => {
        if (!paymentUser || !transactionId || !paymentAmount) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Please provide both Transaction ID and Amount.",
            });
            return;
        }

        setIsUpdating(true);
        try {
            await updateUserPayment(paymentUser._id, transactionId, parseFloat(paymentAmount));
            toast({
                title: "Success",
                description: "User payment status updated. They will now appear in Paid Users.",
            });
            setIsPaymentModalOpen(false);
            if (onRefresh) onRefresh();
        } catch (error) {
            console.error("Failed to update payment", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to update payment status.",
            });
        } finally {
            setIsUpdating(false);
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Loading users...</div>;
    }

    if (!isLoading && users.length === 0) {
        return <div className="p-8 text-center text-muted-foreground">No users found.</div>;
    }

    return (
        <div className="space-y-4">
            <div className="rounded-md border glass-card overflow-x-auto">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Videos</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead>Price</TableHead>
                            {type === 'paid' && <TableHead>Payment ID</TableHead>}
                            {type === 'paid' && <TableHead>Invoice</TableHead>}
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user._id} className="hover:bg-muted/30 transition-colors">
                                <TableCell className="font-medium flex items-center gap-2">
                                    {user.fname} {user.lname}
                                    {(user.trail_video || (user.videos && user.videos.length > 0)) && (
                                        <Video className="w-4 h-4 text-primary" />
                                    )}
                                </TableCell>
                                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="bg-primary/5">
                                        {user.playerRole || 'Player'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="font-mono">{user.videoCount || 0}</TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="font-medium text-green-600">
                                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(user.paymentAmount || 0)}
                                </TableCell>
                                {type === 'paid' && (
                                    <TableCell className="font-mono text-xs text-muted-foreground">
                                        {(user.lastPaymentId && user.lastPaymentId !== 'N/A') ? user.lastPaymentId : (user.paymentId || '-')}
                                    </TableCell>
                                )}
                                {type === 'paid' && (
                                    <TableCell>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                            onClick={() => handleDownloadInvoice(user._id, user.fname)}
                                            title="Download Invoice"
                                        >
                                            <Download className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                )}
                                <TableCell>
                                    <Badge variant={type === 'paid' ? 'default' : 'secondary'} className={type === 'paid' ? 'bg-green-500 hover:bg-green-600' : 'bg-orange-500 hover:bg-orange-600 text-white'}>
                                        {type === 'paid' ? 'Active' : 'Unpaid'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        {type === 'unpaid' && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="border-green-500 text-green-600 hover:bg-green-50"
                                                onClick={() => handleOpenPaymentModal(user)}
                                            >
                                                <CreditCard className="w-4 h-4 mr-1" />
                                                Mark Paid
                                            </Button>
                                        )}
                                        <Button variant="ghost" size="sm" onClick={() => handleViewUser(user)}>
                                            <Eye className="w-4 h-4 mr-1" />
                                            View
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-end space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(page - 1)}
                        disabled={page === 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                    </Button>
                    <div className="text-sm text-muted-foreground">
                        Page {page} of {totalPages}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(page + 1)}
                        disabled={page === totalPages}
                    >
                        Next
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            )}

            {/* Mark as Paid Modal */}
            <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Mark User as Paid</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="userName">User</Label>
                            <Input
                                id="userName"
                                value={`${paymentUser?.fname} ${paymentUser?.lname} (${paymentUser?.email})`}
                                disabled
                                className="bg-muted"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="transactionId">Transaction ID / Payment ID</Label>
                            <Input
                                id="transactionId"
                                placeholder="Enter Transaction ID"
                                value={transactionId}
                                onChange={(e) => setTransactionId(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="amount">Amount (INR)</Label>
                            <Input
                                id="amount"
                                type="number"
                                placeholder="1499"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPaymentModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleMarkAsPaid} disabled={isUpdating} className="bg-green-600 hover:bg-green-700">
                            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Mark as Paid
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <UserDetailsDialog
                user={selectedUser}
                open={!!selectedUser}
                onOpenChange={(open) => !open && setSelectedUser(null)}
            />
        </div>
    );
};
