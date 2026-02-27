import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShieldCheck, ShieldX, User } from "lucide-react";
import api from "@/apihelper/api";
import { getProfile } from "@/apihelper/auth";

const AdminProfile = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [toggling, setToggling] = useState(false);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const response = await getProfile();
            if (response.data) {
                setProfile(response.data);
            }
        } catch (error) {
            console.error("Failed to fetch profile", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to load profile details.",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleToggle2FA = async (action: 'enable' | 'disable') => {
        if (!profile || !profile.userId) return;
        setToggling(true);
        try {
            const response = await api.put(`/auth/toggle-2fa/${profile.userId}`, { action });
            if (response.data?.statusCode === 200) {
                toast({
                    title: `MFA ${action === 'enable' ? 'Enabled' : 'Disabled'}`,
                    description: `Successfully ${action}d your Two-Factor Authentication.`,
                });
                await fetchProfile();
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Failed",
                description: error.response?.data?.data?.message || `Failed to ${action} MFA.`,
            });
        } finally {
            setToggling(false);
        }
    };

    return (
        <div className="container mx-auto py-8 max-w-3xl animate-fade-in">
            <h1 className="text-3xl font-display font-bold mb-6">My Profile</h1>

            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : profile ? (
                <div className="bg-card border rounded-xl p-8 shadow-sm">
                    <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary relative overflow-hidden shrink-0">
                            {profile.profileImage ? (
                                <img src={profile.profileImage} alt={profile.fname} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                            ) : (
                                <span className="text-3xl font-display font-bold">
                                    {profile.email?.charAt(0).toUpperCase() || <User className="w-10 h-10" />}
                                </span>
                            )}
                        </div>
                        <div className="flex-1 space-y-4">
                            <div>
                                <h2 className="text-2xl font-semibold capitalize">{profile.fname} {profile.lname}</h2>
                                <p className="text-muted-foreground">{profile.email}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Role</p>
                                    <p className="font-semibold uppercase text-sm mt-1 inline-block px-3 py-1 bg-secondary rounded-full">
                                        {profile.role.replace('_', ' ')}
                                    </p>
                                </div>
                                {profile.mobile && (
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Mobile</p>
                                        <p className="font-semibold">{profile.mobile}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-8 border-t border-border/50">
                        <h3 className="text-xl font-semibold mb-4">Security Settings</h3>
                        <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg border border-border/50">
                            <div>
                                <p className="font-medium text-foreground">Two-Factor Authentication (MFA)</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Secure your account using Google Authenticator.
                                    {profile.twoFaEnabled
                                        ? " Status: Enabled."
                                        : " Status: Disabled."}
                                </p>
                            </div>
                            <Button
                                variant={profile.twoFaEnabled ? "destructive" : "default"}
                                onClick={() => handleToggle2FA(profile.twoFaEnabled ? 'disable' : 'enable')}
                                disabled={toggling}
                                className="min-w-[120px]"
                            >
                                {toggling ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : profile.twoFaEnabled ? (
                                    <>
                                        <ShieldX className="w-4 h-4 mr-2" />
                                        Disable MFA
                                    </>
                                ) : (
                                    <>
                                        <ShieldCheck className="w-4 h-4 mr-2" />
                                        Enable MFA
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="p-8 text-center text-muted-foreground border rounded-xl bg-card">
                    Could not load profile details.
                </div>
            )}
        </div>
    );
};

export default AdminProfile;
