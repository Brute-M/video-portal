import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
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
import { Loader2, Trash2, Upload, X } from "lucide-react";
import api from "@/apihelper/api";

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

const AdminTeams = () => {
    const { toast } = useToast();
    const [teams, setTeams] = useState<Team[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);

    // Form State
    const [name, setName] = useState("");
    const [order, setOrder] = useState(0);

    // File State
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    useEffect(() => {
        fetchTeams();
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
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(team._id)}
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
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
