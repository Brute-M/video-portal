import React from "react";
import { Link } from "react-router-dom";
import { Home, ChevronDown } from "lucide-react";

interface PageBannerProps {
    title: string;
    currentPage: string;
    videoSrc?: string;
    scrollToId?: string;
}

const PageBanner: React.FC<PageBannerProps> = ({ title, currentPage, videoSrc, scrollToId }) => {
    const handleScrollDown = () => {
        if (scrollToId) {
            const element = document.getElementById(scrollToId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        } else {
            window.scrollTo({
                top: window.innerHeight,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className={`relative w-full ${videoSrc ? 'h-[80vh]' : 'h-auto md:h-[350px] lg:h-[400px]'} bg-[#111a45] overflow-hidden`}>
            {videoSrc ? (
                <>
                    {/* Video Background */}
                    <video
                        src={videoSrc}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover"
                    />

                    {/* Scroll Down Arrow */}
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 animate-bounce cursor-pointer" onClick={handleScrollDown}>
                        <ChevronDown className="w-10 h-10 text-[#FFD700] opacity-80 hover:opacity-100 transition-opacity" />
                    </div>
                </>
            ) : (
                <>
                    {/* Mobile Background Image - Maintains Aspect Ratio */}
                    <img
                        src="/tenis.png"
                        alt="Banner"
                        className="block md:hidden w-full h-[150px] object-cover"
                    />

                    {/* Desktop Background Image - Full Opacity */}
                    <div
                        className="hidden md:block absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: "url('/tenis.png')" }}
                    />
                </>
            )}

            {/* Theme overlay - Only show if NO video */}
            {!videoSrc && <div className="absolute inset-0 bg-[#0b2a5b]/70" />}

            {/* Content Overlay - Only show if NO video */}
            {!videoSrc && (
                <div className="absolute inset-0 z-10 container mx-auto px-4 md:px-8 lg:px-12 flex flex-col justify-center h-full">
                    <h1
                        className="text-white text-3xl sm:text-4xl md:text-6xl lg:text-[64px] font-bold uppercase tracking-tight mb-3 mt-8"
                        style={{ fontFamily: "'Oswald', sans-serif" }}
                    >
                        {title}
                    </h1>

                    {/* Breadcrumb */}
                    <div className="flex items-center gap-3 text-white text-base md:text-lg font-medium tracking-wide">
                        <Link to="/" className="hover:text-yellow-400 transition-colors flex items-center">
                            <Home className="w-5 h-5 mb-0.5" fill="currentColor" />
                        </Link>
                        <span className="opacity-80">/</span>
                        <span className="text-white">{currentPage}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PageBanner;
