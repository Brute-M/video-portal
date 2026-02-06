import React, { useState } from "react";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Play } from "lucide-react";
import VideoModal from "./VideoModal";

const slides = [
  {
    id: 0,
    background: "/banner-brpl.jpeg",
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
              <div className="relative w-full h-full overflow-hidden">
                {/* Image - Maintains Aspect Ratio on all devices */}
                <img
                  src={slide.background}
                  alt="Banner"
                  className={`w-full h-auto object-cover transition-transform duration-[10000ms] ease-out ${index === current ? 'scale-110' : 'scale-100'}`}
                />

                {/* Content Overlay */}
                <div className="absolute inset-0 z-10 w-full h-full max-w-[1400px] mx-auto px-4 md:px-10 lg:px-16 flex items-end md:items-center pb-8 md:pb-0">
                  <div className="flex flex-col items-start justify-center w-full gap-4 md:gap-6 z-20">
                    {/* Buttons Container */}
                    <div className="flex flex-col sm:flex-row gap-4 mt-auto md:mt-0 ml-4 md:ml-0">
                      <Link to="/registration">
                        <Button
                          size="lg"
                          className="bg-amber-500 hover:bg-amber-600 text-black font-bold text-base md:text-lg px-8 h-12 md:h-14 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.5)] transform hover:scale-105 transition-all duration-300"
                        >
                          REGISTER NOW
                        </Button>
                      </Link>

                      <Button
                        variant="outline"
                        size="lg"
                        className="bg-transparent border-2 border-white text-white hover:bg-white/10 hover:text-white font-bold text-base md:text-lg px-8 h-12 md:h-14 rounded-full backdrop-blur-sm transform hover:scale-105 transition-all duration-300 gap-2"
                        onClick={() => setIsVideoModalOpen(true)}
                      >
                        <Play className="w-5 h-5 fill-current" />
                        PLAY VIDEO
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
        videoSrc="https://brpl-public-uploads.s3.ap-south-1.amazonaws.com/teams-video.mp4"
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
