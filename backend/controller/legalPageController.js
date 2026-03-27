const LegalPage = require('../model/legalPage.model');

// GET by key (public)
exports.getByKey = async (req, res) => {
    try {
        const { key } = req.params;
        if (!['privacy_policy', 'terms_conditions', 'rule_book'].includes(key)) {
            return res.status(400).json({ success: false, message: 'Invalid key' });
        }
        let page = await LegalPage.findOne({ key });
        if (!page) {
            const defaultTitles = { privacy_policy: 'Privacy Policy', terms_conditions: 'Terms & Conditions', rule_book: 'Rule Book' };
            page = await LegalPage.create({ key, title: defaultTitles[key], content: '' });
        }
        res.status(200).json({ success: true, data: page });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// PUT update (admin)
exports.updateByKey = async (req, res) => {
    try {
        const { key } = req.params;
        if (!['privacy_policy', 'terms_conditions', 'rule_book'].includes(key)) {
            return res.status(400).json({ success: false, message: 'Invalid key' });
        }
        const { title, content } = req.body;
        const update = {};
        if (title !== undefined) update.title = title;
        if (content !== undefined) update.content = content;
        const page = await LegalPage.findOneAndUpdate(
            { key },
            { $set: update },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        res.status(200).json({ success: true, data: page });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
