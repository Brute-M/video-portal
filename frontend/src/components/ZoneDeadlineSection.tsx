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
        <div className="w-full bg-[#0F172A] py-8 px-4 md:px-8 relative overflow-hidden mb-0">
            {/* Background Decoration */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-[#0F172A] to-[#0F172A]" />

            <div className="max-w-5xl mx-auto relative z-10 text-center">

                {/* Warning Header */}
                <div className="flex flex-col md:flex-row items-center justify-center gap-3 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <AlertTriangle className="w-8 h-8 text-[#FFC928] animate-pulse" />
                    <h2 className="text-2xl md:text-4xl font-extrabold text-white uppercase tracking-wider font-display italic">
                        ZONES ARE <span className="text-[#FFC928]">NEARING CAPACITY</span>
                    </h2>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Stat 1 */}
                    <div className="flex flex-col items-center p-2">
                        <span className="text-3xl md:text-5xl font-bold text-white mb-2 font-display">78%</span>
                        <span className="text-[#FFC928] font-bold tracking-widest text-sm">Registrations Completed</span>
                    </div>

                    {/* Stat 2 */}
                    <div className="flex flex-col items-center p-2 border-y md:border-y-0 md:border-x border-white/10">
                        <span className="text-3xl md:text-5xl font-bold text-white mb-2 font-mono tabular-nums tracking-wider text-shadow">{timeLeft}</span>
                        <span className="text-[#FFC928] font-bold tracking-widest text-sm">Time Left</span>
                    </div>

                    {/* Stat 3 */}
                    <div className="flex flex-col items-center p-2">
                        <span className="text-3xl md:text-5xl font-bold text-white mb-2 font-display">89</span>
                        <span className="text-[#FFC928] font-bold tracking-widest text-sm">Slots Available</span>
                    </div>
                </div>

                {/* CTA Text */}
                <div className="space-y-3 mb-6">
                    <p className="text-lg md:text-xl text-gray-300 italic font-medium">
                        Those who hesitate fall behind.
                    </p>
                    <p className="text-xl md:text-2xl text-white font-bold tracking-wide">
                        Those who step forward, leave their mark.
                    </p>
                </div>

                {/* Action Button */}
                <Button
                    onClick={() => {
                        const formContainer = document.getElementById("auth-form-container");
                        if (formContainer) {
                            formContainer.scrollIntoView({ behavior: "smooth" });
                        } else {
                            navigate("/registration");
                        }
                    }}
                    className="bg-[#FFC928] text-black hover:bg-[#FFC928]/90 text-base md:text-lg font-bold px-8 py-3 h-auto rounded-full shadow-[0_0_20px_rgba(255,201,40,0.3)] transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(255,201,40,0.5)]"
                >
                    Start Your Journey - Register Now
                </Button>
            </div>
        </div>
    );
};

export default ZoneDeadlineSection;
