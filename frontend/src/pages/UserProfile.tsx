import { useEffect, useState, useRef } from "react";
import { getProfile } from "@/apihelper/auth";
import api from "@/apihelper/api";
import { Loader2, ArrowLeft, Lock } from "lucide-react";
import TrialPass from "@/components/TrialPass";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { toPng } from "html-to-image";

const UserProfile = () => {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [uploadingImage, setUploadingImage] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();
    const { toast } = useToast();

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await getProfile();
            setProfile(response.data?.data || response.data);
        } catch (error) {
            console.error("Failed to fetch profile", error);
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Basic validation
        if (!file.type.startsWith('image/')) {
            toast({
                title: "Invalid file type",
                description: "Please upload an image file (JPEG, PNG, etc).",
                variant: "destructive"
            });
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            toast({
                title: "File too large",
                description: "Image size should be less than 5MB.",
                variant: "destructive"
            });
            return;
        }

        setUploadingImage(true);
        const formData = new FormData();
        formData.append('profileImage', file);

        try {
            const response = await api.post('/auth/upload-profile-image', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data?.data?.profileImage || response.data?.profileImage) {
                // Update local profile state with new image
                const newImageUrl = response.data?.data?.profileImage || response.data?.profileImage;
                setProfile({ ...profile, profileImage: newImageUrl });
                toast({
                    title: "Success",
                    description: "Profile image updated successfully!",
                });
            } else {
                throw new Error("Invalid response from server");
            }
        } catch (error: any) {
            console.error("Image upload failed", error);
            toast({
                title: "Upload Failed",
                description: error.response?.data?.message || "Something went wrong while uploading your image.",
                variant: "destructive"
            });
        } finally {
            setUploadingImage(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = ''; // Reset input
            }
        }
    };

    const handleDownload = async () => {
        const passElement = document.getElementById("brpl-trial-pass");
        if (!passElement) {
            toast({
                title: "Download Failed",
                description: "Could not find the pass element.",
                variant: "destructive"
            });
            return;
        }

        try {
            const dataUrl = await toPng(passElement, {
                pixelRatio: window.devicePixelRatio || 2,
                quality: 1.0,
            });

            const link = document.createElement("a");
            link.href = dataUrl;
            link.download = `BRPL-Pass-${profile?.fname || "User"}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast({
                title: "Download Complete",
                description: "Your Trial Pass has been downloaded successfully.",
            });
        } catch (error: any) {
            console.error("Error generating pass image:", error);
            toast({
                title: "Download Failed",
                description: `Failed to generate pass image: ${error?.message || error}. Please try again.`,
                variant: "destructive"
            });
        }
    };
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="text-center py-12 flex flex-col items-center">
                <p className="text-lg text-muted-foreground mb-4">Profile not found</p>
                <button onClick={() => navigate(-1)} className="text-primary hover:underline flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" /> Go Back
                </button>
            </div>
        );
    }

    // "show only thier destails and their trail pass exact same as provided image"
    return (
        <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-12">
            <div>
                <h1 className="text-3xl font-display font-bold">My Profile</h1>
                <p className="text-muted-foreground">Manage your details and view your exclusive Trial Pass.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* Details Section */}
                <div className="glass-card p-6 md:col-span-5 h-fit shadow-lg shadow-black/5 border-none">
                    <h2 className="text-xl font-semibold border-b pb-4 mb-4">Personal Details</h2>
                    <div className="space-y-5">
                        <div className="bg-secondary/20 p-4 rounded-xl">
                            <p className="text-sm font-medium text-muted-foreground mb-1">Full Name</p>
                            <p className="font-semibold text-lg">{profile.fname} {profile.lname}</p>
                        </div>
                        <div className="bg-secondary/20 p-4 rounded-xl">
                            <p className="text-sm font-medium text-muted-foreground mb-1">Email Address</p>
                            <p className="font-semibold text-lg">{profile.email}</p>
                        </div>
                        <div className="bg-secondary/20 p-4 rounded-xl">
                            <p className="text-sm font-medium text-muted-foreground mb-1">Mobile Number</p>
                            <p className="font-semibold text-lg">{profile.mobile || "N/A"}</p>
                        </div>
                        <div className="bg-secondary/20 p-4 rounded-xl">
                            <p className="text-sm font-medium text-muted-foreground mb-1">Role / Affiliation</p>
                            <p className="font-semibold text-lg capitalize">{profile.playerRole || profile.role || "Player"}</p>
                        </div>
                        <div className="bg-secondary/20 p-4 rounded-xl flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">Status</p>
                                <p className="font-semibold text-lg">
                                    {profile.isPaid ? "Paid Member" : "Registered User"}
                                </p>
                            </div>
                            <div className={`w-3 h-3 rounded-full ${profile.isPaid ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]' : 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.6)] animate-pulse'}`}></div>
                        </div>
                    </div>
                </div>

                {/* Trial Pass Section */}
                {profile.isPaid ? (
                    <div className="md:col-span-7 flex flex-col items-center justify-center p-8 bg-black/5 dark:bg-white/5 rounded-3xl inner-shadow border border-border">
                        <h3 className="text-2xl font-bold mb-6 text-center w-full">Your BRPL Trial Pass</h3>

                        {/* Trial Pass component rendering exactly as image */}
                        <div id="trial-pass-container" className="transform md:hover:scale-105 transition-transform duration-500 ease-out origin-top relative group">
                            <TrialPass user={profile} />

                            {/* Overlay to indicate it's clickable for upload if we wanted, but we will use an explicit button instead */}
                            <div className="absolute inset-x-0 top-[115px] flex justify-center pointer-events-none">
                                {uploadingImage && (
                                    <div className="absolute z-50 bg-black/60 text-white flex items-center justify-center rounded-[22px] w-[220px] h-[220px]">
                                        <Loader2 className="w-8 h-8 animate-spin" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageUpload}
                        />

                        <div className="mt-8 flex flex-wrap justify-center gap-4 w-full">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadingImage}
                                className="bg-secondary text-secondary-foreground border border-border px-6 py-2 rounded-lg font-medium shadow hover:bg-secondary/80 transition-colors flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
                                {uploadingImage ? "Uploading..." : "Update Photo"}
                            </button>
                            <button
                                onClick={handleDownload}
                                className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium shadow-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                            >
                                Download Pass
                            </button>
                        </div>

                        <p className="text-sm text-muted-foreground mt-6 text-center max-w-sm">
                            This digital pass grants you access to all selected events and tryouts valid under the BRPL 2026 season.
                        </p>
                    </div>
                ) : (
                    <div className="md:col-span-7 flex flex-col items-center justify-center p-12 bg-black/5 dark:bg-white/5 rounded-3xl border border-border text-center h-full min-h-[400px]">
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Lock className="w-10 h-10 text-primary" />
                        </div>
                        <h3 className="text-3xl font-display font-bold mb-4">Trial Pass Locked</h3>
                        <p className="text-muted-foreground max-w-md mx-auto mb-8 text-lg">
                            Complete your registration payment to unlock and download your official BRPL Trial Pass.
                        </p>
                        <Link to="/dashboard" className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 hover:scale-105 transition-all inline-flex items-center gap-2 text-lg">
                            Complete Payment
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserProfile;
