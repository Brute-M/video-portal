import PageBanner from "@/components/PageBanner";
import AboutSection from "@/components/AboutSection";
import MissionVisionSection from "@/components/MissionVisionSection";
import MeetOurTeamSection from "@/components/MeetOurTeamSection";
import SEO from "@/components/SEO";
import { useState, useEffect } from "react";
import api from "@/apihelper/api";
import { getImageUrl } from "@/utils/imageHelper";

const AboutUs = () => {
    const [videoSrc, setVideoSrc] = useState<string | null>(null);
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [aboutData, setAboutData] = useState<any>(null);

    useEffect(() => {
        const fetchContent = async () => {
            try {
                const response = await api.get('/api/cms/about-us');
                if (response.data.data) {
                    setAboutData(response.data.data);
                    setVideoSrc(response.data.data.videoUrl || null);
                    setImageSrc(response.data.data.bannerImage ? getImageUrl(response.data.data.bannerImage) : null);
                }
            } catch (error) {
                console.error("Failed to load banner content", error);
            }
        };
        fetchContent();
    }, []);
    return (
        <div className="min-h-screen bg-gray-50">
            <SEO
                title="About Us"
                description="Learn about Beyond Reach Premier League's mission, vision, and the team driving the future of cricket content creation."
            />
            <PageBanner
                pageKey="aboutUs"
                title="About us"
                currentPage="About us"
                videoSrc={videoSrc || undefined}
                imageSrc={imageSrc || undefined}
                scrollToId="about-content"
            />

            <div id="about-content" data-aos="fade-up">
                <AboutSection
                    imageSrc={aboutData?.aboutBrplImage ? getImageUrl(aboutData.aboutBrplImage) : undefined}
                    title={aboutData?.aboutBrplTitle}
                    description={aboutData?.aboutBrplDescription}
                />
            </div>
            <div data-aos="fade-up">
                <MissionVisionSection
                    missionTitle={aboutData?.missionTitle}
                    missionDescription={aboutData?.missionDescription}
                    missionImage={aboutData?.missionImage ? getImageUrl(aboutData.missionImage) : undefined}
                    visionTitle={aboutData?.visionTitle}
                    visionDescription={aboutData?.visionDescription}
                    visionImage={aboutData?.visionImage ? getImageUrl(aboutData.visionImage) : undefined}
                />
            </div>
            <div data-aos="fade-up">
                <MeetOurTeamSection />
            </div>
        </div>
    );
};

export default AboutUs;
