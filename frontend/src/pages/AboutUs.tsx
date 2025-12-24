import PageBanner from "@/components/PageBanner";
import AboutSection from "@/components/AboutSection";
import MissionVisionSection from "@/components/MissionVisionSection";
import MeetOurTeamSection from "@/components/MeetOurTeamSection";
import SEO from "@/components/SEO";

const AboutUs = () => {
    return (
        <div className="min-h-screen bg-gray-50">
            <SEO
                title="About Us"
                description="Learn about Beyond Reach Premier League's mission, vision, and the team driving the future of cricket content creation."
            />
            <PageBanner title="About us" currentPage="About us" />

            <div data-aos="fade-up">
                <AboutSection />
            </div>
            <div data-aos="fade-up">
                <MissionVisionSection />
            </div>
            <div data-aos="fade-up">
                <MeetOurTeamSection />
            </div>
        </div>
    );
};

export default AboutUs;
