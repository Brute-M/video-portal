import React, { useState, useMemo, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    LogOut,
    LayoutDashboard,
    Video,
    Settings,
    Menu,
    X,
    User,
    HelpCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ModeToggle } from "@/components/mode-toggle";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { TourProvider, useTour } from "@reactour/tour";

type Step = { selector: string; content: string; position: "top" | "right" | "bottom" | "left" };

const DASHBOARD_TOUR_STORAGE_KEY = "brpl_dashboard_tour_done";

/** Tour steps: welcome then each sidebar menu item with guide text */
function getTourSteps(t: (key: string) => string): Step[] {
    return [
        { selector: "[data-tour=\"welcome\"]", content: t("tour_welcome"), position: "bottom" },
        { selector: "[data-tour=\"nav-dashboard\"]", content: t("tour_nav_dashboard"), position: "right" },
        { selector: "[data-tour=\"nav-videos\"]", content: t("tour_nav_videos"), position: "right" },
        { selector: "[data-tour=\"nav-profile\"]", content: t("tour_nav_profile"), position: "right" },
        { selector: "[data-tour=\"nav-settings\"]", content: t("tour_nav_settings"), position: "right" },
    ];
}

function openTourWhenWelcomeReady(setTourOpen: (open: boolean) => void) {
    const openWhenReady = (attempts = 0) => {
        const maxAttempts = 50;
        const el = document.querySelector("[data-tour=\"welcome\"]");
        if (el) {
            setTourOpen(true);
            return;
        }
        if (attempts < maxAttempts) {
            setTimeout(() => openWhenReady(attempts + 1), 100);
        }
    };
    setTimeout(() => openWhenReady(), 400);
}

function DashboardLayoutInner() {
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();
    const { t } = useTranslation();
    const { setIsOpen: setTourOpen } = useTour();

    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
    const userEmail = localStorage.getItem("userEmail");
    const isOnDashboard = location.pathname.startsWith("/dashboard");

    const handleStartTour = () => {
        if (location.pathname !== "/dashboard") {
            navigate("/dashboard");
        }
        openTourWhenWelcomeReady(setTourOpen);
    };

    // Auto-start tour once after login when user lands on dashboard and hasn't completed/skipped it before
    useEffect(() => {
        if (location.pathname !== "/dashboard") return;
        if (localStorage.getItem(DASHBOARD_TOUR_STORAGE_KEY) === "true") return;
        openTourWhenWelcomeReady(setTourOpen);
    }, [location.pathname, setTourOpen]);

    const handleLogout = () => {
        toast({
            title: t("signed_out"),
            description: t("signed_out_desc"),
        });
        localStorage.removeItem("token");
        navigate("/auth");
    };

    const navItems = [
        { icon: LayoutDashboard, label: t("dashboard"), path: "/dashboard", tourId: "nav-dashboard" },
        { icon: Video, label: t("my_videos"), path: "/dashboard/videos", tourId: "nav-videos" },
        { icon: User, label: "My Profile", path: "/dashboard/profile", tourId: "nav-profile" },
        { icon: Settings, label: t("settings"), path: "/dashboard/settings", tourId: "nav-settings" },
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
                data-tour="sidebar"
                className={`${isSidebarOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0 md:w-20"
                    } glass-card border-r border-border transition-all duration-300 flex flex-col fixed h-full z-30 bg-background`}
            >
                <div className="p-6 flex items-center justify-between border-b border-border/50">
                    <div className="flex items-center gap-2">
                        <img src="/logo.png" alt="BRPL Logo" className="w-16 h-16 object-contain" loading="lazy" decoding="async" />
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
                                data-tour={item.tourId}
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
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                            <Menu className="w-5 h-5" />
                        </Button>
                        <div className="hidden md:block">
                            <LanguageSwitcher />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {isOnDashboard && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleStartTour}
                                className="gap-2 shrink-0"
                                title={t("take_tour")}
                            >
                                <HelpCircle className="w-4 h-4" />
                                <span className="hidden sm:inline">{t("take_tour")}</span>
                            </Button>
                        )}
                        <div className="md:hidden">
                            <LanguageSwitcher />
                        </div>
                        <ModeToggle />
                        <Link to="/dashboard/profile" className="flex items-center gap-2 hover:bg-secondary/50 p-2 rounded-lg transition-colors cursor-pointer text-decoration-none">
                            <span className="text-sm text-foreground/80 hidden sm:block">
                                {userEmail || "user@example.com"}
                            </span>
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium">
                                {(userEmail ? userEmail[0].toUpperCase() : "U")}
                            </div>
                        </Link>
                        <Button variant="ghost" size="icon" onClick={handleLogout} title={t("sign_out")}>
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
}

const TourWrapper = ({ children }: { children: React.ReactNode }) => (
    <div style={{ position: "fixed", inset: 0, zIndex: 99999 }}>{children}</div>
);

const DashboardLayout = () => {
    const { t } = useTranslation();
    const steps = useMemo(() => getTourSteps(t), [t]);

    return (
        <TourProvider
            steps={steps}
            showCloseButton
            showBadge
            showNavigation
            showPrevNextButtons
            scrollSmooth
            Wrapper={TourWrapper}
            beforeClose={() => {
                try {
                    localStorage.setItem(DASHBOARD_TOUR_STORAGE_KEY, "true");
                } catch {
                    // ignore
                }
            }}
            styles={{
                popover: (base: React.CSSProperties) => ({
                    ...base,
                    borderRadius: "12px",
                    padding: "1rem 1.25rem",
                    maxWidth: "320px",
                }),
                close: (base: React.CSSProperties) => ({
                    ...base,
                    top: 8,
                    right: 8,
                }),
            }}
            className="reactour-popover-dashboard"
        >
            <DashboardLayoutInner />
        </TourProvider>
    );
};

export default DashboardLayout;
