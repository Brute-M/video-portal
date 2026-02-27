const Blog = require('../model/blog.model');
const News = require('../model/news.model');

/** Static public routes for the website (no auth required) */
const STATIC_PATHS = [
    '',
    '/about-us',
    '/teams',
    '/events',
    '/career',
    '/blog',
    '/news',
    '/partners',
    '/types-of-partners',
    '/faqs',
    '/registration',
    '/contact-us',
    '/privacy-policy',
    '/terms-and-conditions',
];

/** Policy pages: changefreq yearly, priority 0.3 */
const POLICY_PATHS = ['/privacy-policy', '/terms-and-conditions'];

/** Blog/News listing pages: changefreq weekly, priority 0.6 */
const LISTING_PATHS = ['/blog', '/news'];

/** Optional: important landing pages (e.g. QR campaigns) → weekly, priority 0.7. Add paths here when needed. */
const LANDING_PATHS = [];

/**
 * Get changefreq and priority for a static path.
 * Rules: Home → daily/1.0; Main pages → weekly/0.8; Landing (QR etc.) → weekly/0.7; Blog|News listing → weekly/0.6; Policies → yearly/0.3.
 */
function getStaticMeta(path) {
    if (path === '') return { changefreq: 'daily', priority: '1.0' };
    if (POLICY_PATHS.includes(path)) return { changefreq: 'yearly', priority: '0.3' };
    if (LISTING_PATHS.includes(path)) return { changefreq: 'weekly', priority: '0.6' };
    if (LANDING_PATHS.includes(path)) return { changefreq: 'weekly', priority: '0.7' };
    return { changefreq: 'weekly', priority: '0.8' }; // Main pages (About, Teams, Contact, etc.)
}

function getBaseUrl(req) {
    const envUrl = process.env.SITE_URL || process.env.FRONTEND_URL;
    if (envUrl) return envUrl.replace(/\/$/, '');
    const protocol = req.protocol || 'https';
    const host = req.get('host') || '';
    return host ? `${protocol}://${host}` : 'https://brpl.net';
}

function escapeXml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/**
 * GET /sitemap.xml - XML sitemap for search engines
 */
exports.getSitemap = async (req, res) => {
    try {
        const baseUrl = getBaseUrl(req);

        const [blogPosts, newsPosts] = await Promise.all([
            Blog.find({ isPublished: true }).select('slug updatedAt').lean(),
            News.find({ isPublished: true }).select('slug updatedAt').lean(),
        ]);

        const urls = [];

        for (const path of STATIC_PATHS) {
            const loc = path ? `${baseUrl}${path}` : baseUrl + '/';
            const { changefreq, priority } = getStaticMeta(path);
            urls.push({ loc, lastmod: new Date().toISOString().split('T')[0], changefreq, priority });
        }

        for (const post of blogPosts) {
            urls.push({
                loc: `${baseUrl}/blog/${post.slug}`,
                lastmod: post.updatedAt ? new Date(post.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                changefreq: 'monthly',
                priority: '0.5',
            });
        }

        for (const post of newsPosts) {
            urls.push({
                loc: `${baseUrl}/news/${post.slug}`,
                lastmod: post.updatedAt ? new Date(post.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                changefreq: 'monthly',
                priority: '0.5',
            });
        }

        const xml = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
            ...urls.map(
                (u) =>
                    `  <url><loc>${escapeXml(u.loc)}</loc><lastmod>${u.lastmod}</lastmod><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`
            ),
            '</urlset>',
        ].join('\n');

        res.set('Content-Type', 'application/xml');
        res.set('Cache-Control', 'public, max-age=3600');
        res.send(xml);
    } catch (error) {
        console.error('Sitemap error:', error);
        res.status(500).set('Content-Type', 'application/xml').send('<?xml version="1.0"?><error>Server error</error>');
    }
};

/**
 * GET /robots.txt - Robots configuration
 */
exports.getRobots = (req, res) => {
    const baseUrl = getBaseUrl(req);
    const sitemapUrl = `${baseUrl}/sitemap.xml`;

    const lines = [
        'User-agent: *',
        'Allow: /',
        'Disallow: /admin',
        'Disallow: /admin/',
        'Disallow: /dashboard',
        'Disallow: /dashboard/',
        'Disallow: /auth',
        'Disallow: /api/',
        '',
        `Sitemap: ${sitemapUrl}`,
    ];

    res.set('Content-Type', 'text/plain');
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(lines.join('\n'));
};
