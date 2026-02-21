import { Helmet } from 'react-helmet-async';
import { useState, useEffect } from 'react';
import { getSeoMetaByPath } from '@/apihelper/seo';

interface SEOProps {
    title: string;
    description: string;
    keywords?: string;
    image?: string;
    url?: string;
}

const SEO = ({ title, description, keywords, image, url }: SEOProps) => {
    const siteTitle = 'Beyond Reach Premier League';

    // Dynamic mappings that fallback to the provided props initially
    const [dynamicTitle, setDynamicTitle] = useState(`${title} | ${siteTitle}`);
    const [dynamicDesc, setDynamicDesc] = useState(description);
    const [dynamicKeywords, setDynamicKeywords] = useState(keywords || '');

    useEffect(() => {
        const fetchSEO = async () => {
            try {
                const path = window.location.pathname;
                const data = await getSeoMetaByPath(path);

                if (data && data.title) {
                    // Injecting Admin-defined dynamic SEO metadata
                    setDynamicTitle(data.title.includes(siteTitle) ? data.title : `${data.title} | ${siteTitle}`);
                    if (data.description) setDynamicDesc(data.description);
                    if (data.keywords) setDynamicKeywords(data.keywords);
                } else {
                    // Fallback back to standard Component props if nothing found
                    setDynamicTitle(`${title} | ${siteTitle}`);
                    setDynamicDesc(description);
                    setDynamicKeywords(keywords || '');
                }
            } catch (error) {
                console.error("Failed to fetch custom SEO Meta", error);
            }
        };

        fetchSEO();
        // We re-trigger lookup if the page passes new static props (e.g., dynamic ID pages)
    }, [title, description, keywords]);

    const defaultImage = '/logo.png';
    const currentUrl = url || window.location.href;

    return (
        <Helmet>
            <title>{dynamicTitle}</title>
            <meta name="description" content={dynamicDesc} />
            {dynamicKeywords && <meta name="keywords" content={dynamicKeywords} />}
            <link rel="canonical" href={currentUrl} />

            <meta property="og:type" content="website" />
            <meta property="og:url" content={currentUrl} />
            <meta property="og:title" content={dynamicTitle} />
            <meta property="og:description" content={dynamicDesc} />
            {image && <meta property="og:image" content={image} />}
            {!image && <meta property="og:image" content={defaultImage} />}

            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:url" content={currentUrl} />
            <meta name="twitter:title" content={dynamicTitle} />
            <meta name="twitter:description" content={dynamicDesc} />
            {image && <meta name="twitter:image" content={image} />}
            {!image && <meta name="twitter:image" content={defaultImage} />}
        </Helmet>
    );
};

export default SEO;
