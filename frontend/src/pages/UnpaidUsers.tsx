import { useState, useEffect } from "react";
import { getUsers } from "@/apihelper/user";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { UserTable } from "@/components/UserTable";
import { FilterBar } from "@/components/FilterBar";
import { exportUsersExcel } from "@/apihelper/admin";
import { FileSpreadsheet } from "lucide-react";

const UnpaidUsers = () => {
    const { toast } = useToast();
    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [currentFilters, setCurrentFilters] = useState<{ search?: string; startDate?: Date; endDate?: Date }>({});
    const limit = 10;

    useEffect(() => {
        fetchUsers({});
    }, [page]);

    const fetchUsers = async (filters: any) => {
        setIsLoading(true);
        try {
            const data: any = await getUsers('unpaid', { ...filters, page, limit });
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
        } catch (error: any) {
            console.error("Failed to fetch unpaid users", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to fetch users.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            toast({ description: "Generating export..." });
            const blob = await exportUsersExcel(currentFilters.search, 'unpaid', currentFilters.startDate, currentFilters.endDate);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Unpaid_Users_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
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

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-foreground">Unpaid Users</h1>
                    <p className="text-muted-foreground mt-1">Users with pending payments or incomplete registrations.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={handleExport} variant="outline" className="gap-2">
                        <FileSpreadsheet className="w-4 h-4" />
                        Export Excel
                    </Button>
                    <div className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 text-orange-500 rounded-lg self-start sm:self-auto h-10">
                        <span className="w-2 h-2 rounded-full bg-orange-500" />
                        <span className="font-medium whitespace-nowrap">{totalRecords} Records Found</span>
                    </div>
                </div>
            </div>

            <FilterBar onFilterChange={(filters) => {
                setPage(1);
                setCurrentFilters(filters);
                fetchUsers(filters);
            }} />

            <UserTable
                users={users}
                isLoading={isLoading}
                type="unpaid"
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                onRefresh={() => fetchUsers(currentFilters)}
            />
        </div>
    );
};

export default UnpaidUsers;
