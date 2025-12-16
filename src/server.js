require("dotenv").config();
const app = require("./app");
const { connectDB } = require("./config/db");

const port = process.env.PORT || 3000;

(async () => {
  try {
    await connectDB(process.env.MONGODB_URI);
    app.listen(port, () => console.log(`✅ API running on port ${port}`));
  } catch (err) {
    console.error("❌ Failed to start:", err);
    process.exit(1);
  }
})();
