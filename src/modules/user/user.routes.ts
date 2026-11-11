import { Router } from "express"

import { authenticate } from "../../middlewares/authenticate.js"
import { validate } from "../../middlewares/validate.js"
import { userController } from "./user.controller.js"
import { updateMeSchema } from "./user.schema.js"

const router = Router()

router.use(authenticate)

// Get Me
router.get("/me", userController.getMe)

// Update Me
router.patch("/me", validate(updateMeSchema, "body"), userController.updateMe)

export const userRouter = router
