import { Quote, Star } from "lucide-react";

const LivesChangedSection = () => {
    const testimonials = [
        {
            id: 1,
            quote: "I played district cricket 20 years ago. No one gave me a chance beyond that. BRPL is building the system I wish I had.",
            name: "VIJAY SINGH",
            role: "FORMER COACH, PUNJAB",
            color: "text-blue-600"
        },
        {
            id: 2,
            quote: "I drive an auto all day. My bat is in the backseat—I hit the nets every evening. BRPL made me believe I wasn't too old or too poor.",
            name: "SURESH KUMAR",
            role: "25, TAMIL NADU",
            color: "text-blue-600"
        },
        {
            id: 3,
            quote: "I'm a night security guard. I practice with a tennis ball during my breaks. BRPL told me talent doesn't have a schedule.",
            name: "MOHAMMAD IRFAN",
            role: "28, UTTAR PRADESH",
            color: "text-blue-600"
        }
    ];

    return (
        <section className="w-full bg-white py-16 px-4 md:px-8 relative">
            <div className="max-w-7xl mx-auto">
                <h2 className="text-center text-4xl md:text-5xl font-extrabold text-[#1e2330] mb-20 uppercase tracking-wide font-display">
                    LIVES CHANGED BY <span className="text-[#FFC928]">BRPL</span>
                </h2>

                {/* Yellow underline decoration */}
                <div className="flex justify-center -mt-16 mb-16">
                    <div className="w-24 h-1.5 bg-[#FFC928] rounded-full"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {testimonials.map((testimonial) => (
                        <div key={testimonial.id} className="bg-white p-8 rounded-2xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] border border-gray-100 flex flex-col h-full hover:-translate-y-1 transition-transform duration-300">

                            {/* Quote Icon */}
                            <div className="bg-[#1e2330] w-12 h-12 rounded-lg flex items-center justify-center mb-6 shadow-md">
                                <Quote className="w-6 h-6 text-[#FFC928] fill-[#FFC928]" />
                            </div>

                            {/* Stars */}
                            <div className="flex gap-1 mb-4">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="w-4 h-4 text-[#FFC928] fill-[#FFC928]" />
                                ))}
                            </div>

                            {/* Quote Text */}
                            <p className="text-[#1e2330] font-medium text-lg mb-8 leading-relaxed italic flex-grow">
                                "{testimonial.quote}"
                            </p>

                            {/* Author details */}
                            <div className="border-t border-gray-100 pt-6 mt-auto">
                                <h4 className="font-bold text-[#1e2330] text-lg uppercase tracking-wide font-display">
                                    {testimonial.name}
                                </h4>
                                <p className="text-[#FFC928] font-bold text-sm uppercase tracking-wider mt-1">
                                    {testimonial.role}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default LivesChangedSection;
