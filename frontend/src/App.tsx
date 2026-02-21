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
import VideoAnalysis from "./pages/VideoAnalysis";
import NotFound from "./pages/NotFound";
import DashboardLayout from "./layouts/DashboardLayout";
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/AdminDashboard";
import PaidUsers from "./pages/PaidUsers";
import UnpaidUsers from "./pages/UnpaidUsers";
import CouponUsage from "./pages/CouponUsage";
import PublicLayout from "./layouts/PublicLayout";
import AboutUs from "./pages/AboutUs";
import TeamsPage from "./pages/TeamsPage";
import Career from "./pages/Career";
import ContactUs from "./pages/ContactUs";
import Registration from "./pages/Registration";
import Events from "./pages/Events";
import ThankYou from "./pages/ThankYou";
import PaymentSuccessful from "./pages/PaymentSuccessful";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsAndConditions from "./pages/TermsAndConditions";
import RegisteredUsers from "./pages/RegisteredUsers";
import UserDetails from "./pages/UserDetails";
import Payments from "./pages/Payments";
import Press from "./pages/Press";

import AdminEvents from "./pages/AdminEvents";
import AdminJobsList from "./pages/AdminJobsList";
import AdminJobForm from "./pages/AdminJobForm";
// import AdminNavLinks from "./pages/AdminNavLinks";
import AdminAmbassadors from "./pages/AdminAmbassadors";
import AdminTeams from "./pages/AdminTeams";
import BecomePartner from "./pages/BecomePartner";
import AdminCampaigns from "./pages/AdminCampaigns";
import AdminPartners from "./pages/AdminPartners";
import TypesOfPartners from "./pages/TypesOfPartners";
import FAQs from "./pages/FAQs";
import AdminFAQs from "./pages/AdminFAQs";
import AdminSettings from "./pages/AdminSettings";
import AdminBanner from "./pages/AdminBanner";
import AdminWhoWeAre from "./pages/AdminWhoWeAre";
import AdminAboutUs from "./pages/AdminAboutUs";
import AdminAboutBrpl from "@/pages/AdminAboutBrpl";
import AdminMeetOurTeam from "@/pages/AdminMeetOurTeam";
import AdminMissionVision from "./pages/AdminMissionVision";
import AdminSocialContact from "./pages/AdminSocialContact";
import AdminPageBanner from "./pages/AdminPageBanner";
import AdminPrivacyPolicy from "./pages/AdminPrivacyPolicy";
import AdminTermsConditions from "./pages/AdminTermsConditions";
import AdminSeoMeta from "./pages/AdminSeoMeta";

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
                <Route path="/events" element={<Events />} />
                <Route path="/contact-us" element={<ContactUs />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
                <Route path="/press/:id" element={<Press />} />
                <Route path="/partners" element={<BecomePartner />} />
                <Route path="/types-of-partners" element={<TypesOfPartners />} />
                <Route path="/faqs" element={<FAQs />} />
              </Route>

              <Route path="/thank-you" element={<ThankYou />} />
              <Route path="/payment-successfull" element={<PaymentSuccessful />} />

              <Route element={<AdminLayout />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/paid-users" element={<PaidUsers />} />
                <Route path="/admin/unpaid-users" element={<UnpaidUsers />} />
                {/* <Route path="/admin/coupon-usage" element={<CouponUsage />} /> */}
                <Route path="/admin/registered-users" element={<RegisteredUsers />} />
                <Route path="/admin/users/:userId" element={<UserDetails />} />
                {/* <Route path="/admin/step1-leads" element={<Step1Leads />} /> */}
                <Route path="/admin/payments" element={<Payments />} />
                <Route path="/admin/events" element={<AdminEvents />} />
                <Route path="/admin/jobs" element={<AdminJobsList />} />
                <Route path="/admin/jobs/create" element={<AdminJobForm />} />
                <Route path="/admin/jobs/edit/:id" element={<AdminJobForm />} />
                <Route path="/admin/ambassadors" element={<AdminAmbassadors />} />
                <Route path="/admin/teams" element={<AdminTeams />} />
                <Route path="/admin/partners" element={<AdminPartners />} />
                <Route path="/admin/campaigns" element={<AdminCampaigns />} />
                <Route path="/admin/faqs" element={<AdminFAQs />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
                <Route path="/admin/cms/banners" element={<AdminBanner />} />
                <Route path="/admin/cms/who-we-are" element={<AdminWhoWeAre />} />
                <Route path="/admin/about-us/banner" element={<AdminAboutUs />} />
                <Route path="/admin/about-us/about-brpl" element={<AdminAboutBrpl />} />
                <Route path="/admin/about-us/mission-vision" element={<AdminMissionVision />} />
                <Route path="/admin/about-us/meet-our-team" element={<AdminMeetOurTeam />} />
                <Route path="/admin/social-contact" element={<AdminSocialContact />} />
                <Route path="/admin/page-banner" element={<AdminPageBanner />} />
                <Route path="/admin/privacy-policy" element={<AdminPrivacyPolicy />} />
                <Route path="/admin/terms-conditions" element={<AdminTermsConditions />} />
                <Route path="/admin/meta-content" element={<AdminSeoMeta />} />
                {/* <Route path="/admin/nav-links" element={<AdminNavLinks />} /> */}
              </Route>

              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/dashboard/videos" element={<Videos />} />
                <Route path="/dashboard/analysis" element={<VideoAnalysis />} />
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
