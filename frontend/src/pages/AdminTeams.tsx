import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, Upload, X, ImageIcon, Video } from "lucide-react";
import api from "@/apihelper/api";
import { getImageUrl } from "@/utils/imageHelper";

interface Team {
    _id: string;
    name: string;
    logo: string;
    order: number;
}

const createTeam = async (formData: FormData) => {
    return api.post('/api/teams', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        }
    });
};

const updateTeam = async (id: string, formData: FormData) => {
    return api.put(`/api/teams/${id}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        }
    });
};

const getTeams = async () => {
    return api.get('/api/teams');
};

const deleteTeam = async (id: string) => {
    return api.delete(`/api/teams/${id}`);
};

const DEFAULT_TEAMS_VIDEO = "https://brpl-public-uploads.s3.ap-south-1.amazonaws.com/teams-video.mp4";

const AdminTeams = () => {
    const { toast } = useToast();
    const [teams, setTeams] = useState<Team[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const userRole = localStorage.getItem("userRole") || "user";

    // Form State
    const [name, setName] = useState("");
    const [order, setOrder] = useState(0);

    // File State
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    // Teams page banner & video (from site settings)
    const [teamsBannerImage, setTeamsBannerImage] = useState("");
    const [teamsVideoUrl, setTeamsVideoUrl] = useState("");
    const [teamsBannerSaving, setTeamsBannerSaving] = useState(false);
    const [teamsBannerUploading, setTeamsBannerUploading] = useState(false);

    useEffect(() => {
        fetchTeams();
        fetchTeamsBannerSettings();
        return () => {
            if (logoPreview && logoPreview.startsWith('blob:')) {
                URL.revokeObjectURL(logoPreview);
            }
        };
    }, []);

    const fetchTeams = async () => {
        setIsLoading(true);
        try {
            const response = await getTeams();
            setTeams(response.data);
        } catch (error) {
            console.error("Error fetching teams:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to fetch teams.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const fetchTeamsBannerSettings = async () => {
        try {
            const res = await api.get("/api/cms/site-settings");
            const data = res.data?.data;
            if (data) {
                setTeamsBannerImage(data.teamsBannerImage || "");
                setTeamsVideoUrl(data.teamsVideoUrl ?? DEFAULT_TEAMS_VIDEO);
            }
        } catch (e) {
            console.error("Error fetching teams banner settings:", e);
        }
    };

    const handleTeamsBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setTeamsBannerUploading(true);
        try {
            const formData = new FormData();
            formData.append("image", file);
            const res = await api.post("/api/cms/site-settings/upload-teams-banner-image", formData, {
                headers: { "Content-Type": undefined },
            });
            const path = res.data?.path;
            const url = res.data?.url;
            if (path) {
                setTeamsBannerImage(url || path);
                toast({ title: "Success", description: "Teams banner image updated." });
            }
        } catch (err) {
            toast({ variant: "destructive", title: "Error", description: "Failed to upload banner image." });
        } finally {
            setTeamsBannerUploading(false);
        }
    };

    const handleSaveTeamsBannerVideo = async () => {
        setTeamsBannerSaving(true);
        try {
            await api.put("/api/cms/site-settings", { teamsVideoUrl: teamsVideoUrl || "" });
            toast({ title: "Success", description: "Teams banner & video saved." });
        } catch (err) {
            toast({ variant: "destructive", title: "Error", description: "Failed to save." });
        } finally {
            setTeamsBannerSaving(false);
        }
    };

    const teamsBannerImageSrc = () => {
        if (!teamsBannerImage) return "";
        if (teamsBannerImage.startsWith("http") || teamsBannerImage.startsWith("blob:")) return teamsBannerImage;
        if (teamsBannerImage.startsWith("uploads/")) return getImageUrl(teamsBannerImage);
        if (teamsBannerImage.startsWith("/")) return teamsBannerImage;
        return getImageUrl(teamsBannerImage);
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const removeLogo = () => {
        setLogoFile(null);
        if (logoPreview && logoPreview.startsWith('blob:')) {
            URL.revokeObjectURL(logoPreview);
        }
        setLogoPreview(null);
    };

    const handleEdit = (team: Team) => {
        setEditId(team._id);
        setName(team.name);
        setOrder(team.order || 0);
        setLogoPreview(team.logo);
        setLogoFile(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditId(null);
        setName("");
        setOrder(0);
        removeLogo();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!editId && !logoFile) {
            toast({
                variant: "destructive",
                title: "Validation Error",
                description: "Please upload a logo.",
            });
            return;
        }

        setIsSubmitting(true);
        const formData = new FormData();
        formData.append("name", name);
        formData.append("order", order.toString());
        if (logoFile) {
            formData.append("logo", logoFile);
        } else if (logoPreview && !logoPreview.startsWith('blob:')) {
            // Keep existing logo URL if not changed
            formData.append("logo", logoPreview);
        }

        try {
            if (editId) {
                await updateTeam(editId, formData);
                toast({
                    title: "Success",
                    description: "Team updated successfully.",
                });
            } else {
                await createTeam(formData);
                toast({
                    title: "Success",
                    description: "Team created successfully.",
                });
            }

            handleCancelEdit();
            fetchTeams();
        } catch (error) {
            console.error("Error saving team:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: `Failed to ${editId ? 'update' : 'create'} team.`,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this team?")) return;

        try {
            await deleteTeam(id);
            toast({
                title: "Deleted",
                description: "Team deleted successfully.",
            });
            fetchTeams();
        } catch (error) {
            console.error("Error deleting team:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to delete team.",
            });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold font-display">Manage Teams</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ImageIcon className="w-5 h-5" /> Teams Page Banner & Video
                    </CardTitle>
                    <CardDescription>
                        Banner image and video shown at the top of the public Teams page. Video takes priority if both are set.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Banner Image</Label>
                        <div className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center min-h-[120px] bg-muted/30">
                            {teamsBannerImage ? (
                                <div className="relative w-full max-w-md">
                                    <img src={teamsBannerImageSrc()} alt="Teams banner" className="w-full h-auto max-h-40 object-cover rounded" loading="lazy" decoding="async" />
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">No banner image. Upload to show an image when no video URL is set.</p>
                            )}
                            <Label className="mt-2 cursor-pointer flex items-center gap-2 text-primary hover:underline">
                                <Upload className="w-4 h-4" />
                                {teamsBannerUploading ? "Uploading..." : "Upload banner image"}
                                <input type="file" accept="image/*" className="hidden" onChange={handleTeamsBannerUpload} disabled={teamsBannerUploading} />
                            </Label>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <Video className="w-4 h-4" /> Video URL
                        </Label>
                        <Input
                            value={teamsVideoUrl}
                            onChange={(e) => setTeamsVideoUrl(e.target.value)}
                            placeholder="https://example.com/teams-video.mp4"
                        />
                        <p className="text-xs text-muted-foreground">If set, the Teams page banner will show this video instead of the image.</p>
                    </div>
                    <Button type="button" onClick={handleSaveTeamsBannerVideo} disabled={teamsBannerSaving}>
                        {teamsBannerSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Save Teams Banner & Video
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{editId ? "Edit Team" : "Add New Team"}</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Team Name</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. North East Panthers"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="order">Display Order</Label>
                                <Input
                                    id="order"
                                    type="number"
                                    value={order}
                                    onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Team Logo</Label>
                            {!logoPreview ? (
                                <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors relative h-48 flex flex-col items-center justify-center">
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLogoChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <Upload className="w-10 h-10 text-gray-400 mb-2" />
                                    <p className="text-sm text-gray-500">Click to upload logo</p>
                                </div>
                            ) : (
                                <div className="relative rounded-lg overflow-hidden border border-gray-200 w-48 h-48 bg-gray-50 flex items-center justify-center">
                                    <img
                                        src={logoPreview}
                                        alt="Preview"
                                        className="max-w-full max-h-full object-contain"
                                        loading="lazy"
                                        decoding="async"
                                    />
                                    <button
                                        type="button"
                                        onClick={removeLogo}
                                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-4 mt-6">
                            <Button type="submit" disabled={isSubmitting} className="flex-1">
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {editId ? "Updating..." : "Creating..."}
                                    </>
                                ) : (
                                    editId ? "Update Team" : "Create Team"
                                )}
                            </Button>

                            {editId && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleCancelEdit}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                            )}
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Existing Teams</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Logo</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Order</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {teams.map((team) => (
                                    <TableRow key={team._id}>
                                        <TableCell>
                                            <img
                                                src={team.logo}
                                                alt={team.name}
                                                className="w-10 h-10 object-contain"
                                                loading="lazy"
                                                decoding="async"
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">{team.name}</TableCell>
                                        <TableCell>{team.order}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEdit(team)}
                                                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                                >
                                                    Edit
                                                </Button>
                                                {userRole === 'admin' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDelete(team._id)}
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {teams.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                            No teams found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminTeams;
