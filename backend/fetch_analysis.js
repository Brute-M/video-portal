const mongoose = require('mongoose');
require('dotenv').config();

async function main() {
    await mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/brpl-new');
    const videos = await mongoose.connection.db.collection('videos').find({ analysis: { $ne: null } }).sort({ createdAt: -1 }).limit(1).toArray();
    if (videos.length > 0) {
        require('fs').writeFileSync('analysis.json', JSON.stringify(videos[0].analysis, null, 2));
        console.log("Analysis saved to analysis.json");
    } else {
        console.log("No videos found");
    }
    mongoose.disconnect();
}

main().catch(console.error);
