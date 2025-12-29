import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";

interface UserDetailsDialogProps {
    user: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const UserDetailsDialog = ({ user, open, onOpenChange }: UserDetailsDialogProps) => {
    if (!user) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass-card border-white/20">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-display font-bold">User Details</DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <div className="space-y-4">
                        <div>
                            <h4 className="text-sm font-medium text-muted-foreground">Full Name</h4>
                            <p className="text-lg font-medium">{user.fname ? `${user.fname} ${user.lname || ''}` : user.name || 'N/A'}</p>
                        </div>
                        <div>
                            <h4 className="text-sm font-medium text-muted-foreground">Email Address</h4>
                            <p className="text-lg">{user.email}</p>
                        </div>
                        <div>
                            <h4 className="text-sm font-medium text-muted-foreground">Mobile Number</h4>
                            <p className="text-lg">{user.mobile || 'N/A'}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <h4 className="text-sm font-medium text-muted-foreground">Registration Date</h4>
                            <p className="text-lg">
                                {user.createdAt ? format(new Date(user.createdAt), "PPP p") : 'N/A'}
                            </p>
                        </div>
                        <div>
                            <h4 className="text-sm font-medium text-muted-foreground">Payment Status</h4>
                            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${user.isPaid ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"
                                }`}>
                                {user.isPaid ? "Paid" : "Unpaid"}
                            </div>
                        </div>
                        <div>
                            <h4 className="text-sm font-medium text-muted-foreground">Player Role</h4>
                            <p className="text-lg capitalize">{user.playerRole || 'N/A'}</p>
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-6 border-t border-border">
                    <h4 className="text-lg font-semibold mb-4">Additional Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h4 className="text-sm font-medium text-muted-foreground">Video Count</h4>
                            <p className="text-base">{user.videoCount || 0}</p>
                        </div>
                        <div>
                            <h4 className="text-sm font-medium text-muted-foreground">Total Amount Paid</h4>
                            <p className="text-base font-medium text-green-600">
                                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(user.paymentAmount || 0)}
                            </p>
                        </div>
                        <div>
                            <h4 className="text-sm font-medium text-muted-foreground">Last Payment ID</h4>
                            <p className="text-base font-mono bg-secondary/50 p-2 rounded text-xs overflow-x-auto">
                                {user.lastPaymentId || 'N/A'}
                            </p>
                        </div>
                        {/* Add more fields here if available in the user object */}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
