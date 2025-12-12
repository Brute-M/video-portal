const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const userRoutes = require("./routes/userRoute");
const authRoutes = require("./routes/authRoute");
const videoRoutes = require("./routes/videoRoute");
const locationRoute = require("./routes/locationRoute");
const path = require("path");
const app = express();
const port = 5000;
const dbURI = "mongodb://localhost:27017/videoPortal";

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
app.use("/api/locations", locationRoute);

app.listen(port, () => {
  console.log(`server is running on port ${port}`);
});
