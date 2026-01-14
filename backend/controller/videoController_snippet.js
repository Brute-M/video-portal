
const saveVideoAnalysis = async (req, res) => {
    try {
        const { id } = req.params;
        const { analysis, role } = req.body;

        if (!analysis) {
            return res.status(400).json({ statusCode: 400, data: { message: 'Analysis data is required' } });
        }

        const video = await Video.findOne({ _id: id, userId: req.userId });

        if (!video) {
            return res.status(404).json({ statusCode: 404, data: { message: 'Video not found or unauthorized' } });
        }

        video.analysis = analysis;
        video.role = role || video.role;
        await video.save();

        res.status(200).json({
            statusCode: 200,
            data: {
                message: 'Analysis saved successfully',
                video
            }
        });

    } catch (error) {
        console.error("Error saving analysis:", error);
        res.status(500).json({ statusCode: 500, data: { message: 'Server error saving analysis' } });
    }
};
