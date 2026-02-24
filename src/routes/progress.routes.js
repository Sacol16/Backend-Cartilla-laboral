// routes/progress.routes.js
const express = require("express");
const { z } = require("zod");
const { authRequired } = require("../middleware/auth");
const Progress = require("../models/Progress");
const Group = require("../models/Group");

const router = express.Router();

// Puedes cambiar la lógica: average, sum, max, etc.
function computeOverallScore(modules) {
  if (!modules || modules.length === 0) return 0;
  const sum = modules.reduce((acc, m) => acc + (Number(m.score) || 0), 0);
  return Math.round(sum / modules.length); // promedio redondeado
}

// Joven guarda progreso de UN módulo dentro del arreglo `modules`
router.put("/modules/:moduleId", authRequired, async (req, res) => {
  if (req.user.role !== "youth") return res.status(403).json({ ok: false, error: "Only youth" });

  const schema = z.object({
    score: z.number().min(0).max(100).optional(),
    done: z.boolean().optional(),
    data: z.unknown().optional(), // data libre (Module1ActivityManager, etc)
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.issues });

  const { moduleId } = req.params;
  const { score, done, data } = parsed.data;
  const safeData = (data && typeof data === "object") ? data : {};

  // 1) Traer/crear el documento del youth
  let doc = await Progress.findOne({ youthId: req.user.sub });
  if (!doc) doc = await Progress.create({ youthId: req.user.sub, score: 0, modules: [] });

  // 2) Insertar/actualizar el item del módulo dentro del array
  const idx = doc.modules.findIndex((m) => m.moduleId === moduleId);

  if (idx === -1) {
    doc.modules.push({
      moduleId,
      score: typeof score === "number" ? score : 0,
      done: typeof done === "boolean" ? done : false,
      data: data || {},
    });
  } else {
    if (typeof score === "number") doc.modules[idx].score = score;
    if (typeof done === "boolean") doc.modules[idx].done = done;
    if (data && typeof data === "object") doc.modules[idx].data = data;
  }

  // 3) Recalcular score general
  doc.score = computeOverallScore(doc.modules);

  await doc.save();
  res.json({ ok: true, progress: doc });
});

// Facilitador ve progreso de un grupo (ahora devuelve 1 doc por youth)
router.get("/groups/:groupId", authRequired, async (req, res) => {
  if (req.user.role !== "facilitator") return res.status(403).json({ ok: false, error: "Only facilitator" });

  const { groupId } = req.params;
  const group = await Group.findById(groupId);
  if (!group) return res.status(404).json({ ok: false, error: "Group not found" });

  if (String(group.facilitatorId) !== req.user.sub) {
    return res.status(403).json({ ok: false, error: "Not your group" });
  }

  const progress = await Progress.find({ youthId: { $in: group.members } });
  res.json({ ok: true, progress });
});

// routes/progress.js
router.get("/youth/:youthId", authRequired, async (req, res) => {
  const { youthId } = req.params;

  const doc = await Progress.findOne({ youthId }).lean();

  if (!doc) {
    return res.json({ ok: true, progress: [] });
  }

  const progress = (doc.modules || []).map((m) => ({
    _id: String(doc._id),                 // id del doc general (suficiente para UI)
    youthId: String(doc.youthId),
    moduleId: String(m.moduleId),         // <-- lo que te faltaba
    score: typeof m.score === "number" ? m.score : 0,
    done: !!m.done,
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : null,
  }));

  return res.json({ ok: true, progress });
});

// GET progreso de un estudiante por módulo
// /progress/youth/:youthId/module/:moduleId
router.get("/youth/:youthId/module/:moduleId", authRequired, async (req, res) => {
  const { youthId, moduleId } = req.params;

  const doc = await Progress.findOne({ youthId }).lean();
  if (!doc) return res.json({ ok: true, module: null });

  const mod = (doc.modules || []).find(m => String(m.moduleId) === String(moduleId));
  if (!mod) return res.json({ ok: true, module: null });

  return res.json({
    ok: true,
    module: {
      moduleId: String(mod.moduleId),
      score: typeof mod.score === "number" ? mod.score : 0,
      done: !!mod.done,
      dataJson: JSON.stringify(mod.data || {}),
      updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : null
    }
  });
});

module.exports = router;