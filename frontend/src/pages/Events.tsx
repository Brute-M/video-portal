import { useState, useMemo, useEffect } from "react";
import { Calendar, MapPin, ArrowRight, X, Play, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageBanner from "@/components/PageBanner";
import Lightbox from "yet-another-react-lightbox";
import Video from "yet-another-react-lightbox/plugins/video";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Counter from "yet-another-react-lightbox/plugins/counter";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import "yet-another-react-lightbox/plugins/captions.css";
import "yet-another-react-lightbox/plugins/counter.css";
import api from "@/apihelper/api";

const Events = () => {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [lightboxIndex, setLightboxIndex] = useState(-1);
    const [activeFilter, setActiveFilter] = useState('All');

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const response = await api.get('/api/events');
                if (response.data && response.data.data) {
                    setEvents(response.data.data);
                }
            } catch (error) {
                console.error('Failed to fetch events', error);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    const openGallery = (event: any) => {
        setSelectedEvent(event);
        setLightboxIndex(0);
    };

    const slides = useMemo(() => {
        if (!selectedEvent) return [];
        return selectedEvent.media.map((item: any) => {
            if (item.type === 'video') {
                return {
                    type: "video",
                    width: item.width || 1280,
                    height: item.height || 720,
                    poster: item.poster,
                    sources: [{ src: item.src, type: 'video/mp4' }], // Adjust if needed
                    title: selectedEvent.title,
                    description: `${selectedEvent.date} - ${selectedEvent.location}`
                };
            }
            return {
                src: item.src,
                width: item.width || 1200, // Fallback if 0
                height: item.height || 800,
                title: selectedEvent.title,
                description: `${selectedEvent.date} - ${selectedEvent.location}`
            };
        });
    }, [selectedEvent]);

    const filteredEvents = activeFilter === 'All'
        ? events
        : events.filter(event => event.category?.toLowerCase() === activeFilter.toLowerCase());

    // Extract unique categories for filter
    const categories = ['All', ...Array.from(new Set(events.map(e => e.category)))];

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <PageBanner title="Events" currentPage="Events" />

            {/* Gallery Section */}
            <section className="py-16 px-4 md:px-8 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                    <div>
                        <h2 className="text-3xl font-bold text-[#111a45] uppercase tracking-wide mb-2">
                            Event <span className="text-[#FFC928]">Gallery</span>
                        </h2>
                        <div className="h-1.5 w-24 bg-[#FFC928] rounded-full"></div>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                        {categories.map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setActiveFilter(filter)}
                                className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all 
                                    ${activeFilter === filter
                                        ? "bg-[#111a45] text-white border-[#111a45]"
                                        : "bg-white text-gray-600 border-gray-200 hover:bg-[#111a45] hover:text-white hover:border-[#111a45]"
                                    }`}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="w-10 h-10 animate-spin text-[#111A45]" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredEvents.length === 0 ? (
                            <div className="col-span-full text-center py-10 text-gray-500">
                                No events found.
                            </div>
                        ) : (
                            filteredEvents.map((event) => (
                                <div key={event._id} className="group relative bg-white rounded-2xl overflow-hidden shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] hover:shadow-xl transition-all duration-500 hover:-translate-y-2 border border-gray-100">
                                    <div className="relative h-64 overflow-hidden">
                                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors z-10" />
                                        <img
                                            src={event.image}
                                            alt={event.title}
                                            onClick={() => openGallery(event)}
                                            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 cursor-pointer"
                                        />
                                        <div className="absolute top-4 left-4 z-20 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-[#111a45]">
                                            {event.category}
                                        </div>
                                    </div>

                                    <div className="p-6 relative">
                                        <h3 className="text-xl font-bold text-[#111a45] mb-3 group-hover:text-blue-700 transition-colors">
                                            {event.title}
                                        </h3>

                                        <div className="space-y-2 mb-6">
                                            <div className="flex items-center text-gray-500 text-sm">
                                                <Calendar className="w-4 h-4 mr-2 text-[#FFC928]" />
                                                {event.date}
                                            </div>
                                            <div className="flex items-center text-gray-500 text-sm">
                                                <MapPin className="w-4 h-4 mr-2 text-[#FFC928]" />
                                                {event.location}
                                            </div>
                                        </div>

                                        <Button
                                            onClick={() => openGallery(event)}
                                            className="w-full bg-gray-50 text-[#111a45] hover:bg-[#111a45] hover:text-white border border-gray-200 group-hover:border-[#111a45] transition-all duration-300 font-semibold flex items-center justify-between"
                                        >
                                            View Details
                                            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </section>

            {/* Lightbox for Fullscreen View */}
            {selectedEvent && (
                <Lightbox
                    open={lightboxIndex >= 0}
                    index={lightboxIndex}
                    close={() => setLightboxIndex(-1)}
                    slides={slides}
                    plugins={[Video, Thumbnails, Captions, Counter, Zoom]}
                    carousel={{ finite: false }}
                    animation={{ fade: 250 }}
                    controller={{ closeOnBackdropClick: true }}
                    styles={{
                        container: { backgroundColor: "rgba(0, 0, 0, 0.95)" }
                    }}
                />
            )}
        </div>
    );
};

export default Events;