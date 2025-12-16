const mongoose = require("mongoose");

const ProgressSchema = new mongoose.Schema(
  {
    youthId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    moduleId: { type: String, required: true },
    score: { type: Number, default: 0 },
    done: { type: Boolean, default: false },
    data: { type: Object, default: {} }
  },
  { timestamps: true }
);

ProgressSchema.index({ youthId: 1, moduleId: 1 }, { unique: true });

module.exports = mongoose.model("Progress", ProgressSchema);
