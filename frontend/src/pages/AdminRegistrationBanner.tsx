import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload, X, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/apihelper/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getImageUrl } from "@/utils/imageHelper";

const AdminRegistrationBanner = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [quote, setQuote] = useState("Where skill is the only selection criteria and your dream is the only qualification.");
    const [backgroundImage, setBackgroundImage] = useState("/auth-banner.png");
    const [bgUrlDirty, setBgUrlDirty] = useState(false);
    const [mobileBackgroundImage, setMobileBackgroundImage] = useState("");
    const [mobileBgUrlDirty, setMobileBgUrlDirty] = useState(false);

    // Background image upload
    const [bgMode, setBgMode] = useState<"url" | "upload">("url");
    const [bgFile, setBgFile] = useState<File | null>(null);
    const [bgPreview, setBgPreview] = useState<string | null>(null);
    const bgFileInputRef = useRef<HTMLInputElement>(null);

    // Mobile background image upload
    const [mobileBgMode, setMobileBgMode] = useState<"url" | "upload">("url");
    const [mobileBgFile, setMobileBgFile] = useState<File | null>(null);
    const [mobileBgPreview, setMobileBgPreview] = useState<string | null>(null);
    const mobileBgFileInputRef = useRef<HTMLInputElement>(null);

    const resetBgFile = () => {
        setBgFile(null);
        if (bgPreview?.startsWith("blob:")) URL.revokeObjectURL(bgPreview);
        setBgPreview(null);
        if (bgFileInputRef.current) bgFileInputRef.current.value = "";
    };

    const resetMobileBgFile = () => {
        setMobileBgFile(null);
        if (mobileBgPreview?.startsWith("blob:")) URL.revokeObjectURL(mobileBgPreview);
        setMobileBgPreview(null);
        if (mobileBgFileInputRef.current) mobileBgFileInputRef.current.value = "";
    };

    const handleBgFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setBgFile(file);
        setBgPreview(URL.createObjectURL(file));
    };

    const handleMobileBgFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setMobileBgFile(file);
        setMobileBgPreview(URL.createObjectURL(file));
    };

    useEffect(() => {
        setIsLoading(true);
        apiClient.get("/api/registration-banner")
            .then(res => {
                if (res.data.success && res.data.data) {
                    const s = res.data.data;
                    setQuote(s.quote || "");
                    setBackgroundImage(s.backgroundImage || "/auth-banner.png");
                    setMobileBackgroundImage(s.mobileBackgroundImage || "");
                }
            })
            .catch(() => toast.error("Failed to load settings"))
            .finally(() => setIsLoading(false));
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const formData = new FormData();
            formData.append("quote", quote);

            // Only send desktop banner if user uploaded a file or explicitly edited the URL
            if (bgMode === "upload" && bgFile) {
                formData.append("backgroundImageFile", bgFile);
            } else if (bgUrlDirty) {
                formData.append("backgroundImage", backgroundImage);
            }

            // Only send mobile banner if user uploaded a file or explicitly edited the URL
            if (mobileBgMode === "upload" && mobileBgFile) {
                formData.append("mobileBackgroundImageFile", mobileBgFile);
            } else if (mobileBgUrlDirty) {
                formData.append("mobileBackgroundImage", mobileBackgroundImage);
            }

            const res = await apiClient.put("/api/registration-banner/settings", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            if (res.data.success) {
                toast.success("Settings updated successfully");
                // Re-fetch to get properly converted display URLs
                const refreshRes = await apiClient.get("/api/registration-banner");
                if (refreshRes.data.success && refreshRes.data.data) {
                    const s = refreshRes.data.data;
                    setBackgroundImage(s.backgroundImage || "/auth-banner.png");
                    setMobileBackgroundImage(s.mobileBackgroundImage || "");
                }
                resetBgFile();
                setBgMode("url");
                setBgUrlDirty(false);
                resetMobileBgFile();
                setMobileBgMode("url");
                setMobileBgUrlDirty(false);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to update settings");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-24">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Registration Banner & Quote
                </h1>
                <p className="text-gray-500 mt-1">Manage the background banner image and the quote shown below the registration form.</p>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                {/* Quote */}
                <Card>
                    <CardHeader>
                        <CardTitle>Quote Text</CardTitle>
                        <CardDescription>The motivational quote displayed below the registration/login form.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            value={quote}
                            onChange={e => setQuote(e.target.value)}
                            placeholder="Enter quote text..."
                            rows={3}
                        />
                        {/* Preview */}
                        <div className="mt-3 p-3 bg-[#0F172A] rounded-lg">
                            <p className="text-sm bg-gradient-to-r from-[#FFC928] to-[#f59e0b] bg-clip-text text-transparent italic font-semibold text-center">
                                "{quote}"
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Background Image */}
                <Card>
                    <CardHeader>
                        <CardTitle>Background Banner Image</CardTitle>
                        <CardDescription>The background image behind the registration/login form.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex gap-2 p-1 bg-gray-100 rounded-lg w-fit">
                            <button type="button" onClick={() => setBgMode("upload")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${bgMode === "upload" ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-700"}`}>
                                <Upload className="w-3.5 h-3.5" /> Upload Image
                            </button>
                            <button type="button" onClick={() => { setBgMode("url"); resetBgFile(); }} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${bgMode === "url" ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-700"}`}>
                                <LinkIcon className="w-3.5 h-3.5" /> Enter URL
                            </button>
                        </div>

                        {bgMode === "upload" && (
                            <div>
                                {!bgPreview ? (
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg h-40 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors" onClick={() => bgFileInputRef.current?.click()}>
                                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                        <p className="text-sm text-gray-500">Click to upload banner image</p>
                                        <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP up to 10MB</p>
                                        <input ref={bgFileInputRef} type="file" accept="image/*" className="hidden" onChange={handleBgFileChange} />
                                    </div>
                                ) : (
                                    <div className="relative rounded-lg overflow-hidden border border-gray-200 h-40 bg-gray-50">
                                        <img src={bgPreview} alt="Banner preview" className="w-full h-full object-cover" />
                                        <button type="button" onClick={resetBgFile} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors">
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {bgMode === "url" && (
                            <div className="space-y-2">
                                <Input value={backgroundImage} onChange={e => { setBackgroundImage(e.target.value); setBgUrlDirty(true); }} placeholder="e.g. /auth-banner.png or https://..." />
                                {backgroundImage && (
                                    <img src={getImageUrl(backgroundImage)} alt="Banner preview" className="w-full h-40 object-cover rounded border mt-1" onError={e => (e.currentTarget.style.display = 'none')} />
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Mobile Background Image */}
                <Card>
                    <CardHeader>
                        <CardTitle>Mobile Banner Image</CardTitle>
                        <CardDescription>A separate banner image optimized for mobile devices. If not set, the desktop banner will be used on all devices.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex gap-2 p-1 bg-gray-100 rounded-lg w-fit">
                            <button type="button" onClick={() => setMobileBgMode("upload")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${mobileBgMode === "upload" ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-700"}`}>
                                <Upload className="w-3.5 h-3.5" /> Upload Image
                            </button>
                            <button type="button" onClick={() => { setMobileBgMode("url"); resetMobileBgFile(); }} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${mobileBgMode === "url" ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-700"}`}>
                                <LinkIcon className="w-3.5 h-3.5" /> Enter URL
                            </button>
                        </div>

                        {mobileBgMode === "upload" && (
                            <div>
                                {!mobileBgPreview ? (
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg h-40 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors" onClick={() => mobileBgFileInputRef.current?.click()}>
                                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                        <p className="text-sm text-gray-500">Click to upload mobile banner image</p>
                                        <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP up to 10MB</p>
                                        <input ref={mobileBgFileInputRef} type="file" accept="image/*" className="hidden" onChange={handleMobileBgFileChange} />
                                    </div>
                                ) : (
                                    <div className="relative rounded-lg overflow-hidden border border-gray-200 h-40 bg-gray-50">
                                        <img src={mobileBgPreview} alt="Mobile banner preview" className="w-full h-full object-cover" />
                                        <button type="button" onClick={resetMobileBgFile} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors">
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {mobileBgMode === "url" && (
                            <div className="space-y-2">
                                <Input value={mobileBackgroundImage} onChange={e => { setMobileBackgroundImage(e.target.value); setMobileBgUrlDirty(true); }} placeholder="e.g. /mobile-banner.png or https://..." />
                                {mobileBackgroundImage && (
                                    <img src={getImageUrl(mobileBackgroundImage)} alt="Mobile banner preview" className="w-full h-40 object-cover rounded border mt-1" onError={e => (e.currentTarget.style.display = 'none')} />
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Button type="submit" disabled={isSaving} className="w-full sm:w-auto">
                    {isSaving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving...</> : "Save Settings"}
                </Button>
            </form>
        </div>
    );
};

export default AdminRegistrationBanner;
