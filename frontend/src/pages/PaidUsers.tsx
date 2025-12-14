import { useState, useEffect } from "react";
import { getUsers } from "@/apihelper/user";
import { useToast } from "@/hooks/use-toast";
import { UserTable } from "@/components/UserTable";
import { FilterBar } from "@/components/FilterBar";

const PaidUsers = () => {
    const { toast } = useToast();
    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchUsers({});
    }, []);

    const fetchUsers = async (filters: any) => {
        setIsLoading(true);
        try {
            const data = await getUsers('paid', filters);
            setUsers(data || []);
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
                    <span className="font-medium">{users.length} Records Found</span>
                </div>
            </div>

            <FilterBar onFilterChange={fetchUsers} />

            <UserTable users={users} isLoading={isLoading} type="paid" />
        </div>
    );
};

export default PaidUsers;
