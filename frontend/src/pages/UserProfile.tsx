import { useEffect, useState, useRef } from "react";
import { getProfile, updateProfile as updateProfileApi } from "@/apihelper/auth";
import api from "@/apihelper/api";
import { Loader2, ArrowLeft, Lock, Pencil } from "lucide-react";
import TrialPass from "@/components/TrialPass";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { toPng } from "html-to-image";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const UserProfile = () => {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [profileEditOpen, setProfileEditOpen] = useState(false);
    const [updatingProfile, setUpdatingProfile] = useState(false);
    const [editForm, setEditForm] = useState({ fname: "", lname: "", email: "", mobile: "", playerRole: "" });
    const fileInputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();
    const { toast } = useToast();

    useEffect(() => {
        fetchProfile();
    }, []);

    const openProfileEdit = () => {
        if (profile) {
            setEditForm({
                fname: profile.fname || "",
                lname: profile.lname || "",
                email: profile.email || "",
                mobile: profile.mobile || "",
                playerRole: profile.playerRole || profile.role || "",
            });
            setProfileEditOpen(true);
        }
    };

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile) return;
        setUpdatingProfile(true);
        try {
            await updateProfileApi(editForm);
            toast({
                title: "Profile updated",
                description: "Your profile has been updated successfully.",
            });
            setProfileEditOpen(false);
            fetchProfile();
        } catch (error: any) {
            const msg = error?.response?.data?.data?.message || error?.message || "Failed to update profile.";
            toast({
                title: "Update failed",
                description: msg,
                variant: "destructive",
            });
        } finally {
            setUpdatingProfile(false);
        }
    };

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
                const newImageUrl = response.data?.data?.profileImage || response.data?.profileImage;
                setProfile((prev) => (prev ? { ...prev, profileImage: newImageUrl } : prev));
                toast({
                    title: "Success",
                    description: "Profile image updated successfully!",
                });
                await fetchProfile();
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
        const fullName = (`${profile?.fname || ''} ${profile?.lname || ''}`.trim() || 'User').replace(/[^a-zA-Z0-9\s-]/g, '').trim() || 'User';
        const fileName = `BRPL-Pass-${fullName}.png`;

        const triggerDownload = (blob: Blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = fileName;
            link.style.display = "none";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        };

        try {
            const passElement = document.getElementById("brpl-trial-pass");
            if (!passElement) throw new Error("Pass element not found");

            // Wait for profile image to be ready (TrialPass converts external URLs to data URL async)
            const passImg = passElement.querySelector("img") as HTMLImageElement;
            if (passImg && !passImg.complete) {
                await new Promise<void>((resolve) => {
                    passImg.onload = () => resolve();
                    passImg.onerror = () => resolve();
                    setTimeout(resolve, 500);
                });
            }
            await new Promise((r) => setTimeout(r, 150));

            // Primary: capture exactly what's on screen (includes profile image when it's data URL)
            try {
                const dataUrl = await toPng(passElement, {
                    pixelRatio: 2,
                    cacheBust: true,
                    includeQueryParams: true,
                });
                const res = await fetch(dataUrl);
                const blob = await res.blob();
                triggerDownload(blob);
                toast({
                    title: "Download Complete",
                    description: "Your Trial Pass has been downloaded successfully.",
                });
                return;
            } catch (captureErr) {
                console.warn("html-to-image capture failed, using canvas fallback:", captureErr);
            }

            // Fallback: draw on canvas so profile image works via data URL from DOM or proxy
            const canvas = document.createElement("canvas");
            canvas.width = 800;
            canvas.height = 1020;
            const ctx = canvas.getContext("2d");
            if (!ctx) throw new Error("Could not create canvas context");

            const bgImg = new Image();
            bgImg.crossOrigin = "anonymous";
            await new Promise((resolve, reject) => {
                bgImg.onload = resolve;
                bgImg.onerror = reject;
                bgImg.src = "/assets/trail-pass-bg.png";
            });
            ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

            const profImg = new Image();
            let loadUrl: string = (passImg?.src) || profile?.profileImage || "/assets/hero-player.png";
            let blobUrlToRevoke: string | null = null;

            if (loadUrl && !loadUrl.startsWith("data:") && !loadUrl.startsWith("blob:") && !loadUrl.startsWith("/") && !loadUrl.includes(window.location.host)) {
                try {
                    const proxiedUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(loadUrl)}`;
                    const res = await fetch(proxiedUrl, { cache: "no-store" });
                    const blob = await res.blob();
                    loadUrl = URL.createObjectURL(blob);
                    blobUrlToRevoke = loadUrl;
                } catch (e) {
                    console.warn("Proxy fetch failed, using fallback image", e);
                    loadUrl = "/assets/hero-player.png";
                }
            }
            if (loadUrl && !loadUrl.startsWith("data:") && !loadUrl.startsWith("blob:") && !loadUrl.startsWith("/")) {
                profImg.crossOrigin = "anonymous";
            }

            await new Promise((resolve) => {
                profImg.onload = resolve;
                profImg.onerror = () => {
                    profImg.onload = resolve;
                    profImg.src = "/assets/hero-player.png";
                };
                profImg.src = loadUrl;
            });
            if (blobUrlToRevoke) URL.revokeObjectURL(blobUrlToRevoke);

            const x = 180, y = 236, size = 440, radius = 44, borderWidth = 6;
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + size - radius, y);
            ctx.quadraticCurveTo(x + size, y, x + size, y + radius);
            ctx.lineTo(x + size, y + size - radius);
            ctx.quadraticCurveTo(x + size, y + size, x + size - radius, y + size);
            ctx.lineTo(x + radius, y + size);
            ctx.quadraticCurveTo(x, y + size, x, y + size - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.closePath();
            ctx.fillStyle = "#5c667a";
            ctx.fill();
            ctx.clip();
            const scale = Math.max(size / profImg.width, size / profImg.height);
            const drawWidth = profImg.width * scale;
            const drawHeight = profImg.height * scale;
            ctx.drawImage(profImg, x + (size - drawWidth) / 2, y + (size - drawHeight) / 2, drawWidth, drawHeight);
            ctx.restore();
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + size - radius, y);
            ctx.quadraticCurveTo(x + size, y, x + size, y + radius);
            ctx.lineTo(x + size, y + size - radius);
            ctx.quadraticCurveTo(x + size, y + size, x + size - radius, y + size);
            ctx.lineTo(x + radius, y + size);
            ctx.quadraticCurveTo(x, y + size, x, y + size - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.closePath();
            ctx.lineWidth = borderWidth;
            ctx.strokeStyle = "#24324a";
            ctx.stroke();

            ctx.fillStyle = "#000000";
            ctx.font = "600 52px Poppins, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(fullName, canvas.width / 2, 730);

            const svg = passElement.querySelector("svg");
            if (svg) {
                try {
                    const svgData = new XMLSerializer().serializeToString(svg);
                    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
                    const svgUrl = URL.createObjectURL(svgBlob);
                    const barcodeImg = new Image();
                    await new Promise((resolve, reject) => {
                        barcodeImg.onload = resolve;
                        barcodeImg.onerror = reject;
                        barcodeImg.src = svgUrl;
                    });
                    const bcWidth = barcodeImg.width * 2;
                    const bcHeight = barcodeImg.height * 2;
                    ctx.drawImage(barcodeImg, (canvas.width - bcWidth) / 2, 770, bcWidth, bcHeight);
                    URL.revokeObjectURL(svgUrl);
                } catch (bcErr) {
                    console.warn("Barcode draw failed", bcErr);
                }
            }

            const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
            if (blob) {
                triggerDownload(blob);
            } else {
                const dataUrl = canvas.toDataURL("image/png");
                const link = document.createElement("a");
                link.href = dataUrl;
                link.download = fileName;
                link.style.display = "none";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }

            toast({
                title: "Download Complete",
                description: "Your Trial Pass has been downloaded successfully.",
            });
        } catch (error: any) {
            console.error("Error generating pass image:", error);
            toast({
                title: "Download Failed",
                description: error?.message || "Failed to generate pass. Please try again.",
                variant: "destructive",
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
        <div className="space-y-4 sm:space-y-6 animate-fade-in max-w-5xl mx-auto pb-8 sm:pb-12 px-4 sm:px-6">
            <div>
                <h1 className="text-2xl sm:text-3xl font-display font-bold">My Profile</h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-1">Manage your details and view your exclusive Trial Pass.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 md:gap-8">
                {/* Details Section */}
                <div className="glass-card p-4 sm:p-6 md:col-span-5 h-fit shadow-lg shadow-black/5 border-none">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-4 mb-4">
                        <h2 className="text-lg sm:text-xl font-semibold">Personal Details</h2>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={openProfileEdit}
                            className="gap-2 w-full sm:w-auto shrink-0"
                        >
                            <Pencil className="w-4 h-4" />
                            Update profile
                        </Button>
                    </div>
                    <Dialog open={profileEditOpen} onOpenChange={setProfileEditOpen}>
                        <DialogContent className="w-[calc(100vw-2rem)] max-w-md max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Update profile</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleProfileUpdate} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-fname">First name</Label>
                                    <Input
                                        id="edit-fname"
                                        value={editForm.fname}
                                        onChange={(e) => setEditForm((p) => ({ ...p, fname: e.target.value }))}
                                        placeholder="First name"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-lname">Last name</Label>
                                    <Input
                                        id="edit-lname"
                                        value={editForm.lname}
                                        onChange={(e) => setEditForm((p) => ({ ...p, lname: e.target.value }))}
                                        placeholder="Last name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-email">Email</Label>
                                    <Input
                                        id="edit-email"
                                        type="email"
                                        value={editForm.email}
                                        onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                                        placeholder="Email"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-mobile">Mobile number</Label>
                                    <Input
                                        id="edit-mobile"
                                        value={editForm.mobile}
                                        onChange={(e) => setEditForm((p) => ({ ...p, mobile: e.target.value }))}
                                        placeholder="Mobile number"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-role">Role / Affiliation</Label>
                                    <Select
                                        value={editForm.playerRole || undefined}
                                        onValueChange={(val) => setEditForm((p) => ({ ...p, playerRole: val }))}
                                    >
                                        <SelectTrigger id="edit-role">
                                            <SelectValue placeholder="Select role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Batsman">Batsman</SelectItem>
                                            <SelectItem value="Bowler">Bowler</SelectItem>
                                            <SelectItem value="Wicket Keeper">Wicket Keeper</SelectItem>
                                            <SelectItem value="All-Rounder">All-Rounder</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setProfileEditOpen(false)}
                                        disabled={updatingProfile}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={updatingProfile}>
                                        {updatingProfile ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                Saving...
                                            </>
                                        ) : (
                                            "Save changes"
                                        )}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                    <div className="space-y-4 sm:space-y-5">
                        <div className="bg-secondary/20 p-3 sm:p-4 rounded-xl">
                            <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Full Name</p>
                            <p className="font-semibold text-base sm:text-lg break-words">{profile.fname} {profile.lname}</p>
                        </div>
                        <div className="bg-secondary/20 p-3 sm:p-4 rounded-xl">
                            <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Email Address</p>
                            <p className="font-semibold text-base sm:text-lg break-all">{profile.email}</p>
                        </div>
                        <div className="bg-secondary/20 p-3 sm:p-4 rounded-xl">
                            <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Mobile Number</p>
                            <p className="font-semibold text-base sm:text-lg">{profile.mobile || "N/A"}</p>
                        </div>
                        <div className="bg-secondary/20 p-3 sm:p-4 rounded-xl">
                            <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Role / Affiliation</p>
                            <p className="font-semibold text-base sm:text-lg capitalize">{profile.playerRole || profile.role || "Player"}</p>
                        </div>
                        <div className="bg-secondary/20 p-3 sm:p-4 rounded-xl flex items-center justify-between gap-2">
                            <div className="min-w-0">
                                <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Status</p>
                                <p className="font-semibold text-base sm:text-lg truncate">
                                    {profile.isPaid ? "Paid Member" : "Registered User"}
                                </p>
                            </div>
                            <div className={`w-3 h-3 rounded-full shrink-0 ${profile.isPaid ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]' : 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.6)] animate-pulse'}`}></div>
                        </div>
                    </div>
                </div>

                {/* Trial Pass Section */}
                {profile.isPaid ? (
                    <div className="md:col-span-7 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 bg-black/5 dark:bg-white/5 rounded-2xl sm:rounded-3xl inner-shadow border border-border">
                        <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center w-full">Your BRPL Trial Pass</h3>

                        {/* Trial Pass - responsive wrapper: scale down on small screens */}
                        <div id="trial-pass-container" className="flex justify-center w-full overflow-x-auto py-2 md:py-0">
                            <div className="trial-pass-scaled origin-top transition-transform duration-500 ease-out md:hover:scale-105 relative group" style={{ width: 'min(400px, 100%)' }}>
                                <TrialPass key={profile?.profileImage ?? profile?._id ?? 'pass'} user={profile} />

                                <div className="absolute inset-x-0 top-[21%] flex justify-center pointer-events-none">
                                    {uploadingImage && (
                                        <div className="absolute z-50 bg-black/60 text-white flex items-center justify-center rounded-[22px] w-[55%] max-w-[220px] aspect-square">
                                            <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageUpload}
                        />

                        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4 w-full">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadingImage}
                                className="bg-secondary text-secondary-foreground border border-border px-5 sm:px-6 py-2.5 rounded-lg font-medium shadow hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
                                {uploadingImage ? "Uploading..." : "Update Photo"}
                            </button>
                            <button
                                onClick={handleDownload}
                                className="bg-primary text-primary-foreground px-5 sm:px-6 py-2.5 rounded-lg font-medium shadow-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
                            >
                                Download Pass
                            </button>
                        </div>

                        <p className="text-xs sm:text-sm text-muted-foreground mt-4 sm:mt-6 text-center max-w-sm px-2">
                            This digital pass grants you access to all selected events and tryouts valid under the BRPL 2026 season.
                        </p>
                    </div>
                ) : (
                    <div className="md:col-span-7 flex flex-col items-center justify-center p-6 sm:p-12 bg-black/5 dark:bg-white/5 rounded-2xl sm:rounded-3xl border border-border text-center h-full min-h-[320px] sm:min-h-[400px]">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                            <Lock className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                        </div>
                        <h3 className="text-2xl sm:text-3xl font-display font-bold mb-3 sm:mb-4">Trial Pass Locked</h3>
                        <p className="text-muted-foreground max-w-md mx-auto mb-6 sm:mb-8 text-base sm:text-lg px-2">
                            Complete your registration payment to unlock and download your official BRPL Trial Pass.
                        </p>
                        <Link to="/dashboard" className="bg-primary text-primary-foreground px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 hover:scale-105 transition-all inline-flex items-center justify-center gap-2 text-base sm:text-lg w-full sm:w-auto">
                            Complete Payment
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserProfile;
