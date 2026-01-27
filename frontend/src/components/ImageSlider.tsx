import { useState } from "react";
import Slider from "react-slick";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const ImageSlider = () => {
    const [index, setIndex] = useState(-1);

    // JSON configuration for images
    const sliderImages = [
        { id: 1, src: "https://brpl-public-uploads.s3.ap-south-1.amazonaws.com/1.jpg", alt: "Slide 1" },
        { id: 2, src: "https://brpl-public-uploads.s3.ap-south-1.amazonaws.com/2.jpg", alt: "Slide 2" },
        { id: 3, src: "https://brpl-public-uploads.s3.ap-south-1.amazonaws.com/3.jpg", alt: "Slide 3" },
        { id: 4, src: "https://brpl-public-uploads.s3.ap-south-1.amazonaws.com/4.jpg", alt: "Slide 4" },
        { id: 5, src: "https://brpl-public-uploads.s3.ap-south-1.amazonaws.com/5.jpg", alt: "Slide 5" },
        // { id: 6, src: "https://brpl-public-uploads.s3.ap-south-1.amazonaws.com/6.jpg", alt: "Slide 6" },
        { id: 7, src: "https://brpl-public-uploads.s3.ap-south-1.amazonaws.com/7.jpg", alt: "Slide 7" },
        { id: 8, src: "https://brpl-public-uploads.s3.ap-south-1.amazonaws.com/8.jpg", alt: "Slide 8" },
        { id: 9, src: "https://brpl-public-uploads.s3.ap-south-1.amazonaws.com/9.jpg", alt: "Slide 9" },
    ];

    const sliderSettings = {
        dots: false,
        infinite: true,
        slidesToShow: 4, // Desktop: 4 slides
        slidesToScroll: 1,
        autoplay: true,
        speed: 2000,
        autoplaySpeed: 2000,
        cssEase: "linear",
        pauseOnHover: false,
        arrows: false,
        responsive: [
            {
                breakpoint: 1024,
                settings: {
                    slidesToShow: 3,
                    slidesToScroll: 1,
                }
            },
            {
                breakpoint: 640, // Mobile breakpoint
                settings: {
                    slidesToShow: 1, // Mobile: 1 slide
                    slidesToScroll: 1,
                    initialSlide: 0,
                    dots: true,
                }
            }
        ]
    };

    return (
        <section className="w-full py-16 px-0 md:px-8 relative overflow-hidden border-t border-gray-800">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/40 via-[#1e2330] to-[#1e2330] pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="w-full relative z-10 px-4 md:px-4">
                    <Slider {...sliderSettings}>
                        {sliderImages.map((image, i) => (
                            <div
                                key={image.id}
                                className="px-1 md:px-2 focus:outline-none cursor-pointer"
                                onClick={() => setIndex(i)}
                            >
                                <div className="rounded-xl overflow-hidden h-[200px] md:h-[200px] flex items-center justify-center bg-transparent">
                                    <img
                                        src={image.src}
                                        alt={image.alt}
                                        className="h-full w-full object-cover rounded-xl"
                                        loading="lazy"
                                    />
                                </div>
                            </div>
                        ))}
                    </Slider>
                </div>
            </div>

            <Lightbox
                index={index}
                slides={sliderImages}
                open={index >= 0}
                close={() => setIndex(-1)}
            />
        </section>
    );
};

export default ImageSlider;
