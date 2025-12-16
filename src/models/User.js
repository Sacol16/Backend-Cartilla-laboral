const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, unique: true, lowercase: true, trim: true, required: true },
    name: { type: String, trim: true, required: true },
    passwordHash: { type: String, required: true },

    role: { type: String, enum: ["facilitator", "youth"], required: true },

    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group", default: null },
    facilitatorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
