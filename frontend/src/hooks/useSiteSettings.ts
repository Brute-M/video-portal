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
};

export function useSiteSettings() {
    const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        api.get("/api/cms/site-settings")
            .then((res) => {
                if (cancelled) return;
                const data = res.data?.data;
                if (data) {
                    setSettings({
                        contactAddress: data.contactAddress ?? defaultSettings.contactAddress,
                        contactPhone: data.contactPhone ?? defaultSettings.contactPhone,
                        contactPhoneSecondary: data.contactPhoneSecondary ?? defaultSettings.contactPhoneSecondary,
                        contactEmail: data.contactEmail ?? defaultSettings.contactEmail,
                        whatsappNumber: data.whatsappNumber ?? defaultSettings.whatsappNumber,
                        mapEmbedUrl: data.mapEmbedUrl ?? defaultSettings.mapEmbedUrl,
                        socialLinks: Array.isArray(data.socialLinks) && data.socialLinks.length > 0 ? data.socialLinks : defaultSettings.socialLinks,
                        bannerImage: data.bannerImage ?? defaultSettings.bannerImage,
                        bannerTitles: data.bannerTitles && typeof data.bannerTitles === "object" ? data.bannerTitles : defaultSettings.bannerTitles,
                        teamsBannerImage: data.teamsBannerImage ?? defaultSettings.teamsBannerImage,
                        teamsVideoUrl: (data.teamsVideoUrl != null && String(data.teamsVideoUrl).trim() !== "")
                            ? String(data.teamsVideoUrl).trim()
                            : defaultSettings.teamsVideoUrl,
                    });
                }
            })
            .catch(() => {
                if (!cancelled) setSettings(defaultSettings);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => { cancelled = true; };
    }, []);

    return { settings, loading };
}
