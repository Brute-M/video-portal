const FAQ = require('../model/faq.model');

exports.createFAQ = async (req, res) => {
    try {
        const { question, answer } = req.body;
        const newFAQ = new FAQ({ question, answer });
        await newFAQ.save();
        res.status(201).json({ success: true, data: newFAQ });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getFAQs = async (req, res) => {
    try {
        const filters = {};
        if (req.query.activeOnly === 'true') {
            filters.isActive = true;
        }
        const faqs = await FAQ.find(filters).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: faqs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateFAQ = async (req, res) => {
    try {
        const { id } = req.params;
        const { question, answer, isActive } = req.body;
        const updatedFAQ = await FAQ.findByIdAndUpdate(
            id,
            { question, answer, isActive },
            { new: true }
        );
        if (!updatedFAQ) {
            return res.status(404).json({ success: false, message: "FAQ not found" });
        }
        res.status(200).json({ success: true, data: updatedFAQ });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteFAQ = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedFAQ = await FAQ.findByIdAndDelete(id);
        if (!deletedFAQ) {
            return res.status(404).json({ success: false, message: "FAQ not found" });
        }
        res.status(200).json({ success: true, message: "FAQ deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
