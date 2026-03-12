const Blog = require('../model/blog.model');
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
    let base = slug || 'post';
    let candidate = base;
    let n = 0;
    const query = { slug: candidate };
    if (excludeId) query._id = { $ne: excludeId };
    while (await Blog.findOne(query)) {
        n += 1;
        candidate = `${base}-${n}`;
        query.slug = candidate;
    }
    return candidate;
}

/** Public: list published posts (for /blog) */
exports.getBlogs = async (req, res) => {
    try {
        const posts = await Blog.find({ isPublished: true })
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
        console.error('getBlogs error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/** Public: get single post by slug (for /blog/:slug) */
exports.getBlogBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const post = await Blog.findOne({ slug, isPublished: true }).lean();
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }
        if (post.featuredImage) {
            post.featuredImage = convertCloudUrlToStream(req, post.featuredImage);
        }
        res.status(200).json({ success: true, data: post });
    } catch (error) {
        console.error('getBlogBySlug error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/** Admin: list all posts */
exports.adminGetBlogs = async (req, res) => {
    try {
        const posts = await Blog.find().sort({ createdAt: -1 }).lean();
        const withUrls = posts.map(p => {
            if (p.featuredImage) {
                p.featuredImage = convertCloudUrlToStream(req, p.featuredImage);
            }
            return p;
        });
        res.status(200).json({ success: true, data: withUrls });
    } catch (error) {
        console.error('adminGetBlogs error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/** Admin: get one by id */
exports.adminGetBlog = async (req, res) => {
    try {
        const post = await Blog.findById(req.params.id).lean();
        if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
        if (post.featuredImage) {
            post.featuredImage = convertCloudUrlToStream(req, post.featuredImage);
        }
        res.status(200).json({ success: true, data: post });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/** Admin: create post (multipart: featuredImage optional) */
exports.createBlog = async (req, res) => {
    try {
        const { title, slug, metaTitle, metaDescription, content, enableSchema, isPublished } = req.body;
        const finalSlug = await ensureUniqueSlug(slug || slugify(title || 'post'));
        const featuredKey = req.file ? (req.file.location || req.file.key) : '';

        const post = new Blog({
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
        console.error('createBlog error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/** Admin: update post (multipart: featuredImage optional) */
exports.updateBlog = async (req, res) => {
    try {
        const post = await Blog.findById(req.params.id);
        if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

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
        console.error('updateBlog error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/** Admin: delete post */
exports.deleteBlog = async (req, res) => {
    try {
        const post = await Blog.findById(req.params.id);
        if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

        await Blog.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: 'Post deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
