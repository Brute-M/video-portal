
import React, { useState, useEffect } from 'react';
import api from '@/apihelper/api';
import { Trash2, Edit, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from "@/components/ui/use-toast";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

interface NavLink {
    _id: string;
    label: string;
    path: string;
    order: number;
    isActive: boolean;
    isExternal: boolean;
}

const AdminNavLinks = () => {
    const [navLinks, setNavLinks] = useState<NavLink[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentLink, setCurrentLink] = useState<Partial<NavLink>>({});
    const { toast } = useToast();
    const userRole = localStorage.getItem("userRole") || "user";

    useEffect(() => {
        fetchNavLinks();
    }, []);

    const fetchNavLinks = async () => {
        try {
            const response = await api.get('/nav-links');
            setNavLinks(response.data);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to fetch nav links",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            if (currentLink._id) {
                await api.put(`/ nav - links / ${currentLink._id} `, currentLink);
                toast({ title: "Success", description: "Nav link updated" });
            } else {
                await api.post('/nav-links', { ...currentLink, order: navLinks.length });
                toast({ title: "Success", description: "Nav link created" });
            }
            setIsDialogOpen(false);
            fetchNavLinks();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to save nav link",
                variant: "destructive",
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            await api.delete(`/ nav - links / ${id} `);
            toast({ title: "Success", description: "Nav link deleted" });
            fetchNavLinks();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete nav link",
                variant: "destructive",
            });
        }
    };

    const moveLink = async (index: number, direction: 'up' | 'down') => {
        const newLinks = [...navLinks];
        if (direction === 'up' && index > 0) {
            [newLinks[index], newLinks[index - 1]] = [newLinks[index - 1], newLinks[index]];
        } else if (direction === 'down' && index < newLinks.length - 1) {
            [newLinks[index], newLinks[index + 1]] = [newLinks[index + 1], newLinks[index]];
        } else {
            return;
        }

        // Optimistic update
        setNavLinks(newLinks);

        // Update orders in backend
        const orderUpdates = newLinks.map((link, idx) => ({ id: link._id, order: idx }));
        try {
            await api.post(`/ nav - links / reorder`, { orderUpdates });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to reorder links",
                variant: "destructive",
            });
            fetchNavLinks(); // Revert
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Manage Navigation Links</h1>
                <Button onClick={() => { setCurrentLink({}); setIsDialogOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" /> Add New Link
                </Button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]"></TableHead>
                            <TableHead>Label</TableHead>
                            <TableHead>Path</TableHead>
                            <TableHead>External</TableHead>
                            <TableHead>Active</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {navLinks.map((link, index) => (
                            <TableRow key={link._id}>
                                <TableCell>
                                    <div className="flex flex-col gap-1">
                                        <Button variant="ghost" size="sm" className="h-4 w-4 p-0" onClick={() => moveLink(index, 'up')} disabled={index === 0}>▲</Button>
                                        <Button variant="ghost" size="sm" className="h-4 w-4 p-0" onClick={() => moveLink(index, 'down')} disabled={index === navLinks.length - 1}>▼</Button>
                                    </div>
                                </TableCell>
                                <TableCell className="font-medium">{link.label}</TableCell>
                                <TableCell>{link.path}</TableCell>
                                <TableCell>{link.isExternal ? "Yes" : "No"}</TableCell>
                                <TableCell>{link.isActive ? <span className="text-green-600">Active</span> : <span className="text-red-600">Inactive</span>}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => { setCurrentLink(link); setIsDialogOpen(true); }}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    {userRole === 'admin' && (
                                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(link._id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                        {navLinks.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                    No navigation links found. Create one to get started.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{currentLink._id ? 'Edit Link' : 'Add New Link'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Label</label>
                            <Input
                                value={currentLink.label || ''}
                                onChange={(e) => setCurrentLink({ ...currentLink, label: e.target.value })}
                                placeholder="e.g. Home"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Path</label>
                            <Input
                                value={currentLink.path || ''}
                                onChange={(e) => setCurrentLink({ ...currentLink, path: e.target.value })}
                                placeholder="e.g. /home or https://google.com"
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="isExternal"
                                checked={currentLink.isExternal || false}
                                onCheckedChange={(checked) => setCurrentLink({ ...currentLink, isExternal: checked as boolean })}
                            />
                            <label htmlFor="isExternal" className="text-sm font-medium">External Link</label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="isActive"
                                checked={currentLink.isActive !== false} // Default to true
                                onCheckedChange={(checked) => setCurrentLink({ ...currentLink, isActive: checked as boolean })}
                            />
                            <label htmlFor="isActive" className="text-sm font-medium">Active</label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminNavLinks;
