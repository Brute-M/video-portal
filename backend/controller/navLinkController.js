const NavLink = require('../model/navLink.model');

// Get all nav links (sorted by order)
exports.getAllNavLinks = async (req, res) => {
    try {
        const navLinks = await NavLink.find().sort({ order: 1 });
        res.status(200).json(navLinks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create a new nav link
exports.createNavLink = async (req, res) => {
    try {
        const { label, path, order, isActive, isExternal } = req.body;
        const newNavLink = new NavLink({ label, path, order, isActive, isExternal });
        await newNavLink.save();
        res.status(201).json(newNavLink);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Update a nav link
exports.updateNavLink = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedNavLink = await NavLink.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedNavLink) {
            return res.status(404).json({ message: 'NavLink not found' });
        }
        res.status(200).json(updatedNavLink);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete a nav link
exports.deleteNavLink = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedNavLink = await NavLink.findByIdAndDelete(id);
        if (!deletedNavLink) {
            return res.status(404).json({ message: 'NavLink not found' });
        }
        res.status(200).json({ message: 'NavLink deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Reorder nav links (bulk update)
exports.reorderNavLinks = async (req, res) => {
    try {
        const { orderUpdates } = req.body; // Array of { id, order }

        if (!Array.isArray(orderUpdates)) {
            return res.status(400).json({ message: "Invalid input format" });
        }

        const updates = orderUpdates.map(({ id, order }) =>
            NavLink.findByIdAndUpdate(id, { order })
        );

        await Promise.all(updates);
        res.status(200).json({ message: 'NavLinks reordered successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
