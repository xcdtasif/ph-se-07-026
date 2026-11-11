import { UTApi } from "uploadthing/server"

import { env } from "../config/env.js"

export const utapi = new UTApi({ token: env.UPLOADTHING_TOKEN })

// Every file uploaded to our app is served from here, followed by its key
export const UPLOAD_URL_PREFIX = `https://${env.UPLOADTHING_APP_ID}.ufs.sh/f/`
