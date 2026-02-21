import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    LogOut,
    Menu,
    Users,
    Settings,
    UserCheck,
    UserX,
    LayoutDashboard,
    CreditCard,
    X,
    Briefcase,
    Link as LinkIcon,
    QrCode,
    HelpCircle,
    Shield,
    BookOpen as HelperIcon,
    ChevronDown,
    ChevronRight,
    Info,
    Share2,
    ImageIcon,
    FileText
} from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { ModeToggle } from "@/components/mode-toggle";

const AdminLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();
    // Initialize closed on mobile (less than 768px), open on desktop
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
    const userEmail = localStorage.getItem("userEmail") || "admin@brpl.com";
    const userRole = localStorage.getItem("userRole") || "user";

    const handleLogout = () => {
        toast({
            title: "Signed Out",
            description: "Logged out successfully.",
        });
        localStorage.removeItem("token");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("userRole");
        navigate("/auth");
    };

    const allNavItems = [
        { icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" },
        { icon: UserCheck, label: "Paid Users", path: "/admin/paid-users" },
        { icon: UserX, label: "Unpaid Users", path: "/admin/unpaid-users" },
        // { icon: Users, label: "Coupon Usage", path: "/admin/coupon-usage" },
        { icon: Users, label: "Registered Users", path: "/admin/registered-users" },
        { icon: CreditCard, label: "Events", path: "/admin/events" },
        { icon: Briefcase, label: "Manage Jobs", path: "/admin/jobs" },
        { icon: Users, label: "Ambassadors", path: "/admin/ambassadors" },
        { icon: Users, label: "Teams", path: "/admin/teams" },
        { icon: Users, label: "Partners", path: "/admin/partners" },
        {
            icon: HelperIcon,
            label: "Home Page",
            path: "#",
            children: [
                { label: "Banners", path: "/admin/cms/banners" },
                { label: "Who We Are", path: "/admin/cms/who-we-are" }
            ]
        },
        {
            icon: Info,
            label: "About Us",
            path: "#",
            children: [
                { label: "Banner", path: "/admin/about-us/banner" },
                { label: "About BRPL", path: "/admin/about-us/about-brpl" },
                { label: "Mission & Vision", path: "/admin/about-us/mission-vision" },
                { label: "Meet Our Team", path: "/admin/about-us/meet-our-team" }
            ]
        },
        { icon: QrCode, label: "QR Campaigns", path: "/admin/campaigns" },
        { icon: HelpCircle, label: "Manage FAQs", path: "/admin/faqs" },
        { icon: Share2, label: "Social & Contact", path: "/admin/social-contact" },
        { icon: ImageIcon, label: "Page Banner", path: "/admin/page-banner" },
        { icon: Shield, label: "Privacy Policy", path: "/admin/privacy-policy" },
        { icon: FileText, label: "Terms & Conditions", path: "/admin/terms-conditions" },
        { icon: FileText, label: "Meta Content", path: "/admin/meta-content" },
        { icon: Settings, label: "Settings", path: "/admin/settings" },
        // { icon: LinkIcon, label: "Nav Links", path: "/admin/nav-links" },
        // { icon: Users, label: "Step 1 Leads", path: "/admin/step1-leads" },
    ];

    // Define allowed paths for roles
    const getFilteredNavItems = () => {
        // Admins and Subadmins get everything (including CMS)
        if (userRole === 'admin' || userRole === 'subadmin') return allNavItems;

        // Paths allowed for seo_content
        const commonAllowed = [
            "/admin/dashboard",
            "/admin/faqs",
            "/admin/teams",
            "/admin/campaigns",
            "/admin/ambassadors",
            "/admin/jobs",
            "/admin/partners"
        ];

        if (userRole === 'seo_content') {
            return allNavItems.filter(item =>
                commonAllowed.includes(item.path) || item.label === "Meta Content" || item.label === "Home Page" || item.label === "About Us" || item.label === "Social & Contact" || item.label === "Page Banner" || item.label === "Privacy Policy" || item.label === "Terms & Conditions"
            );
        }

        // Default or other roles
        return [];
    };

    const navItems = getFilteredNavItems();

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
                                BRPL Admin
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

                <div className="flex-1 py-6 px-3 overflow-y-auto">
                    <nav className="space-y-1">
                        {navItems.map((item) => (
                            <div key={item.label}>
                                {item.children ? (
                                    <div className="space-y-1">
                                        <button
                                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-muted-foreground hover:bg-secondary hover:text-foreground`}
                                            onClick={(e) => {
                                                const next = e.currentTarget.nextElementSibling;
                                                next?.classList.toggle('hidden');
                                                e.currentTarget.querySelector('.chevron')?.classList.toggle('rotate-90');
                                            }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <item.icon className="w-5 h-5 flex-shrink-0" />
                                                {isSidebarOpen && <span>{item.label}</span>}
                                            </div>
                                            {isSidebarOpen && <ChevronRight className="w-4 h-4 chevron transition-transform" />}
                                        </button>
                                        <div className="hidden pl-10 space-y-1">
                                            {item.children.map(child => (
                                                <Link
                                                    key={child.path}
                                                    to={child.path}
                                                    className={`block px-3 py-2 rounded-lg text-sm transition-colors ${location.pathname === child.path
                                                        ? "bg-primary/10 text-primary"
                                                        : "text-muted-foreground hover:text-foreground"
                                                        }`}
                                                >
                                                    {child.label}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <Link
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
                                )}
                            </div>
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
                                {userEmail}
                            </span>
                            <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 font-medium">
                                A
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

export default AdminLayout;
