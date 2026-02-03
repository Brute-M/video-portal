import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import apiClient from "@/apihelper/api";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

const Press: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [ambassador, setAmbassador] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchAmbassador = async () => {
            try {
                const response = await apiClient.get(`/api/ambassadors/${id}`);
                setAmbassador(response.data);
            } catch (err) {
                console.error("Failed to fetch ambassador", err);
                setError(true);
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            fetchAmbassador();
        }
    }, [id]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex justify-center items-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#111a45]" />
            </div>
        );
    }

    if (error || !ambassador) {
        return <Navigate to="/404" replace />;
    }

    return (
        <div className="min-h-screen bg-white text-gray-900 pt-14 pb-12 px-4 md:px-8">
            <div className="max-w-8xl mx-auto">
                <Link to="/" className="inline-flex items-center text-[#111a45] hover:text-[#FFC928] mb-8 transition-colors font-medium">
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back to Home
                </Link>

                <div className="grid md:grid-cols-2 gap-12 items-start">
                    {/* Image Section */}
                    <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
                        <img
                            src={ambassador.image}
                            alt={ambassador.name}
                            className="w-full h-auto object-cover"
                        />
                    </div>

                    {/* Details Section */}
                    <div className="space-y-6">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2 text-[#111a45]">
                                {ambassador.name}
                            </h1>
                            <p className="text-2xl text-[#FFC928] font-medium">
                                {ambassador.designation}
                            </p>
                        </div>

                        <div className="h-1 w-20 bg-[#111a45]/20 rounded-full" />

                        <div className="prose prose-lg text-gray-700">
                            <p className="leading-relaxed whitespace-pre-line">
                                {ambassador.description}
                            </p>
                        </div>

                        {/* Additional Info / Stats (Mock) */}
                        {/* <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-gray-200">
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <span className="block text-sm text-gray-500 mb-1">Role</span>
                                <span className="text-lg font-semibold text-[#111a45]">Brand Ambassador</span>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <span className="block text-sm text-gray-500 mb-1">Joined</span>
                                <span className="text-lg font-semibold text-[#111a45]">2026</span>
                            </div>
                        </div> */}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Press;
