
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
import { Loader2, Pencil, Trash2, X, ShieldCheck, ShieldX } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import api from "@/apihelper/api";

const AdminSettings = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<any[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const userRole = localStorage.getItem("userRole") || "user";

    // Creation Form State
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        role: "subadmin",
    });

    // Edit State
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editData, setEditData] = useState({
        userId: "",
        email: "",
        role: "",
        password: "" // Optional
    });

    // Delete State
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [deleteId, setDeleteId] = useState("");

    const fetchUsers = async () => {
        try {
            setLoadingUsers(true);
            // Fetch both subadmin and seo_content
            const response = await api.get(`/admin/records?type=system&limit=100`);
            if (response.data && response.data.data && response.data.data.items) {
                let fetchedUsers = response.data.data.items;
                // If subadmin, only show seo_content users
                if (userRole === 'subadmin') {
                    fetchedUsers = fetchedUsers.filter((u: any) => u.role === 'seo_content');
                }
                setUsers(fetchedUsers);
            }
        } catch (error) {
            console.error("Failed to fetch system users", error);
        } finally {
            setLoadingUsers(false);
        }
    };

    useEffect(() => {
        // Set default role for subadmin
        if (userRole === 'subadmin') {
            setFormData(prev => ({ ...prev, role: 'seo_content' }));
        }
        fetchUsers();
    }, [userRole]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSelectChange = (val: string) => {
        // Subadmins can only create seo_content users
        if (userRole === 'subadmin' && val !== 'seo_content') {
            toast({
                variant: "destructive",
                title: "Permission Denied",
                description: "Subadmins can only create 'SEO Content' users."
            });
            return;
        }
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
                setFormData({
                    email: "",
                    password: "",
                    role: userRole === 'subadmin' ? "seo_content" : "subadmin",
                });
                fetchUsers();
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

    // Edit Handlers
    const handleEditClick = (user: any) => {
        // Subadmins can only edit seo_content users
        if (userRole === 'subadmin' && user.role !== 'seo_content') {
            toast({
                variant: "destructive",
                title: "Permission Denied",
                description: "Subadmins can only edit 'SEO Content' users."
            });
            return;
        }
        setEditData({
            userId: user._id,
            email: user.email,
            role: user.role,
            password: ""
        });
        setIsEditOpen(true);
    };

    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditData({ ...editData, [e.target.id]: e.target.value });
    };

    const handleEditRoleChange = (val: string) => {
        // Subadmins can only change role to seo_content
        if (userRole === 'subadmin' && val !== 'seo_content') {
            toast({
                variant: "destructive",
                title: "Permission Denied",
                description: "Subadmins can only set role to 'SEO Content'."
            });
            return;
        }
        setEditData({ ...editData, role: val });
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload: any = {
                userId: editData.userId,
                email: editData.email,
                role: editData.role
            };
            if (editData.password) {
                payload.password = editData.password;
            }

            const response = await api.put("/auth/update-system-user", payload);

            if (response.data?.statusCode === 200) {
                toast({
                    title: "User Updated",
                    description: "System user updated successfully"
                });
                setIsEditOpen(false);
                fetchUsers();
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: error.response?.data?.data?.message || "Failed to update user"
            });
        } finally {
            setLoading(false);
        }
    };

    // Delete Handlers
    const confirmDelete = (id: string) => {
        setDeleteId(id);
        setIsDeleteOpen(true);
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setLoading(true);
        try {
            await api.delete(`/auth/delete-system-user/${deleteId}`);

            toast({ title: "User Deleted", description: "System user deleted successfully" });
            fetchUsers();
            setIsDeleteOpen(false);

        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Delete Failed",
                description: error.response?.data?.data?.message || error.response?.data?.message || "Failed to delete user"
            });
        } finally {
            setLoading(false);
            setDeleteId("");
        }
    };

    const handleToggle2FA = async (userId: string, action: 'enable' | 'disable') => {
        setLoading(true);
        try {
            const response = await api.put(`/auth/toggle-2fa/${userId}`, { action });
            if (response.data?.statusCode === 200) {
                toast({
                    title: `MFA ${action === 'enable' ? 'Enabled' : 'Disabled'}`,
                    description: `Successfully ${action}d MFA for user.`,
                });
                fetchUsers();
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Failed",
                description: error.response?.data?.data?.message || `Failed to ${action} MFA.`,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto py-8 max-w-5xl animate-fade-in">
            <h1 className="text-3xl font-display font-bold mb-6">System Settings & User Management</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Create Form */}
                <div className="lg:col-span-1 bg-card border rounded-xl p-6 shadow-sm h-fit">
                    <h2 className="text-xl font-semibold mb-4">Create New User</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" value={formData.email} onChange={handleChange} required placeholder="user@example.com" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" type="password" value={formData.password} onChange={handleChange} required placeholder="••••••••" />
                        </div>

                        {userRole === 'admin' ? (
                            <div className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <Select value={formData.role} onValueChange={handleSelectChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="subadmin">Sub Admin</SelectItem>
                                        <SelectItem value="seo_content">SEO Content</SelectItem>
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

                {/* Users List */}
                <div className="lg:col-span-2 bg-card border rounded-xl p-6 shadow-sm flex flex-col h-[600px]">
                    <h2 className="text-xl font-semibold mb-4">System Users (Subadmin & SEO Content)</h2>
                    <div className="border rounded-md flex-1 overflow-hidden flex flex-col">
                        <div className="overflow-auto">
                            <Table>
                                <TableHeader className="sticky top-0 bg-secondary">
                                    <TableRow>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>MFA</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loadingUsers ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center">
                                                <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                                            </TableCell>
                                        </TableRow>
                                    ) : users.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                                No system users found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        users.map((user) => (
                                            <TableRow key={user._id}>
                                                <TableCell className="font-medium">{user.email}</TableCell>
                                                <TableCell>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${user.role === 'subadmin' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                                        }`}>
                                                        {user.role === 'seo_content' ? 'SEO CONTENT' : user.role.toUpperCase()}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${user.twoFaEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                                                        {user.twoFaEnabled ? 'Enabled' : 'Disabled'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {new Date(user.createdAt).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {(userRole === 'admin' || (userRole === 'subadmin' && user.role === 'seo_content')) && (
                                                            <>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleToggle2FA(user._id, user.twoFaEnabled ? 'disable' : 'enable')}
                                                                    title={user.twoFaEnabled ? "Disable MFA" : "Enable MFA"}
                                                                >
                                                                    {user.twoFaEnabled ? <ShieldCheck className="h-4 w-4 text-green-500" /> : <ShieldX className="h-4 w-4 text-red-400" />}
                                                                </Button>
                                                                <Button variant="ghost" size="sm" onClick={() => handleEditClick(user)} title="Edit">
                                                                    <Pencil className="h-4 w-4 text-blue-500" />
                                                                </Button>
                                                            </>
                                                        )}
                                                        {userRole === 'admin' && (
                                                            <Button variant="ghost" size="sm" onClick={() => confirmDelete(user._id)}>
                                                                <Trash2 className="h-4 w-4 text-red-500" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Dialog */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Delete</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this user? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Delete"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Modal */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit System User</DialogTitle>
                        <DialogDescription>Update user details. Leave password blank to keep current password.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdate} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={editData.email}
                                onChange={handleEditChange}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                            <Select value={editData.role} onValueChange={handleEditRoleChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="subadmin">Sub Admin</SelectItem>
                                    <SelectItem value="seo_content">SEO Content</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">New Password (Optional)</Label>
                            <Input
                                id="password"
                                type="password"
                                value={editData.password}
                                onChange={handleEditChange}
                                placeholder="Leave blank to keep current"
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Update User"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminSettings;
