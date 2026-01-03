import { useState, useEffect } from "react";
import { getAdminRecords, AdminRecord } from "@/apihelper/admin";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ChevronLeft, ChevronRight, Eye, Video, Download, FileSpreadsheet } from "lucide-react";
import { downloadUserInvoice, exportUsersExcel } from "@/apihelper/admin";

import { FilterBar } from "@/components/FilterBar";
import { UserDetailsDialog } from "@/components/UserDetailsDialog";

const RegisteredUsers = () => {
    const { toast } = useToast();
    const [users, setUsers] = useState<AdminRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [filters, setFilters] = useState<{ search: string, startDate?: Date, endDate?: Date }>({ search: '' });
    const [selectedUser, setSelectedUser] = useState<AdminRecord | null>(null);
    const limit = 10;

    useEffect(() => {
        fetchUsers();
    }, [page, filters]);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const response = await getAdminRecords(page, limit, filters.search, 'users', filters.startDate, filters.endDate);
            if (response && response.data) {
                setUsers(response.data.items);
                setTotalPages(response.data.pagination.pages);
                setTotalRecords(response.data.pagination.total);
            } else {
                setUsers([]);
                setTotalRecords(0);
            }
        } catch (error) {
            console.error("Failed to fetch users", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to fetch registered users.",
            });
            setUsers([]);
            setTotalRecords(0);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFilterChange = (newFilters: { search: string; startDate?: Date; endDate?: Date }) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
        setPage(1); // Reset to first page on filter change
    };

    const handleDownloadInvoice = async (userId: string, userName: string) => {
        try {
            const blob = await downloadUserInvoice(userId);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Invoice-${userName.replace(/\s+/g, '_')}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast({ title: "Success", description: "Invoice downloaded successfully." });
        } catch (error) {
            console.error("Download failed", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to download invoice." });
        }
    };

    const handleExport = async () => {
        try {
            toast({ description: "Generating export..." });
            // For now, type='users' is hardcoded in fetch logic, but endpoint logic handles filter
            // Check if we want to filter just "landing" etc. The request said "paid user and unpaid user landing page registered user"
            // The table shows all. So exporting all current filtered view is best.
            // But exportTypes supports 'paid'|'unpaid'|'landing'.
            // If the user hasn't selected a specific filter in UI (UI doesn't show type filter explicitly other than implicit 'users' list), we export all matches of search.

            const blob = await exportUsersExcel(filters.search, '', filters.startDate, filters.endDate);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Users_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast({ title: "Success", description: "Export downloaded successfully." });
        } catch (error) {
            console.error("Export failed", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to export users." });
        }
    };

    const handleViewUser = (user: AdminRecord) => {
        setSelectedUser(user);
    };

    const handlePrevPage = () => {
        if (page > 1) setPage(page - 1);
    };

    const handleNextPage = () => {
        if (page < totalPages) setPage(page + 1);
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-3xl font-display font-bold text-foreground">Registered Users</h1>
                <Button onClick={handleExport} variant="outline" className="gap-2">
                    <FileSpreadsheet className="w-4 h-4" />
                    Export Excel
                </Button>
            </div>

            <FilterBar onFilterChange={handleFilterChange} />

            <Card className="glass-card">
                <CardHeader>
                    <CardTitle className="text-lg flex justify-between items-center">
                        <span>All Registered Users (Landing Page)</span>
                        <span className="text-sm font-normal text-muted-foreground">Total: {totalRecords}</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8">Loading users...</div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>No.</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Mobile</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Payment ID</TableHead>
                                        <TableHead>Invoice</TableHead>
                                        <TableHead>Registered At</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                                                No users found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        users.map((user, index) => (
                                            <TableRow key={user._id}>
                                                <TableCell className="font-medium">{(page - 1) * limit + index + 1}</TableCell>
                                                <TableCell className="font-medium flex items-center gap-2">
                                                    {user.fname ? `${user.fname} ${user.lname || ''}` : user.name || 'N/A'}
                                                    {(user.trail_video || (user.videos && user.videos.length > 0)) && (
                                                        <Video className="w-4 h-4 text-primary" />
                                                    )}
                                                </TableCell>
                                                <TableCell>{user.email}</TableCell>
                                                <TableCell>{user.mobile || 'N/A'}</TableCell>
                                                <TableCell>
                                                    <Badge variant={user.isPaid ? 'default' : 'secondary'} className={user.isPaid ? 'bg-green-500 hover:bg-green-600' : 'bg-orange-500 hover:bg-orange-600 text-white'}>
                                                        {user.isPaid ? 'Paid' : 'Unpaid'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-mono text-xs text-muted-foreground">
                                                    {(user.lastPaymentId && user.lastPaymentId !== 'N/A') ? user.lastPaymentId : (user.paymentId || '-')}
                                                </TableCell>
                                                <TableCell>
                                                    {user.isPaid && (
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                            onClick={() => handleDownloadInvoice(user._id, user.fname || user.name || 'User')}
                                                            title="Download Invoice"
                                                        >
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(user.createdAt).toLocaleDateString('en-IN', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" onClick={() => handleViewUser(user)}>
                                                        <Eye className="w-4 h-4 mr-1" />
                                                        View
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>

                            {/* Pagination */}
                            <div className="flex items-center justify-end space-x-2 py-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handlePrevPage}
                                    disabled={page === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Previous
                                </Button>
                                <div className="text-sm text-muted-foreground">
                                    Page {page} of {totalPages}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleNextPage}
                                    disabled={page === totalPages}
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            <UserDetailsDialog
                user={selectedUser}
                open={!!selectedUser}
                onOpenChange={(open) => !open && setSelectedUser(null)}
            />
        </div>
    );
};

export default RegisteredUsers;
