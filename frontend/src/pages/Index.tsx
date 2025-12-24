import PointsTable from "@/components/PointsTable";
import Teams from "@/components/Teams";
import Banner from "@/components/Banner";
import SEO from "@/components/SEO";

const Index = () => {
  return (
    <div className="min-h-screen bg-transparent relative flex flex-col font-sans">
      <SEO
        title="Home"
        description="Welcome to Beyond Reach Premier League. The all-in-one platform for creators to upload high-quality videos, reach their audience, and start earning."
      />
      {/* Hero Section */}
      <Banner />

      {/* Points Table Section */}
      <PointsTable />

      {/* Teams Section */}
      <Teams />
    </div>
  );
};

export default Index;
