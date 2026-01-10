
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

const RegistrationFAQ = () => {
    const faqs = [
        {
            question: "1. Is this Leather Ball or Tennis Ball?",
            answer:
                "It is Hard Tennis Ball Cricket. You don't need pads or expensive gear. Just bring your favorite bat and play.",
        },
        {
            question: "2. Can I register now and upload video later?",
            answer:
                "Yes! You can pay ₹1499 now to book your slot (before they fill up) and upload your trial video anytime within 7 days from your dashboard.",
        },
        {
            question: "3. What is the Age Limit?",
            answer:
                "We have categories for everyone: Under-19, Under-24, and Open Category (No age limit). Talent has no age!",
        },
        {
            question: "4. What if I don't get selected?",
            answer:
                "Even if you don't make it to the TV round, you get a Customized BRPL Jersey and a BRPL Tennis ball. Plus, you stay in our database for future leagues.",
        },
        {
            question: "5. Is the fee refundable?",
            answer:
                "The registration fee is non-refundable as it covers your backend processing and kit costs. ",
        },
    ];

    return (
        <div className="w-full max-w-4xl mx-auto mt-16 px-4 mb-20">
            <div className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-bold text-[#1a237e] uppercase tracking-wide">
                    FREQUENTLY ASKED <span className="text-[#FFC928]">QUESTIONS</span>
                </h2>
                <div className="h-1.5 w-24 bg-[#FFC928] mx-auto mt-4 rounded-full"></div>
            </div>

            <Accordion type="single" collapsible className="w-full bg-white/50 backdrop-blur-sm rounded-lg border border-white/20 shadow-sm">
                {faqs.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`} className="border-b border-gray-200 last:border-0 px-4">
                        <AccordionTrigger className="text-left text-[#1a237e] font-bold uppercase hover:no-underline py-6 text-sm md:text-base">
                            {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-gray-600 text-sm md:text-base pb-6 leading-relaxed">
                            {faq.answer}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    );
};

export default RegistrationFAQ;
