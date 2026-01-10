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
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: "url('/register-footer-2.png')",
                }}
            >
                <div className="absolute inset-0 bg-black/60 md:bg-black/50" /> {/* Dark overlay for text readability */}
            </div>

            <div className="relative z-10 max-w-5xl mx-auto px-4 text-center text-white">
                <h1 className="text-2xl md:text-6xl font-extrabold font-display uppercase tracking-tight mb-4 drop-shadow-lg leading-tight">
                    Don't Let Your Talent <br className="hidden md:block" /> Stay in the Gully.
                </h1>
                <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-3xl mx-auto font-light">
                    "Slots for your city are filling fast. Join the revolution today."
                </p>

                <div className="flex flex-col items-center gap-3">
                    <Button
                        size="lg"
                        onClick={scrollToForm}
                        className="bg-[#FFC928] text-black hover:bg-[#ffda6b] text-lg md:text-2xl px-6 py-4 md:px-10 md:py-8 rounded-full font-bold shadow-[0_0_20px_rgba(255,201,40,0.6)] hover:shadow-[0_0_30px_rgba(255,201,40,0.8)] transition-all transform hover:scale-105"
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
