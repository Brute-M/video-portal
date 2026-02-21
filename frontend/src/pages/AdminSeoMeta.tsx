import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAllSeoMeta, updateSeoMeta } from "@/apihelper/seo";
import { Loader2, Globe, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminSeoMeta() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Default predefined pages for the portal
    const PREDEFINED_PAGES = [
        { path: '/', name: 'Home' },
        { path: '/about-us', name: 'About Us' },
        { path: '/teams', name: 'Teams' },
        { path: '/events', name: 'Events' },
        { path: '/career', name: 'Career' },
        { path: '/partners', name: 'Partners' },
        { path: '/faqs', name: 'FAQs' },
        { path: '/registration', name: 'Registration' },
        { path: '/contact', name: 'Contact Us' },
        { path: '/login', name: 'Login' },
        { path: '/dashboard', name: 'User Dashboard' },
        { path: 'custom', name: '✨ Create Custom Route...' }
    ];

    const [selectedPage, setSelectedPage] = useState<string>("/");
    const [formData, setFormData] = useState({
        pagePath: "/",
        title: "",
        description: "",
        keywords: ""
    });

    const [savedMetas, setSavedMetas] = useState<any[]>([]);

    useEffect(() => {
        fetchMetas();
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
                keywords: ""
            });
            return;
        }

        const found = metas.find(m => m.pagePath === path);
        if (found) {
            setFormData({
                pagePath: path,
                title: found.title || "",
                description: found.description || "",
                keywords: found.keywords || ""
            });
        } else {
            setFormData({
                pagePath: path,
                title: "",
                description: "",
                keywords: ""
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

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-display font-bold text-foreground">Meta Content (SEO)</h1>
                    <p className="text-muted-foreground mt-1">Manage global page titles and descriptions for search engines.</p>
                </div>
                <Globe className="w-8 h-8 text-primary opacity-20" />
            </div>

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
