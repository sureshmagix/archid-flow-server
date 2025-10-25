import { Router } from "express";
import { body } from "express-validator";
import { signup, me, updateProfile } from "../controllers/user.controller.js";
import { validate } from "../middleware/validate.js";
import { auth } from "../middleware/auth.js";

const router = Router();

// 🔹 SIGNUP
router.post(
  "/signup",
  [
    body("name").notEmpty().withMessage("Name required"),
    body("mobile").notEmpty().withMessage("Mobile required"),
    body("password").isLength({ min: 6 }).withMessage("Password min 6 chars"),
    body("confirmPassword").notEmpty().withMessage("Confirm password required"),
  ],
  validate,
  signup
);

// 🔹 PROFILE
router.get("/me", auth, me);
router.put("/me", auth, updateProfile);

export default router;
