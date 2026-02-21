import { useState, useEffect } from "react";
import api from "@/apihelper/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Pencil, Trash2, Upload, X } from "lucide-react";
import { getImageUrl } from "@/utils/imageHelper";

interface TeamMember {
    _id: string;
    name: string;
    role: string;
    bio: string;
    image: string;
    order: number;
}

const AdminMeetOurTeam = () => {
    const { toast } = useToast();
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [currentId, setCurrentId] = useState<string | null>(null);
    const [name, setName] = useState("");
    const [role, setRole] = useState("");
    const [bio, setBio] = useState("");
    const [order, setOrder] = useState(0);
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [existingImage, setExistingImage] = useState<string | null>(null);

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        try {
            const response = await api.get('/api/cms/our-team');
            setMembers(response.data.data);
        } catch (error) {
            console.error("Error fetching team:", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to load team members." });
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
        }
    };

    const removeFile = () => {
        setFile(null);
        if (preview) URL.revokeObjectURL(preview);
        setPreview(null);
    };

    const resetForm = () => {
        setCurrentId(null);
        setName("");
        setRole("");
        setBio("");
        setOrder(0);
        setFile(null);
        setPreview(null);
        setExistingImage(null);
    };

    const handleEdit = async (member: TeamMember) => {
        setCurrentId(member._id);
        setName(member.name);
        setRole(member.role);
        setBio(member.bio || "");
        setOrder(member.order || 0);
        setExistingImage(member.image || null);
        setIsDialogOpen(true);
        // Refetch member to ensure we have latest image URL from server
        try {
            const response = await api.get(`/api/cms/our-team/${member._id}`);
            const fresh = response.data?.data;
            if (fresh?.image !== undefined) setExistingImage(fresh.image || null);
        } catch {
            // keep form data from list if refetch fails
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this member?")) return;
        try {
            await api.delete(`/api/cms/our-team/${id}`);
            setMembers(members.filter(m => m._id !== id));
            toast({ title: "Success", description: "Member deleted successfully." });
        } catch (error) {
            console.error("Error deleting member:", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to delete member." });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData();
        formData.append("name", name);
        formData.append("role", role);
        formData.append("bio", bio);
        formData.append("order", order.toString());
        if (file) {
            formData.append("image", file);
        }

        try {
            if (currentId) {
                // Update
                const response = await api.put(`/api/cms/our-team/${currentId}`, formData, {
                    headers: {
                        "Content-Type": undefined,
                    },
                });
                setMembers(members.map(m => m._id === currentId ? response.data.data : m));
                toast({ title: "Success", description: "Member updated successfully." });
            } else {
                // Create
                const response = await api.post('/api/cms/our-team', formData, {
                    headers: {
                        "Content-Type": undefined,
                    },
                });
                setMembers([...members, response.data.data]);
                toast({ title: "Success", description: "Member added successfully." });
            }
            setIsDialogOpen(false);
            resetForm();
        } catch (error) {
            console.error("Error saving member:", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to save member." });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-8 animate-fade-in max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold font-display">Manage Team Members</h1>
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) resetForm();
                }}>
                    <DialogTrigger asChild>
                        <Button onClick={resetForm}>
                            <Plus className="w-4 h-4 mr-2" /> Add Member
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{currentId ? "Edit Member" : "Add New Member"}</DialogTitle>
                            <DialogDescription>
                                Add or update details for the "Meet Our Team" section.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                            {/* Image Upload */}
                            <div className="space-y-2">
                                <Label>Profile Photo</Label>
                                <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 flex flex-col items-center justify-center relative bg-gray-50 h-[200px]">
                                    {preview || (existingImage && existingImage.trim()) ? (
                                        <div className="relative h-full w-auto max-w-full rounded overflow-hidden">
                                            <img
                                                src={preview || (existingImage ? getImageUrl(existingImage) : "") || ""}
                                                alt="Preview"
                                                className="h-full w-auto object-contain"
                                            />
                                            {preview && (
                                                <button
                                                    type="button"
                                                    onClick={removeFile}
                                                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                            <p className="text-sm text-muted-foreground">Upload Photo</p>
                                        </div>
                                    )}
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. John Doe" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="role">Role/Designation</Label>
                                    <Input id="role" value={role} onChange={(e) => setRole(e.target.value)} required placeholder="e.g. CEO" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bio">Bio</Label>
                                <Textarea
                                    id="bio"
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    rows={5}
                                    placeholder="Short bio shown on hover..."
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="order">Display Order</Label>
                                <Input
                                    id="order"
                                    type="number"
                                    value={order}
                                    onChange={(e) => setOrder(parseInt(e.target.value))}
                                    placeholder="0"
                                />
                                <p className="text-xs text-muted-foreground">Lower numbers appear first.</p>
                            </div>

                            <DialogFooter>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        "Save Member"
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">Order</TableHead>
                            <TableHead className="w-[100px]">Image</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead className="hidden md:table-cell">Bio Preview</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                </TableCell>
                            </TableRow>
                        ) : members.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No team members found. Add one to get started.
                                </TableCell>
                            </TableRow>
                        ) : (
                            members.map((member) => (
                                <TableRow key={member._id}>
                                    <TableCell>{member.order}</TableCell>
                                    <TableCell>
                                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100">
                                            {member.image ? (
                                                <img src={getImageUrl(member.image)} alt={member.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Img</div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium">{member.name}</TableCell>
                                    <TableCell>{member.role}</TableCell>
                                    <TableCell className="hidden md:table-cell max-w-xs truncate text-muted-foreground">
                                        {member.bio}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(member)}>
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(member._id)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default AdminMeetOurTeam;
