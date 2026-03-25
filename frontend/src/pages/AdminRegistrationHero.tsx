import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, X, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/apihelper/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface SettingsForm {
    titleLine1: string;
    titleLine2: string;
    subtitle: string;
    buttonText: string;
    paymentNote: string;
    backgroundImage: string;
}

const AdminRegistrationHero = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [form, setForm] = useState<SettingsForm>({
        titleLine1: "Don\u2019t Let Your Talent",
        titleLine2: "Stay in the Gully.",
        subtitle: "Slots for your city are filling fast. Join the revolution today.",
        buttonText: "REGISTER NOW - \u20B91499",
        paymentNote: "Secure Payment via UPI/Card",
        backgroundImage: "/banner.png",
    });

    // Background image upload
    const [bgMode, setBgMode] = useState<"url" | "upload">("url");
    const [bgFile, setBgFile] = useState<File | null>(null);
    const [bgPreview, setBgPreview] = useState<string | null>(null);
    const bgFileInputRef = useRef<HTMLInputElement>(null);

    const resetBgFile = () => {
        setBgFile(null);
        if (bgPreview?.startsWith("blob:")) URL.revokeObjectURL(bgPreview);
        setBgPreview(null);
        if (bgFileInputRef.current) bgFileInputRef.current.value = "";
    };

    const handleBgFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setBgFile(file);
        setBgPreview(URL.createObjectURL(file));
    };

    useEffect(() => {
        setIsLoading(true);
        apiClient.get("/api/registration-hero")
            .then(res => {
                if (res.data.success && res.data.data) {
                    const s = res.data.data;
                    setForm({
                        titleLine1: s.titleLine1 || "",
                        titleLine2: s.titleLine2 || "",
                        subtitle: s.subtitle || "",
                        buttonText: s.buttonText || "",
                        paymentNote: s.paymentNote || "",
                        backgroundImage: s.backgroundImage || "/banner.png",
                    });
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
            formData.append("titleLine1", form.titleLine1);
            formData.append("titleLine2", form.titleLine2);
            formData.append("subtitle", form.subtitle);
            formData.append("buttonText", form.buttonText);
            formData.append("paymentNote", form.paymentNote);

            if (bgMode === "upload" && bgFile) {
                formData.append("backgroundImageFile", bgFile);
            } else {
                formData.append("backgroundImage", form.backgroundImage);
            }

            const res = await apiClient.put("/api/registration-hero/settings", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            if (res.data.success) {
                toast.success("Settings updated successfully");
                if (res.data.data?.backgroundImage) {
                    setForm(prev => ({ ...prev, backgroundImage: res.data.data.backgroundImage }));
                }
                resetBgFile();
                setBgMode("url");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to update settings");
        } finally {
            setIsSaving(false);
        }
    };

    const update = (field: keyof SettingsForm, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
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
                    Registration Hero Section
                </h1>
                <p className="text-gray-500 mt-1">Manage the hero banner at the top of the Registration page.</p>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                {/* Title */}
                <Card>
                    <CardHeader>
                        <CardTitle>Hero Title</CardTitle>
                        <CardDescription>Two-line heading displayed on the hero banner.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="titleLine1">Title Line 1</Label>
                                <Input id="titleLine1" value={form.titleLine1} onChange={e => update("titleLine1", e.target.value)} placeholder="e.g. Don't Let Your Talent" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="titleLine2">Title Line 2</Label>
                                <Input id="titleLine2" value={form.titleLine2} onChange={e => update("titleLine2", e.target.value)} placeholder="e.g. Stay in the Gully." />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="subtitle">Subtitle</Label>
                            <Input id="subtitle" value={form.subtitle} onChange={e => update("subtitle", e.target.value)} placeholder="e.g. Slots for your city are filling fast..." />
                        </div>
                    </CardContent>
                </Card>

                {/* Button & Payment Note */}
                <Card>
                    <CardHeader>
                        <CardTitle>CTA Button & Note</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="buttonText">Button Text</Label>
                                <Input id="buttonText" value={form.buttonText} onChange={e => update("buttonText", e.target.value)} placeholder="e.g. REGISTER NOW - ₹1499" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="paymentNote">Payment Note</Label>
                                <Input id="paymentNote" value={form.paymentNote} onChange={e => update("paymentNote", e.target.value)} placeholder="e.g. Secure Payment via UPI/Card" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Background Image */}
                <Card>
                    <CardHeader>
                        <CardTitle>Background Image</CardTitle>
                        <CardDescription>The hero banner background image.</CardDescription>
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
                                        <p className="text-sm text-gray-500">Click to upload background image</p>
                                        <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP up to 10MB</p>
                                        <input ref={bgFileInputRef} type="file" accept="image/*" className="hidden" onChange={handleBgFileChange} />
                                    </div>
                                ) : (
                                    <div className="relative rounded-lg overflow-hidden border border-gray-200 h-40 bg-gray-50">
                                        <img src={bgPreview} alt="Background preview" className="w-full h-full object-cover" />
                                        <button type="button" onClick={resetBgFile} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors">
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {bgMode === "url" && (
                            <div className="space-y-2">
                                <Input value={form.backgroundImage} onChange={e => update("backgroundImage", e.target.value)} placeholder="e.g. /banner.png or https://..." />
                                {form.backgroundImage && (
                                    <img src={form.backgroundImage} alt="Background preview" className="w-full h-40 object-cover rounded border mt-1" onError={e => (e.currentTarget.style.display = 'none')} />
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

export default AdminRegistrationHero;
