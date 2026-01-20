import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, Image, Upload, X } from "lucide-react";
import api from "@/apihelper/api"; // Centralized API instance

const createEvent = async (formData: FormData) => {
    return api.post('/api/events/create', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        }
    });
};

const getEvents = async () => {
    return api.get('/api/events');
};

const deleteEvent = async (id: string) => {
    return api.delete(`/api/events/${id}`);
};

interface Event {
    _id: string;
    title: string;
    date: string;
    location: string;
    category: string;
    image: string;
    media: any[];
}

const AdminEvents = () => {
    const { toast } = useToast();
    const [events, setEvents] = useState<Event[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [title, setTitle] = useState("");
    const [date, setDate] = useState("");
    const [location, setLocation] = useState("");
    const [category, setCategory] = useState("");

    // File State
    const [bannerImage, setBannerImage] = useState<File | null>(null);
    const [bannerPreview, setBannerPreview] = useState<string | null>(null);

    const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
    const [galleryPreviews, setGalleryPreviews] = useState<{ url: string, type: string }[]>([]);

    useEffect(() => {
        fetchEvents();
        return () => {
            // Cleanup object URLs on unmount
            if (bannerPreview) URL.revokeObjectURL(bannerPreview);
            galleryPreviews.forEach(p => URL.revokeObjectURL(p.url));
        };
    }, []);

    const fetchEvents = async () => {
        setIsLoading(true);
        try {
            const response = await getEvents();
            if (response.data && response.data.data) {
                setEvents(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching events:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to fetch events.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setBannerImage(file);
            setBannerPreview(URL.createObjectURL(file));
        }
    };

    const removeBanner = () => {
        setBannerImage(null);
        if (bannerPreview) {
            URL.revokeObjectURL(bannerPreview);
            setBannerPreview(null);
        }
    };

    const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setGalleryFiles(prev => [...prev, ...newFiles]);

            const newPreviews = newFiles.map(file => ({
                url: URL.createObjectURL(file),
                type: file.type.startsWith('video') ? 'video' : 'image'
            }));
            setGalleryPreviews(prev => [...prev, ...newPreviews]);
        }
    };

    const removeGalleryItem = (index: number) => {
        const fileToRemove = galleryFiles[index]; // Keep ref if needed, mainly just removing from array
        // URL cleanup
        URL.revokeObjectURL(galleryPreviews[index].url);

        const newFiles = galleryFiles.filter((_, i) => i !== index);
        const newPreviews = galleryPreviews.filter((_, i) => i !== index);

        setGalleryFiles(newFiles);
        setGalleryPreviews(newPreviews);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!bannerImage) {
            toast({
                variant: "destructive",
                title: "Validation Error",
                description: "Please upload a banner image.",
            });
            return;
        }

        setIsSubmitting(true);
        const formData = new FormData();
        formData.append("title", title);
        formData.append("date", date);
        formData.append("location", location);
        formData.append("category", category);
        formData.append("image", bannerImage);

        galleryFiles.forEach((file) => {
            formData.append("gallery", file);
        });

        try {
            await createEvent(formData);
            toast({
                title: "Success",
                description: "Event created successfully.",
            });
            // Reset form
            setTitle("");
            setDate("");
            setLocation("");
            setCategory("");
            removeBanner();
            // Clear gallery
            galleryPreviews.forEach(p => URL.revokeObjectURL(p.url));
            setGalleryFiles([]);
            setGalleryPreviews([]);

            // Refresh list
            fetchEvents();
        } catch (error) {
            console.error("Error creating event:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to create event. Please try again.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this event?")) return;

        try {
            await deleteEvent(id);
            toast({
                title: "Deleted",
                description: "Event deleted successfully.",
            });
            fetchEvents();
        } catch (error) {
            console.error("Error deleting event:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to delete event.",
            });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold font-display">Manage Events</h1>
            </div>

            {/* Create Event Form */}
            <Card>
                <CardHeader>
                    <CardTitle>Create New Event</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Event Title</Label>
                                <Input
                                    id="title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Season 1 Launch"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="date">Date</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="location">Location</Label>
                                <Input
                                    id="location"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder="e.g. New Delhi Stadium"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="category">Category</Label>
                                <select
                                    id="category"
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    required
                                >
                                    <option value="" disabled>Select a category</option>
                                    <option value="Tournament">Tournament</option>
                                    <option value="Trials">Trials</option>
                                    <option value="Community">Community</option>
                                    <option value="Training">Training</option>
                                    <option value="Auction">Auction</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Banner Section */}
                            <div className="space-y-2">
                                <Label htmlFor="banner">Banner Image</Label>

                                {!bannerPreview ? (
                                    <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors relative h-48 flex flex-col items-center justify-center">
                                        <Input
                                            id="banner"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleBannerChange}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        <Upload className="w-10 h-10 text-gray-400 mb-2" />
                                        <p className="text-sm text-gray-500">Click to upload banner</p>
                                    </div>
                                ) : (
                                    <div className="relative rounded-lg overflow-hidden border border-gray-200 h-48 bg-gray-50">
                                        <img
                                            src={bannerPreview}
                                            alt="Banner Preview"
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={removeBanner}
                                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Gallery Section */}
                            <div className="space-y-2">
                                <Label htmlFor="gallery">Gallery Images/Videos</Label>

                                <div className="space-y-4">
                                    <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors relative h-20 flex items-center justify-center">
                                        <Input
                                            id="gallery"
                                            type="file"
                                            multiple
                                            accept="image/*,video/*"
                                            onChange={handleGalleryChange}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        <div className="flex items-center gap-2 text-gray-500">
                                            <Image className="w-5 h-5" />
                                            <span className="text-sm">Add more files</span>
                                        </div>
                                    </div>

                                    {galleryPreviews.length > 0 && (
                                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                            {galleryPreviews.map((preview, index) => (
                                                <div key={index} className="relative aspect-square rounded-md overflow-hidden border border-gray-200 group bg-gray-100">
                                                    {preview.type === 'video' ? (
                                                        <video
                                                            src={preview.url}
                                                            className="w-full h-full object-cover"
                                                            controls={false} // Optional: remove controls for cleaner preview
                                                            muted // Mute video previews
                                                            loop // Loop video previews
                                                            autoPlay // Autoplay video previews
                                                        />
                                                    ) : (
                                                        <img
                                                            src={preview.url}
                                                            alt={`Preview ${index}`}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => removeGalleryItem(index)}
                                                        className="absolute top-1 right-1 bg-red-500/80 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <Button type="submit" disabled={isSubmitting} className="w-full mt-6">
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating Event... This may take a few minutes for large files.
                                </>
                            ) : (
                                "Create Event"
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Events List */}
            <Card>
                <CardHeader>
                    <CardTitle>Existing Events</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Banner</TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead>Media Count</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {events.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            No events found. Create one above!
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    events.map((event) => (
                                        <TableRow key={event._id}>
                                            <TableCell>
                                                <img
                                                    src={event.image}
                                                    alt={event.title}
                                                    className="w-16 h-10 object-cover rounded"
                                                />
                                            </TableCell>
                                            <TableCell className="font-medium">{event.title}</TableCell>
                                            <TableCell>{event.date}</TableCell>
                                            <TableCell>{event.location}</TableCell>
                                            <TableCell>{event.media?.length || 0}</TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(event._id)}
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminEvents;
