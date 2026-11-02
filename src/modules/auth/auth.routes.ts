import { Router } from "express"

import { validate } from "../../middlewares/validate.js"
import { authController } from "./auth.controller.js"
import { registerUserSchema } from "./auth.schema.js"

const router = Router()

router.post("/register", validate(registerUserSchema, "body"), authController.registerUser)

export const authRouter = router
