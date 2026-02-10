const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/auth.routes");
const groupRoutes = require("./routes/group.routes");
const progressRoutes = require("./routes/progress.routes");

const app = express();

app.use(helmet());

// ⬇️ sube el límite (audio + png base64 lo necesitan)
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

app.use(cors({
  origin: process.env.CORS_ORIGIN || "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 120
}));

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/auth", authRoutes);
app.use("/groups", groupRoutes);
app.use("/progress", progressRoutes);

module.exports = app;