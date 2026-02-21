import { useState, useEffect } from "react";
import api from "@/apihelper/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Upload, Share2, MapPin, Phone, Mail } from "lucide-react";
import { getImageUrl } from "@/utils/imageHelper";

interface SocialLink {
    name: string;
    url: string;
    image: string;
}

const AdminSocialContact = () => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [contactAddress, setContactAddress] = useState("");
    const [contactPhone, setContactPhone] = useState("");
    const [contactPhoneSecondary, setContactPhoneSecondary] = useState("");
    const [contactEmail, setContactEmail] = useState("");
    const [whatsappNumber, setWhatsappNumber] = useState("");
    const [mapEmbedUrl, setMapEmbedUrl] = useState("");
    const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
    const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
    const [imagePreviewByKey, setImagePreviewByKey] = useState<Record<string, string>>({});

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setIsLoading(true);
        try {
            const response = await api.get("/api/cms/site-settings");
            const data = response.data?.data;
            if (data) {
                setContactAddress(data.contactAddress || "");
                setContactPhone(data.contactPhone || "");
                setContactPhoneSecondary(data.contactPhoneSecondary || "");
                setContactEmail(data.contactEmail || "");
                setWhatsappNumber(data.whatsappNumber || "");
                setMapEmbedUrl(data.mapEmbedUrl || "");
                setSocialLinks(Array.isArray(data.socialLinks) ? data.socialLinks : []);
            }
        } catch (error) {
            console.error("Error fetching site settings:", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to load settings." });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSocialImageUpload = async (index: number, file: File) => {
        setUploadingIndex(index);
        try {
            const formData = new FormData();
            formData.append("image", file);
            const response = await api.post("/api/cms/site-settings/upload-social-icon", formData, {
                headers: { "Content-Type": undefined },
            });
            const path = response.data?.path;
            const url = response.data?.url;
            if (path) {
                if (url) setImagePreviewByKey((prev) => ({ ...prev, [path]: url }));
                setSocialLinks((prev) => {
                    const next = [...prev];
                    if (!next[index]) next[index] = { name: "", url: "", image: "" };
                    next[index] = { ...next[index], image: path };
                    return next;
                });
                toast({ title: "Success", description: "Image uploaded." });
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to upload image." });
        } finally {
            setUploadingIndex(null);
        }
    };

    const addSocialLink = () => {
        setSocialLinks((prev) => [...prev, { name: "", url: "", image: "" }]);
    };

    const removeSocialLink = (index: number) => {
        setSocialLinks((prev) => prev.filter((_, i) => i !== index));
    };

    const updateSocialLink = (index: number, field: keyof SocialLink, value: string) => {
        setSocialLinks((prev) => {
            const next = [...prev];
            if (!next[index]) next[index] = { name: "", url: "", image: "" };
            next[index] = { ...next[index], [field]: value };
            return next;
        });
    };

    const getSocialImageSrc = (image: string) => {
        if (!image) return "";
        if (imagePreviewByKey[image]) return imagePreviewByKey[image];
        if (image.startsWith("http") || image.startsWith("blob:")) return image;
        if (image.startsWith("uploads/")) return getImageUrl(image);
        if (image.startsWith("/")) return image;
        return imagePreviewByKey[image] || "";
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.put("/api/cms/site-settings", {
                contactAddress,
                contactPhone,
                contactPhoneSecondary,
                contactEmail,
                whatsappNumber: whatsappNumber.replace(/\D/g, ""),
                mapEmbedUrl,
                socialLinks,
            });
            toast({ title: "Success", description: "Site settings saved. Changes will reflect across the website." });
        } catch (error) {
            console.error("Error saving settings:", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to save settings." });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="p-8 animate-fade-in max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold font-display mb-2">Social & Contact</h1>
            <p className="text-muted-foreground mb-8">
                Manage contact details and social media links. These appear in the header, footer, and contact page across the whole website.
            </p>

            <form onSubmit={handleSubmit} className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Phone className="w-5 h-5" /> Contact Details
                        </CardTitle>
                        <CardDescription>Address, phone, and email shown site-wide.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Textarea
                                id="address"
                                value={contactAddress}
                                onChange={(e) => setContactAddress(e.target.value)}
                                placeholder="Full address"
                                rows={3}
                                className="resize-none"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="phone">Primary Phone</Label>
                                <Input
                                    id="phone"
                                    value={contactPhone}
                                    onChange={(e) => setContactPhone(e.target.value)}
                                    placeholder="+(91) 81309 55866"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone2">Secondary Phone (optional)</Label>
                                <Input
                                    id="phone2"
                                    value={contactPhoneSecondary}
                                    onChange={(e) => setContactPhoneSecondary(e.target.value)}
                                    placeholder="+(91) 98215 63585"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={contactEmail}
                                onChange={(e) => setContactEmail(e.target.value)}
                                placeholder="info@brpl.net"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="whatsapp">WhatsApp Number (digits only, with country code)</Label>
                            <Input
                                id="whatsapp"
                                value={whatsappNumber}
                                onChange={(e) => setWhatsappNumber(e.target.value)}
                                placeholder="918130955866"
                            />
                            <p className="text-xs text-muted-foreground">Used for the floating WhatsApp button. No + or spaces.</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="map">Google Map Embed URL (optional)</Label>
                            <Input
                                id="map"
                                value={mapEmbedUrl}
                                onChange={(e) => setMapEmbedUrl(e.target.value)}
                                placeholder="https://www.google.com/maps/embed?pb=..."
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Share2 className="w-5 h-5" /> Social Media Links
                        </CardTitle>
                        <CardDescription>Links and icons shown in header and footer. Upload an image or use default icon by leaving image empty.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {socialLinks.map((link, index) => (
                            <div key={index} className="flex flex-col sm:flex-row gap-4 p-4 border rounded-lg bg-muted/30">
                                <div className="flex-shrink-0 w-20 h-20 rounded-lg border bg-background flex items-center justify-center overflow-hidden">
                                    {link.image ? (
                                        <img src={getSocialImageSrc(link.image)} alt={link.name || "Social"} className="w-full h-full object-contain" />
                                    ) : (
                                        <span className="text-xs text-muted-foreground">No img</span>
                                    )}
                                </div>
                                <div className="flex-1 space-y-2 min-w-0">
                                    <div className="flex gap-2 flex-wrap">
                                        <Input
                                            placeholder="Name (e.g. Facebook)"
                                            value={link.name}
                                            onChange={(e) => updateSocialLink(index, "name", e.target.value)}
                                            className="max-w-[140px]"
                                        />
                                        <Input
                                            placeholder="URL"
                                            value={link.url}
                                            onChange={(e) => updateSocialLink(index, "url", e.target.value)}
                                            className="flex-1 min-w-[120px]"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Label className="text-xs cursor-pointer flex items-center gap-1">
                                            <Upload className="w-3 h-3" />
                                            <span>Upload icon</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) handleSocialImageUpload(index, file);
                                                }}
                                                disabled={uploadingIndex === index}
                                            />
                                        </Label>
                                        {uploadingIndex === index && <Loader2 className="w-4 h-4 animate-spin" />}
                                    </div>
                                </div>
                                <Button type="button" variant="ghost" size="icon" className="flex-shrink-0 text-destructive hover:text-destructive" onClick={() => removeSocialLink(index)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                        <Button type="button" variant="outline" onClick={addSocialLink} className="w-full sm:w-auto">
                            <Plus className="w-4 h-4 mr-2" /> Add Social Link
                        </Button>
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            "Save All Settings"
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default AdminSocialContact;
