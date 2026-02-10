import EventGallerySlider from "@/components/EventGallerySlider";
import Teams from "@/components/Teams";
import Banner from "@/components/Banner";
import SEO from "@/components/SEO";
import AmbassadorsSection from "@/components/AmbassadorsSection";

import WhoWeAre from "@/components/WhoWeAre";

const Index = () => {
  return (
    <div className="min-h-screen bg-transparent relative flex flex-col font-sans">
      <SEO
        title="Home"
        description="Welcome to Beyond Reach Premier League. The all-in-one platform for creators to upload high-quality videos, reach their audience, and start earning."
      />
      {/* Hero Section */}
      <Banner />

      {/* Who We Are Section */}
      <WhoWeAre />

      {/* Event Gallery Slider (Formerly Points Table) */}
      <EventGallerySlider />

      {/* Ambassadors Section */}
      <AmbassadorsSection />

      {/* Teams Section */}
      <Teams />
    </div>
  );
};

export default Index;
