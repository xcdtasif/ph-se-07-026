import app from "./app.js"
import { env } from "./config/env.js"

const isVercel = !!process.env["VERCEL"]

if (!isVercel) {
  app.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`)
  })
}

export default app
