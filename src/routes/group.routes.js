const express = require("express");
const bcrypt = require("bcrypt");
const { z } = require("zod");
const { authRequired, requireRole } = require("../middleware/auth");
const Group = require("../models/Group");
const User = require("../models/User");

const router = express.Router();

router.post("/", authRequired, requireRole("facilitator"), async (req, res) => {
  const schema = z.object({ name: z.string().min(2) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.issues });

  const group = await Group.create({
    name: parsed.data.name,
    facilitatorId: req.user.sub,
    members: []
  });

  res.status(201).json({ ok: true, group });
});

router.post("/:groupId/youths", authRequired, requireRole("facilitator"), async (req, res) => {
  const schema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    tempPassword: z.string().min(6)
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.issues });

  const { groupId } = req.params;

  const group = await Group.findById(groupId);
  if (!group) return res.status(404).json({ ok: false, error: "Group not found" });

  if (String(group.facilitatorId) !== req.user.sub) {
    return res.status(403).json({ ok: false, error: "Not your group" });
  }

  const exists = await User.findOne({ email: parsed.data.email });
  if (exists) return res.status(409).json({ ok: false, error: "Email already exists" });

  const passwordHash = await bcrypt.hash(parsed.data.tempPassword, 12);

  const youth = await User.create({
    email: parsed.data.email,
    name: parsed.data.name,
    passwordHash,
    role: "youth",
    groupId: group._id,
    facilitatorId: req.user.sub
  });

  group.members.push(youth._id);
  await group.save();

  res.status(201).json({ ok: true, youthId: youth._id });
});

module.exports = router;
