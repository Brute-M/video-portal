import { useEffect, lazy, Suspense, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/theme-provider";
import { BrowserRouter, Routes, Route } from "react-router-dom";

const PixelTracker = lazy(() => import("@/components/PixelTracker"));

const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Videos = lazy(() => import("./pages/Videos"));
const VideoAnalysis = lazy(() => import("./pages/VideoAnalysis"));
const NotFound = lazy(() => import("./pages/NotFound"));
const DashboardLayout = lazy(() => import("./layouts/DashboardLayout"));
const AdminLayout = lazy(() => import("./layouts/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const PaidUsers = lazy(() => import("./pages/PaidUsers"));
const UnpaidUsers = lazy(() => import("./pages/UnpaidUsers"));
const CouponUsage = lazy(() => import("./pages/CouponUsage"));
const PublicLayout = lazy(() => import("./layouts/PublicLayout"));
const AboutUs = lazy(() => import("./pages/AboutUs"));
const TeamsPage = lazy(() => import("./pages/TeamsPage"));
const Career = lazy(() => import("./pages/Career"));
const ContactUs = lazy(() => import("./pages/ContactUs"));
const Registration = lazy(() => import("./pages/Registration"));
const Events = lazy(() => import("./pages/Events"));
const ThankYou = lazy(() => import("./pages/ThankYou"));
const PaymentSuccessful = lazy(() => import("./pages/PaymentSuccessful"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsAndConditions = lazy(() => import("./pages/TermsAndConditions"));
const RegisteredUsers = lazy(() => import("./pages/RegisteredUsers"));
const UserDetails = lazy(() => import("./pages/UserDetails"));
const Payments = lazy(() => import("./pages/Payments"));
const Press = lazy(() => import("./pages/Press"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const News = lazy(() => import("./pages/News"));
const NewsPost = lazy(() => import("./pages/NewsPost"));

const AdminEvents = lazy(() => import("./pages/AdminEvents"));
const AdminJobsList = lazy(() => import("./pages/AdminJobsList"));
const AdminJobForm = lazy(() => import("./pages/AdminJobForm"));
// const AdminNavLinks = lazy(() => import("./pages/AdminNavLinks"));
const AdminAmbassadors = lazy(() => import("./pages/AdminAmbassadors"));
const AdminTeams = lazy(() => import("./pages/AdminTeams"));
const BecomePartner = lazy(() => import("./pages/BecomePartner"));
const AdminCampaigns = lazy(() => import("./pages/AdminCampaigns"));
const AdminPartners = lazy(() => import("./pages/AdminPartners"));
const TypesOfPartners = lazy(() => import("./pages/TypesOfPartners"));
const FAQs = lazy(() => import("./pages/FAQs"));
const AdminFAQs = lazy(() => import("./pages/AdminFAQs"));
const AdminSettings = lazy(() => import("./pages/AdminSettings"));
const AdminBanner = lazy(() => import("./pages/AdminBanner"));
const AdminWhoWeAre = lazy(() => import("./pages/AdminWhoWeAre"));
const AdminAboutUs = lazy(() => import("./pages/AdminAboutUs"));
const AdminAboutBrpl = lazy(() => import("@/pages/AdminAboutBrpl"));
const AdminMeetOurTeam = lazy(() => import("@/pages/AdminMeetOurTeam"));
const AdminMissionVision = lazy(() => import("./pages/AdminMissionVision"));
const AdminSocialContact = lazy(() => import("./pages/AdminSocialContact"));
const AdminPageBanner = lazy(() => import("./pages/AdminPageBanner"));
const AdminPrivacyPolicy = lazy(() => import("./pages/AdminPrivacyPolicy"));
const AdminTermsConditions = lazy(() => import("./pages/AdminTermsConditions"));
const AdminSeoMeta = lazy(() => import("./pages/AdminSeoMeta"));
const AdminBlog = lazy(() => import("./pages/AdminBlog"));
const AdminNews = lazy(() => import("./pages/AdminNews"));
const AdminProfile = lazy(() => import("./pages/AdminProfile"));
const UserProfile = lazy(() => import("./pages/UserProfile"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, staleTime: 60 * 1000 },
  },
});

const RouteFallback = () => (
  <div className="flex h-screen w-full items-center justify-center bg-[#111a45]" aria-label="Loading">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#FFC928] border-t-transparent" />
  </div>
);

const App = () => {
  const [deferAnalytics, setDeferAnalytics] = useState(false);

  // Lazy-load AOS after first paint to improve LCP/FCP
  useEffect(() => {
    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      import("aos").then((AOS) => {
        if (cancelled) return;
        import("aos/dist/aos.css");
        AOS.default.init({ once: true, duration: 1000 });
      });
    };
    const id = typeof requestIdleCallback !== "undefined"
      ? requestIdleCallback(run, { timeout: 2000 })
      : window.setTimeout(run, 500);
    return () => {
      cancelled = true;
      if (typeof cancelIdleCallback !== "undefined") cancelIdleCallback(id as number);
      else clearTimeout(id);
    };
  }, []);

  // Defer analytics (Pixel) until after load so they don't block main thread
  useEffect(() => {
    const onLoad = () => setDeferAnalytics(true);
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            {deferAnalytics && (
              <Suspense fallback={null}>
                <PixelTracker />
              </Suspense>
            )}
            <Suspense fallback={<RouteFallback />}>
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
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/blog/:slug" element={<BlogPost />} />
                  <Route path="/news" element={<News />} />
                  <Route path="/news/:slug" element={<NewsPost />} />
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
                  <Route path="/admin/blog" element={<AdminBlog />} />
                  <Route path="/admin/news" element={<AdminNews />} />
                  <Route path="/admin/profile" element={<AdminProfile />} />
                  {/* <Route path="/admin/nav-links" element={<AdminNavLinks />} /> */}
                </Route>

                <Route element={<DashboardLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/dashboard/videos" element={<Videos />} />
                  <Route path="/dashboard/analysis" element={<VideoAnalysis />} />
                  <Route path="/dashboard/settings" element={<Dashboard />} />
                  <Route path="/dashboard/profile" element={<UserProfile />} />
                </Route>

                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
