import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Slider from "react-slick";
import { Quote, Star, ChevronLeft, ChevronRight } from "lucide-react";

// Custom Arrow Components
const PrevArrow = ({ className, style, onClick }: any) => (
    <button
        onClick={onClick}
        className="absolute left-0 top-1/2 -translate-y-1/2 -ml-2 lg:-ml-12 z-20 w-10 h-10 flex items-center justify-center bg-white border border-gray-100 rounded-full shadow-lg text-[#1e2330] hover:bg-[#FFC928] hover:text-black hover:scale-110 transition-all duration-300"
        aria-label="Previous"
    >
        <ChevronLeft className="w-6 h-6" />
    </button>
);

const NextArrow = ({ className, style, onClick }: any) => (
    <button
        onClick={onClick}
        className="absolute right-0 top-1/2 -translate-y-1/2 -mr-2 lg:-mr-12 z-20 w-10 h-10 flex items-center justify-center bg-white border border-gray-100 rounded-full shadow-lg text-[#1e2330] hover:bg-[#FFC928] hover:text-black hover:scale-110 transition-all duration-300"
        aria-label="Next"
    >
        <ChevronRight className="w-6 h-6" />
    </button>
);

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
            quote: "I drive an auto all day. My bat is in the backseat—I hit the nets every evening. BRPL made me believe I wasn’t too old or too poor.",
            name: "SURESH KUMAR",
            role: "25, TAMIL NADU",
            color: "text-blue-600"
        },
        {
            id: 3,
            quote: "I’m a night security guard. I practice with a tennis ball during my breaks. BRPL told me talent doesn’t have a schedule.",
            name: "MOHAMMAD IRFAN",
            role: "28, UTTAR PRADESH",
            color: "text-blue-600"
        },
        {
            id: 4,
            quote: "Playing on Live TV is a dream come true. We always play in the gully. The idea of playing in a real stadium with floodlights gives me goosebumps.",
            name: "AMIT YADAV",
            role: "FAST BOWLER, LUCKNOW",
            color: "text-blue-600"
        },
        {
            id: 5,
            quote: "India's biggest league for sure! The digital skill card feature is very cool. If you love tennis cricket, you cannot miss this.",
            name: "KARTHIK R.",
            role: "CHENNAI",
            color: "text-blue-600"
        }
    ];

    const settings = {
        dots: false,
        infinite: true,
        speed: 600,
        slidesToShow: 3,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 5000,
        prevArrow: <PrevArrow />,
        nextArrow: <NextArrow />,
        responsive: [
            {
                breakpoint: 1280,
                settings: {
                    slidesToShow: 3,
                    slidesToScroll: 1,
                }
            },
            {
                breakpoint: 1024,
                settings: {
                    slidesToShow: 2,
                    slidesToScroll: 1,
                }
            },
            {
                breakpoint: 768,
                settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1,
                    dots: false
                }
            },
            {
                breakpoint: 640,
                settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1,
                    dots: false
                }
            }
        ]
    };

    return (
        <section className="w-full bg-white py-20 px-4 md:px-8 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-2 md:px-4 relative z-10">
                <div className="text-center mb-16 relative">
                    <h2 className="text-3xl md:text-5xl font-black text-[#1e2330] mb-4 uppercase tracking-tighter font-sans italic drop-shadow-2xl">
                        LIVES CHANGED BY <span className="text-[#FFC928]">BRPL</span>
                    </h2>
                </div>

                <div className="slider-container px-2 md:px-4">
                    <Slider {...settings}>
                        {testimonials.map((testimonial) => (
                            <div key={testimonial.id} className="h-full px-4 py-4">
                                <div className="bg-white p-8 rounded-[2rem] shadow-[0_10px_30px_rgba(0,0,0,0.08)] border border-gray-100 flex flex-col h-[420px] relative transition-transform duration-300 hover:-translate-y-1">

                                    {/* Quote Icon Box */}
                                    <div className="bg-[#1e2330] w-14 h-14 rounded-2xl flex items-center justify-center mb-5 shrink-0">
                                        <Quote className="w-6 h-6 text-[#FFC928] fill-[#FFC928]" />
                                    </div>

                                    {/* Stars */}
                                    <div className="flex gap-1 mb-5 shrink-0">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className="w-5 h-5 text-[#FFC928] fill-[#FFC928]" />
                                        ))}
                                    </div>

                                    {/* Quote Text */}
                                    <div className="flex-grow overflow-y-auto custom-scrollbar mb-6">
                                        <p className="text-[#1e2330] font-bold text-lg leading-tight">
                                            "{testimonial.quote}"
                                        </p>
                                    </div>

                                    {/* Divider */}
                                    <div className="w-full h-px bg-gray-200 mb-6 shrink-0" />

                                    {/* Author details */}
                                    <div className="mt-auto shrink-0">
                                        <h4 className="font-extrabold text-[#1e2330] text-xl uppercase tracking-wide font-display italic">
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
