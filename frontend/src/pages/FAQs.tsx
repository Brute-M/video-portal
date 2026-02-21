import React, { useState, useEffect } from "react";
import PageBanner from "@/components/PageBanner";
import apiClient from "@/apihelper/api";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

interface FAQ {
    _id: string;
    question: string;
    answer: string;
}

const FAQs = () => {
    const [faqs, setFaqs] = useState<FAQ[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchFAQs = async () => {
            try {
                const response = await apiClient.get('/api/faqs?activeOnly=true');
                if (response.data.success) {
                    setFaqs(response.data.data);
                }
            } catch (error) {
                console.error("Failed to fetch FAQs", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchFAQs();
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <PageBanner pageKey="faqs" title="Frequently Asked Questions" currentPage="FAQs" />

            <div className="max-w-4xl mx-auto px-6 py-16">
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8 md:p-12">
                    <h2 className="text-3xl font-extrabold text-[#111a45] mb-8 text-center">
                        Common Questions
                    </h2>

                    {isLoading ? (
                        <div className="text-center py-8">Loading...</div>
                    ) : faqs.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">No FAQs available at the moment.</div>
                    ) : (
                        <Accordion type="single" collapsible className="w-full space-y-4">
                            {faqs.map((faq, index) => (
                                <AccordionItem key={faq._id} value={`item-${index}`} className="border rounded-lg px-4 bg-slate-50 data-[state=open]:bg-white data-[state=open]:shadow-sm transition-all">
                                    <AccordionTrigger className="text-lg font-semibold text-slate-800 hover:text-yellow-600 text-left">
                                        {faq.question}
                                    </AccordionTrigger>
                                    <AccordionContent className="text-slate-600 text-base leading-relaxed whitespace-pre-wrap">
                                        {faq.answer}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FAQs;
