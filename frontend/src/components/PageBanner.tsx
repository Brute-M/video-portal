import React from "react";
import { Link } from "react-router-dom";
import { Home } from "lucide-react";

interface PageBannerProps {
    title: string;
    currentPage: string;
}

const PageBanner: React.FC<PageBannerProps> = ({ title, currentPage }) => {
    return (
        <div className="relative w-full h-auto md:h-[350px] lg:h-[400px] bg-[#111a45] overflow-hidden">
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

            {/* Theme overlay */}
            <div className="absolute inset-0 bg-[#0b2a5b]/70" />

            {/* Content Overlay */}
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
        </div>
    );
};

export default PageBanner;
