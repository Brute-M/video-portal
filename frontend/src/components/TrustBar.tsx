import { Trophy, Tv, Bot, Users, Timer, Circle } from "lucide-react";

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
        <section className="w-full bg-[#1e2330] py-16 px-4 md:px-8 relative overflow-hidden">
            {/* Background Pattern - Subtle concentric circles or waves could go here if needed, 
            but using a solid dark background as a base for now to match the "Dark Blue" feeling. 
            The provided image has a radial gradient look. */}

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/40 via-[#1e2330] to-[#1e2330] pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10">
                <h2 className="text-center text-4xl md:text-5xl font-extrabold text-[#FFC928] mb-12 uppercase tracking-wide font-display">
                    The Numbers Speak
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-6">
                    {trustItems.map((item, index) => (
                        <div
                            key={index}
                            className="bg-white rounded-2xl p-4 lg:p-6 flex flex-col items-center justify-center text-center shadow-xl hover:-translate-y-1 transition-transform duration-300 min-h-[160px]"
                        >
                            <item.icon className={`w-10 h-10 ${item.color} mb-3`} strokeWidth={1.5} />
                            <h3 className="text-xl lg:text-2xl font-bold text-gray-900 leading-tight mb-1">
                                {item.hook}
                            </h3>
                            <p className="text-[10px] lg:text-xs font-bold text-gray-500 uppercase tracking-wider">
                                {item.descriptor}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default TrustBar;
