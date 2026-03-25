import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import apiClient from "@/apihelper/api";

const RegistrationHero = () => {
    const [titleLine1, setTitleLine1] = useState("Don\u2019t Let Your Talent");
    const [titleLine2, setTitleLine2] = useState("Stay in the Gully.");
    const [subtitle, setSubtitle] = useState("Slots for your city are filling fast. Join the revolution today.");
    const [buttonText, setButtonText] = useState("REGISTER NOW - \u20B91499");
    const [paymentNote, setPaymentNote] = useState("Secure Payment via UPI/Card");
    const [backgroundImage, setBackgroundImage] = useState("/banner.png");

    useEffect(() => {
        apiClient.get("/api/registration-hero")
            .then(res => {
                if (res.data.success && res.data.data) {
                    const s = res.data.data;
                    if (s.titleLine1) setTitleLine1(s.titleLine1);
                    if (s.titleLine2) setTitleLine2(s.titleLine2);
                    if (s.subtitle !== undefined) setSubtitle(s.subtitle);
                    if (s.buttonText) setButtonText(s.buttonText);
                    if (s.paymentNote !== undefined) setPaymentNote(s.paymentNote);
                    if (s.backgroundImage) setBackgroundImage(s.backgroundImage);
                }
            })
            .catch(() => {});
    }, []);

    const scrollToForm = () => {
        const formElement = document.getElementById("auth-form-container");
        if (formElement) {
            formElement.scrollIntoView({ behavior: "smooth" });
        } else {
            window.scrollTo({ top: 100, behavior: "smooth" });
        }
    };

    return (
        <section className="relative w-full flex items-center justify-center overflow-hidden bg-black min-h-[420px] h-[55vw] max-h-[calc(100vh-70px)] py-10 md:py-0">
            {/* Background Image with Overlay */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url('${backgroundImage}')` }}
            >
                <div className="absolute inset-0 bg-black/60 md:bg-black/50" />
            </div>

            <div className="relative z-10 max-w-5xl mx-auto px-4 text-center text-white">
                <h1 className="text-3xl md:text-6xl font-black font-display uppercase tracking-tighter mb-6 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] leading-tight text-white/90">
                    {titleLine1} <br className="hidden md:block" /> {titleLine2}
                </h1>
                {subtitle && (
                    <p className="text-lg md:text-2xl text-white mb-8 max-w-3xl mx-auto font-medium drop-shadow-md bg-black/20 backdrop-blur-sm rounded-lg py-1 px-4 inline-block">
                        "{subtitle}"
                    </p>
                )}

                <div className="flex flex-col items-center gap-3">
                    {buttonText && (
                        <Button
                            size="lg"
                            onClick={scrollToForm}
                            className="bg-[#FFC928] text-black hover:bg-[#ffda6b] text-base md:text-xl px-8 py-6 rounded-full font-bold shadow-[0_0_20px_rgba(255,201,40,0.4)] hover:shadow-[0_0_30px_rgba(255,201,40,0.6)] transition-all transform hover:scale-105"
                        >
                            {buttonText}
                        </Button>
                    )}
                    {paymentNote && (
                        <p className="text-sm text-gray-300 flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            {paymentNote}
                        </p>
                    )}
                </div>
            </div>
        </section>
    );
};

export default RegistrationHero;
