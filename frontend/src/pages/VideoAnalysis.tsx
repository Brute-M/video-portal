import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { analyzeVideo } from "@/apihelper/analysis";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AnalysisResult } from "@/components/AnalysisResult";

const VideoAnalysis = () => {
    const [file, setFile] = useState<File | null>(null);
    const [role, setRole] = useState("batsman");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const { toast } = useToast();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleAnalyze = async () => {
        if (!file) {
            toast({
                title: "No file selected",
                description: "Please upload a video to analyze",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);
        setResult(null);
        try {
            const formData = new FormData();
            formData.append("video", file);
            formData.append("role", role);

            const data = await analyzeVideo(formData);
            setResult(data);
            toast({
                title: "Analysis Complete",
                description: "Video analysis has been completed successfully."
            });
        } catch (error) {
            console.error("Analysis failed", error);
            toast({
                title: "Analysis Failed",
                description: "Could not analyze the video. Please try again.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8">
                <h1 className="text-3xl font-display font-bold text-foreground">Video Analysis</h1>
                <p className="text-muted-foreground mt-1">
                    Upload a video to get detailed performance analysis
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle>Upload Video</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="video">Video File</Label>
                            <Input
                                id="video"
                                type="file"
                                accept=".mp4,.mov,video/*"
                                onChange={handleFileChange}
                                className="cursor-pointer file:cursor-pointer"
                            />
                            <p className="text-xs text-muted-foreground">Supported formats: .mp4, .mov</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                            <Input
                                id="role"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                placeholder="e.g. Batsman"
                            />
                        </div>

                        <Button
                            onClick={handleAnalyze}
                            disabled={loading}
                            className="w-full"
                            variant="hero"
                            size="lg"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Analyzing Video...
                                </>
                            ) : "Start Analysis"}
                        </Button>
                    </CardContent>
                </Card>

                {/* Raw Response View for Debugging/Unknown Schema */}
                {result && !result.success && (
                    <Card className="glass-card h-full">
                        <CardHeader>
                            <CardTitle>Analysis Result</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <pre className="whitespace-pre-wrap text-xs bg-secondary/50 p-4 rounded-lg overflow-auto max-h-[500px] border border-border">
                                {JSON.stringify(result, null, 2)}
                            </pre>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Analysis Results using Reusable Component */}
            {result && result.success && result.data && (
                <AnalysisResult data={result.data} />
            )}
        </div>
    );
};

export default VideoAnalysis;
