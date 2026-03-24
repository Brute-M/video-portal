import { Helmet } from "react-helmet-async";
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
                "Open for players aged 18 to 40. Each team will include a minimum of 2 players from the 18–20 age group, with 1 player in the playing XI for every match.",
        },
        {
            question: "4. What if I don't get selected?",
            answer:
                "Even if you are not selected for this season, your registration remainsvaluable. When you register for the next season, you will receive anexclusive offer on the registration fee."
        },
        {
            question: "5. Is the fee refundable?",
            answer:
                "The registration fee is non-refundable as it covers your backend processing and kit costs. ",
        },
    ];

    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: {
                "@type": "Answer",
                text: faq.answer,
            },
        })),
    };

    return (
        <section className="w-full bg-[#020617] py-16">
            <Helmet>
                <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
            </Helmet>
            <div className="w-full max-w-7xl mx-auto px-4">
                <div className="text-center mb-10">
                    <h2 className="text-3xl md:text-5xl font-black text-white mb-4 uppercase tracking-tighter font-sans italic drop-shadow-2xl">
                        FREQUENTLY ASKED <span className="text-[#FFC928]">QUESTIONS</span>
                    </h2>
                </div>

                <div className="grid gap-4">
                    <Accordion type="single" collapsible className="w-full space-y-4">
                        {faqs.map((faq, index) => (
                            <AccordionItem
                                key={index}
                                value={`item-${index}`}
                                className="border border-gray-700 border-b-4 border-b-[#FFC928] bg-[#0F172A] rounded-lg overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_0_20px_rgba(255,201,40,0.1)]"
                            >
                                <AccordionTrigger className="text-left text-white font-bold uppercase hover:text-[#FFC928] hover:no-underline py-5 px-6 text-sm md:text-base data-[state=open]:text-[#FFC928]">
                                    {faq.question}
                                </AccordionTrigger>
                                <AccordionContent className="text-gray-300 text-sm md:text-base px-6 pb-6 leading-relaxed bg-[#1e293b]">
                                    {faq.answer}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </div>
        </section>
    );
};

export default RegistrationFAQ;
