import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { getUserById } from "@/apihelper/user";
import {
    Loader2,
    ExternalLink,
    Activity,
    ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnalysisResult } from "@/components/AnalysisResult";

const UserDetails = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const baseURL = import.meta.env.VITE_API_URL || 'https://brpl.net/api'
    const [userDetails, setUserDetails] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (userId) {
            fetchUserDetails();
        }
    }, [userId]);

    const fetchUserDetails = async () => {
        setLoading(true);
        try {
            if (!userId) return;
            const data = await getUserById(userId);
            setUserDetails(data);
        } catch (error) {
            console.error("Failed to fetch user details", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!userDetails) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <p className="text-muted-foreground">User not found.</p>
                <Button variant="outline" onClick={() => navigate(-1)}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Go Back
                </Button>
            </div>
        );
    }

    const displayUser = userDetails;

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <h1 className="text-3xl font-display font-bold text-foreground">User Details</h1>
            </div>

            <div className="glass-card p-6 border-white/20">
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
                                    <div className="grid grid-cols-1 gap-8">
                                        {displayUser.videos.map((video: any, idx: number) => {
                                            const videoUrl = video.url || video.path?.replace(/\\/g, '/');

                                            return (
                                                <div key={video._id || idx} className="space-y-4 bg-secondary/10 p-6 rounded-xl border border-white/5">
                                                    <div className="flex justify-between items-start text-sm mb-2">
                                                        <span className="font-medium truncate max-w-[300px] text-lg">{video.originalName || `Video ${idx + 1}`}</span>
                                                        <div className="flex items-center gap-2">
                                                            <a
                                                                href={videoUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                title="Open in new tab"
                                                                className="text-primary hover:text-primary/80"
                                                            >
                                                                <ExternalLink className="w-5 h-5" />
                                                            </a>
                                                            <span className={`px-2 py-0.5 rounded text-xs uppercase tracking-wide font-semibold ${video.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                                {video.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="rounded-lg overflow-hidden border border-border bg-black aspect-video max-w-3xl shadow-xl">
                                                        <video
                                                            controls
                                                            className="w-full h-full"
                                                            src={videoUrl}
                                                        >
                                                            Your browser does not support the video tag.
                                                        </video>
                                                    </div>

                                                    {
                                                        video.analysis && (
                                                            <div className="mt-4 pt-4 border-t border-border animate-in fade-in zoom-in-95 duration-300">
                                                                <h6 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                                                    <Activity className="w-4 h-4 text-primary" />
                                                                    AI Analysis Report
                                                                </h6>
                                                                <AnalysisResult data={video} />
                                                            </div>
                                                        )
                                                    }
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserDetails;
