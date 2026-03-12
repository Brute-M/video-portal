const News = require('../model/news.model');
const { convertCloudUrlToStream } = require('../utils/cloudStore');

function slugify(text) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

async function ensureUniqueSlug(slug, excludeId = null) {
    let base = slug || 'news';
    let candidate = base;
    let n = 0;
    const query = { slug: candidate };
    if (excludeId) query._id = { $ne: excludeId };
    while (await News.findOne(query)) {
        n += 1;
        candidate = `${base}-${n}`;
        query.slug = candidate;
    }
    return candidate;
}

exports.getNewsList = async (req, res) => {
    try {
        const posts = await News.find({ isPublished: true })
            .sort({ createdAt: -1 })
            .select('title slug metaTitle metaDescription featuredImage createdAt updatedAt')
            .lean();

        const withUrls = posts.map(p => {
            if (p.featuredImage) {
                p.featuredImage = convertCloudUrlToStream(req, p.featuredImage);
            }
            return p;
        });

        res.status(200).json({ success: true, data: withUrls });
    } catch (error) {
        console.error('getNewsList error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getNewsBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const post = await News.findOne({ slug, isPublished: true }).lean();
        if (!post) {
            return res.status(404).json({ success: false, message: 'News not found' });
        }
        if (post.featuredImage) {
            post.featuredImage = convertCloudUrlToStream(req, post.featuredImage);
        }
        res.status(200).json({ success: true, data: post });
    } catch (error) {
        console.error('getNewsBySlug error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.adminGetNewsList = async (req, res) => {
    try {
        const posts = await News.find().sort({ createdAt: -1 }).lean();
        const withUrls = posts.map(p => {
            if (p.featuredImage) {
                p.featuredImage = convertCloudUrlToStream(req, p.featuredImage);
            }
            return p;
        });
        res.status(200).json({ success: true, data: withUrls });
    } catch (error) {
        console.error('adminGetNewsList error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.adminGetNews = async (req, res) => {
    try {
        const post = await News.findById(req.params.id).lean();
        if (!post) return res.status(404).json({ success: false, message: 'News not found' });
        if (post.featuredImage) {
            post.featuredImage = convertCloudUrlToStream(req, post.featuredImage);
        }
        res.status(200).json({ success: true, data: post });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createNews = async (req, res) => {
    try {
        const { title, slug, metaTitle, metaDescription, content, enableSchema, isPublished } = req.body;
        const finalSlug = await ensureUniqueSlug(slug || slugify(title || 'news'));
        const featuredKey = req.file ? (req.file.location || req.file.key) : '';

        const post = new News({
            title: title || 'Untitled',
            slug: finalSlug,
            metaTitle: metaTitle || '',
            metaDescription: metaDescription || '',
            featuredImage: featuredKey,
            content: content || '',
            enableSchema: enableSchema === 'true' || enableSchema === true,
            isPublished: isPublished !== 'false' && isPublished !== false
        });
        await post.save();

        const data = post.toObject();
        if (data.featuredImage) {
            data.featuredImage = convertCloudUrlToStream(req, data.featuredImage);
        }
        res.status(201).json({ success: true, data });
    } catch (error) {
        console.error('createNews error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateNews = async (req, res) => {
    try {
        const post = await News.findById(req.params.id);
        if (!post) return res.status(404).json({ success: false, message: 'News not found' });

        const { title, slug, metaTitle, metaDescription, content, enableSchema, isPublished } = req.body;
        if (title !== undefined) post.title = title;
        if (metaTitle !== undefined) post.metaTitle = metaTitle;
        if (metaDescription !== undefined) post.metaDescription = metaDescription;
        if (content !== undefined) post.content = content;
        if (enableSchema !== undefined) post.enableSchema = enableSchema === 'true' || enableSchema === true;
        if (isPublished !== undefined) post.isPublished = isPublished !== 'false' && isPublished !== false;

        const newSlug = slug !== undefined ? slug.trim().toLowerCase() : post.slug;
        if (newSlug) {
            post.slug = await ensureUniqueSlug(newSlug, post._id);
        }

        if (req.file) {
            post.featuredImage = req.file.location || req.file.key;
        }

        await post.save();
        const data = post.toObject();
        if (data.featuredImage) {
            data.featuredImage = convertCloudUrlToStream(req, data.featuredImage);
        }
        res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('updateNews error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteNews = async (req, res) => {
    try {
        const post = await News.findById(req.params.id);
        if (!post) return res.status(404).json({ success: false, message: 'News not found' });

        await News.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: 'News deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
