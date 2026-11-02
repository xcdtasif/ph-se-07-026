import app from "./app.js"
import { env } from "./config/env.js"

const isVercel = !!process.env["VERCEL"]
const port = env.port

if (!isVercel) {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`)
  })
}

export default app
