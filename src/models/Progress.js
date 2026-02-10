// models/Progress.js
const mongoose = require("mongoose");

const ModuleProgressSchema = new mongoose.Schema(
  {
    moduleId: { type: String, required: true },     // ej: "module_1"
    score: { type: Number, default: 0 },            // score del módulo
    done: { type: Boolean, default: false },        // si el módulo se completó
    data: { type: Object, default: {} },            // data libre (ej: actividad manager)
  },
  { _id: false }
);

const ProgressSchema = new mongoose.Schema(
  {
    youthId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    score: { type: Number, default: 0 },            // score general (agregado)
    modules: { type: [ModuleProgressSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Progress", ProgressSchema);