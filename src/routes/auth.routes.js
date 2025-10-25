import { Router } from "express";
import { body } from "express-validator";
import { validate } from "../middleware/validate.js";
import { login } from "../controllers/auth.controller.js";

const router = Router();

router.post(
  "/login",
  [body("username").notEmpty(), body("password").notEmpty()],
  validate,
  login
);

export default router;
