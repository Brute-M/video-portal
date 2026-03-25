import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import apiClient from "@/apihelper/api";

interface FaqItem {
    _id: string;
    question: string;
    answer: string;
    order: number;
}

const fallbackFaqs: FaqItem[] = [
    { _id: "1", question: "Is this Leather Ball or Tennis Ball?", answer: "It is Hard Tennis Ball Cricket. You don't need pads or expensive gear. Just bring your favorite bat and play.", order: 1 },
    { _id: "2", question: "Can I register now and upload video later?", answer: "Yes! You can pay \u20B91499 now to book your slot (before they fill up) and upload your trial video anytime within 7 days from your dashboard.", order: 2 },
    { _id: "3", question: "What is the Age Limit?", answer: "Open for players aged 18 to 40. Each team will include a minimum of 2 players from the 18\u201320 age group, with 1 player in the playing XI for every match.", order: 3 },
    { _id: "4", question: "What if I don't get selected?", answer: "Even if you are not selected for this season, your registration remains valuable. When you register for the next season, you will receive an exclusive offer on the registration fee.", order: 4 },
    { _id: "5", question: "Is the fee refundable?", answer: "The registration fee is non-refundable as it covers your backend processing and kit costs.", order: 5 },
];

const RegistrationFAQ = () => {
    const [faqs, setFaqs] = useState<FaqItem[]>(fallbackFaqs);
    const [titleBefore, setTitleBefore] = useState("FREQUENTLY ASKED");
    const [titleHighlight, setTitleHighlight] = useState("QUESTIONS");

    useEffect(() => {
        apiClient.get("/api/registration-faqs")
            .then(res => {
                if (res.data.success && res.data.data.length > 0) {
                    setFaqs(res.data.data);
                }
                if (res.data.settings) {
                    if (res.data.settings.titleBefore) setTitleBefore(res.data.settings.titleBefore);
                    if (res.data.settings.titleHighlight) setTitleHighlight(res.data.settings.titleHighlight);
                }
            })
            .catch(() => {});
    }, []);

    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((faq, index) => ({
            "@type": "Question",
            name: `${index + 1}. ${faq.question}`,
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
                        {titleBefore} <span className="text-[#FFC928]">{titleHighlight}</span>
                    </h2>
                </div>

                <div className="grid gap-4">
                    <Accordion type="single" collapsible className="w-full space-y-4">
                        {faqs.map((faq, index) => (
                            <AccordionItem
                                key={faq._id}
                                value={`item-${faq._id}`}
                                className="border border-gray-700 border-b-4 border-b-[#FFC928] bg-[#0F172A] rounded-lg overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_0_20px_rgba(255,201,40,0.1)]"
                            >
                                <AccordionTrigger className="text-left text-white font-bold uppercase hover:text-[#FFC928] hover:no-underline py-5 px-6 text-sm md:text-base data-[state=open]:text-[#FFC928]">
                                    {index + 1}. {faq.question}
                                </AccordionTrigger>
                                <AccordionContent className="text-gray-300 text-sm md:text-base p-6 md:p-8 leading-relaxed bg-[#1e293b]">
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
