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

const path = require("path");
const app = express();
const port = 5000;
// const dbURI = "mongodb://localhost:27017/videoPortal";
const dbURI = "mongodb+srv://ektadev531_db_user:PLKibNBAsz34iqrU@mycluster.rrydwwg.mongodb.net/brpl";

app.use(cors());
app.use(express.json());
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


app.use("/auth", authRoutes);
app.use("/api/video", videoRoutes);
app.use("/api", userRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/locations", locationRoute);
app.use("/api/contact", contactRoute);
app.use("/api/payment", paymentRoute);
app.use("/admin", adminRoutes);

app.listen(port, () => {
  console.log(`server is running on port ${port}`);
});
