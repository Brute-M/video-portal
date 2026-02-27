import React, { useState, useEffect } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Trash, Edit, Loader2, Upload, X, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import api from "@/apihelper/api";
import { getImageUrl } from "@/utils/imageHelper";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const NEWS_FEATURED_IMAGE_MAX_MB = 10;
const NEWS_FEATURED_IMAGE_MAX_BYTES = NEWS_FEATURED_IMAGE_MAX_MB * 1024 * 1024;

function slugify(text: string) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^\w\-]+/g, "")
        .replace(/\-\-+/g, "-")
        .replace(/^-+/, "")
        .replace(/-+$/, "");
}

interface NewsPost {
    _id: string;
    title: string;
    slug: string;
    metaTitle: string;
    metaDescription: string;
    featuredImage: string;
    content: string;
    enableSchema: boolean;
    isPublished: boolean;
    createdAt: string;
    updatedAt: string;
}

const AdminNews = () => {
    const [posts, setPosts] = useState<NewsPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({
        title: "",
        slug: "",
        metaTitle: "",
        metaDescription: "",
        content: "",
        enableSchema: true,
        isPublished: true,
    });
    const [featuredFile, setFeaturedFile] = useState<File | null>(null);
    const [featuredPreview, setFeaturedPreview] = useState<string | null>(null);
    const [existingFeatured, setExistingFeatured] = useState<string | null>(null);

    const fetchPosts = async () => {
        setIsLoading(true);
        try {
            const res = await api.get("/api/news/admin/list");
            if (res.data?.success && Array.isArray(res.data.data)) {
                setPosts(res.data.data);
            }
        } catch (e) {
            console.error(e);
            toast.error("Failed to load news");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    useEffect(() => {
        if (form.title && !editingId) {
            setForm((f) => ({ ...f, slug: slugify(f.title) }));
        }
    }, [form.title, editingId]);

    const resetForm = () => {
        setForm({
            title: "",
            slug: "",
            metaTitle: "",
            metaDescription: "",
            content: "",
            enableSchema: true,
            isPublished: true,
        });
        setFeaturedFile(null);
        setFeaturedPreview(null);
        setExistingFeatured(null);
        setEditingId(null);
    };

    const handleFeaturedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > NEWS_FEATURED_IMAGE_MAX_BYTES) {
            toast.error(`Image is too large. Maximum size is ${NEWS_FEATURED_IMAGE_MAX_MB} MB.`);
            e.target.value = "";
            return;
        }
        if (featuredPreview?.startsWith("blob:")) URL.revokeObjectURL(featuredPreview);
        setFeaturedFile(file);
        setFeaturedPreview(URL.createObjectURL(file));
        setExistingFeatured(null);
    };

    const removeFeatured = () => {
        if (featuredPreview?.startsWith("blob:")) URL.revokeObjectURL(featuredPreview);
        setFeaturedFile(null);
        setFeaturedPreview(null);
        setExistingFeatured(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title.trim()) {
            toast.error("Title is required");
            return;
        }
        if (featuredFile && featuredFile.size > NEWS_FEATURED_IMAGE_MAX_BYTES) {
            toast.error(`Image is too large. Maximum size is ${NEWS_FEATURED_IMAGE_MAX_MB} MB.`);
            return;
        }
        setIsSubmitting(true);
        try {
            const fd = new FormData();
            fd.append("title", form.title);
            fd.append("slug", form.slug || slugify(form.title));
            fd.append("metaTitle", form.metaTitle);
            fd.append("metaDescription", form.metaDescription);
            fd.append("content", form.content);
            fd.append("enableSchema", String(form.enableSchema));
            fd.append("isPublished", String(form.isPublished));
            if (featuredFile) fd.append("featuredImage", featuredFile);

            if (editingId) {
                await api.put(`/api/news/admin/${editingId}`, fd, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                toast.success("News updated");
            } else {
                await api.post("/api/news/admin/create", fd, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                toast.success("News created");
            }
            resetForm();
            fetchPosts();
        } catch (err: any) {
            const msg = err.response?.data?.message || "Failed to save news";
            toast.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const openEdit = (post: NewsPost) => {
        setEditingId(post._id);
        setForm({
            title: post.title,
            slug: post.slug,
            metaTitle: post.metaTitle || "",
            metaDescription: post.metaDescription || "",
            content: post.content || "",
            enableSchema: post.enableSchema !== false,
            isPublished: post.isPublished !== false,
        });
        setFeaturedFile(null);
        setFeaturedPreview(null);
        setExistingFeatured(post.featuredImage || null);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this news item?")) return;
        try {
            await api.delete(`/api/news/admin/${id}`);
            toast.success("News deleted");
            fetchPosts();
            if (editingId === id) resetForm();
        } catch {
            toast.error("Failed to delete");
        }
    };

    const featuredDisplayUrl = featuredPreview || (existingFeatured && (existingFeatured.startsWith("http") ? existingFeatured : getImageUrl(existingFeatured))) || null;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">News</h1>
                    <p className="text-muted-foreground mt-1">Manage news articles for the News section.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{editingId ? "Edit News" : "New News"}</CardTitle>
                    <CardDescription>Title, slug, meta, featured image, content, and Article schema toggle.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title *</Label>
                                <Input
                                    id="title"
                                    value={form.title}
                                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                                    placeholder="News title"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="slug">Slug (URL)</Label>
                                <Input
                                    id="slug"
                                    value={form.slug}
                                    onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                                    placeholder="url-friendly-slug"
                                />
                                <p className="text-xs text-muted-foreground">Used in /news/:slug. Leave blank to auto-generate from title.</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="metaTitle">Meta Title (SEO)</Label>
                            <Input
                                id="metaTitle"
                                value={form.metaTitle}
                                onChange={(e) => setForm((f) => ({ ...f, metaTitle: e.target.value }))}
                                placeholder="SEO title for search engines"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="metaDescription">Meta Description (SEO)</Label>
                            <Input
                                id="metaDescription"
                                value={form.metaDescription}
                                onChange={(e) => setForm((f) => ({ ...f, metaDescription: e.target.value }))}
                                placeholder="Short description for search results"
                                className="min-h-[60px]"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Featured Image</Label>
                            <p className="text-xs text-muted-foreground mb-1">Max size: {NEWS_FEATURED_IMAGE_MAX_MB} MB. JPG, PNG or WebP recommended.</p>
                            <div className="flex items-center gap-4 flex-wrap">
                                <Label className="cursor-pointer flex items-center gap-2 text-primary hover:underline">
                                    <Upload className="w-4 h-4" />
                                    Upload image (max {NEWS_FEATURED_IMAGE_MAX_MB} MB)
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleFeaturedChange}
                                    />
                                </Label>
                                {(featuredDisplayUrl || featuredFile) && (
                                    <Button type="button" variant="ghost" size="sm" onClick={removeFeatured}>
                                        <X className="w-4 h-4 mr-1" /> Remove
                                    </Button>
                                )}
                            </div>
                            {featuredDisplayUrl && (
                                <div className="mt-2 relative w-48 h-28 rounded-lg overflow-hidden border bg-muted">
                                    <img
                                        src={featuredDisplayUrl}
                                        alt="Featured"
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                        decoding="async"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Content</Label>
                            <div className="border rounded-md overflow-hidden">
                                <ReactQuill
                                    theme="snow"
                                    value={form.content}
                                    onChange={(value) => setForm((f) => ({ ...f, content: value }))}
                                    className="min-h-[200px]"
                                    modules={{
                                        toolbar: [
                                            [{ header: [1, 2, 3, false] }],
                                            ["bold", "italic", "underline", "strike"],
                                            [{ list: "ordered" }, { list: "bullet" }],
                                            ["link"],
                                            ["clean"],
                                        ],
                                    }}
                                />
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-6">
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="enableSchema"
                                    checked={form.enableSchema}
                                    onCheckedChange={(c) => setForm((f) => ({ ...f, enableSchema: c }))}
                                />
                                <Label htmlFor="enableSchema">Output Article schema (JSON-LD) for SEO</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="isPublished"
                                    checked={form.isPublished}
                                    onCheckedChange={(c) => setForm((f) => ({ ...f, isPublished: c }))}
                                />
                                <Label htmlFor="isPublished">Published (visible on /news)</Label>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                {editingId ? "Update News" : "Create News"}
                            </Button>
                            {editingId && (
                                <Button type="button" variant="outline" onClick={resetForm}>
                                    Cancel
                                </Button>
                            )}
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>All News</CardTitle>
                    <CardDescription>Edit or delete existing news items.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : posts.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No news yet. Create one above.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">Image</TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Slug</TableHead>
                                    <TableHead>Schema</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {posts.map((post) => (
                                    <TableRow key={post._id}>
                                        <TableCell>
                                            <div className="w-12 h-10 rounded overflow-hidden bg-muted">
                                                {post.featuredImage ? (
                                                    <img
                                                        src={post.featuredImage.startsWith("http") ? post.featuredImage : getImageUrl(post.featuredImage)}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                        loading="lazy"
                                                        decoding="async"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <ImageIcon className="w-4 h-4 text-muted-foreground" />
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">{post.title}</TableCell>
                                        <TableCell className="text-muted-foreground font-mono text-sm">{post.slug}</TableCell>
                                        <TableCell>{post.enableSchema ? "Yes" : "No"}</TableCell>
                                        <TableCell>{post.isPublished ? "Published" : "Draft"}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" onClick={() => openEdit(post)}>
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(post._id)}>
                                                <Trash className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminNews;
