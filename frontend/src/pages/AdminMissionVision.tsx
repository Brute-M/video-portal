import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, X, Trash2 } from "lucide-react";
import api from "@/apihelper/api";
import { getImageUrl } from "@/utils/imageHelper";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const AdminMissionVision = () => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);

    // Mission State
    const [missionTitle, setMissionTitle] = useState("");
    const [missionDescription, setMissionDescription] = useState("");
    const [missionFile, setMissionFile] = useState<File | null>(null);
    const [missionPreview, setMissionPreview] = useState<string | null>(null);
    const [existingMissionImage, setExistingMissionImage] = useState<string | null>(null);
    const [isSubmittingMission, setIsSubmittingMission] = useState(false);
    const [isDeletingMissionImage, setIsDeletingMissionImage] = useState(false);

    // Vision State
    const [visionTitle, setVisionTitle] = useState("");
    const [visionDescription, setVisionDescription] = useState("");
    const [visionFile, setVisionFile] = useState<File | null>(null);
    const [visionPreview, setVisionPreview] = useState<string | null>(null);
    const [existingVisionImage, setExistingVisionImage] = useState<string | null>(null);
    const [isSubmittingVision, setIsSubmittingVision] = useState(false);
    const [isDeletingVisionImage, setIsDeletingVisionImage] = useState(false);

    useEffect(() => {
        fetchData();
        return () => {
            if (missionPreview && missionPreview.startsWith('blob:')) URL.revokeObjectURL(missionPreview);
            if (visionPreview && visionPreview.startsWith('blob:')) URL.revokeObjectURL(visionPreview);
        };
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/api/cms/about-us');
            const data = response.data.data;
            if (data) {
                setMissionTitle(data.missionTitle || "Our Mission");
                setMissionDescription(data.missionDescription || "");
                setExistingMissionImage(data.missionImage || null);

                setVisionTitle(data.visionTitle || "Our Vision");
                setVisionDescription(data.visionDescription || "");
                setExistingVisionImage(data.visionImage || null);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // --- Mission Handlers ---
    const handleMissionFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setMissionFile(selectedFile);
            setMissionPreview(URL.createObjectURL(selectedFile));
        }
    };

    const removeMissionFile = () => {
        setMissionFile(null);
        if (missionPreview && missionPreview.startsWith('blob:')) URL.revokeObjectURL(missionPreview);
        setMissionPreview(null);
    };

    const handleMissionSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmittingMission(true);
        const formData = new FormData();
        formData.append("missionTitle", missionTitle);
        formData.append("missionDescription", missionDescription);
        if (missionFile) formData.append("missionImage", missionFile);

        try {
            await api.post('/api/cms/about-us/mission-vision', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast({ title: "Success", description: "Mission updated successfully." });
            const response = await api.get('/api/cms/about-us');
            if (response.data.data) setExistingMissionImage(response.data.data.missionImage);
            removeMissionFile();
        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Error", description: "Failed to update Mission." });
        } finally {
            setIsSubmittingMission(false);
        }
    };

    const handleDeleteMissionImage = async () => {
        if (!confirm("Remove Mission image?")) return;
        setIsDeletingMissionImage(true);
        try {
            const formData = new FormData();
            formData.append('removeMissionImage', 'true');
            await api.post('/api/cms/about-us/mission-vision', formData);
            toast({ title: "Success", description: "Mission image removed." });
            setExistingMissionImage(null);
            setMissionPreview(null);
            setMissionFile(null);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to remove image." });
        } finally {
            setIsDeletingMissionImage(false);
        }
    };

    // --- Vision Handlers ---
    const handleVisionFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setVisionFile(selectedFile);
            setVisionPreview(URL.createObjectURL(selectedFile));
        }
    };

    const removeVisionFile = () => {
        setVisionFile(null);
        if (visionPreview && visionPreview.startsWith('blob:')) URL.revokeObjectURL(visionPreview);
        setVisionPreview(null);
    };

    const handleVisionSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmittingVision(true);
        const formData = new FormData();
        formData.append("visionTitle", visionTitle);
        formData.append("visionDescription", visionDescription);
        if (visionFile) formData.append("visionImage", visionFile);

        try {
            await api.post('/api/cms/about-us/mission-vision', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast({ title: "Success", description: "Vision updated successfully." });
            const response = await api.get('/api/cms/about-us');
            if (response.data.data) setExistingVisionImage(response.data.data.visionImage);
            removeVisionFile();
        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Error", description: "Failed to update Vision." });
        } finally {
            setIsSubmittingVision(false);
        }
    };

    const handleDeleteVisionImage = async () => {
        if (!confirm("Remove Vision image?")) return;
        setIsDeletingVisionImage(true);
        try {
            const formData = new FormData();
            formData.append('removeVisionImage', 'true');
            await api.post('/api/cms/about-us/mission-vision', formData);
            toast({ title: "Success", description: "Vision image removed." });
            setExistingVisionImage(null);
            setVisionPreview(null);
            setVisionFile(null);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to remove image." });
        } finally {
            setIsDeletingVisionImage(false);
        }
    };

    if (isLoading) return <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div>;

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8">
            <h1 className="text-3xl font-bold font-display">Manage Mission & Vision</h1>

            <Tabs defaultValue="mission" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="mission">Our Mission</TabsTrigger>
                    <TabsTrigger value="vision">Our Vision</TabsTrigger>
                </TabsList>

                {/* MISSION TAB */}
                <TabsContent value="mission">
                    <form onSubmit={handleMissionSubmit}>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
                            {/* Mission Image */}
                            <Card className="h-fit">
                                <CardHeader>
                                    <CardTitle className="flex justify-between items-center">
                                        <span>Mission Image</span>
                                        {existingMissionImage && (
                                            <Button type="button" variant="destructive" size="sm" onClick={handleDeleteMissionImage} disabled={isDeletingMissionImage}>
                                                <Trash2 className="w-4 h-4 mr-2" /> Remove
                                            </Button>
                                        )}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center relative bg-gray-50 h-[300px]">
                                        {missionPreview || existingMissionImage ? (
                                            <div className="relative w-full h-full rounded overflow-hidden">
                                                <img
                                                    src={missionPreview || getImageUrl(existingMissionImage) || ""}
                                                    alt="Preview"
                                                    className="w-full h-full object-cover"
                                                />
                                                {missionPreview && (
                                                    <button type="button" onClick={removeMissionFile} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8">
                                                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                                                <p className="text-sm text-muted-foreground">Upload Image</p>
                                            </div>
                                        )}
                                        <Input type="file" accept="image/*" onChange={handleMissionFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Mission Content */}
                            <Card className="h-fit">
                                <CardHeader><CardTitle>Mission Content</CardTitle></CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <Label>Title</Label>
                                        <Input value={missionTitle} onChange={(e) => setMissionTitle(e.target.value)} placeholder="Our Mission" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Description</Label>
                                        <div className="h-64 mb-12">
                                            <ReactQuill theme="snow" value={missionDescription} onChange={setMissionDescription} className="h-56" />
                                        </div>
                                    </div>
                                    <div className="pt-6">
                                        <Button type="submit" disabled={isSubmittingMission} className="w-full">
                                            {isSubmittingMission ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Update Mission"}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </form>
                </TabsContent>

                {/* VISION TAB */}
                <TabsContent value="vision">
                    <form onSubmit={handleVisionSubmit}>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
                            {/* Vision Image */}
                            <Card className="h-fit">
                                <CardHeader>
                                    <CardTitle className="flex justify-between items-center">
                                        <span>Vision Image</span>
                                        {existingVisionImage && (
                                            <Button type="button" variant="destructive" size="sm" onClick={handleDeleteVisionImage} disabled={isDeletingVisionImage}>
                                                <Trash2 className="w-4 h-4 mr-2" /> Remove
                                            </Button>
                                        )}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center relative bg-gray-50 h-[300px]">
                                        {visionPreview || existingVisionImage ? (
                                            <div className="relative w-full h-full rounded overflow-hidden">
                                                <img
                                                    src={visionPreview || getImageUrl(existingVisionImage) || ""}
                                                    alt="Preview"
                                                    className="w-full h-full object-cover"
                                                />
                                                {visionPreview && (
                                                    <button type="button" onClick={removeVisionFile} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8">
                                                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                                                <p className="text-sm text-muted-foreground">Upload Image</p>
                                            </div>
                                        )}
                                        <Input type="file" accept="image/*" onChange={handleVisionFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Vision Content */}
                            <Card className="h-fit">
                                <CardHeader><CardTitle>Vision Content</CardTitle></CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <Label>Title</Label>
                                        <Input value={visionTitle} onChange={(e) => setVisionTitle(e.target.value)} placeholder="Our Vision" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Description</Label>
                                        <div className="h-64 mb-12">
                                            <ReactQuill theme="snow" value={visionDescription} onChange={setVisionDescription} className="h-56" />
                                        </div>
                                    </div>
                                    <div className="pt-6">
                                        <Button type="submit" disabled={isSubmittingVision} className="w-full">
                                            {isSubmittingVision ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Update Vision"}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </form>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default AdminMissionVision;
