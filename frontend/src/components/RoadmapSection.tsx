import { FileText, Smartphone, Search, Trophy } from "lucide-react";

const RoadmapSection = () => {
    const steps = [
        {
            id: 1,
            icon: FileText,
            title: "RECORD YOUR SKILLS", // The image text says "RECORD YOUR SKILLS"? Wait, user text says "Sign Up & Pay" for Step 1.
            // Let's re-read the prompt details.
            // Image has: 1. RECORD YOUR SKILLS, 2. CLEAR ZONE TRIALS ...
            // Text Request has: 
            // Step 1: Sign Up & Pay (Form)
            // Step 2: Record & Upload (Phone)
            // Step 3: Get Shortlisted (Search)
            // Step 4: Play Live on TV (Stadium/TV)

            // I MUST FOLLOW THE TEXT REQUEST CONTENT but DESIGN from Image.

            headline: "SIGN UP & PAY",
            description: "Fill your details and pay the one-time entry fee of ₹1499 to secure your spot.",
        },
        {
            id: 2,
            icon: Smartphone,
            headline: "RECORD & UPLOAD",
            description: "No travel needed! Record a batting or bowling video on your phone and upload it.",
        },
        {
            id: 3,
            icon: Search,
            headline: "GET SHORTLISTED",
            description: "Our experts and AI technology analyze your technique. Best players get the \"Golden Call\".",
        },
        {
            id: 4,
            icon: Trophy,
            headline: "PLAY LIVE ON TV",
            description: "Get auctioned into a team, wear the pro jersey, and play for the ₹3 Crore prize pool.",
        },
    ];

    return (
        <section className="w-full bg-white py-16 px-4 md:px-8 relative">
            <div className="max-w-7xl mx-auto">
                <h2 className="text-center text-4xl md:text-5xl font-extrabold text-[#111827] mb-20 uppercase tracking-wide font-display">
                    YOUR JOURNEY TO <span className="text-[#FFC928]">GLORY</span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6 mt-12">
                    {steps.map((step) => (
                        <div
                            key={step.id}
                            className="bg-white rounded-3xl p-6 lg:p-8 flex flex-col items-center text-center shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] hover:shadow-2xl transition-all duration-300 relative group border border-gray-100 mt-8"
                        >
                            {/* Floating Step Number */}
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-[#FF5555] rounded-full flex items-center justify-center border-[6px] border-white shadow-lg z-10">
                                <span className="text-3xl font-bold text-white">{step.id}</span>
                            </div>

                            <div className="mt-10 mb-6 text-gray-400 group-hover:text-[#FFC928] transition-colors duration-300">
                                <step.icon className="w-12 h-12" strokeWidth={1.5} />
                            </div>

                            <h3 className="text-xl font-bold text-[#1e2330] mb-3 uppercase">
                                {step.headline}
                            </h3>

                            <p className="text-gray-500 text-sm leading-relaxed">
                                {step.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default RoadmapSection;
