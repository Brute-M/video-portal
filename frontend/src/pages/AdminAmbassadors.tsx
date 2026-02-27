import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; // Assuming Textarea component exists
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

interface Ambassador {
    _id: string;
    name: string;
    designation: string;
    description: string;
    image: string;
    order: number;
}

const createAmbassador = async (formData: FormData) => {
    return api.post('/api/ambassadors', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        }
    });
};

const updateAmbassador = async (id: string, formData: FormData) => {
    return api.put(`/api/ambassadors/${id}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        }
    });
};

const getAmbassadors = async () => {
    return api.get('/api/ambassadors');
};

const deleteAmbassador = async (id: string) => {
    return api.delete(`/api/ambassadors/${id}`);
};

const AdminAmbassadors = () => {
    const { toast } = useToast();
    const [ambassadors, setAmbassadors] = useState<Ambassador[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const userRole = localStorage.getItem("userRole") || "user";

    // Form State
    const [name, setName] = useState("");
    const [designation, setDesignation] = useState("");
    const [description, setDescription] = useState("");
    const [order, setOrder] = useState(0);

    // File State
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    useEffect(() => {
        fetchAmbassadors();
        return () => {
            if (imagePreview && imagePreview.startsWith('blob:')) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, []);

    const fetchAmbassadors = async () => {
        setIsLoading(true);
        try {
            const response = await getAmbassadors();
            setAmbassadors(response.data);
        } catch (error) {
            console.error("Error fetching ambassadors:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to fetch ambassadors.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const removeImage = () => {
        setImageFile(null);
        if (imagePreview && imagePreview.startsWith('blob:')) {
            URL.revokeObjectURL(imagePreview);
        }
        setImagePreview(null);
    };

    const handleEdit = (ambassador: Ambassador) => {
        setEditId(ambassador._id);
        setName(ambassador.name);
        setDesignation(ambassador.designation);
        setDescription(ambassador.description || "");
        setOrder(ambassador.order || 0);
        setImagePreview(ambassador.image);
        setImageFile(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditId(null);
        setName("");
        setDesignation("");
        setDescription("");
        setOrder(0);
        removeImage();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!editId && !imageFile) {
            toast({
                variant: "destructive",
                title: "Validation Error",
                description: "Please upload an image.",
            });
            return;
        }

        setIsSubmitting(true);
        const formData = new FormData();
        formData.append("name", name);
        formData.append("designation", designation);
        formData.append("description", description);
        formData.append("order", order.toString());
        if (imageFile) {
            formData.append("image", imageFile);
        } else if (imagePreview && !imagePreview.startsWith('blob:')) {
            // Keep existing image URL if not changed
            formData.append("image", imagePreview);
        }

        try {
            if (editId) {
                await updateAmbassador(editId, formData);
                toast({
                    title: "Success",
                    description: "Ambassador updated successfully.",
                });
            } else {
                await createAmbassador(formData);
                toast({
                    title: "Success",
                    description: "Ambassador created successfully.",
                });
            }

            handleCancelEdit();
            fetchAmbassadors();
        } catch (error) {
            console.error("Error saving ambassador:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: `Failed to ${editId ? 'update' : 'create'} ambassador.`,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this ambassador?")) return;

        try {
            await deleteAmbassador(id);
            toast({
                title: "Deleted",
                description: "Ambassador deleted successfully.",
            });
            fetchAmbassadors();
        } catch (error) {
            console.error("Error deleting ambassador:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to delete ambassador.",
            });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold font-display">Manage Ambassadors</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{editId ? "Edit Ambassador" : "Add New Ambassador"}</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. John Doe"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="designation">Designation</Label>
                                <Input
                                    id="designation"
                                    value={designation}
                                    onChange={(e) => setDesignation(e.target.value)}
                                    placeholder="e.g. Former Cricketer"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description (Bio)</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Enter detailed description..."
                                className="min-h-[100px]"
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

                        <div className="space-y-2">
                            <Label>Image</Label>
                            {!imagePreview ? (
                                <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors relative h-48 flex flex-col items-center justify-center">
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <Upload className="w-10 h-10 text-gray-400 mb-2" />
                                    <p className="text-sm text-gray-500">Click to upload image</p>
                                </div>
                            ) : (
                                <div className="relative rounded-lg overflow-hidden border border-gray-200 w-48 h-48 bg-gray-50">
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                        decoding="async"
                                    />
                                    <button
                                        type="button"
                                        onClick={removeImage}
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
                                    editId ? "Update Ambassador" : "Create Ambassador"
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
                    <CardTitle>Existing Ambassadors</CardTitle>
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
                                    <TableHead>Image</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Designation</TableHead>
                                    <TableHead>Order</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {ambassadors.map((ambassador) => (
                                    <TableRow key={ambassador._id}>
                                        <TableCell>
                                            <img
                                                src={ambassador.image}
                                                alt={ambassador.name}
                                                className="w-10 h-10 object-cover rounded-full"
                                                loading="lazy"
                                                decoding="async"
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">{ambassador.name}</TableCell>
                                        <TableCell>{ambassador.designation}</TableCell>
                                        <TableCell>{ambassador.order}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEdit(ambassador)}
                                                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                                >
                                                    Edit
                                                </Button>
                                                {userRole === 'admin' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDelete(ambassador._id)}
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {ambassadors.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            No ambassadors found.
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

export default AdminAmbassadors;
