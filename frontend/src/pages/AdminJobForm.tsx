import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import api from "@/apihelper/api";
import { useNavigate, useParams } from "react-router-dom";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// API Helpers
const createJob = async (formData: FormData) => {
    return api.post('/api/jobs/create', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        }
    });
};

const updateJob = async (id: string, formData: FormData) => {
    return api.put(`/api/jobs/${id}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        }
    });
};

const getJob = async (id: string) => {
    return api.get(`/api/jobs/${id}`);
};

const AdminJobForm = () => {
    const { toast } = useToast();
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>(); // If id exists, it's Edit mode
    const isEditMode = !!id;

    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [salary, setSalary] = useState("");
    const [status, setStatus] = useState("Open");
    const [experience, setExperience] = useState("");
    const [jdFile, setJdFile] = useState<File | null>(null);
    const [jdContent, setJdContent] = useState("");

    useEffect(() => {
        if (isEditMode && id) {
            const fetchJob = async () => {
                setIsLoading(true);
                try {
                    const response = await getJob(id);
                    if (response.data && response.data.data) {
                        const job = response.data.data;
                        setTitle(job.title);
                        setDescription(job.description);
                        setSalary(job.salary);
                        setStatus(job.status);
                        setExperience(job.experience);
                        setJdContent(job.jdContent || "");
                    }
                } catch (error) {
                    console.error("Failed to fetch job", error);
                    toast({
                        variant: "destructive",
                        title: "Error",
                        description: "Failed to load job details.",
                    });
                    navigate('/admin/jobs');
                } finally {
                    setIsLoading(false);
                }
            };
            fetchJob();
        }
    }, [id, isEditMode, navigate, toast]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setJdFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate file OR content only for new job
        if (!isEditMode && !jdFile && !jdContent) {
            toast({
                variant: "destructive",
                title: "Validation Error",
                description: "Please upload a JD file OR enter JD content.",
            });
            return;
        }

        setIsSubmitting(true);
        const formData = new FormData();
        formData.append("title", title);
        formData.append("description", description);
        formData.append("salary", salary);
        formData.append("status", status);
        formData.append("experience", experience);
        formData.append("jdContent", jdContent);
        if (jdFile) {
            formData.append("jdFile", jdFile);
        }

        try {
            if (isEditMode && id) {
                await updateJob(id, formData);
                toast({
                    title: "Success",
                    description: "Job updated successfully.",
                });
            } else {
                await createJob(formData);
                toast({
                    title: "Success",
                    description: "Job created successfully.",
                });
            }

            navigate('/admin/jobs');
        } catch (error) {
            console.error("Error saving job:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: `Failed to ${isEditMode ? 'update' : 'create'} job.`,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-[#111a45]" />
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 max-w-3xl font-sans">
            <Card>
                <CardHeader>
                    <CardTitle>{isEditMode ? "Edit Job" : "Post New Job"}</CardTitle>
                    <CardDescription>Fill in the details for the job opening</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Job Title</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Senior Developer"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description (Short)</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Brief overview..."
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="experience">Experience</Label>
                            <Input
                                id="experience"
                                value={experience}
                                onChange={(e) => setExperience(e.target.value)}
                                placeholder="e.g. 3-5 Years"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="salary">Salary (CTC)</Label>
                            <Input
                                id="salary"
                                value={salary}
                                onChange={(e) => setSalary(e.target.value)}
                                placeholder="e.g. 10-12 LPA"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Open">Open</SelectItem>
                                    <SelectItem value="Closed">Closed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Job Description (Content)</Label>
                            <ReactQuill theme="snow" value={jdContent} onChange={setJdContent} className="pb-10 h-64 mb-10" />
                        </div>

                        <div className="space-y-2 pt-10">
                            <Label htmlFor="jdFile">Job Description (PDF/DOCX)</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    id="jdFile"
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    onChange={handleFileChange}
                                    className="cursor-pointer"
                                />
                            </div>
                            {isEditMode && !jdFile && (
                                <p className="text-xs text-gray-500">Leave empty to keep existing file</p>
                            )}
                        </div>

                        <div className="flex gap-2 pt-4">
                            <Button type="submit" disabled={isSubmitting} className="flex-1 bg-[#111a45]">
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEditMode ? "Update Job" : "Post Job"}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => navigate('/admin/jobs')}>
                                Cancel
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminJobForm;
