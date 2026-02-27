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
import { Loader2, Trash2, Upload, X } from "lucide-react";
import api from "@/apihelper/api"; // Centralized API instance

const createEvent = async (formData: FormData) => {
    return api.post('/api/events/create', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        }
    });
};

const updateEvent = async (id: string, formData: FormData) => {
    return api.put(`/api/events/${id}`, formData, {
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
}

const AdminEvents = () => {
    const { toast } = useToast();
    const [events, setEvents] = useState<Event[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const userRole = localStorage.getItem("userRole") || "user";

    // Form State
    const [title, setTitle] = useState("");
    const [date, setDate] = useState("");
    const [location, setLocation] = useState("");
    const [category, setCategory] = useState("");

    // File State
    const [bannerImage, setBannerImage] = useState<File | null>(null);
    const [bannerPreview, setBannerPreview] = useState<string | null>(null);


    useEffect(() => {
        fetchEvents();
        return () => {
            // Cleanup object URLs on unmount
            if (bannerPreview) URL.revokeObjectURL(bannerPreview);
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
            // Only revoke if it was a blob URL (checking if it starts with blob:)
            if (bannerPreview.startsWith('blob:')) {
                URL.revokeObjectURL(bannerPreview);
            }
            setBannerPreview(null);
        }
    };

    const handleEdit = (event: Event) => {
        setEditId(event._id);
        setTitle(event.title);
        setDate(event.date);
        setLocation(event.location);
        setCategory(event.category);
        setBannerPreview(event.image);
        setBannerImage(null); // Reset file input, current image is in preview
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditId(null);
        setTitle("");
        setDate("");
        setLocation("");
        setCategory("");
        removeBanner();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate image only if creating new event (for edit, existing image is okay)
        if (!editId && !bannerImage) {
            toast({
                variant: "destructive",
                title: "Validation Error",
                description: "Please upload an event image.",
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

        try {
            if (editId) {
                await updateEvent(editId, formData);
                toast({
                    title: "Success",
                    description: "Event updated successfully.",
                });
            } else {
                await createEvent(formData);
                toast({
                    title: "Success",
                    description: "Event created successfully.",
                });
            }

            // Reset form
            setTitle("");
            setDate("");
            setLocation("");
            setCategory("");
            removeBanner();
            setEditId(null);

            // Refresh list
            fetchEvents();
        } catch (error) {
            console.error("Error saving event:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: `Failed to ${editId ? 'update' : 'create'} event.`,
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
                    <CardTitle>{editId ? "Edit Event" : "Create New Event"}</CardTitle>
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
                                    <option value="Launch Event">Launch Event</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            {/* Banner Section */}
                            <div className="space-y-2">
                                <Label htmlFor="banner">Event Image</Label>

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
                                        <p className="text-sm text-gray-500">Click to upload event image</p>
                                    </div>
                                ) : (
                                    <div className="relative rounded-lg overflow-hidden border border-gray-200 h-48 bg-gray-50">
                                        <img
                                            src={bannerPreview}
                                            alt="Banner Preview"
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                            decoding="async"
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
                        </div>

                        <div className="flex gap-4 mt-6">
                            <Button type="submit" disabled={isSubmitting} className="flex-1">
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {editId ? "Updating..." : "Creating..."}
                                    </>
                                ) : (
                                    editId ? "Update Event" : "Create Event"
                                )}
                            </Button>

                            {editId && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleCancelEdit}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                            )}
                        </div>
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
                                    <TableHead>Image</TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {events.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
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
                                                    loading="lazy"
                                                    decoding="async"
                                                />
                                            </TableCell>
                                            <TableCell className="font-medium">{event.title}</TableCell>
                                            <TableCell>{event.date}</TableCell>
                                            <TableCell>{event.location}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEdit(event)}
                                                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                                    >
                                                        Edit
                                                    </Button>
                                                    {userRole === 'admin' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleDelete(event._id)}
                                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                </div>
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
