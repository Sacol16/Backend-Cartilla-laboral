const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const User = require("../models/User");

const router = express.Router();
const { authRequired } = require("../middleware/auth");

const registerFacSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(6),
  code: z.string()
});

router.post("/register-facilitator", async (req, res) => {
  const parsed = registerFacSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.issues });

  const { email, name, password, code } = parsed.data;

  if (code !== process.env.FACILITATOR_CODE) {
    return res.status(403).json({ ok: false, error: "Invalid facilitator code" });
  }

  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ ok: false, error: "Email already exists" });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ email, name, passwordHash, role: "facilitator" });

  return res.status(201).json({ ok: true, id: user._id });
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.issues });

  const { email, password } = parsed.data;

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ ok: false, error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ ok: false, error: "Invalid credentials" });

  const token = jwt.sign(
    {
      sub: String(user._id),
      role: user.role,
      groupId: user.groupId ? String(user.groupId) : null,
      facilitatorId: user.facilitatorId ? String(user.facilitatorId) : null
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
  );

  res.json({
    ok: true,
    token,
    user: { id: user._id, role: user.role, name: user.name, email: user.email, groupId: user.groupId }
  });
});

router.get("/me", authRequired, async (req, res) => {
  const user = await User.findById(req.user.sub).select("_id name email role groupId").lean();
  if (!user) return res.status(404).json({ ok: false, error: "User not found" });

  res.json({
    ok: true,
    user: {
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      groupId: user.groupId ? String(user.groupId) : null
    }
  });
});

module.exports = router;
