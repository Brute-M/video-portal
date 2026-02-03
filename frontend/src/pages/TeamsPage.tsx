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
        <div className="min-h-screen bg-gray-50">
            <SEO
                title="Our Teams"
                description="Meet the teams competing in the Beyond Reach Premier League. Passion, skill, and dedication on full display."
            />
            <PageBanner title="Teams" currentPage="Teams" />

            <section className="container mx-auto px-4 py-16" data-aos="fade-up">
                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="h-10 w-10 animate-spin text-[#111a45]" />
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-y-12 gap-x-8 justify-items-center">
                        {teams.map((team) => (
                            <div key={team._id} className="flex flex-col items-center">
                                <div className="h-36 w-36 sm:h-44 sm:w-44 md:h-52 md:w-52 lg:h-60 lg:w-60 bg-white rounded-full shadow-[0_12px_30px_rgba(0,0,0,0.16)] flex items-center justify-center overflow-hidden transition-transform hover:scale-105 duration-300">
                                    <img
                                        src={team.logo}
                                        alt={team.name}
                                        className="h-24 w-24 sm:h-28 sm:w-28 md:h-32 md:w-32 lg:h-40 lg:w-40 object-contain p-2"
                                    />
                                </div>
                                <p className="mt-4 text-sm sm:text-base md:text-lg font-extrabold text-[#111a45] text-center px-2">
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
