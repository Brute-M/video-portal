import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import api from "@/apihelper/api";

/**
 * When user opens /i/:slug (e.g. /i/rohitfit):
 * - Call backend to record click and get redirect URL
 * - Store influencer ref in localStorage for registration
 * - Redirect to registration with ?ref=slug
 */
const InfluencerRedirect = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!slug) {
            navigate("/registration", { replace: true });
            return;
        }

        const tid = localStorage.getItem("brpl_tracking_id") || `tid_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
        if (!localStorage.getItem("brpl_tracking_id")) {
            localStorage.setItem("brpl_tracking_id", tid);
        }

        const run = async () => {
            try {
                // Use absolute /api path so it works regardless of axios baseURL (/api vs root)
                const res = await api.get(`/api/influencer-links/track/${encodeURIComponent(slug)}`, {
                    params: { tid },
                });
                const data = res.data?.data ?? res.data;
                const redirectUrl = data?.redirectUrl;
                const resolvedSlug = data?.slug ?? slug;

                if (resolvedSlug) {
                    localStorage.setItem("brpl_ref_code", resolvedSlug);
                    // Persist across tabs so discount flow works even if payment is opened in a new tab
                    localStorage.setItem("brpl_influencer_slug", resolvedSlug);
                }

                if (redirectUrl && (redirectUrl.startsWith("http") || redirectUrl.startsWith("/"))) {
                    if (redirectUrl.startsWith("http")) {
                        window.location.href = redirectUrl;
                    } else {
                        navigate(redirectUrl, { replace: true });
                    }
                    return;
                }
            } catch (e: any) {
                const msg = e.response?.data?.data?.message || e.response?.data?.message || "Link not found or expired.";
                setError(msg);
                setTimeout(() => {
                    navigate("/registration", { replace: true });
                }, 2000);
                return;
            }
            navigate(`/registration?ref=${encodeURIComponent(slug)}`, { replace: true });
        };

        run();
    }, [slug, navigate]);

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
                <p className="text-destructive mb-4">{error}</p>
                <p className="text-sm text-muted-foreground">Redirecting to registration...</p>
                <Loader2 className="w-8 h-8 animate-spin mt-4 text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Taking you to registration...</p>
        </div>
    );
};

export default InfluencerRedirect;
