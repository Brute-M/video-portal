import { Link, useLocation } from "react-router-dom";
import { CheckCircle2, ArrowRight, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";

const ThankYou = () => {
    const location = useLocation();
    const isPayment = location.state?.type === 'payment';

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
            <SEO
                title={isPayment ? "Payment Successful" : "Thank You"}
                description={isPayment ? "Your payment was successful." : "Thank you for registering with Beyond Reach Premier League."}
            />

            {/* Background Elements matching Auth page style */}
            <div className="hero-gradient fixed inset-0 pointer-events-none" />
            <div className="absolute inset-0 bg-[url('/bg-cricket1.jpg')] bg-cover bg-center opacity-10" />

            <div className="relative z-10 max-w-lg w-full text-center space-y-8 glass-card p-8 rounded-2xl animate-fade-in">
                <div className="flex justify-center">
                    <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center border-2 border-green-500/20">
                        <CheckCircle2 className="w-10 h-10 text-green-500" />
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-4xl font-display font-bold text-foreground">
                        {isPayment ? "Payment Successful!" : "Welcome to the Team!"}
                    </h1>
                    <p className="text-lg text-muted-foreground">
                        {isPayment
                            ? "Your purchase has been completed. Your video is now live."
                            : "Your account has been successfully created. We're excited to have you join the Beyond Reach Premier League community."}
                    </p>
                </div>

                <div className="pt-4 space-y-4">
                    {!isPayment ? (
                        <Button asChild className="w-full" size="lg" variant="hero">
                            <Link to="/auth">
                                Go to Sign In <ArrowRight className="w-4 h-4 ml-2" />
                            </Link>
                        </Button>
                    ) : (
                        <Button asChild className="w-full" size="lg" variant="hero">
                            <Link to="/dashboard">
                                Back to Dashboard <LayoutDashboard className="w-4 h-4 ml-2" />
                            </Link>
                        </Button>
                    )}


                </div>
            </div>
        </div>
    );
};

export default ThankYou;
