import app from "./app.js"
import { env } from "./config/env.js"

const isVercel = !!process.env["VERCEL"]
const PORT = env.PORT

if (!isVercel) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}

export default app
