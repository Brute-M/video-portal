import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { Play, Upload, CreditCard, Zap, Shield, Clock } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Image */}
      <div
        className="fixed inset-0 z-0 opacity-40"
        style={{
          backgroundImage: "url('/bg-cricket.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed"
        }}
      />
      {/* Hero gradient overlay */}
      <div className="hero-gradient fixed inset-0 pointer-events-none z-0 opacity-60" />

      {/* Floating Elements */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Bat */}
        <div className="absolute top-20 right-[10%] opacity-90 animate-swing rotate-12">
          <img src="/bat-3d.png" alt="Cricket Bat" className="w-64 h-auto drop-shadow-2xl" />
        </div>
        {/* Ball */}
        <div className="absolute bottom-40 left-[10%] opacity-90 animate-bounce-slow">
          <img src="/ball-3d.png" alt="Cricket Ball" className="w-32 h-32 drop-shadow-2xl" />
        </div>
        {/* Stumps */}
        <div className="absolute bottom-10 right-[20%] opacity-40">
          <div className="text-9xl tracking-[0.5em] font-bold text-white drop-shadow-lg">| | |</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 lg:px-12">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="BRPL Logo" className="w-32 h-32 object-contain" />
          <span className="text-xl font-display font-bold text-foreground">Beyond Reach Premier League</span>
        </div>
        <div className="flex items-center gap-4">
          <ModeToggle />
          <Link to="/auth">
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link to="/auth?mode=register">
            <Button variant="hero">Start Free Trial</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center px-6 pt-20 pb-32 text-center lg:pt-32">
        <div className="animate-fade-in opacity-0" style={{ animationDelay: "0.1s" }}>
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8">
            <Zap className="w-4 h-4" />
            Join the season today
          </span>
        </div>

        <h1 className="animate-fade-in opacity-0 max-w-4xl text-4xl font-display font-bold tracking-tight text-foreground sm:text-5xl lg:text-7xl" style={{ animationDelay: "0.2s" }}>
          Unleash Your <span className="gradient-text">Cricket</span> Talent
        </h1>

        <p className="animate-fade-in opacity-0 mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl" style={{ animationDelay: "0.3s" }}>
          The official platform for Beyond Reach Premier League. Upload match clips,
          track stats, and get scouted. Your journey to the stadium starts here.
        </p>

        <div className="animate-fade-in opacity-0 flex flex-col sm:flex-row items-center gap-4 mt-10" style={{ animationDelay: "0.4s" }}>
          <Link to="/auth?mode=register">
            <Button variant="hero" size="xl">
              Register as Player
            </Button>
          </Link>
          <Button variant="glass" size="xl">
            <Play className="w-5 h-5" />
            Watch Highlights
          </Button>
        </div>

        {/* Stats */}
        <div className="animate-fade-in opacity-0 grid grid-cols-3 gap-8 mt-20 max-w-2xl w-full" style={{ animationDelay: "0.5s" }}>
          {[
            { value: "50+", label: "Teams" },
            { value: "1K+", label: "Matches" },
            { value: "500+", label: "Players Registered" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-display font-bold gradient-text">{stat.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 px-6 py-24 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-display font-bold text-foreground sm:text-4xl">
              Features for <span className="gradient-text">Champions</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to manage your cricket career and team performance.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Upload,
                title: "Match Highlights",
                description: "Upload high-quality clips of your best shots and wickets. Show the world your skills.",
              },
              {
                icon: CreditCard,
                title: "Team Sponsorships",
                description: "Connect with sponsors and get funding for your team gear and tournaments.",
              },
              {
                icon: Shield,
                title: "Verified Profiles",
                description: "Official player profiles with verified stats and achievements.",
              },
              {
                icon: Zap,
                title: "Live Scoring",
                description: "Real-time match updates and instant scorecard generation.",
              },
              {
                icon: Clock,
                title: "Tournament Schedule",
                description: "Stay updated with upcoming matches, fixtures, and venue details.",
              },
              {
                icon: Play,
                title: "Performance Analytics",
                description: "Deep dive into your batting and bowling stats to improve your game.",
              },
            ].map((feature, index) => (
              <div
                key={feature.title}
                className="glass-card p-6 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-display font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 py-24 lg:px-12">
        <div className="max-w-4xl mx-auto text-center">
          <div className="glass-card p-12 glow-effect">
            <h2 className="text-3xl font-display font-bold text-foreground sm:text-4xl mb-4">
              Ready to Start Creating?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Join thousands of creators who trust VideoHub for their video hosting and monetization needs.
            </p>
            <Link to="/auth?mode=register">
              <Button variant="hero" size="xl">
                Start Your Free Trial
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground mt-4">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-sky-600 px-6 py-12 lg:px-12 bg-[#0ea5e9]">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <img src="/logo.png" alt="BRPL Logo" className="w-32 h-32 object-contain" />
              <span className="text-lg font-display font-bold text-white">Beyond Reach Premier League</span>
            </div>
            <p className="text-black text-sm max-w-sm">
              Bharat ki League, Bhartiyo ka Sapna.
            </p>
          </div>

          <div className="col-span-1 md:col-span-2 space-y-4 text-sm text-black">
            <div>
              <h4 className="font-semibold text-white mb-1">Address</h4>
              <p>Ground Floor, Suite G-01, Procapitus Business Park,</p>
              <p>D-247/4A, D Block, Sector 63, Noida, Uttar Pradesh 201309</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-1">Contact</h4>
              <p>Phone: +91 88603 42926</p>
              <p>Email: info@brpl.net</p>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-12 pt-8 border-t border-black/10 text-center text-sm text-black">
          <p>© {new Date().getFullYear()} Beyond Reach Premier League. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
