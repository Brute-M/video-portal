const SeoMeta = require('../model/seoMeta.model');

const getAllSeoMeta = async (req, res) => {
    try {
        const metas = await SeoMeta.find().sort({ pagePath: 1 });
        res.status(200).json({ statusCode: 200, data: metas });
    } catch (error) {
        console.error('Error fetching SEO metas:', error);
        res.status(500).json({ message: 'Server error fetching SEO meta' });
    }
};

const getSeoMetaByPath = async (req, res) => {
    try {
        const { path } = req.query;
        if (!path) {
            return res.status(400).json({ message: 'Path is required' });
        }
        const meta = await SeoMeta.findOne({ pagePath: path });
        if (!meta) {
            return res.status(404).json({ message: 'SEO meta not found' });
        }
        res.status(200).json({ statusCode: 200, data: meta });
    } catch (error) {
        console.error('Error fetching SEO meta by path:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateSeoMeta = async (req, res) => {
    try {
        if (!['admin', 'subadmin', 'seo_content'].includes(req.role) && req.userId !== 'admin') {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const { pagePath, title, description, keywords } = req.body;

        if (!pagePath || !title) {
            return res.status(400).json({ message: 'Page path and title are required' });
        }

        const updated = await SeoMeta.findOneAndUpdate(
            { pagePath },
            { title, description, keywords },
            { new: true, upsert: true }
        );

        res.status(200).json({ statusCode: 200, message: 'SEO meta saved successfully', data: updated });
    } catch (error) {
        console.error('Error updating SEO meta:', error);
        res.status(500).json({ message: 'Server error updating SEO meta' });
    }
};

module.exports = {
    getAllSeoMeta,
    getSeoMetaByPath,
    updateSeoMeta
};
