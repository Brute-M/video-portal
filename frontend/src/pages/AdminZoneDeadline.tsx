import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/apihelper/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface SettingsForm {
    titleBefore: string;
    titleHighlight: string;
    stat1Value: string;
    stat1Label: string;
    stat2Label: string;
    stat3Value: string;
    stat3Label: string;
    ctaLine1: string;
    ctaLine2: string;
    buttonText: string;
    countdownTargetDate: string;
}

const AdminZoneDeadline = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [form, setForm] = useState<SettingsForm>({
        titleBefore: "ZONES ARE",
        titleHighlight: "NEARING CAPACITY",
        stat1Value: "78%",
        stat1Label: "Registrations Completed",
        stat2Label: "Time Left",
        stat3Value: "89",
        stat3Label: "Slots Available",
        ctaLine1: "Those who hesitate fall behind.",
        ctaLine2: "Those who step forward, leave their mark.",
        buttonText: "Start Your Journey - Register Now",
        countdownTargetDate: "",
    });

    useEffect(() => {
        setIsLoading(true);
        apiClient.get("/api/zone-deadline")
            .then(res => {
                if (res.data.success && res.data.data) {
                    const s = res.data.data;
                    setForm({
                        titleBefore: s.titleBefore || "",
                        titleHighlight: s.titleHighlight || "",
                        stat1Value: s.stat1Value || "",
                        stat1Label: s.stat1Label || "",
                        stat2Label: s.stat2Label || "",
                        stat3Value: s.stat3Value || "",
                        stat3Label: s.stat3Label || "",
                        ctaLine1: s.ctaLine1 || "",
                        ctaLine2: s.ctaLine2 || "",
                        buttonText: s.buttonText || "",
                        countdownTargetDate: s.countdownTargetDate
                            ? new Date(s.countdownTargetDate).toISOString().slice(0, 16)
                            : "",
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
            const payload = {
                ...form,
                countdownTargetDate: form.countdownTargetDate
                    ? new Date(form.countdownTargetDate).toISOString()
                    : undefined,
            };
            const res = await apiClient.put("/api/zone-deadline/settings", payload);
            if (res.data.success) toast.success("Settings updated successfully");
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
                    Zone Deadline Section
                </h1>
                <p className="text-gray-500 mt-1">Manage the urgency section "Zones Are Nearing Capacity" on the Registration page.</p>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                {/* Section Title */}
                <Card>
                    <CardHeader>
                        <CardTitle>Section Title</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="titleBefore">Text before highlight</Label>
                                <Input id="titleBefore" value={form.titleBefore} onChange={e => update("titleBefore", e.target.value)} placeholder="e.g. ZONES ARE" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="titleHighlight">Highlighted text (yellow)</Label>
                                <Input id="titleHighlight" value={form.titleHighlight} onChange={e => update("titleHighlight", e.target.value)} placeholder="e.g. NEARING CAPACITY" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Stats */}
                <Card>
                    <CardHeader>
                        <CardTitle>Stats</CardTitle>
                        <CardDescription>The three stat cards displayed in the section. Stat 2 is the countdown timer.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Stat 1 */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                            <div className="space-y-2">
                                <Label htmlFor="stat1Value">Stat 1 - Value</Label>
                                <Input id="stat1Value" value={form.stat1Value} onChange={e => update("stat1Value", e.target.value)} placeholder="e.g. 78%" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="stat1Label">Stat 1 - Label</Label>
                                <Input id="stat1Label" value={form.stat1Label} onChange={e => update("stat1Label", e.target.value)} placeholder="e.g. Registrations Completed" />
                            </div>
                        </div>

                        {/* Stat 2 (Countdown) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                            <div className="space-y-2">
                                <Label htmlFor="countdownTargetDate">Stat 2 - Countdown Target Date</Label>
                                <Input id="countdownTargetDate" type="datetime-local" value={form.countdownTargetDate} onChange={e => update("countdownTargetDate", e.target.value)} />
                                <p className="text-xs text-blue-500">Live countdown timer counts down to this date.</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="stat2Label">Stat 2 - Label</Label>
                                <Input id="stat2Label" value={form.stat2Label} onChange={e => update("stat2Label", e.target.value)} placeholder="e.g. Time Left" />
                            </div>
                        </div>

                        {/* Stat 3 */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                            <div className="space-y-2">
                                <Label htmlFor="stat3Value">Stat 3 - Value</Label>
                                <Input id="stat3Value" value={form.stat3Value} onChange={e => update("stat3Value", e.target.value)} placeholder="e.g. 89" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="stat3Label">Stat 3 - Label</Label>
                                <Input id="stat3Label" value={form.stat3Label} onChange={e => update("stat3Label", e.target.value)} placeholder="e.g. Slots Available" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* CTA & Button */}
                <Card>
                    <CardHeader>
                        <CardTitle>CTA Text & Button</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="ctaLine1">CTA Line 1 (italic)</Label>
                                <Input id="ctaLine1" value={form.ctaLine1} onChange={e => update("ctaLine1", e.target.value)} placeholder="e.g. Those who hesitate fall behind." />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ctaLine2">CTA Line 2 (bold)</Label>
                                <Input id="ctaLine2" value={form.ctaLine2} onChange={e => update("ctaLine2", e.target.value)} placeholder="e.g. Those who step forward, leave their mark." />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="buttonText">Button Text</Label>
                            <Input id="buttonText" value={form.buttonText} onChange={e => update("buttonText", e.target.value)} placeholder="e.g. Start Your Journey - Register Now" />
                        </div>
                    </CardContent>
                </Card>

                <Button type="submit" disabled={isSaving} className="w-full sm:w-auto">
                    {isSaving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving...</> : "Save Settings"}
                </Button>
            </form>
        </div>
    );
};

export default AdminZoneDeadline;
