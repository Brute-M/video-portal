import { AlertTriangle, Timer, Users, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const ZoneDeadlineSection = () => {
    const navigate = useNavigate();
    const [timeLeft, setTimeLeft] = useState("00:00:00:00");

    useEffect(() => {
        // Set target date to 10 days from now
        const targetDate = new Date().getTime() + (10 * 24 * 60 * 60 * 1000);

        const timer = setInterval(() => {
            const now = new Date().getTime();
            const distance = targetDate - now;

            if (distance < 0) {
                clearInterval(timer);
                setTimeLeft("00:00:00:00");
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            // Format with leading zeros
            const strDays = days < 10 ? `0${days}` : days;
            const strHours = hours < 10 ? `0${hours}` : hours;
            const strMinutes = minutes < 10 ? `0${minutes}` : minutes;
            const strSeconds = seconds < 10 ? `0${seconds}` : seconds;

            setTimeLeft(`${strDays}:${strHours}:${strMinutes}:${strSeconds}`);
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    return (
        <div className="w-full bg-[#0F172A] py-16 px-4 md:px-8 relative overflow-hidden mb-0">
            {/* Background Decoration */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-[#0F172A] to-[#0F172A]" />

            <div className="max-w-5xl mx-auto relative z-10 text-center">

                {/* Warning Header */}
                <div className="flex flex-col md:flex-row items-center justify-center gap-3 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <AlertTriangle className="w-10 h-10 text-[#FFC928] animate-pulse" />
                    <h2 className="text-3xl md:text-5xl font-extrabold text-white uppercase tracking-wider font-display">
                        ZONES ARE <span className="text-[#FFC928]">NEARING CAPACITY</span>
                    </h2>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                    {/* Stat 1 */}
                    <div className="flex flex-col items-center p-4">
                        <span className="text-5xl md:text-6xl font-bold text-white mb-2 font-display">78%</span>
                        <span className="text-[#FFC928] font-bold tracking-widest text-sm">Registrations Completed</span>
                    </div>

                    {/* Stat 2 */}
                    <div className="flex flex-col items-center p-4 border-y md:border-y-0 md:border-x border-white/10">
                        <span className="text-5xl md:text-6xl font-bold text-white mb-2 font-mono tabular-nums tracking-wider text-shadow">{timeLeft}</span>
                        <span className="text-[#FFC928] font-bold tracking-widest text-sm">Time Left</span>
                    </div>

                    {/* Stat 3 */}
                    <div className="flex flex-col items-center p-4">
                        <span className="text-5xl md:text-6xl font-bold text-white mb-2 font-display">89</span>
                        <span className="text-[#FFC928] font-bold tracking-widest text-sm">Slots Available</span>
                    </div>
                </div>

                {/* CTA Text */}
                <div className="space-y-4 mb-10">
                    <p className="text-xl md:text-2xl text-gray-300 italic font-medium">
                        Those who hesitate fall behind.
                    </p>
                    <p className="text-2xl md:text-3xl text-white font-bold tracking-wide">
                        Those who step forward, leave their mark.
                    </p>
                </div>

                {/* Action Button */}
                <Button
                    onClick={() => navigate("/auth?mode=register")}
                    className="bg-[#FFC928] text-black hover:bg-[#FFC928]/90 text-lg md:text-xl font-bold px-10 py-6 h-auto rounded-full shadow-[0_0_20px_rgba(255,201,40,0.4)] transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(255,201,40,0.6)]"
                >
                    👉 Secure Your Spot
                </Button>
            </div>
        </div>
    );
};

export default ZoneDeadlineSection;
