import PageBanner from "@/components/PageBanner";
import SEO from "@/components/SEO";

const teams = [
    {
        name: "North East Panthers",
        logo: "/2.png",
    },
    {
        name: "Central Strikers",
        logo: "/5.png",
    },
    {
        name: "Western Heroes",
        logo: "/4.png",
    },
    {
        name: "Northern Dabanggs",
        logo: "/3.png",
    },
    {
        name: "Southern Lions",
        logo: "/1.png",
    },
    {
        name: "Eastern Rhinos",
        logo: "/6.png",
    },
];

const TeamsPage = () => {
    return (
        <div className="min-h-screen bg-gray-50">
            <SEO
                title="Our Teams"
                description="Meet the teams competing in the Beyond Reach Premier League. Passion, skill, and dedication on full display."
            />
            <PageBanner title="Teams" currentPage="Teams" />

            <section className="container mx-auto px-4 py-16" data-aos="fade-up">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-y-12 gap-x-8 justify-items-center">
                    {teams.map((team) => (
                        <div key={team.name} className="flex flex-col items-center">
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
            </section>
        </div>
    );
};

export default TeamsPage;
