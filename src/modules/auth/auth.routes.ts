import { Router } from "express"

import { validate } from "../../middlewares/validate.js"
import { authController } from "./auth.controller.js"
import { loginUserSchema, registerUserSchema } from "./auth.schema.js"

const router = Router()

router.post("/register", validate(registerUserSchema, "body"), authController.registerUser)

router.post("/login", validate(loginUserSchema, "body"), authController.loginUser)

router.post("/logout", authController.logoutUser)
// router.get("/me")
// router.post("/refresh")

export const authRouter = router
