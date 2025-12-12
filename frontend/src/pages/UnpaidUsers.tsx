import { useState, useEffect } from "react";
import { getUsers } from "@/apihelper/user";
import { useToast } from "@/hooks/use-toast";
import { UserTable } from "@/components/UserTable";
import { FilterBar } from "@/components/FilterBar";

const UnpaidUsers = () => {
    const { toast } = useToast();
    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchUsers({});
    }, []);

    const fetchUsers = async (filters: any) => {
        setIsLoading(true);
        try {
            const data = await getUsers('unpaid', filters);
            setUsers(data || []);
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

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-display font-bold text-foreground">Unpaid Users</h1>
                    <p className="text-muted-foreground mt-1">Users with pending payments or incomplete registrations.</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 text-orange-500 rounded-lg">
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                    <span className="font-medium">{users.length} Records Found</span>
                </div>
            </div>

            <FilterBar onFilterChange={fetchUsers} />

            <UserTable users={users} isLoading={isLoading} type="unpaid" />
        </div>
    );
};

export default UnpaidUsers;
