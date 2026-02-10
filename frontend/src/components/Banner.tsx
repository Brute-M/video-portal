import React, { useState } from "react";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Play, UserPlus } from "lucide-react";
import VideoModal from "./VideoModal";

const slides = [
  {
    id: 0,
    background: "/banner-brpl.jpeg",
    // title: "BRPL", // Brand Name
    // subtitle: "Bharat ki League, Bharatiyon ka Sapna", // Slogan
  },
  // {
  //   id: 1,
  //   background: "/banner.png",
  // },
  // {
  //   id: 1,
  //   // background: "/bg-cricket1.jpg",
  //   // background: "/banner-2.png",
  //   title: "BHARAT KI LEAGUE",
  //   subtitle: "BHARTIYO KA SAPNA",
  // },
  // {
  //   id: 2,
  //   background: "/bg-cricket1.jpg",
  //   // background: "/banner.png",
  //   title: "BHARAT KI LEAGUE",
  //   subtitle: "BHARTIYO KA SAPNA",
  // },
];

const Banner = () => {
  const [api, setApi] = React.useState<CarouselApi | null>(null);
  const [current, setCurrent] = React.useState(0);
  const [scrollSnaps, setScrollSnaps] = React.useState<number[]>([]);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  React.useEffect(() => {
    if (!api) return;

    setScrollSnaps(api.scrollSnapList());
    setCurrent(api.selectedScrollSnap());

    const onSelect = () => {
      setCurrent(api.selectedScrollSnap());
    };

    api.on("select", onSelect);

    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  React.useEffect(() => {
    if (!api) return;

    const interval = setInterval(() => {
      api.scrollNext();
    }, 6000);

    return () => clearInterval(interval);
  }, [api]);

  const handleDotClick = (index: number) => {
    if (!api) return;
    api.scrollTo(index);
  };

  return (
    <div className="relative w-full h-auto overflow-hidden font-sans bg-[#020617]">
      <Carousel setApi={setApi} className="h-full">
        <CarouselContent className="h-full">
          {slides.map((slide, index) => (
            <CarouselItem key={slide.id} className="h-full">
              <div className="relative w-full h-auto md:h-full overflow-hidden">
                {/* Image - Maintains Aspect Ratio on all devices */}
                <img
                  src={slide.background}
                  alt="Banner"
                  className={`w-full h-auto object-cover transition-transform duration-[10000ms] ease-out ${index === current ? 'scale-110' : 'scale-100'}`}
                />

                {/* Content Overlay */}
                <div className="relative md:absolute md:inset-0 z-10 w-full h-auto md:h-full max-w-[1400px] mx-auto px-4 md:px-10 lg:px-16 flex flex-col justify-end items-center md:items-end py-4 md:pb-12">
                  <div className="flex flex-col items-center md:items-end justify-center w-full gap-8 md:gap-10 z-20">
                    {/* Branding Text */}
                    {/* {slide.title && (
                      <div className="text-center md:text-right space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
                        <h1 className="text-5xl md:text-7xl lg:text-9xl font-black text-white tracking-tighter drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">
                          {slide.title}
                        </h1>
                        <p className="text-xl md:text-3xl lg:text-4xl font-bold text-amber-500 tracking-wide uppercase drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                          {slide.subtitle}
                        </p>
                      </div>
                    )} */}

                    {/* Buttons Container */}
                    <div className="flex flex-row gap-4 w-full justify-center md:justify-end">
                      <Link to="/registration">
                        <Button
                          size="lg"
                          className="bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs md:text-sm px-4 md:px-6 h-10 md:h-12 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.5)] transform hover:scale-105 transition-all duration-300 flex items-center justify-center"
                        >
                          <span>REGISTER NOW</span>
                        </Button>
                      </Link>

                      <Button
                        variant="outline"
                        size="lg"
                        className="bg-transparent border-2 border-white text-white hover:bg-white/10 hover:text-white font-bold text-xs md:text-sm px-4 md:px-6 h-10 md:h-12 rounded-full backdrop-blur-sm transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
                        onClick={() => setIsVideoModalOpen(true)}
                      >
                        <Play className="w-5 h-5 fill-current" />
                        <span>PLAY VIDEO</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      <VideoModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        videoSrc="https://brpl-public-uploads.s3.ap-south-1.amazonaws.com/BRPL_Launch_Film.mp4"
      />

      {/* <div className="absolute bottom-7 md:bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
        {scrollSnaps.map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => handleDotClick(index)}
            className="focus:outline-none"
          >
            {index === current ? (
              <div className="w-14 h-[6px] rounded-full bg-white shadow-[0_0_8px_rgba(0,0,0,0.7)]" />
            ) : (
              <div className="w-14 h-[6px] rounded-full border border-white bg-transparent" />
            )}
          </button>
        ))}
      </div> */}
    </div>
  );
};

export default Banner;
