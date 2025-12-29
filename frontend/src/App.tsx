import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/theme-provider";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Videos from "./pages/Videos";
import NotFound from "./pages/NotFound";
import DashboardLayout from "./layouts/DashboardLayout";
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/AdminDashboard";
import PaidUsers from "./pages/PaidUsers";
import UnpaidUsers from "./pages/UnpaidUsers";
<<<<<<< HEAD
import CouponUsage from "./pages/CouponUsage";
=======
>>>>>>> 8c09cfeefc9d939bac72912758e18842fc8583a8
import PublicLayout from "./layouts/PublicLayout";
import AboutUs from "./pages/AboutUs";
import TeamsPage from "./pages/TeamsPage";
import Career from "./pages/Career";
import ContactUs from "./pages/ContactUs";
import Registration from "./pages/Registration";
import ThankYou from "./pages/ThankYou";
import PaymentSuccessful from "./pages/PaymentSuccessful";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsAndConditions from "./pages/TermsAndConditions";
<<<<<<< HEAD
import RegisteredUsers from "./pages/RegisteredUsers";
=======
>>>>>>> 8c09cfeefc9d939bac72912758e18842fc8583a8

import AOS from "aos";
import "aos/dist/aos.css";
import { useEffect } from "react";

const queryClient = new QueryClient();

import PixelTracker from "@/components/PixelTracker";

const App = () => {
  useEffect(() => {
    AOS.init({
      once: true, // Animation happens only once - while scrolling down
      duration: 1000, // Duration of animation
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <PixelTracker />
            <Routes>
              <Route element={<PublicLayout />}>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/registration" element={<Registration />} />
                <Route path="/about-us" element={<AboutUs />} />
                <Route path="/teams" element={<TeamsPage />} />
                <Route path="/career" element={<Career />} />
                <Route path="/contact-us" element={<ContactUs />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
              </Route>

              <Route path="/thank-you" element={<ThankYou />} />
              <Route path="/payment-successfull" element={<PaymentSuccessful />} />

              <Route element={<AdminLayout />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/paid-users" element={<PaidUsers />} />
                <Route path="/admin/unpaid-users" element={<UnpaidUsers />} />
<<<<<<< HEAD
                <Route path="/admin/coupon-usage" element={<CouponUsage />} />
                <Route path="/admin/registered-users" element={<RegisteredUsers />} />
=======
>>>>>>> 8c09cfeefc9d939bac72912758e18842fc8583a8
              </Route>

              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/dashboard/videos" element={<Videos />} />
                <Route path="/dashboard/settings" element={<Dashboard />} />
              </Route>

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
