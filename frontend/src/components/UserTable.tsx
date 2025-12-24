import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface User {
    _id: string;
    fname: string;
    lname: string;
    email: string;
    playerRole?: string;
    videoCount: number;
    createdAt: string;
    lastPaymentId?: string;
    isPaid: boolean;
}

interface UserTableProps {
    users: User[];
    isLoading: boolean;
    type: 'paid' | 'unpaid';
}

export const UserTable = ({ users, isLoading, type }: UserTableProps) => {
    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Loading users...</div>;
    }

    if (users.length === 0) {
        return <div className="p-8 text-center text-muted-foreground">No users found.</div>;
    }

    return (
        <div className="rounded-md border glass-card overflow-x-auto">
            <Table>
                <TableHeader className="bg-muted/50">
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Videos</TableHead>
                        <TableHead>Joined</TableHead>
                        {type === 'paid' && <TableHead>Payment ID</TableHead>}
                        <TableHead>Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map((user) => (
                        <TableRow key={user._id} className="hover:bg-muted/30 transition-colors">
                            <TableCell className="font-medium">{user.fname} {user.lname}</TableCell>
                            <TableCell className="text-muted-foreground">{user.email}</TableCell>
                            <TableCell>
                                <Badge variant="outline" className="bg-primary/5">
                                    {user.playerRole || 'Player'}
                                </Badge>
                            </TableCell>
                            <TableCell className="font-mono">{user.videoCount || 0}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                                {new Date(user.createdAt).toLocaleDateString()}
                            </TableCell>
                            {type === 'paid' && (
                                <TableCell className="font-mono text-xs text-muted-foreground">
                                    {user.lastPaymentId !== 'N/A' ? user.lastPaymentId : '-'}
                                </TableCell>
                            )}
                            <TableCell>
                                <Badge variant={type === 'paid' ? 'default' : 'secondary'} className={type === 'paid' ? 'bg-green-500 hover:bg-green-600' : 'bg-orange-500 hover:bg-orange-600 text-white'}>
                                    {type === 'paid' ? 'Active' : 'Unpaid'}
                                </Badge>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};
