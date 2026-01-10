import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Video,
  HardDrive,
  Activity,
  Upload,
  Play,
  ArrowRight,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getVideos, getLatestVideo } from "@/apihelper/video";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OfferModal } from "@/components/OfferModal";
import { getProfile } from "@/apihelper/auth";
import { AlertCircle, CreditCard, Lock as LockIcon, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createLandingOrder, verifyLandingPayment } from "@/apihelper/payment";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalVideos: 0,
    storageUsed: "0 MB",
    activeVideos: 0,
    recentVideos: [] as any[],
  });
  const [userProfile, setUserProfile] = useState<any>(null);
  const [latestVideo, setLatestVideo] = useState<any>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
    fetchProfile();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await getVideos();
      const list = Array.isArray(response) ? response : (response.videos || response.data || []);

      setStats({
        totalVideos: list.length,
        storageUsed: formatFileSize(list.reduce((acc: number, curr: any) => acc + (curr.size || 50 * 1024 * 1024), 0)),
        activeVideos: list.filter((v: any) => v.status === "completed").length,
        recentVideos: list.slice(0, 3),
      });

      // Also fetch the single latest video
      const latestRes = await getLatestVideo();
      if (latestRes.statusCode === 200) {
        setLatestVideo(latestRes.data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard stats", error);
    }
  };

  const fetchProfile = async () => {
    setIsProfileLoading(true);
    try {
      const response = await getProfile();
      const profile = response.data?.data || response.data;
      setUserProfile(profile);
    } catch (error) {
      console.error("Failed to fetch profile", error);
    } finally {
      setIsProfileLoading(false);
    }
  };


  const handleRegistrationPayment = async () => {
    setIsProcessingPayment(true);
    try {
      const order = await createLandingOrder(1499);

      const options: any = {
        key: "rzp_live_RsBsR05m5SGbtT",
        amount: order.amount,
        currency: order.currency,
        name: "Beyond Reach Premier League",
        description: "Registration and Service Fee",
        order_id: order.id,
        handler: async (response: any) => {
          try {
            await verifyLandingPayment({
              ...response,
              userId: userProfile._id,
              amount: 1499
            });

            toast({
              title: "Payment Successful",
              description: "Registration verified successfully.",
            });

            // Refresh everything
            await fetchProfile();
            await fetchStats();
          } catch (verifyError: any) {
            console.error("Verification failed", verifyError);
            toast({
              variant: "destructive",
              title: "Verification Failed",
              description: "Payment was successful but verification failed. Please contact support.",
            });
          }
        },
        prefill: {
          name: `${userProfile?.fname || ''} ${userProfile?.lname || ''}`.trim(),
          email: userProfile?.email,
          contact: userProfile?.mobile,
        },
        theme: {
          color: "#0f172a",
        },
        modal: {
          ondismiss: () => setIsProcessingPayment(false)
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error: any) {
      console.error("Payment initiation failed", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not initiate payment. Please try again later.",
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const isPaid = userProfile?.isPaid || stats.totalVideos > 0;

  if (isProfileLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="relative overflow-hidden rounded-2xl glass-card border-none p-8 md:p-12 mb-8 shadow-2xl">
        {/* Stadium Background */}
        <div className="absolute inset-0 z-0">
          <img
            src="/assets/cricket-bg.png"
            alt="Stadium"
            className="w-full h-full object-cover opacity-50 contrast-125 saturate-150"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-center gap-6">
          <div className="space-y-2 max-w-lg">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground tracking-tight slide-in-from-left-5">
              Welcome to the <span className="text-primary glow-text">BRPL</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Manage your cricket highlights, track your performance, and engage with fans.
            </p>
            <div className="pt-4 flex gap-4">
              {isPaid && stats.totalVideos === 0 && (
                <Button variant="hero" size="lg" asChild className="shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
                  <Link to="/dashboard/videos">
                    <Upload className="w-5 h-5 mr-2" />
                    Upload your video
                  </Link>
                </Button>
              )}
              {isPaid && stats.totalVideos > 0 && (
                <div className="flex items-center gap-2 text-green-500 font-medium bg-green-500/10 px-4 py-2 rounded-lg border border-green-500/20">
                  <CheckCircle2 className="w-5 h-5" />
                  Video Successfully Uploaded
                </div>
              )}
            </div>
          </div>

          <div className="hidden md:block relative w-64 h-64 animate-in slide-in-from-right-8 duration-700 delay-200">
            <div className="absolute rounded-full bg-primary/20 blur-3xl inset-4"></div>
            <img
              src="/assets/cricket-elements.png"
              alt="Cricket Gear"
              className="w-full h-full object-contain drop-shadow-2xl hover:scale-110 transition-transform duration-500 relative z-10 mix-blend-normal"
              style={{ maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)' }}
            />
          </div>
        </div>
      </div>

      {!isPaid ? (
        <div className="glass-card p-12 text-center space-y-6 animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <LockIcon className="w-10 h-10 text-primary" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-3xl font-display font-bold">Access Restricted</h2>
            <p className="text-muted-foreground">
              To unlock your dashboard and start uploading videos, please complete your registration payment and verification.
            </p>
          </div>
          <Button
            size="xl"
            variant="hero"
            className="px-12 h-14 text-lg font-bold shadow-xl overflow-hidden group relative"
            onClick={handleRegistrationPayment}
            disabled={isProcessingPayment}
          >
            {isProcessingPayment ? "Initiating..." : (
              <>
                <CreditCard className="w-5 h-5 mr-2" />
                Complete Payment (₹ 1499)
              </>
            )}
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 skew-x-[-20deg]" />
          </Button>
          <p className="text-xs text-muted-foreground italic">
            Secure payment via Razorpay. Access will be granted immediately upon verification.
          </p>
        </div>
      ) : (
        <>
          {/* Latest Video Action Alert */}
          {latestVideo?.status === 'pending_payment' && !isPaid && (
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center justify-between animate-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Payment Pending</p>
                  <p className="text-sm text-muted-foreground">Your latest video <span className="text-foreground font-medium">"{latestVideo.originalName}"</span> is waiting for payment to be activated.</p>
                </div>
              </div>
              <Button variant="default" size="sm" asChild className="shrink-0">
                <Link to="/dashboard/videos">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pay Now
                </Link>
              </Button>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="glass-card hover:border-primary/50 transition-colors group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
                  Total Videos
                </CardTitle>
                <Video className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-display">{stats.totalVideos}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  +20% from last month
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card hover:border-primary/50 transition-colors group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-accent transition-colors">
                  Storage Used
                </CardTitle>
                <HardDrive className="h-4 w-4 text-accent group-hover:scale-110 transition-transform" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-display">{stats.storageUsed}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  15GB available
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-display font-semibold">Recent Uploads</h2>
                <Link to="/dashboard/videos" className="text-sm text-primary hover:underline flex items-center">
                  View all <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>

              <div className="space-y-3">
                {stats.recentVideos.length === 0 ? (
                  <div className="text-center py-8 glass-card rounded-lg text-muted-foreground">
                    No videos uploaded yet.
                  </div>
                ) : (
                  stats.recentVideos.map(video => (
                    <div key={video._id} className="glass-card p-4 flex items-center gap-4 group cursor-pointer hover:bg-secondary/50 transition-colors" onClick={() => navigate("/dashboard/videos")}>
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                        <Play className="w-5 h-5 fill-current" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{video.originalName || video.filename}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          Uploaded on {new Date(video.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${video.status === 'completed' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
                        }`}>
                        {video.status || 'Processing'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-4">
              <Card className="glass-card border-border">
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">System Status</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Upload Service</span>
                      <span className="flex items-center text-green-500 gap-1"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Operational</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Payment Gateway</span>
                      <span className="flex items-center text-green-500 gap-1"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Operational</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;

