import { useState, useEffect } from "react";
import { getUsers } from "@/apihelper/user";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Users, UserCheck, UserX, TrendingUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { getAdminRecords, AdminRecord, getDashboardStats, getDashboardCharts } from "@/apihelper/admin";

const AdminDashboard = () => {
    const { toast } = useToast();
    const [stats, setStats] = useState({
        paidCount: 0,
        unpaidCount: 0,
        totalRevenue: 0,
    });
    // Simplified registration & revenue data for charts
    const [chartData, setChartData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [users, setUsers] = useState<AdminRecord[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);

    useEffect(() => {
        fetchStats();
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setIsLoadingUsers(true);
        try {
            const response = await getAdminRecords(1, 5, '', 'users');
            if (response && response.data && response.data.items) {
                setUsers(response.data.items);
            }
        } catch (error) {
            console.error("Failed to fetch users", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to fetch registered users.",
            });
        } finally {
            setIsLoadingUsers(false);
        }
    };

    const fetchStats = async () => {
        setIsLoading(true);
        try {
            const statsRes = await getDashboardStats();
            const chartsRes = await getDashboardCharts();

            if (statsRes && statsRes.data && statsRes.data.stats) {
                setStats({
                    paidCount: statsRes.data.stats.paidCount,
                    unpaidCount: statsRes.data.stats.unpaidCount,
                    totalRevenue: statsRes.data.stats.totalRevenue,
                });
            }

            if (chartsRes && chartsRes.data) {
                setChartData(chartsRes.data);
            }

        } catch (error: any) {
            console.error("Failed to fetch stats", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to fetch dashboard stats.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <h1 className="text-3xl font-display font-bold text-foreground">Admin Overview</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="glass-card hover:border-primary/50 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-display">
                            {isLoading ? "..." : stats.paidCount + stats.unpaidCount}
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card hover:border-green-500/50 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Paid Users</CardTitle>
                        <UserCheck className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-display text-green-500">
                            {isLoading ? "..." : stats.paidCount}
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card hover:border-orange-500/50 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Unpaid Users</CardTitle>
                        <UserX className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-display text-orange-500">
                            {isLoading ? "..." : stats.unpaidCount}
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card hover:border-blue-500/50 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                        <TrendingUp className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-display text-foreground">
                            {isLoading ? "..." : `₹ ${stats.totalRevenue.toLocaleString()}`}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle className="text-lg">User Registration Trend</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area type="monotone" dataKey="users" stroke="#8884d8" fillOpacity={1} fill="url(#colorUsers)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle className="text-lg">Revenue Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="revenue" fill="#4CAF50" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Registered Users Table */}
            <Card className="glass-card">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Recent Registered Users (Landing Page)</CardTitle>
                    <Button variant="outline" size="sm" asChild>
                        <Link to="/admin/registered-users">View All</Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    {isLoadingUsers ? (
                        <div className="text-center py-4">Loading users...</div>
                    ) : (
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
                                            <TableCell className="font-medium">{index + 1}</TableCell>
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
                    )}
                </CardContent>
            </Card>

        </div>
    );
};

export default AdminDashboard;

