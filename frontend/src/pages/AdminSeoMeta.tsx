import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAllSeoMeta, updateSeoMeta } from "@/apihelper/seo";
import api from "@/apihelper/api";
import { CodeEditorWithHighlight } from "@/components/CodeEditorWithHighlight";
import { Loader2, Globe, CheckCircle2, BarChart3 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminSeoMeta() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [customHeadScripts, setCustomHeadScripts] = useState("");
    const [scriptsLoading, setScriptsLoading] = useState(true);
    const [scriptsSaving, setScriptsSaving] = useState(false);

    // Default predefined pages for the portal
    const PREDEFINED_PAGES = [
        { path: '/', name: 'Home' },
        { path: '/about-us', name: 'About Us' },
        { path: '/teams', name: 'Teams' },
        { path: '/events', name: 'Events' },
        { path: '/career', name: 'Career' },
        { path: '/blog', name: 'Blog' },
        { path: '/news', name: 'News' },
        { path: '/partners', name: 'Partners' },
        { path: '/faqs', name: 'FAQs' },
        { path: '/registration', name: 'Registration' },
        { path: '/contact-us', name: 'Contact Us' },
        { path: '/login', name: 'Login' },
        { path: '/dashboard', name: 'User Dashboard' },
        { path: 'custom', name: '✨ Create Custom Route...' }
    ];

    const [selectedPage, setSelectedPage] = useState<string>("/");
    const [formData, setFormData] = useState({
        pagePath: "/",
        title: "",
        description: "",
        keywords: "",
        ogTitle: "",
        ogDescription: "",
        ogImage: "",
        customBodyScripts: ""
    });

    const [savedMetas, setSavedMetas] = useState<any[]>([]);

    useEffect(() => {
        fetchMetas();
    }, []);

    useEffect(() => {
        const fetchSiteSettings = async () => {
            setScriptsLoading(true);
            try {
                const res = await api.get("/api/cms/site-settings");
                const data = res.data?.data;
                setCustomHeadScripts(data?.customHeadScripts != null ? String(data.customHeadScripts) : "");
            } catch {
                setCustomHeadScripts("");
            } finally {
                setScriptsLoading(false);
            }
        };
        fetchSiteSettings();
    }, []);

    const fetchMetas = async () => {
        setIsLoading(true);
        try {
            const data = await getAllSeoMeta();
            setSavedMetas(data || []);
            loadMetaForPath(selectedPage, data || []);
        } catch (error) {
            console.error("Failed to fetch meta data", error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadMetaForPath = (path: string, metas: any[] = savedMetas) => {
        if (path === 'custom') {
            setFormData({
                pagePath: "/",
                title: "",
                description: "",
                keywords: "",
                ogTitle: "",
                ogDescription: "",
                ogImage: "",
                customBodyScripts: ""
            });
            return;
        }

        const found = metas.find(m => m.pagePath === path);
        if (found) {
            setFormData({
                pagePath: path,
                title: found.title || "",
                description: found.description || "",
                keywords: found.keywords || "",
                ogTitle: found.ogTitle || "",
                ogDescription: found.ogDescription || "",
                ogImage: found.ogImage || "",
                customBodyScripts: found.customBodyScripts || ""
            });
        } else {
            setFormData({
                pagePath: path,
                title: "",
                description: "",
                keywords: "",
                ogTitle: "",
                ogDescription: "",
                ogImage: "",
                customBodyScripts: ""
            });
        }
    };

    const handlePageChange = (val: string) => {
        setSelectedPage(val);
        loadMetaForPath(val);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await updateSeoMeta(formData);
            toast({
                title: "Success",
                description: "Meta details updated successfully. Changes will go live immediately.",
            });
            fetchMetas(); // Refresh list
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to update meta content.",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveScripts = async (e: React.FormEvent) => {
        e.preventDefault();
        setScriptsSaving(true);
        try {
            await api.put("/api/cms/site-settings", { customHeadScripts: customHeadScripts.trim() });
            toast({
                title: "Success",
                description: "Scripts saved. They will be injected on the next page load across the site.",
            });
        } catch {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to save scripts.",
            });
        } finally {
            setScriptsSaving(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-display font-bold text-foreground">Meta Content (SEO)</h1>
                    <p className="text-muted-foreground mt-1">Manage global page titles and descriptions for search engines.</p>
                </div>
                <Globe className="w-8 h-8 text-primary opacity-20" />
            </div>

            <Card className="glass-card border-primary/20">
                <CardHeader className="bg-primary/5 border-b">
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        Google Analytics & Search Console
                    </CardTitle>
                    <CardDescription>
                        Paste the script/meta code (e.g., Google Analytics gtag.js, Search Console verification) or organization schema. It will be injected into the <code className="text-xs bg-muted px-1 rounded">&lt;head&gt;</code> on every public page.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    {scriptsLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <form onSubmit={handleSaveScripts} className="space-y-4">
                            <Label htmlFor="customHeadScripts" className="font-medium">Script/Meta code (e.g. &lt;script&gt;...&lt;/script&gt; or &lt;meta ... /&gt;)</Label>
                            <CodeEditorWithHighlight
                                id="customHeadScripts"
                                value={customHeadScripts}
                                onChange={setCustomHeadScripts}
                                placeholder="Paste the code from Google (e.g. gtag.js or Search Console verification). Include full script/meta tags."
                                rows={12}
                            />
                            <Button type="submit" disabled={scriptsSaving}>
                                {scriptsSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Save scripts
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>

            <Card className="glass-card">
                <CardHeader>
                    <CardTitle>Select Page to Edit</CardTitle>
                    <CardDescription>Choose the page you want to update meta tags for.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Page Route</Label>
                            <Select value={selectedPage} onValueChange={handlePageChange} disabled={isLoading}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a page" />
                                </SelectTrigger>
                                <SelectContent className="z-[200]">
                                    {PREDEFINED_PAGES.map(p => {
                                        const isSaved = savedMetas.some(m => m.pagePath === p.path);
                                        return (
                                            <SelectItem key={p.path} value={p.path}>
                                                <div className="flex justify-between items-center w-full min-w-[200px]">
                                                    <span>{p.name} <span className="text-muted-foreground text-xs ml-1">({p.path})</span></span>
                                                    {isSaved && <CheckCircle2 className="w-3 h-3 text-green-500 ml-2" />}
                                                </div>
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="glass-card shadow-lg border-primary/20">
                <CardHeader className="bg-primary/5 border-b">
                    <CardTitle className="text-primary flex items-center gap-2">
                        <Globe className="w-5 h-5" />
                        Edit SEO Configuration
                    </CardTitle>
                    <CardDescription>Changes affect how this page appears in Google searches and social media previews.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    {isLoading ? (
                        <div className="flex justify-center items-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {selectedPage === 'custom' && (
                                <div className="space-y-2 animate-fade-in">
                                    <Label htmlFor="pagePath" className="font-bold">Custom Page Route *</Label>
                                    <Input
                                        id="pagePath"
                                        placeholder="e.g. /my-new-page"
                                        value={formData.pagePath}
                                        onChange={handleChange}
                                        required
                                        className="text-lg border-blue-200 focus-visible:ring-blue-500"
                                    />
                                    <p className="text-xs text-muted-foreground">Enter the exact path URL you want this to apply to (must start with /).</p>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="title" className="font-bold">Page Meta Title *</Label>
                                <Input
                                    id="title"
                                    placeholder="e.g. Home | Beyond Reach Premier League"
                                    value={formData.title}
                                    onChange={handleChange}
                                    required
                                    className="text-lg"
                                />
                                <p className="text-xs text-muted-foreground">Appears as the blue clickable link in Google searches. Keep it under 60 characters for best results.</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description" className="font-bold">Meta Description</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Describe the page content..."
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={4}
                                />
                                <p className="text-xs text-muted-foreground">The small paragraph text under the search result link. Recommended length is 150-160 characters.</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="keywords" className="font-bold">Focus Keywords (Optional)</Label>
                                <Input
                                    id="keywords"
                                    placeholder="e.g. cricket league, trials, sports"
                                    value={formData.keywords}
                                    onChange={handleChange}
                                />
                                <p className="text-xs text-muted-foreground">Comma separated keywords relevant to the page content.</p>
                            </div>

                            <div className="border-t pt-6 mt-6 space-y-4">
                                <h3 className="font-bold text-foreground">Open Graph (Social sharing)</h3>
                                <p className="text-xs text-muted-foreground">Override how this page appears when shared on Facebook, LinkedIn, etc. Leave blank to use the meta title and description above.</p>
                                <div className="space-y-2">
                                    <Label htmlFor="ogTitle" className="font-medium">OG Title (optional)</Label>
                                    <Input
                                        id="ogTitle"
                                        placeholder="Same as meta title if empty"
                                        value={formData.ogTitle}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="ogDescription" className="font-medium">OG Description (optional)</Label>
                                    <Textarea
                                        id="ogDescription"
                                        placeholder="Same as meta description if empty"
                                        value={formData.ogDescription}
                                        onChange={handleChange}
                                        rows={2}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="ogImage" className="font-medium">OG Image URL (optional)</Label>
                                    <Input
                                        id="ogImage"
                                        placeholder="Full URL e.g. https://yoursite.com/og-image.jpg"
                                        value={formData.ogImage}
                                        onChange={handleChange}
                                    />
                                    <p className="text-xs text-muted-foreground">Image shown when the page is shared. Use absolute URL. Recommended 1200×630 px.</p>
                                </div>
                            </div>

                            <div className="border-t pt-6 mt-6 space-y-4">
                                <h3 className="font-bold text-foreground">Per-page Script & Schema Tags</h3>
                                <div className="space-y-2">
                                    <Label htmlFor="customBodyScripts" className="font-medium">Custom Page Scripts & Schema (&lt;head&gt;)</Label>
                                    <CodeEditorWithHighlight
                                        id="customBodyScripts"
                                        value={formData.customBodyScripts}
                                        onChange={(val) => setFormData(prev => ({ ...prev, customBodyScripts: val }))}
                                        placeholder="Paste JSON-LD schema or script tags specifically for this page. They will be injected into the <head>."
                                        rows={6}
                                    />
                                </div>
                            </div>

                            <Button type="submit" disabled={isSaving} className="w-full sm:w-auto mt-4 px-8">
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Save SEO Settings
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
