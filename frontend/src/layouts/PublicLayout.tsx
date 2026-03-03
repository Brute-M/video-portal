import { Outlet } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SchemaMarkup } from "@/components/SchemaMarkup";
import { CustomHeadScripts } from "@/components/CustomHeadScripts";
import { CustomBodyScripts } from "@/components/CustomBodyScripts";

const PublicLayout = () => {
    return (
        <div className="min-h-screen relative flex flex-col font-sans">
            <SchemaMarkup organizationOnly />
            <CustomHeadScripts />
            <CustomBodyScripts />
            <Header />
            <main className="flex-grow">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
};

export default PublicLayout;
