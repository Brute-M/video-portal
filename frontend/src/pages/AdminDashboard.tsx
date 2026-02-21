import { useState, useEffect } from "react";
import { getUsers } from "@/apihelper/user";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
    Users, UserCheck, UserX, TrendingUp,
    Briefcase,
    QrCode,
    HelpCircle,
    Info,
    Share2,
    ImageIcon,
    FileText,
    LayoutDashboard,
    Shield
} from "lucide-react";
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

    const userRole = localStorage.getItem("userRole") || "user";
    const formattedRole = userRole === 'seo_content' ? 'SEO CONTENT' : userRole.toUpperCase();

    useEffect(() => {
        if (userRole !== 'seo_content') {
            fetchStats();
            fetchUsers();
        } else {
            setIsLoadingUsers(false);
            setIsLoading(false);
        }
    }, [userRole]);

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

    const isSuperAdmin = userRole === 'admin';
    const isSeoContent = userRole === 'seo_content';

    if (isSeoContent) {
        const seoModules = [
            { title: "Home Page CMS", icon: LayoutDashboard, path: "/admin/cms/banners", color: "bg-yellow-100 text-yellow-600", border: "border-yellow-500/50", desc: "Manage banners and Who We Are section." },
            { title: "About Us CMS", icon: Info, path: "/admin/about-us/about-brpl", color: "bg-rose-100 text-rose-600", border: "border-rose-500/50", desc: "Edit About Us page content & team." },
            { title: "Manage FAQs", icon: HelpCircle, path: "/admin/faqs", color: "bg-orange-100 text-orange-600", border: "border-orange-500/50", desc: "Add or update frequently asked questions." },
            { title: "Manage Jobs", icon: Briefcase, path: "/admin/jobs", color: "bg-green-100 text-green-600", border: "border-green-500/50", desc: "Update and post new career opportunities." },
            { title: "QR Campaigns", icon: QrCode, path: "/admin/campaigns", color: "bg-indigo-100 text-indigo-600", border: "border-indigo-500/50", desc: "Handle QR code marketing campaigns." },
            { title: "Ambassadors", icon: Users, path: "/admin/ambassadors", color: "bg-purple-100 text-purple-600", border: "border-purple-500/50", desc: "Manage brand ambassadors." },
            { title: "Teams", icon: Users, path: "/admin/teams", color: "bg-pink-100 text-pink-600", border: "border-pink-500/50", desc: "Update team members and profiles." },
            { title: "Partners", icon: Users, path: "/admin/partners", color: "bg-teal-100 text-teal-600", border: "border-teal-500/50", desc: "Manage partner logos and details." },
            { title: "Social & Contact", icon: Share2, path: "/admin/social-contact", color: "bg-blue-100 text-blue-600", border: "border-blue-500/50", desc: "Update social media links & contacts." },
            { title: "Page Banner", icon: ImageIcon, path: "/admin/page-banner", color: "bg-cyan-100 text-cyan-600", border: "border-cyan-500/50", desc: "Update banners for inner pages." },
            { title: "Privacy Policy", icon: Shield, path: "/admin/privacy-policy", color: "bg-slate-100 text-slate-600", border: "border-slate-500/50", desc: "Update privacy guidelines." },
            { title: "Terms & Conditions", icon: FileText, path: "/admin/terms-conditions", color: "bg-gray-100 text-gray-600", border: "border-gray-500/50", desc: "Update terms of service." }
        ];

        return (
            <div className="space-y-8 animate-fade-in pb-10">
                <div className="bg-gradient-to-r from-emerald-900 to-teal-800 p-8 rounded-2xl text-white shadow-xl">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-4xl font-display font-bold mb-2">Content Manager Dashboard</h1>
                            <p className="text-emerald-100/80">Manage the website's content, campaigns, and structural information.</p>
                        </div>
                        <div className="flex flex-col items-end hidden md:flex">
                            <span className="px-4 py-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-sm font-bold tracking-wider mb-2 flex items-center gap-2">
                                <Shield className="w-4 h-4" />
                                {formattedRole}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
                    {seoModules.map((module, index) => (
                        <Card key={index} className={`glass-card hover:${module.border} hover:shadow-lg transition-all transform hover:-translate-y-1 overflow-hidden group`}>
                            <Link to={module.path} className="block w-full h-full">
                                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                                    <div className={`p-3 rounded-xl mr-4 ${module.color} group-hover:scale-110 transition-transform`}>
                                        <module.icon className="h-6 w-6" />
                                    </div>
                                    <CardTitle className="text-lg font-bold font-display leading-tight">{module.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground mt-2">{module.desc}</p>
                                    <div className="mt-4 flex items-center text-sm font-medium text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                        Manage Content <TrendingUp className="ml-1 h-4 w-4" />
                                    </div>
                                </CardContent>
                            </Link>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    if (isSuperAdmin) {
        return (
            <div className="space-y-8 animate-fade-in pb-10">
                {/* Super Admin Header */}
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-8 rounded-2xl text-white shadow-xl">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-4xl font-display font-bold mb-2">Super Admin Control Center</h1>
                            <p className="text-gray-400">Welcome back. You have full system access.</p>
                        </div>
                        <div className="hidden md:block">
                            <span className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full text-sm font-bold tracking-wider">
                                SYSTEM MASTER
                            </span>
                        </div>
                    </div>
                </div>

                {/* Quick Actions (Admin Only) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Link to="/admin/system-users" className="p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all flex items-center gap-3 group">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <Users className="w-5 h-5" />
                        </div>
                        <span className="font-medium text-gray-700">Manage System Users</span>
                    </Link>
                    <Link to="/admin/campaigns" className="p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all flex items-center gap-3 group">
                        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition-colors">
                            <Users className="w-5 h-5" />
                        </div>
                        <span className="font-medium text-gray-700">QR Campaigns</span>
                    </Link>
                    <Link to="/admin/jobs" className="p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all flex items-center gap-3 group">
                        <div className="p-2 bg-green-100 text-green-600 rounded-lg group-hover:bg-green-600 group-hover:text-white transition-colors">
                            <Users className="w-5 h-5" />
                        </div>
                        <span className="font-medium text-gray-700">Manage Jobs</span>
                    </Link>
                    <Link to="/admin/partners" className="p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all flex items-center gap-3 group">
                        <div className="p-2 bg-orange-100 text-orange-600 rounded-lg group-hover:bg-orange-600 group-hover:text-white transition-colors">
                            <Users className="w-5 h-5" />
                        </div>
                        <span className="font-medium text-gray-700">Partner Requests</span>
                    </Link>
                </div>

                {/* Admin Stats Grid - More prominent */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="glass-card bg-gradient-to-br from-white to-gray-50 border-t-4 border-t-primary shadow-sm hover:shadow-md transition-all">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Users</p>
                                    <h3 className="text-3xl font-bold mt-2 text-gray-900">{isLoading ? "..." : (stats.paidCount + stats.unpaidCount).toLocaleString()}</h3>
                                </div>
                                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                    <Users className="h-5 w-5" />
                                </div>
                            </div>
                        </CardHeader>
                    </Card>

                    <Card className="glass-card bg-gradient-to-br from-white to-green-50/50 border-t-4 border-t-green-500 shadow-sm hover:shadow-md transition-all">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Paid Members</p>
                                    <h3 className="text-3xl font-bold mt-2 text-green-600">{isLoading ? "..." : stats.paidCount.toLocaleString()}</h3>
                                </div>
                                <div className="p-2 bg-green-100 rounded-lg text-green-600">
                                    <UserCheck className="h-5 w-5" />
                                </div>
                            </div>
                        </CardHeader>
                    </Card>

                    <Card className="glass-card bg-gradient-to-br from-white to-orange-50/50 border-t-4 border-t-orange-500 shadow-sm hover:shadow-md transition-all">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pending / Unpaid</p>
                                    <h3 className="text-3xl font-bold mt-2 text-orange-600">{isLoading ? "..." : stats.unpaidCount.toLocaleString()}</h3>
                                </div>
                                <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                                    <UserX className="h-5 w-5" />
                                </div>
                            </div>
                        </CardHeader>
                    </Card>

                    <Card className="glass-card bg-gradient-to-br from-white to-blue-50/50 border-t-4 border-t-blue-500 shadow-sm hover:shadow-md transition-all">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Revenue</p>
                                    <h3 className="text-3xl font-bold mt-2 text-blue-700">{isLoading ? "..." : `₹ ${stats.totalRevenue.toLocaleString()}`}</h3>
                                </div>
                                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                    <TrendingUp className="h-5 w-5" />
                                </div>
                            </div>
                        </CardHeader>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Charts taking up 2 columns */}
                    <div className="lg:col-span-2 space-y-8">
                        <Card className="shadow-lg border-0">
                            <CardHeader>
                                <CardTitle className="text-lg font-bold text-gray-800">Growth Analytics</CardTitle>
                            </CardHeader>
                            <CardContent className="h-[350px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorUsersAdmin" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#0f172a" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#0f172a" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                        <YAxis axisLine={false} tickLine={false} />
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <Tooltip />
                                        <Area type="monotone" dataKey="users" stroke="#0f172a" strokeWidth={3} fillOpacity={1} fill="url(#colorUsersAdmin)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card className="shadow-lg border-0">
                            <CardHeader>
                                <CardTitle className="text-lg font-bold text-gray-800">Revenue Stream</CardTitle>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData}>
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                        <YAxis axisLine={false} tickLine={false} />
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <Tooltip cursor={{ fill: 'transparent' }} />
                                        <Bar dataKey="revenue" fill="#4CAF50" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Users Sidebar List */}
                    <div className="lg:col-span-1">
                        <Card className="h-full shadow-lg border-0 flex flex-col">
                            <CardHeader className="bg-gray-50 border-b border-gray-100">
                                <CardTitle className="text-lg font-bold text-gray-800">New Registrations</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 flex-1 overflow-auto max-h-[700px]">
                                <div className="divide-y divide-gray-100">
                                    {users.slice(0, 8).map((user, i) => (
                                        <div key={user._id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                                                    {user.fname ? user.fname[0].toUpperCase() : 'U'}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm text-gray-900">{user.fname} {user.lname}</p>
                                                    <p className="text-xs text-gray-500">{user.email}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="block text-xs text-gray-400">
                                                    {new Date(user.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                    {users.length === 0 && <div className="p-8 text-center text-gray-500">No recent users</div>}
                                </div>
                            </CardContent>
                            <div className="p-4 border-t border-gray-100 bg-gray-50">
                                <Button variant="outline" className="w-full" asChild>
                                    <Link to="/admin/registered-users">View All Users</Link>
                                </Button>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    // Default Layout (Subadmin, etc.)
    return (
        <div className="space-y-8 animate-fade-in pb-10">
            {/* Header */}
            <div className={`bg-gradient-to-r ${userRole === 'subadmin' ? 'from-blue-900 to-indigo-800' : 'from-slate-800 to-gray-800'} p-8 rounded-2xl text-white shadow-xl`}>
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-display font-bold mb-2">
                            {userRole === 'subadmin' ? "Subadmin Portal" : "Dashboard Overview"}
                        </h1>
                        <p className="text-blue-100/80">Monitor user registrations, payments, and system metrics in real-time.</p>
                    </div>
                    <div className="hidden md:flex flex-col items-end">
                        <span className={`px-4 py-2 border rounded-full text-sm font-bold tracking-wider flex items-center gap-2 ${userRole === 'subadmin' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : 'bg-gray-500/20 text-gray-300 border-gray-500/30'}`}>
                            <Shield className="w-4 h-4" />
                            {formattedRole}
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="glass-card bg-gradient-to-br from-white to-gray-50 border-t-4 border-t-primary shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Users</p>
                                <h3 className="text-3xl font-bold mt-2 text-gray-900">{isLoading ? "..." : (stats.paidCount + stats.unpaidCount).toLocaleString()}</h3>
                            </div>
                            <div className="p-3 bg-primary/10 rounded-xl text-primary group-hover:scale-110 transition-transform duration-300">
                                <Users className="h-6 w-6" />
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                <Card className="glass-card bg-gradient-to-br from-white to-green-50/50 border-t-4 border-t-green-500 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Paid Users</p>
                                <h3 className="text-3xl font-bold mt-2 text-green-600">{isLoading ? "..." : stats.paidCount.toLocaleString()}</h3>
                            </div>
                            <div className="p-3 bg-green-100 rounded-xl text-green-600 group-hover:scale-110 transition-transform duration-300">
                                <UserCheck className="h-6 w-6" />
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                <Card className="glass-card bg-gradient-to-br from-white to-orange-50/50 border-t-4 border-t-orange-500 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Unpaid Users</p>
                                <h3 className="text-3xl font-bold mt-2 text-orange-600">{isLoading ? "..." : stats.unpaidCount.toLocaleString()}</h3>
                            </div>
                            <div className="p-3 bg-orange-100 rounded-xl text-orange-600 group-hover:scale-110 transition-transform duration-300">
                                <UserX className="h-6 w-6" />
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                <Card className="glass-card bg-gradient-to-br from-white to-blue-50/50 border-t-4 border-t-blue-500 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Revenue</p>
                                <h3 className="text-3xl font-bold mt-2 text-blue-700">{isLoading ? "..." : `₹ ${stats.totalRevenue.toLocaleString()}`}</h3>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-xl text-blue-600 group-hover:scale-110 transition-transform duration-300">
                                <TrendingUp className="h-6 w-6" />
                            </div>
                        </div>
                    </CardHeader>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="shadow-lg border-0 hover:shadow-xl transition-all duration-300">
                    <CardHeader className="bg-gray-50 border-b border-gray-100 rounded-t-xl">
                        <CardTitle className="text-lg font-bold text-gray-800">User Registration Trend</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[350px] w-full pt-6">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorUsersSub" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorUsersSub)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="shadow-lg border-0 hover:shadow-xl transition-all duration-300">
                    <CardHeader className="bg-gray-50 border-b border-gray-100 rounded-t-xl">
                        <CardTitle className="text-lg font-bold text-gray-800">Revenue Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[350px] w-full pt-6">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <Tooltip
                                    cursor={{ fill: 'rgba(74, 222, 128, 0.1)' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="revenue" fill="#22c55e" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Registered Users Table - Now visible for everyone since permission is fixed */}
            <Card className="shadow-lg border-0 hover:shadow-xl transition-all duration-300">
                <CardHeader className="bg-gray-50 border-b border-gray-100 rounded-t-xl flex flex-row items-center justify-between pb-4">
                    <CardTitle className="text-lg font-bold text-gray-800">Recent Registered Users (Landing Page)</CardTitle>
                    <Button variant="outline" size="sm" asChild className="hover:bg-blue-50 hover:text-blue-600 transition-colors">
                        <Link to="/admin/registered-users">View All</Link>
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoadingUsers ? (
                        <div className="text-center py-8 text-gray-500 animate-pulse">Loading users...</div>
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

