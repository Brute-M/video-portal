import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { getUserById } from "@/apihelper/user";

import { Loader2, ExternalLink } from "lucide-react";

interface UserDetailsDialogProps {
    user: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const UserDetailsDialog = ({ user, open, onOpenChange }: UserDetailsDialogProps) => {
    const baseURL = import.meta.env.VITE_API_URL || 'https://brpl.net/api'
    const [userDetails, setUserDetails] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && user?._id) {
            fetchUserDetails();
        } else {
            setUserDetails(null);
            setUserDetails(null);
        }
    }, [open, user]);

    const fetchUserDetails = async () => {
        setLoading(true);
        try {
            const data = await getUserById(user._id);
            setUserDetails(data);
        } catch (error) {
            console.error("Failed to fetch user details", error);
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    // Use fetched details if available, otherwise fallback to passed user prop (which might be incomplete)
    const displayUser = userDetails || user;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass-card border-white/20">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-display font-bold">User Details</DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground">Full Name</h4>
                                    <p className="text-lg font-medium">{displayUser.fname ? `${displayUser.fname} ${displayUser.lname || ''}` : displayUser.name || 'N/A'}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground">Email Address</h4>
                                    <p className="text-lg">{displayUser.email}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground">Mobile Number</h4>
                                    <p className="text-lg">{displayUser.mobile || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground">Registration Date</h4>
                                    <p className="text-lg">
                                        {displayUser.createdAt ? format(new Date(displayUser.createdAt), "PPP p") : 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground">Payment Status</h4>
                                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${displayUser.isPaid ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"
                                        }`}>
                                        {displayUser.isPaid ? "Paid" : "Unpaid"}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground">Player Role</h4>
                                    <p className="text-lg capitalize">{displayUser.playerRole || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-border">
                            <h4 className="text-lg font-semibold mb-4">Additional Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground">Video Count</h4>
                                    <p className="text-base">{displayUser.videoCount || 0}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground">Total Amount Paid</h4>
                                    <p className="text-base font-medium text-green-600">
                                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(displayUser.paymentAmount || 0)}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground">Last Payment ID</h4>
                                    <p className="text-base font-mono bg-secondary/50 p-2 rounded text-xs overflow-x-auto">
                                        {(displayUser.lastPaymentId && displayUser.lastPaymentId !== 'N/A') ? displayUser.lastPaymentId : (displayUser.paymentId || 'N/A')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {(displayUser.trail_video || (displayUser.videos && displayUser.videos.length > 0)) && (
                            <div className="mt-8 pt-6 border-t border-border">
                                <h4 className="text-xl font-display font-bold mb-4">Video Review</h4>
                                <div className="space-y-6">
                                    {displayUser.trail_video && (
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center mb-1">
                                                <h5 className="text-sm font-medium text-muted-foreground">Original Trail Video (Landing Page)</h5>
                                                <a
                                                    href={displayUser.trail_video_url || (displayUser.trail_video.startsWith('http') ? displayUser.trail_video : `${baseURL || 'http://localhost:5000'}/${displayUser.trail_video}`.replace(/\\/g, '/'))}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-primary hover:underline text-xs flex items-center gap-1"
                                                >
                                                    Open in New Tab <ExternalLink className="w-3 h-3" />
                                                </a>
                                            </div>
                                            <div className="rounded-lg overflow-hidden border border-border bg-black aspect-video max-w-md">
                                                <video
                                                    controls
                                                    className="w-full h-full"
                                                    src={displayUser.trail_video_url || (displayUser.trail_video.startsWith('http') ? displayUser.trail_video : `${baseURL || 'http://localhost:5000'}/${displayUser.trail_video}`.replace(/\\/g, '/'))}
                                                >
                                                    Your browser does not support the video tag.
                                                </video>
                                            </div>
                                        </div>
                                    )}

                                    {displayUser.videos && displayUser.videos.length > 0 && (
                                        <div className="space-y-4">
                                            <h5 className="text-sm font-medium text-muted-foreground">Uploaded Videos ({displayUser.videos.length})</h5>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {displayUser.videos.map((video: any, idx: number) => {
                                                    const videoUrl = video.url || video.path?.replace(/\\/g, '/');

                                                    return (
                                                        <div key={video._id || idx} className="space-y-2">
                                                            <div className="flex justify-between items-center text-xs mb-1">
                                                                <span className="font-medium truncate max-w-[150px]">{video.originalName || `Video ${idx + 1}`}</span>
                                                                <div className="flex items-center gap-2">
                                                                    <a
                                                                        href={videoUrl}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        title="Open in new tab"
                                                                        className="text-primary hover:text-primary/80"
                                                                    >
                                                                        <ExternalLink className="w-4 h-4" />
                                                                    </a>
                                                                    <span className={`px-1.5 py-0.5 rounded ${video.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                                        {video.status}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="rounded-lg overflow-hidden border border-border bg-black aspect-video">
                                                                <video
                                                                    controls
                                                                    className="w-full h-full"
                                                                    src={videoUrl}
                                                                >
                                                                    Your browser does not support the video tag.
                                                                </video>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
};
