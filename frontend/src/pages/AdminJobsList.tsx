import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Trash2, FileText, Plus, Edit } from "lucide-react";
import api from "@/apihelper/api";
import { Link } from "react-router-dom";

const getJobs = async () => {
    return api.get('/api/jobs');
};

const deleteJob = async (id: string) => {
    return api.delete(`/api/jobs/${id}`);
};

interface Job {
    _id: string;
    title: string;
    description: string;
    salary: string;
    status: 'Open' | 'Closed';
    experience: string;
    jdFile: string;
    jdContent: string;
    createdAt: string;
}

const AdminJobsList = () => {
    const { toast } = useToast();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const userRole = localStorage.getItem("userRole") || "user";

    const fetchJobs = async () => {
        setIsLoading(true);
        try {
            const response = await getJobs();
            if (response.data && response.data.data) {
                setJobs(response.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch jobs", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to load jobs.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this job?")) return;
        try {
            await deleteJob(id);
            setJobs(jobs.filter((job) => job._id !== id));
            toast({
                title: "Success",
                description: "Job deleted successfully.",
            });
        } catch (error) {
            console.error("Failed to delete job", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to delete job.",
            });
        }
    };

    return (
        <div className="container mx-auto p-6 max-w-6xl font-sans">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-[#111a45]">Manage Jobs</h1>
                <Link to="/admin/jobs/create">
                    <Button className="bg-[#111a45]">
                        <Plus className="w-4 h-4 mr-2" /> Post New Job
                    </Button>
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Current Openings</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-[#111a45]" />
                        </div>
                    ) : jobs.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">No jobs posted yet.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Experience</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>JD</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {jobs.map((job) => (
                                    <TableRow key={job._id}>
                                        <TableCell className="font-medium">{job.title}</TableCell>
                                        <TableCell>{job.experience}</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${job.status === 'Open' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                {job.status}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {(job.jdFile || job.jdContent) && (
                                                <div className="flex items-center text-blue-600">
                                                    <FileText className="w-4 h-4 mr-1" />
                                                    {job.jdFile ? "File" : "Text"}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Link to={`/admin/jobs/edit/${job._id}`}>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-blue-600"
                                                    >
                                                        <Edit className="w-4 h-4 mr-1" /> Edit
                                                    </Button>
                                                </Link>
                                                {userRole === 'admin' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDelete(job._id)}
                                                        className="text-red-500"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminJobsList;
