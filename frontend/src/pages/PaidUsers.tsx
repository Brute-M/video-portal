import { useState, useEffect } from "react";
import { getUsers } from "@/apihelper/user";
import { useToast } from "@/hooks/use-toast";
import { UserTable } from "@/components/UserTable";
import { FilterBar } from "@/components/FilterBar";

const PaidUsers = () => {
    const { toast } = useToast();
    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
<<<<<<< HEAD
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const limit = 10;

    useEffect(() => {
        fetchUsers({});
    }, [page]);
=======

    useEffect(() => {
        fetchUsers({});
    }, []);
>>>>>>> 8c09cfeefc9d939bac72912758e18842fc8583a8

    const fetchUsers = async (filters: any) => {
        setIsLoading(true);
        try {
<<<<<<< HEAD
            const data: any = await getUsers('paid', { ...filters, page, limit });
            // Handle both array (legacy/fallback) and paginated response
            if (data && data.items) {
                setUsers(data.items);
                setTotalPages(data.pagination.pages);
                setTotalRecords(data.pagination.total);
            } else if (Array.isArray(data)) {
                // Fallback if backend not updated immediately or error
                setUsers(data);
                setTotalRecords(data.length);
            } else {
                setUsers([]);
                setTotalRecords(0);
            }
=======
            const data = await getUsers('paid', filters);
            setUsers(data || []);
>>>>>>> 8c09cfeefc9d939bac72912758e18842fc8583a8
        } catch (error: any) {
            console.error("Failed to fetch paid users", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to fetch users.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-foreground">Paid Users</h1>
                    <p className="text-muted-foreground mt-1">Manage users who have completed payment.</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-500 rounded-lg self-start sm:self-auto">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
<<<<<<< HEAD
                    <span className="font-medium">{totalRecords} Records Found</span>
                </div>
            </div>

            <FilterBar onFilterChange={(filters) => { setPage(1); fetchUsers(filters); }} />

            <UserTable
                users={users}
                isLoading={isLoading}
                type="paid"
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
            />
=======
                    <span className="font-medium">{users.length} Records Found</span>
                </div>
            </div>

            <FilterBar onFilterChange={fetchUsers} />

            <UserTable users={users} isLoading={isLoading} type="paid" />
>>>>>>> 8c09cfeefc9d939bac72912758e18842fc8583a8
        </div>
    );
};

export default PaidUsers;
