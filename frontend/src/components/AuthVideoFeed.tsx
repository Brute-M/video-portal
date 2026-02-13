import { Play, ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

const AuthVideoFeed = () => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [selectedVideo, setSelectedVideo] = useState<any>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { current } = scrollRef;
            const scrollAmount = current.clientWidth * 0.8; // Scroll 80% of width
            current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    const videos = [
        {
            id: 1,
            // title: "Season 2025 Grand Finale Highlights",
            thumbnail: "/banner-brpl.jpeg",
            duration: "10:24",
            videoSrc: "https://brpl-public-uploads.s3.ap-south-1.amazonaws.com/BRPL_Launch_Film.mp4"
        },
        {
            id: 2,
            // title: "Best Catches of the Tournament",
            thumbnail: "/about-us.png",
            duration: "05:12",
            videoSrc: "https://brpl-public-uploads.s3.ap-south-1.amazonaws.com/BRPL_Launch_Film.mp4"
        },
        {
            id: 3,
            // title: "Opening Ceremony Spectacular",
            thumbnail: "/banner-new.png",
            duration: "15:30",
            videoSrc: "https://brpl-public-uploads.s3.ap-south-1.amazonaws.com/BRPL_Launch_Film.mp4"
        },
        {
            id: 4,
            // title: "Top 10 Sixes - Week 4",
            thumbnail: "/banner-2.png",
            duration: "03:45",
            videoSrc: "https://brpl-public-uploads.s3.ap-south-1.amazonaws.com/BRPL_Launch_Film.mp4"
        }
    ];

    return (
        <div className="w-full mt-auto pt-8 pb-4 bg-black/40 backdrop-blur-md border-t border-white/10 relative">
            <div className="flex items-center justify-center px-4">
                <h2 className="text-center text-3xl md:text-5xl font-black text-white mb-12 uppercase tracking-tighter font-sans italic drop-shadow-2xl">
                    Latest <span className="text-[#FFC928]">Videos</span>
                </h2>
            </div>

            <div
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto pb-6 px-6 scrollbar-hide snap-x justify-start md:justify-center"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {videos.map((video) => (
                    <Dialog key={video.id}>
                        <DialogTrigger asChild>
                            <div
                                className="group relative flex-shrink-0 w-[85vw] sm:w-[280px] h-[160px] rounded-xl overflow-hidden border border-white/10 cursor-pointer snap-center md:snap-start transition-all duration-300 bg-black/50"
                                onClick={() => setSelectedVideo(video)}
                            >
                                {/* Thumbnail Image */}
                                <img
                                    src={video.thumbnail}
                                    // alt={video.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                                />

                                {/* Overlay Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent group-hover:via-transparent transition-all" />

                                {/* Play Button Overlay */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-12 h-12 bg-[#FFC928]/90 rounded-full flex items-center justify-center shadow-lg text-black transform group-hover:scale-110 transition-transform duration-300 backdrop-blur-sm">
                                        <Play className="w-5 h-5 fill-black ml-1" />
                                    </div>
                                </div>

                                {/* Content Bottom */}
                                <div className="absolute bottom-0 left-0 w-full p-4 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                    <div className="flex justify-between items-end">
                                        {/* <h4 className="text-white font-bold text-sm leading-tight line-clamp-2 drop-shadow-md group-hover:text-[#FFC928] transition-colors text-left">
                                            {video.title}
                                        </h4> */}
                                        <span className="text-[10px] bg-black/60 text-white px-2 py-0.5 rounded backdrop-blur-sm border border-white/10 ml-2 whitespace-nowrap">
                                            {video.duration}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[800px] bg-black border-white/20 p-0 overflow-hidden">
                            <div className="relative w-full aspect-video bg-black flex items-center justify-center">
                                <video
                                    src={video.videoSrc}
                                    controls
                                    autoPlay
                                    className="w-full h-full object-contain"
                                >
                                    Your browser does not support the video tag.
                                </video>
                            </div>
                            <div className="p-4 bg-[#1a1a1a]">
                                {/* <h3 className="text-xl font-bold text-white mb-2">{video.title}</h3> */}
                                <p className="text-gray-400 text-sm">Duration: {video.duration}</p>
                            </div>
                        </DialogContent>
                    </Dialog>
                ))}
            </div>

            {/* Mobile Navigation Buttons */}
            <div className="flex justify-center gap-4 mt-2 md:hidden relative z-20 pb-4">
                <button
                    onClick={() => scroll('left')}
                    className="bg-white/10 backdrop-blur-md border border-white/20 p-2 rounded-full hover:bg-[#FFC928] hover:text-black hover:border-[#FFC928] transition-all duration-300 group"
                    aria-label="Previous Video"
                >
                    <ChevronLeft className="w-5 h-5 text-white group-hover:text-black" />
                </button>
                <button
                    onClick={() => scroll('right')}
                    className="bg-white/10 backdrop-blur-md border border-white/20 p-2 rounded-full hover:bg-[#FFC928] hover:text-black hover:border-[#FFC928] transition-all duration-300 group"
                    aria-label="Next Video"
                >
                    <ChevronRight className="w-5 h-5 text-white group-hover:text-black" />
                </button>
            </div>
        </div>
    );
};

export default AuthVideoFeed;
