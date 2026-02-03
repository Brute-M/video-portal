import React from "react";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

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
                <div className="absolute inset-0 z-10 w-full h-full max-w-[1400px] mx-auto px-4 md:px-10 lg:px-16 flex items-center">
                  <div className="flex flex-col items-center justify-center w-full mx-auto text-center gap-2 md:gap-3 z-20">
                    {/* Overlay content is currently empty/commented out in original but keeping structure */}
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

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