import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
    type CarouselApi,
} from "@/components/ui/carousel";
import { ArrowRight, MapPin, Calendar } from "lucide-react";

// Mock data or reused from Events - selecting 5 impactful images
const galleryEvents = [
    {
        id: 1,
        image: "https://brpl-public-uploads.s3.ap-south-1.amazonaws.com/DSC03663+.jpg", // Stadium/Cricket generic
        title: "Launch Event",
        date: "March 15, 2026",
        location: "New Delhi"
    },
    {
        id: 2,
        image: "https://brpl-public-uploads.s3.ap-south-1.amazonaws.com/DSC03331.jpg", // Cricket action
        title: "Launch Event",
        date: "March 15, 2026",
        location: "New Delhi"
    },
    {
        id: 3,
        image: "https://brpl-public-uploads.s3.ap-south-1.amazonaws.com/DSC03756.jpg", // Cricket crowd/team
        title: "Launch Event",
        date: "March 15, 2026",
        location: "New Delhi"
    },
    {
        id: 4,
        image: "https://brpl-public-uploads.s3.ap-south-1.amazonaws.com/DSC03335.jpg", // Sports general
        title: "Launch Event",
        date: "March 15, 2026",
        location: "New Delhi"
    },
    {
        id: 5,
        image: "https://brpl-public-uploads.s3.ap-south-1.amazonaws.com/DSC03549.jpg", // Trophy/Award
        title: "Launch Event",
        date: "March 15, 2026",
        location: "New Delhi"
    }
];

const EventGallerySlider: React.FC = () => {
    const [api, setApi] = useState<CarouselApi>();

    useEffect(() => {
        if (!api) {
            return;
        }

        const intervalId = setInterval(() => {
            api.scrollNext();
        }, 3000); // Auto-slide every 3 seconds

        return () => clearInterval(intervalId);
    }, [api]);

    return (
        <section className="relative w-full">
            {/* Background styling reused from PointsTable */}
            <div className="relative py-10 md:py-12 lg:py-16 px-4 md:px-8 lg:px-12 overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: "url('/artist.png')" }}
                />
                {/* Dark tint for text readability */}
                <div className="absolute inset-0 bg-[#020617]/60" />

                <div className="relative max-w-7xl mx-auto">
                    {/* Section Header */}
                    <div className="flex flex-col items-center mb-10 text-center">
                        {/* Using 'Rye' font to match Points Table title style if available globally, otherwise fallback */}
                        <h2
                            className="text-white text-3xl md:text-4xl lg:text-[40px] font-extrabold tracking-[0.05em] mb-4"
                            style={{ fontFamily: "'Rye', serif" }}
                        >
                            BRPL Event Gallery
                        </h2>
                        <div className="h-1 w-24 bg-[#FFC928] rounded-full" />
                        <p className="text-center text-amber-500 font-bold uppercase tracking-wider text-sm md:text-base mt-4 italic">
                            Bharat ki League, Bharatiyon ka Sapna
                        </p>
                    </div>

                    {/* Carousel */}
                    <Carousel
                        setApi={setApi}
                        opts={{
                            align: "start",
                            loop: true,
                        }}
                        className="w-full"
                    >
                        <CarouselContent className="-ml-4">
                            {galleryEvents.map((event) => (
                                <CarouselItem key={event.id} className="pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                                    <div className="group relative h-[350px] rounded-xl overflow-hidden cursor-pointer shadow-xl border border-white/10">
                                        {/* Image */}
                                        <img
                                            src={event.image}
                                            alt={event.title}
                                            loading="lazy"
                                            decoding="async"
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />

                                        {/* Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-95 transition-opacity" />

                                        {/* Content */}
                                        <div className="absolute bottom-0 left-0 w-full p-4 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                            <h3 className="text-white text-xl font-bold mb-2 leading-tight">{event.title}</h3>
                                            <div className="space-y-1 mb-3">
                                                <div className="flex items-center text-gray-300 text-xs">
                                                    <Calendar className="w-3 h-3 mr-1.5 text-[#FFC928]" />
                                                    {event.date}
                                                </div>
                                                <div className="flex items-center text-gray-300 text-xs">
                                                    <MapPin className="w-3 h-3 mr-1.5 text-[#FFC928]" />
                                                    {event.location}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>

                        {/* Custom Navigation Buttons (positioned outside or styled nicer) */}
                        <div className="hidden md:block">
                            <CarouselPrevious className="left-[-20px] bg-white/10 hover:bg-[#FFC928] hover:text-black border-none text-white h-10 w-10" />
                            <CarouselNext className="right-[-20px] bg-white/10 hover:bg-[#FFC928] hover:text-black border-none text-white h-10 w-10" />
                        </div>
                    </Carousel>

                    {/* View More Button */}
                    <div className="mt-12 text-center">
                        <Link to="/events">
                            <button className="group relative inline-flex items-center justify-center px-8 py-3 font-bold text-white transition-all duration-200 bg-[#FFC928] font-sans uppercase tracking-widest rounded-full hover:bg-white hover:text-[#111a45] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FFC928]">
                                <span className="mr-2 text-[#111a45]">View More</span>
                                <ArrowRight className="w-4 h-4 text-[#111a45] group-hover:translate-x-1 transition-transform" />
                            </button>
                        </Link>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default EventGallerySlider;
