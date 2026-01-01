import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Video,
  HardDrive,
  Activity,
  Upload,
  Play,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getVideos } from "@/apihelper/video";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OfferModal } from "@/components/OfferModal";
import { getProfile } from "@/apihelper/auth";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalVideos: 0,
    storageUsed: "0 MB",
    activeVideos: 0,
    recentVideos: [] as any[],
  });
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await getVideos();
        const list = Array.isArray(response) ? response : (response.videos || response.data || []);

        // Calculate mock storage (random sizes if not present or just assume 50MB per video for demo)
        const totalSize = list.reduce((acc: number, curr: any) => acc + (curr.size || 50 * 1024 * 1024), 0);

        setStats({
          totalVideos: list.length,
          storageUsed: formatFileSize(totalSize),
          activeVideos: list.filter((v: any) => v.status === "completed").length,
          recentVideos: list.slice(0, 3), // Get top 3
        });
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      }
    };

    fetchStats();
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await getProfile();
      setUserProfile(response.data?.data || response.data);
    } catch (error) {
      console.error("Failed to fetch profile", error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* <OfferModal /> */}
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
              {!userProfile?.isPaid && (
                <Button variant="hero" size="lg" asChild className="shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
                  <Link to="/dashboard/videos">
                    <Upload className="w-5 h-5 mr-2" />
                    Upload your video
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* Decorative Bat & Ball - Framed to look intentional even if background is black */}
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
        {/* Recent Activity */}
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
                <div key={video._id} className="glass-card p-4 flex items-center gap-4 group cursor-pointer hover:bg-secondary/50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    <Play className="w-5 h-5 fill-current" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{video.originalName || video.filename}</p>
                    <p className="text-xs text-muted-foreground">
                      {/* Mock date for now if not present */}
                      Uploaded recently
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

        {/* Quick Tips / Info */}
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
    </div>
  );
};

export default Dashboard;

