import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const RegistrationHero = () => {
    const scrollToForm = () => {
        const formElement = document.getElementById("auth-form-container");
        if (formElement) {
            formElement.scrollIntoView({ behavior: "smooth" });
        } else {
            window.scrollTo({ top: 100, behavior: "smooth" });
        }
    };

    return (
        <section className="relative w-full h-auto py-12 md:py-0 md:h-[400px] flex items-center justify-center overflow-hidden">
            {/* Background Image with Overlay */}
            <div
                className="absolute inset-0 z-0 bg-[length:100%_100%] bg-center bg-no-repeat"
                style={{
                    backgroundImage: "url('/banner.png')",
                }}
            >
                <div className="absolute inset-0 bg-black/60 md:bg-black/50" /> {/* Dark overlay for text readability */}
            </div>

            <div className="relative z-10 max-w-5xl mx-auto px-4 text-center text-white">
                <h1 className="text-3xl md:text-6xl font-black font-display uppercase tracking-tighter mb-6 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] leading-tight text-white/90">
                    Don't Let Your Talent <br className="hidden md:block" /> Stay in the Gully.
                </h1>
                <p className="text-lg md:text-2xl text-white mb-8 max-w-3xl mx-auto font-medium drop-shadow-md bg-black/20 backdrop-blur-sm rounded-lg py-1 px-4 inline-block">
                    "Slots for your city are filling fast. Join the revolution today."
                </p>

                <div className="flex flex-col items-center gap-3">
                    <Button
                        size="lg"
                        onClick={scrollToForm}
                        className="bg-[#FFC928] text-black hover:bg-[#ffda6b] text-base md:text-xl px-8 py-6 rounded-full font-bold shadow-[0_0_20px_rgba(255,201,40,0.4)] hover:shadow-[0_0_30px_rgba(255,201,40,0.6)] transition-all transform hover:scale-105"
                    >
                        REGISTER NOW - ₹1499
                    </Button>
                    <p className="text-sm text-gray-300 flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        Secure Payment via UPI/Card
                    </p>
                </div>
            </div>
        </section>
    );
};

export default RegistrationHero;
