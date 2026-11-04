import { Router } from "express"

import { authenticate } from "../../middlewares/authenticate.js"
import { validate } from "../../middlewares/validate.js"
import { authController } from "./auth.controller.js"
import { loginUserSchema, registerUserSchema } from "./auth.schema.js"

const router = Router()

// Register User
router.post("/register", validate(registerUserSchema, "body"), authController.registerUser)

// Login User
router.post("/login", validate(loginUserSchema, "body"), authController.loginUser)

// Logout User
router.post("/logout", authController.logoutUser)

// Get Me
router.get("/me", authenticate, authController.getMe)

// Refresh Tokens
router.post("/refresh", authController.refreshTokens)

export const authRouter = router
