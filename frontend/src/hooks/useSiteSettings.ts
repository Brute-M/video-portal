import { useState, useEffect } from "react";
import api from "@/apihelper/api";

export interface SocialLink {
    name: string;
    url: string;
    image: string;
}

export interface SiteSettings {
    contactAddress: string;
    contactPhone: string;
    contactPhoneSecondary: string;
    contactEmail: string;
    whatsappNumber: string;
    mapEmbedUrl: string;
    socialLinks: SocialLink[];
    bannerImage: string;
    bannerTitles: Record<string, string>;
    teamsBannerImage: string;
    teamsVideoUrl: string;
    /** Google Analytics / Search Console scripts to inject in <head> */
    customHeadScripts: string;
    /** Global scripts to inject at the bottom of <body> */
    customBodyScripts: string;
}

const defaultSettings: SiteSettings = {
    contactAddress: "Ground Floor, Suite G-01, Procapitus Business Park, D-247/4A, D Block, Sector 63, Noida, Uttar Pradesh 201309",
    contactPhone: "+(91) 81309 55866",
    contactPhoneSecondary: "+(91) 98215 63585",
    contactEmail: "info@brpl.net",
    whatsappNumber: "918130955866",
    mapEmbedUrl: "",
    socialLinks: [
        { name: "Facebook", url: "https://www.facebook.com/profile.php?id=61584782136820", image: "/facebook.png" },
        { name: "Twitter", url: "https://x.com/BRPLOfficial", image: "/twiter.png" },
        { name: "Instagram", url: "https://www.instagram.com/brpl.t10", image: "/instagram.png" },
    ],
    bannerImage: "",
    bannerTitles: {},
    teamsBannerImage: "",
    teamsVideoUrl: "https://brpl-public-uploads.s3.ap-south-1.amazonaws.com/teams-video.mp4",
    customHeadScripts: "",
    customBodyScripts: "",
};

function isLikelyS3Key(image: string): boolean {
    if (!image || typeof image !== "string") return false;
    if (image.startsWith("http://") || image.startsWith("https://") || image.startsWith("/") || image.startsWith("uploads/")) return false;
    return true;
}

export function useSiteSettings() {
    const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
    const [loading, setLoading] = useState(true);

    const fetchSettings = async () => {
        try {
            const res = await api.get("/api/cms/site-settings");
            const data = res.data?.data;
            if (!data) return;
            let socialLinks = Array.isArray(data.socialLinks) && data.socialLinks.length > 0 ? data.socialLinks : defaultSettings.socialLinks;
            // Resolve any S3 keys to presigned URLs so header/footer always get a valid image URL
            const resolved = await Promise.all(
                socialLinks.map(async (link: SocialLink) => {
                    if (!link.image) return link;
                    if (isLikelyS3Key(link.image)) {
                        try {
                            const presign = await api.get("/api/cms/site-settings/presign-url", { params: { key: link.image } });
                            const url = presign.data?.url;
                            if (url) return { ...link, image: url };
                        } catch {
                            /* keep original */
                        }
                    }
                    return link;
                })
            );
            setSettings({
                contactAddress: data.contactAddress ?? defaultSettings.contactAddress,
                contactPhone: data.contactPhone ?? defaultSettings.contactPhone,
                contactPhoneSecondary: data.contactPhoneSecondary ?? defaultSettings.contactPhoneSecondary,
                contactEmail: data.contactEmail ?? defaultSettings.contactEmail,
                whatsappNumber: data.whatsappNumber ?? defaultSettings.whatsappNumber,
                mapEmbedUrl: data.mapEmbedUrl ?? defaultSettings.mapEmbedUrl,
                socialLinks: resolved,
                bannerImage: data.bannerImage ?? defaultSettings.bannerImage,
                bannerTitles: data.bannerTitles && typeof data.bannerTitles === "object" ? data.bannerTitles : defaultSettings.bannerTitles,
                teamsBannerImage: data.teamsBannerImage ?? defaultSettings.teamsBannerImage,
                teamsVideoUrl: (data.teamsVideoUrl != null && String(data.teamsVideoUrl).trim() !== "")
                    ? String(data.teamsVideoUrl).trim()
                    : defaultSettings.teamsVideoUrl,
                customHeadScripts: data.customHeadScripts != null ? String(data.customHeadScripts) : defaultSettings.customHeadScripts,
                customBodyScripts: data.customBodyScripts != null ? String(data.customBodyScripts) : defaultSettings.customBodyScripts,
            });
        } catch {
            setSettings(defaultSettings);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    // Refetch when user returns to the tab so admin updates (e.g. new social icon) show without full refresh
    useEffect(() => {
        const onFocus = () => fetchSettings();
        window.addEventListener("focus", onFocus);
        return () => window.removeEventListener("focus", onFocus);
    }, []);

    return { settings, loading };
}
