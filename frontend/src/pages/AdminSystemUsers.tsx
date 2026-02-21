import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Loader2, Trash2 } from "lucide-react";
import api from "@/apihelper/api"; // Assuming default axios instance

const AdminSystemUsers = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<any[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const userRole = localStorage.getItem("userRole") || "user";

    const [formData, setFormData] = useState({
        email: "",
        password: "",
        role: "seo_content", // Default mostly used by subadmin
    });

    const fetchUsers = async () => {
        try {
            setLoadingUsers(true);
            const response = await api.get(`/admin/records?type=seo_content&limit=50`);
            if (response.data && response.data.data && response.data.data.items) {
                setUsers(response.data.data.items);
            }
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setLoadingUsers(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSelectChange = (val: string) => {
        setFormData({ ...formData, role: val });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await api.post("/auth/create-system-user", formData);

            if (response.data?.statusCode === 201) {
                toast({
                    title: "User Created",
                    description: `User ${formData.email} created with role ${formData.role}`
                });
                // Reset form
                setFormData({
                    email: "",
                    password: "",
                    role: userRole === 'subadmin' ? 'seo_content' : 'seo_content',
                });
                fetchUsers(); // Refresh list
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Creation Failed",
                description: error.response?.data?.data?.message || "Failed to create user"
            });
        } finally {
            setLoading(false);
        }
    };

    // If subadmin, only show SEO_CONTENT option or better yet, just hide the select and force it.
    const isSubAdmin = userRole === 'subadmin';

    return (
        <div className="container mx-auto py-8 max-w-2xl animate-fade-in">
            <h1 className="text-3xl font-display font-bold mb-6">Create System User</h1>

            <div className="space-y-8">
                {/* Form Section */}
                <div className="bg-card border rounded-xl p-6 shadow-sm">
                    <h2 className="text-xl font-semibold mb-4">New User Details</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" value={formData.email} onChange={handleChange} required placeholder="Enter email address" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" type="password" value={formData.password} onChange={handleChange} required placeholder="Enter password" />
                        </div>

                        {!isSubAdmin ? (
                            <div className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <Select value={formData.role} onValueChange={handleSelectChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="subadmin">Sub Admin</SelectItem>
                                        <SelectItem value="seo_content">SEO Content</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Label>Role</Label>
                                <Input value="SEO Content" disabled />
                                <p className="text-xs text-muted-foreground">Subadmins can only create SEO Content users.</p>
                            </div>
                        )}

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create User"}
                        </Button>
                    </form>
                </div>

                {/* List Section */}
                <div className="bg-card border rounded-xl p-6 shadow-sm flex flex-col">
                    <h2 className="text-xl font-semibold mb-4">Existing SEO Content Users</h2>
                    <div className="border rounded-md">
                        {loadingUsers ? (
                            <div className="flex justify-center items-center h-40">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead className="text-right">Created At</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.filter(u => u.role === 'seo_content').length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center text-muted-foreground h-24">
                                                No SEO Content users found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        users.filter(u => u.role === 'seo_content').map((user) => (
                                            <TableRow key={user._id}>
                                                <TableCell className="font-medium">{user.email}</TableCell>
                                                <TableCell>
                                                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                                        {user.role}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right text-xs text-muted-foreground">
                                                    {new Date(user.createdAt).toLocaleDateString()}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminSystemUsers;
