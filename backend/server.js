const express = require("express");
require("dotenv").config();
const cors = require("cors");
const morgan = require("morgan");
const mongoose = require("mongoose");
// const winston = require('winston');
// const expressWinston = require('express-winston');

const userRoutes = require("./routes/userRoute");
const authRoutes = require("./routes/authRoute");
const videoRoutes = require("./routes/videoRoute");
const locationRoute = require("./routes/locationRoute");
const contactRoute = require("./routes/contactRoute");
const paymentRoute = require("./routes/paymentRoute");
const adminRoutes = require("./routes/adminRoute");
const couponRoutes = require("./routes/couponRoute");
const eventRoutes = require("./routes/eventRoute");
const jobRoutes = require("./routes/jobRoute");
const ambassadorRoutes = require("./routes/ambassadorRoute");
const teamRoutes = require("./routes/teamRoute");
const partnerRoutes = require("./routes/partnerRoutes");
const webhookRoutes = require("./routes/webhookRoute");

const path = require("path");
const app = express();
const port = process.env.PORT || 5000;

const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger-output.json');

// const dbURI = "mongodb://localhost:27017/videoPortal";
const dbURI = process.env.MONGO_URL || "mongodb+srv://brpl-dev-write:YnJwbC1kZXYtd3JpdGU@brpl-dev.nj1umik.mongodb.net/brpl";

app.use(cors());
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// app.use(expressWinston.logger({
//   transports: [
//     new winston.transports.Console()
//   ],
//   format: winston.format.combine(
//     winston.format.timestamp(),
//     winston.format.colorize(),
//     winston.format.printf(({ level, message, meta, timestamp }) => {
//       return `${timestamp} ${level}: ${message} ${JSON.stringify(meta)}`;
//     })
//   ),
//   meta: true,
//   msg: "HTTP {{req.method}} {{req.url}}",
//   expressFormat: true,
//   colorize: true,
//   ignoreRoute: function (req, res) { return false; },
//   requestWhitelist: ['url', 'headers', 'method', 'httpVersion', 'originalUrl', 'query', 'body'],
//   responseWhitelist: ['statusCode', 'body']
// }));

async function connectDB() {
  try {
    await mongoose.connect(dbURI);
    console.log("Connected to MongoDB");
  } catch (err) {
    console.log("MongoDB connection error:", err);
  }
}

connectDB();
app.get("/", (req, res) => {
  res.send("app start");
});

// SEO: sitemap and robots (before other routes so paths are exact)
app.use("/", require("./routes/sitemapRoute"));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));


app.use("/auth", authRoutes);
app.use("/api/auth", authRoutes); // Alias for consistency
app.use("/api/video", videoRoutes);
app.use("/api/blog", require("./routes/blogRoute"));
app.use("/api/news", require("./routes/newsRoute"));
app.use("/api/coupons", couponRoutes);
app.use("/api/locations", locationRoute);
app.use("/api/contact", contactRoute);
app.use("/api/payment", paymentRoute);
app.use("/api/events", eventRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/ambassadors", ambassadorRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/partners", partnerRoutes);
app.use("/api/campaigns", require("./routes/campaignRoutes"));
app.use("/api/faqs", require("./routes/faqRoute"));
app.use("/api/nav-links", require("./routes/navLinkRoute"));
app.use("/api/cms/our-team", require("./routes/ourTeamRoute"));
app.use("/api/cms/site-settings", require("./routes/siteSettingsRoute"));
app.use("/api/cms/legal", require("./routes/legalRoute"));
app.use("/api/cms", require("./routes/cmsRoute"));
app.use("/api", require("./routes/seoRoute"));
app.use("/webhooks", webhookRoutes);
app.use("/api", userRoutes);
app.use("/admin", adminRoutes);
app.use("/api/admin", adminRoutes); // Alias for consistency

app.listen(port, () => {
  console.log(`server is running on port ${port}`);
  console.log('Server listening for campaigns');
  console.log("user latest code on the server")
});
