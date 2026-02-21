import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Shield } from "lucide-react";
import api from "@/apihelper/api";
import LegalPageEditor from "@/components/LegalPageEditor";

const KEY = "privacy_policy";

const AdminPrivacyPolicy = () => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [title, setTitle] = useState("Privacy Policy");
    const [content, setContent] = useState("");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const response = await api.get(`/api/cms/legal/${KEY}`);
            const data = response.data?.data;
            if (data) {
                setTitle(data.title || "Privacy Policy");
                setContent(data.content || "");
            }
        } catch (error) {
            console.error("Error fetching privacy policy:", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to load content." });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.put(`/api/cms/legal/${KEY}`, { title, content });
            toast({ title: "Success", description: "Privacy Policy updated successfully." });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to save." });
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
            <h1 className="text-3xl font-bold font-display mb-2">Privacy Policy</h1>
            <p className="text-muted-foreground mb-8">Edit the Privacy Policy page content. Changes will appear on the public site. Use links in the editor for internal pages (e.g. Terms & Conditions).</p>

            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5" /> Page Content
                        </CardTitle>
                        <CardDescription>Title and body shown on the Privacy Policy page. Toolbar: headers, bold, lists, link, color, align, code block. Use the HTML tab to edit or paste raw HTML.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <LegalPageEditor
                            title={title}
                            content={content}
                            onTitleChange={setTitle}
                            onContentChange={setContent}
                            placeholder="Privacy Policy"
                            editorMinHeight="400px"
                        />
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save Privacy Policy"
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
};

export default AdminPrivacyPolicy;
