import { useState, useEffect } from "react";
import { getAdminRecords, AdminRecord } from "@/apihelper/admin";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { FilterBar } from "@/components/FilterBar";

const RegisteredUsers = () => {
    const { toast } = useToast();
    const [users, setUsers] = useState<AdminRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [filters, setFilters] = useState<{ search: string, startDate?: Date, endDate?: Date }>({ search: '' });
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

    const handlePrevPage = () => {
        if (page > 1) setPage(page - 1);
    };

    const handleNextPage = () => {
        if (page < totalPages) setPage(page + 1);
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <h1 className="text-3xl font-display font-bold text-foreground">Registered Users</h1>

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
                                        <TableHead>Registered At</TableHead>
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
                                                <TableCell>{user.fname ? `${user.fname} ${user.lname || ''}` : user.name || 'N/A'}</TableCell>
                                                <TableCell>{user.email}</TableCell>
                                                <TableCell>{user.mobile || 'N/A'}</TableCell>
                                                <TableCell>
                                                    {new Date(user.createdAt).toLocaleDateString('en-IN', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
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
        </div>
    );
};

export default RegisteredUsers;
