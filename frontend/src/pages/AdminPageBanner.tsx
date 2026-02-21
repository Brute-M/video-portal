import { useState, useEffect } from "react";
import api from "@/apihelper/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, ImageIcon } from "lucide-react";
import { getImageUrl } from "@/utils/imageHelper";

const PAGE_KEYS: { key: string; label: string }[] = [
    { key: "contactUs", label: "Contact Us" },
    { key: "aboutUs", label: "About Us" },
    { key: "teams", label: "Teams" },
    { key: "careers", label: "Careers" },
    { key: "events", label: "Events" },
    { key: "becomePartner", label: "Become a Partner" },
    { key: "typesOfPartners", label: "Types of Partners" },
    { key: "faqs", label: "FAQs" },
    { key: "privacyPolicy", label: "Privacy Policy" },
    { key: "termsAndConditions", label: "Terms & Conditions" },
];

function isS3Key(value: string) {
    return !!value && !value.startsWith("http") && !value.startsWith("uploads/") && !value.startsWith("/");
}

const AdminPageBanner = () => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [bannerImage, setBannerImage] = useState("");
    const [displayBannerUrl, setDisplayBannerUrl] = useState("");
    const [bannerTitles, setBannerTitles] = useState<Record<string, string>>({});
    const [uploadingBanner, setUploadingBanner] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    useEffect(() => {
        if (!bannerImage || !isS3Key(bannerImage)) {
            setDisplayBannerUrl("");
            return;
        }
        let cancelled = false;
        api.get("/api/cms/site-settings/presign-url", { params: { key: bannerImage } })
            .then((res) => {
                if (!cancelled && res.data?.url) setDisplayBannerUrl(res.data.url);
            })
            .catch(() => {
                if (!cancelled) setDisplayBannerUrl("");
            });
        return () => {
            cancelled = true;
        };
    }, [bannerImage]);

    const fetchSettings = async () => {
        setIsLoading(true);
        try {
            const response = await api.get("/api/cms/site-settings");
            const data = response.data?.data;
            if (data) {
                setBannerImage(data.bannerImage || "");
                setBannerTitles(typeof data.bannerTitles === "object" && data.bannerTitles !== null ? data.bannerTitles : {});
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to load banner settings." });
        } finally {
            setIsLoading(false);
        }
    };

    const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingBanner(true);
        try {
            const formData = new FormData();
            formData.append("image", file);
            const response = await api.post("/api/cms/site-settings/upload-banner-image", formData, {
                headers: { "Content-Type": undefined },
            });
            const path = response.data?.path;
            const url = response.data?.url;
            if (path) {
                setBannerImage(url || path);
                setDisplayBannerUrl("");
                toast({ title: "Success", description: "Banner image updated. It will apply across all pages." });
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to upload banner image." });
        } finally {
            setUploadingBanner(false);
        }
    };

    const setTitle = (key: string, value: string) => {
        setBannerTitles((prev) => ({ ...prev, [key]: value }));
    };

    const handleSaveTitles = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.put("/api/cms/site-settings", {
                bannerTitles,
            });
            toast({ title: "Success", description: "Banner titles saved." });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to save titles." });
        } finally {
            setIsSubmitting(false);
        }
    };

    const bannerImageSrc = () => {
        if (displayBannerUrl) return displayBannerUrl;
        if (!bannerImage) return "";
        if (bannerImage.startsWith("http") || bannerImage.startsWith("blob:")) return bannerImage;
        if (bannerImage.startsWith("uploads/")) return getImageUrl(bannerImage);
        if (bannerImage.startsWith("/")) return bannerImage;
        if (isS3Key(bannerImage)) return "";
        return getImageUrl(bannerImage);
    };

    const showPreview = !!bannerImageSrc();
    const loadingPreview = bannerImage && isS3Key(bannerImage) && !displayBannerUrl;

    if (isLoading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="p-8 animate-fade-in max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold font-display mb-2">Page Banner</h1>
            <p className="text-muted-foreground mb-8">
                Set a common banner image for all pages and customize the title shown on each page (Contact Us, About Us, etc.).
            </p>

            <div className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ImageIcon className="w-5 h-5" /> Common Banner Image
                        </CardTitle>
                        <CardDescription>
                            This image is used as the background on Contact Us, About Us, Events, Career, and other pages. Upload to replace.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center min-h-[200px] bg-muted/30">
                            {loadingPreview ? (
                                <p className="text-muted-foreground text-sm flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" /> Loading preview...
                                </p>
                            ) : showPreview ? (
                                <div className="relative w-full max-w-xl rounded-lg overflow-hidden bg-muted">
                                    <img
                                        src={bannerImageSrc()}
                                        alt="Banner preview"
                                        className="w-full h-auto max-h-[280px] object-cover"
                                    />
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-sm">No banner image. Default will be used until you upload one.</p>
                            )}
                            <Label className="mt-4 cursor-pointer flex items-center gap-2 text-primary hover:underline">
                                <Upload className="w-4 h-4" />
                                {uploadingBanner ? "Uploading..." : "Upload new banner image"}
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleBannerUpload}
                                    disabled={uploadingBanner}
                                />
                            </Label>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Banner Titles (per page)</CardTitle>
                        <CardDescription>
                            Edit the main title shown in the banner on each page. Leave blank to use the default title for that page.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSaveTitles} className="space-y-4">
                            {PAGE_KEYS.map(({ key, label }) => (
                                <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                    <Label className="w-40 shrink-0 text-muted-foreground">{label}</Label>
                                    <Input
                                        value={bannerTitles[key] ?? ""}
                                        onChange={(e) => setTitle(key, e.target.value)}
                                        placeholder={label}
                                        className="flex-1"
                                    />
                                </div>
                            ))}
                            <div className="pt-4">
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        "Save Titles"
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AdminPageBanner;
