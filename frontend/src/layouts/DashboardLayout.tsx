import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    Play,
    LogOut,
    LayoutDashboard,
    Video,
    Settings,
    Menu,
    X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ModeToggle } from "@/components/mode-toggle";

const DashboardLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const userEmail = localStorage.getItem("userEmail");

    const handleLogout = () => {
        toast({
            title: "Signed Out",
            description: "You've been successfully logged out.",
        });
        localStorage.removeItem("token");
        navigate("/auth");
    };

    const navItems = [
        { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
        { icon: Video, label: "My Videos", path: "/dashboard/videos" },
        { icon: Settings, label: "Settings", path: "/dashboard/settings" },
    ];

    return (
        <div className="min-h-screen bg-background flex">
            {/* Sidebar */}
            <aside
                className={`${isSidebarOpen ? "w-64" : "w-20"
                    } glass-card border-r border-border transition-all duration-300 flex flex-col fixed h-full z-20`}
            >
                <div className="p-6 flex items-center gap-2 border-b border-border/50">
                    <img src="/logo.png" alt="BRPL Logo" className="w-16 h-16 object-contain" />
                    {isSidebarOpen && (
                        <span className="text-lg font-display font-bold text-foreground">
                            BRPL
                        </span>
                    )}
                </div>

                <div className="flex-1 py-6 px-3">
                    <nav className="space-y-2">
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${location.pathname === item.path
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                                    }`}
                            >
                                <item.icon className="w-5 h-5 flex-shrink-0" />
                                {isSidebarOpen && <span>{item.label}</span>}
                            </Link>
                        ))}
                    </nav>
                </div>


            </aside>

            {/* Main Content */}
            <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? "ml-64" : "ml-20"}`}>
                {/* Header */}
                <header className="h-16 glass-card border-b border-border flex items-center justify-between px-6 sticky top-0 z-10 bg-background/80 backdrop-blur-md">
                    <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                        <Menu className="w-5 h-5" />
                    </Button>

                    <div className="flex items-center gap-4">
                        <ModeToggle />
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-foreground/80 hidden sm:block">
                                {userEmail || "user@example.com"}
                            </span>
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium">
                                {(userEmail ? userEmail[0].toUpperCase() : "U")}
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={handleLogout} title="Sign Out">
                            <LogOut className="w-5 h-5" />
                        </Button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
