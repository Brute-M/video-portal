import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Slider from "react-slick";
import { Quote, Star } from "lucide-react";

const LivesChangedSection = () => {
    const testimonials = [
        {
            id: 1,
            quote: "Finally, a league with zero politics! I have played many local tournaments where selection depends on who you know. But BRPL’s AI-based selection process is a game changer. I uploaded my video and got a fair analysis. Knowing that my talent counts more than connections gives me so much confidence. Can't wait for the trials!",
            name: "RAHUL SHARMA",
            role: "BATTER, DELHI",
            color: "text-blue-600"
        },
        {
            id: 2,
            quote: "Worth every rupee. The free kit is amazing. Honestly, I was thinking twice about the ₹1499 fee. But when I registered and saw that I get a premium Jersey and a branded Tennis Ball included, it felt like a no-brainer. Plus, the chance to play for ₹3 Crores? Best investment for my cricket passion.",
            name: "SAMEER KHAN",
            role: "ALL-ROUNDER, MUMBAI",
            color: "text-blue-600"
        },
        {
            id: 3,
            quote: "My second innings has officially started! Working in IT, I thought my cricket days were over. BRPL gave me hope again. The fact that there are no heavy pads and it's pure tennis ball cricket makes it perfect for players like me who still have the touch but left professional cricket years ago. See you at the stadium!",
            name: "VIKRAM PATEL",
            role: "SOFTWARE ENGINEER, AHMEDABAD",
            color: "text-blue-600"
        },
        {
            id: 4,
            quote: "Playing on Live TV is a dream come true. We always play in the gully or small grounds. The idea of playing in a real stadium with floodlights and cameras gives me goosebumps. Thank you BRPL for giving tennis ball cricketers this massive platform. Tyari shuru!",
            name: "AMIT YADAV",
            role: "FAST BOWLER, LUCKNOW",
            color: "text-blue-600"
        },
        {
            id: 5,
            quote: "India's biggest league for sure! Registered yesterday. The process was super smooth. The digital skill card feature is very cool. If you love tennis cricket, you cannot miss this.",
            name: "KARTHIK R.",
            role: "CHENNAI",
            color: "text-blue-600"
        }
    ];

    const settings = {
        dots: true,
        infinite: true,
        speed: 500,
        slidesToShow: 3,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 5000,
        responsive: [
            {
                breakpoint: 1024,
                settings: {
                    slidesToShow: 2,
                    slidesToScroll: 1,
                    infinite: true,
                    dots: true
                }
            },
            {
                breakpoint: 768,
                settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1
                }
            }
        ]
    };

    return (
        <section className="w-full bg-white py-16 px-4 md:px-8 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4">
                <h2 className="text-center text-4xl md:text-5xl font-extrabold text-[#1e2330] mb-20 uppercase tracking-wide font-display">
                    LIVES CHANGED BY <span className="text-[#FFC928]">BRPL</span>
                </h2>

                {/* Yellow underline decoration */}
                <div className="flex justify-center -mt-16 mb-16">
                    <div className="w-24 h-1.5 bg-[#FFC928] rounded-full"></div>
                </div>

                <div className="slider-container pb-10">
                    <Slider {...settings}>
                        {testimonials.map((testimonial) => (
                            <div key={testimonial.id} className="h-full px-4 pt-2 pb-8">
                                <div className="bg-white p-8 rounded-2xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] border border-gray-100 flex flex-col h-[450px] hover:-translate-y-1 transition-transform duration-300">

                                    {/* Quote Icon */}
                                    <div className="bg-[#1e2330] w-12 h-12 rounded-lg flex items-center justify-center mb-6 shadow-md shrink-0">
                                        <Quote className="w-6 h-6 text-[#FFC928] fill-[#FFC928]" />
                                    </div>

                                    {/* Stars */}
                                    <div className="flex gap-1 mb-4 shrink-0">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className="w-4 h-4 text-[#FFC928] fill-[#FFC928]" />
                                        ))}
                                    </div>

                                    {/* Quote Text */}
                                    <div className="flex-grow overflow-y-auto custom-scrollbar mb-6">
                                        <p className="text-[#1e2330] font-medium text-base leading-relaxed italic">
                                            "{testimonial.quote}"
                                        </p>
                                    </div>

                                    {/* Author details */}
                                    <div className="border-t border-gray-100 pt-6 mt-auto shrink-0">
                                        <h4 className="font-bold text-[#1e2330] text-lg uppercase tracking-wide font-display">
                                            {testimonial.name}
                                        </h4>
                                        <p className="text-[#FFC928] font-bold text-sm uppercase tracking-wider mt-1">
                                            {testimonial.role}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </Slider>
                </div>
            </div>
        </section>
    );
};

export default LivesChangedSection;
