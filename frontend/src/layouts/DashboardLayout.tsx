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
    // Initialize closed on mobile (less than 768px), open on desktop
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
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
        <div className="min-h-screen bg-background flex relative">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`${isSidebarOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0 md:w-20"
                    } glass-card border-r border-border transition-all duration-300 flex flex-col fixed h-full z-30 bg-background`}
            >
                <div className="p-6 flex items-center justify-between border-b border-border/50">
                    <div className="flex items-center gap-2">
                        <img src="/logo.png" alt="BRPL Logo" className="w-16 h-16 object-contain" />
                        {isSidebarOpen && (
                            <span className="text-lg font-display font-bold text-foreground">
                                BRPL
                            </span>
                        )}
                    </div>
                    {/* Mobile Close Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        <X className="w-5 h-5" />
                    </Button>
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
                                onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)}
                            >
                                <item.icon className="w-5 h-5 flex-shrink-0" />
                                {isSidebarOpen && <span>{item.label}</span>}
                            </Link>
                        ))}
                    </nav>
                </div>


            </aside>

            {/* Main Content */}
            <div className={`flex-1 flex flex-col transition-all duration-300 w-full ${isSidebarOpen ? "md:ml-64" : "md:ml-20"}`}>
                {/* Header */}
                <header className="h-16 glass-card border-b border-border flex items-center justify-between px-4 md:px-6 sticky top-0 z-10 bg-background/80 backdrop-blur-md">
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
                <main className="p-4 md:p-6 overflow-x-hidden">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
