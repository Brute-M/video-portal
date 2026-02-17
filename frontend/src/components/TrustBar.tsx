import { Trophy, Tv, Bot, Users, Timer, Circle } from "lucide-react";
import ImageSlider from "./ImageSlider";

const TrustBar = () => {
    const trustItems = [
        {
            icon: Trophy,
            hook: "₹3 Crore",
            descriptor: "TOTAL PRIZE POOL",
            color: "text-amber-500", // Gold/Yellow
        },
        {
            icon: Circle, // Approximating Tennis Ball
            hook: "Tennis Ball",
            descriptor: "NO BIG KIT REQUIREMENTS",
            color: "text-green-500", // Tennis ball green
        },
        {
            icon: Tv,
            hook: "Live TV",
            descriptor: "NATIONAL BROADCAST",
            color: "text-purple-500", // TV/Broadcast color
        },
        {
            icon: Bot,
            hook: "100% Fair",
            descriptor: "AI POWERED SELECTION",
            color: "text-blue-500", // Technology/AI blue
        },
        {
            icon: Users,
            hook: "All Ages",
            descriptor: "U-18, U-19, U-24, U-40",
            color: "text-indigo-500", // People/Users
        },
        {
            icon: Timer,
            hook: "Closing Soon",
            descriptor: "LIMITED CITY SLOTS",
            color: "text-red-500", // Urgency red
        },
    ];



    return (
        <>
            {/* <ImageSlider /> */}
            <section className="w-full bg-[#020617] py-16 px-4 md:px-8 relative overflow-hidden">
                {/* Background Pattern - Removed light gradient for dark theme visibility */}

                <div className="max-w-7xl mx-auto relative z-10">
                    <h2 className="text-center text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-[#FFC928] to-amber-500 bg-clip-text text-transparent mb-12 uppercase tracking-wide font-display italic drop-shadow-sm">
                        The Numbers Speak
                    </h2>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-6">
                        {trustItems.map((item, index) => (
                            <div
                                key={index}
                                className="group relative rounded-2xl p-[2px] shadow-[0_0_20px_rgba(255,201,40,0.15)] hover:-translate-y-1 transition-transform duration-300 min-h-[160px] overflow-hidden"
                            >
                                {/* Moving Gradient Border */}
                                <div className="absolute inset-0 bg-gradient-to-r from-gray-700 via-[#FFC928] to-gray-700 animate-border-move"></div>

                                {/* Content Card */}
                                <div className="relative bg-[#111a45] rounded-[14px] p-4 lg:p-6 flex flex-col items-center justify-center text-center w-full h-full">
                                    <item.icon className="w-10 h-10 text-[#FFC928] mb-3 relative z-10" strokeWidth={1.5} />
                                    <h3 className="text-xl lg:text-2xl font-bold text-[#FFC928] leading-tight mb-1 relative z-10">
                                        {item.hook}
                                    </h3>
                                    <p className="text-[10px] lg:text-xs font-bold text-gray-300 uppercase tracking-wider relative z-10">
                                        {item.descriptor}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>


        </>
    );
};

export default TrustBar;
