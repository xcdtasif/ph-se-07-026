import { Router } from "express"
import type { RequestHandler } from "express"
import { createRouteHandler } from "uploadthing/express"

import { authenticate } from "../../middlewares/authenticate.js"
import { authorize } from "../../middlewares/authorize.js"
import { uploadFileRouter } from "./upload.file-router.js"

/*
UploadThing calls this route from its own servers when an upload finishes. That call has no
cookie, so it skips the auth guard and is verified by UploadThing's signature instead.
*/
const exceptUploadThingHook =
  (handler: RequestHandler): RequestHandler =>
  (req, res, next) =>
    req.headers["uploadthing-hook"] ? next() : handler(req, res, next)

const router = Router()

router.use(exceptUploadThingHook(authenticate), exceptUploadThingHook(authorize("LANDLORD")))

// UploadThing
router.use(createRouteHandler({ router: uploadFileRouter }))

export const uploadRouter = router
