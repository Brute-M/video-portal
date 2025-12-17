import React from "react";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";

const slides = [
  {
    id: 0,
    // background: "/bg-cricket1.jpg",
    background: "/banner-2.png",
    title: "BHARAT KI LEAGUE",
    subtitle: "BHARTIYO KA SAPNA",
  },
  // {
  //   id: 1,
  //   // background: "/bg-cricket1.jpg",
  //   background: "/banner-2.png",
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
    <div className="relative w-full h-auto md:h-[680px] lg:h-[680px] overflow-hidden font-sans bg-[#020617]">
      <Carousel setApi={setApi} className="h-full">
        <CarouselContent className="h-full">
          {slides.map((slide, index) => (
            <CarouselItem key={slide.id} className="h-full">
              <div className="relative w-full h-full">
                {/* Mobile View Image - Maintains Aspect Ratio */}
                <img
                  src={slide.background}
                  alt="Banner"
                  className="block md:hidden w-full h-auto"
                />

                {/* Desktop Background View */}
                <div
                  className="hidden md:block absolute inset-0 z-0 bg-cover bg-no-repeat"
                  style={{
                    backgroundImage: `url('${slide.background}')`,
                    backgroundPosition: "left center",
                    backgroundSize: "cover",
                  }}
                />

                {/* Shared Overlays (Visible on both Mobile and Desktop) */}
                <div className="absolute inset-0 bg-[#070d1e]/20 pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#020617]/20 via-transparent to-[#020617]/20 pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#020617]/20 via-transparent to-[#020617]/20 pointer-events-none" />

                {/* Content Overlay */}
                <div className="absolute inset-0 z-10 w-full h-full max-w-[1400px] mx-auto px-4 md:px-10 lg:px-16 flex items-center">
                  {/* <div className="absolute left-2 md:left-6 lg:left-10 top-1/2 -translate-y-1/2 hidden md:block select-none pointer-events-none">
                    <span
                      className="block text-[170px] lg:text-[170px] xl:text-[80px] font-black text-transparent leading-none opacity-60 tracking-[0.15em] filter blur-[0.2px]"
                      style={{
                        WebkitTextStroke: "6px rgba(147, 147, 147, 0.63)",
                        writingMode: "vertical-rl",
                        transform: "rotate(180deg)",
                        fontFamily: "Suez One, serif",
                      }}
                    >
                      CRICKET
                    </span>
                  </div> */}

                  <div className="flex flex-col items-center justify-center w-full mx-auto text-center gap-2 md:gap-3 z-20">
                    <h1 className={`text-xl sm:text-3xl md:text-[50px] lg:text-[60px] xl:text-[70px] font-black text-white uppercase leading-tight tracking-wider ${index === current ? 'animate-fade-in-left' : 'opacity-0'}`}
                      style={{
                        textShadow: '0 4px 8px rgba(0,0,0,0.5), 0 0 20px rgba(0,0,0,0.8)'
                      }}
                    >
                      {slide.title}
                    </h1>
                    <h2 className={`text-xl sm:text-3xl md:text-[50px] lg:text-[60px] xl:text-[70px] font-black text-[#FFC928] uppercase leading-tight tracking-wider mt-3 ${index === current ? 'animate-fade-in-right' : 'opacity-0'}`}
                      style={{
                        textShadow: '0 4px 8px rgba(0,0,0,0.5), 0 0 20px rgba(255, 201, 40, 0.4)',
                        animationDelay: "0.2s"
                      }}
                    >
                      {slide.subtitle}
                    </h2>
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