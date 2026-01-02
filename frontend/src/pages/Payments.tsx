import { useState, useEffect } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ChevronLeft, ChevronRight, Loader2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// We'll need to add this function to apihelper
const getPaymentsAPI = async (page = 1, search = "") => {
    const token = localStorage.getItem("token");
    const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/payments?page=${page}&limit=10&search=${search}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    return response.json();
};

const Payments = () => {
    const [payments, setPayments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState("");
    const { toast } = useToast();

    useEffect(() => {
        fetchPayments();
    }, [page, search]);

    const fetchPayments = async () => {
        setIsLoading(true);
        try {
            const response = await getPaymentsAPI(page, search);
            if (response.statusCode === 200) {
                setPayments(response.data.items);
                setTotalPages(response.data.pagination.pages);
            }
        } catch (error) {
            console.error("Failed to fetch payments", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to load payment records."
            });
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-display font-bold">Payments History</h1>
                <p className="text-muted-foreground mt-1">
                    Track all registration and video upload transactions
                </p>
            </div>

            <div className="flex items-center gap-4 glass-card p-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by Transaction ID, Status, or Type..."
                        className="pl-10"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="glass-card rounded-xl overflow-hidden">
                <Table>
                    <TableHeader className="bg-secondary/50">
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Transaction ID</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-64 text-center">
                                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                                </TableCell>
                            </TableRow>
                        ) : payments.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-64 text-center text-muted-foreground">
                                    No payment records found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            payments.map((payment) => (
                                <TableRow key={payment._id}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{payment.userId?.fname} {payment.userId?.lname}</span>
                                            <span className="text-xs text-muted-foreground">{payment.userId?.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={payment.type === 'registration' ? 'default' : 'secondary'}>
                                            {payment.type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">{payment.transactionId}</TableCell>
                                    <TableCell className="font-semibold">₹ {payment.amount}</TableCell>
                                    <TableCell>
                                        <Badge className={
                                            payment.status === 'completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                                payment.status === 'failed' ? 'bg-destructive/10 text-destructive' : 'bg-yellow-500/10 text-yellow-500'
                                        }>
                                            {payment.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {formatDate(payment.createdAt)}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                <div className="flex items-center justify-between px-6 py-4 border-t border-border/50">
                    <p className="text-sm text-muted-foreground">
                        Page {page} of {totalPages}
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page === 1}
                            onClick={() => setPage(prev => prev - 1)}
                        >
                            <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page === totalPages}
                            onClick={() => setPage(prev => prev + 1)}
                        >
                            Next <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Payments;
