const express = require("express");
const { z } = require("zod");
const { authRequired } = require("../middleware/auth");
const Progress = require("../models/Progress");
const Group = require("../models/Group");

const router = express.Router();

// Joven guarda su progreso
router.put("/modules/:moduleId", authRequired, async (req, res) => {
  if (req.user.role !== "youth") return res.status(403).json({ ok: false, error: "Only youth" });

  const schema = z.object({
    score: z.number().min(0).max(100).optional(),
    done: z.boolean().optional(),
    data: z.record(z.any()).optional()
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.issues });

  const { moduleId } = req.params;

  const doc = await Progress.findOneAndUpdate(
    { youthId: req.user.sub, moduleId },
    { $set: { ...parsed.data } },
    { upsert: true, new: true }
  );

  res.json({ ok: true, progress: doc });
});

// Facilitador ve progreso de un grupo
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

module.exports = router;