import PageBanner from "@/components/PageBanner";
import SEO from "@/components/SEO";

import { useEffect, useState } from "react";
import apiClient from "@/apihelper/api";
import { Loader2 } from "lucide-react";

const TeamsPage = () => {
    const [teams, setTeams] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const response = await apiClient.get('/api/teams');
                setTeams(response.data);
            } catch (error) {
                console.error("Failed to fetch teams", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchTeams();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 overflow-x-hidden">
            <SEO
                title="Our Teams"
                description="Meet the teams competing in the Beyond Reach Premier League. Passion, skill, and dedication on full display."
            />
            <PageBanner
                title=""
                currentPage=""
                videoSrc="https://brpl-public-uploads.s3.ap-south-1.amazonaws.com/teams-video.mp4"
            />

            <section className="container mx-auto px-4 py-16" data-aos="fade-up">
                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="h-10 w-10 animate-spin text-[#111a45]" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-y-12 gap-x-8 justify-items-center">
                        {teams.map((team) => (
                            <div key={team._id} className="flex flex-col items-center group cursor-pointer">
                                <div className="relative h-36 w-36 sm:h-44 sm:w-44 md:h-52 md:w-52 lg:h-60 lg:w-60 transition-transform duration-300 group-hover:scale-105 group-hover:shadow-[0_0_30px_rgba(255,165,0,0.6)] rounded-full">
                                    {/* Rotating Gradient Border - Always Visible */}
                                    <div
                                        className="absolute -inset-1 rounded-full animate-spin-slow"
                                        style={{
                                            background: `conic-gradient(from 0deg, #111a45, #ffa500, #111a45)`,
                                        }}
                                    />

                                    {/* White Background Circle */}
                                    <div className="absolute inset-0 bg-white rounded-full flex items-center justify-center overflow-hidden">
                                        <img
                                            src={team.logo}
                                            alt={team.name}
                                            className="h-28 w-28 sm:h-28 sm:w-28 md:h-32 md:w-32 lg:h-40 lg:w-40 object-contain p-2"
                                        />
                                    </div>
                                </div>
                                <p className="mt-4 text-sm sm:text-base md:text-lg font-extrabold text-[#111a45] text-center px-2 group-hover:text-amber-500 transition-colors duration-300">
                                    {team.name}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default TeamsPage;
