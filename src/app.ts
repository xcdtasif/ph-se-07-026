import cookieParser from "cookie-parser"
import cors from "cors"
import express from "express"
import type { Application, Request, Response } from "express"

import { env } from "./config/env.js"
import { errorHandler } from "./middlewares/error-handler.js"
import { notFound } from "./middlewares/not-found.js"
import { authRouter } from "./modules/auth/auth.routes.js"
import { categoryRouter } from "./modules/category/category.routes.js"

const app: Application = express()

const corsOptions: cors.CorsOptions = {
  origin: env.CLIENT_URL,
  credentials: true,
}

app.use(cors(corsOptions))

// app.use("/api/payments/confirm", express.raw({ type: "application/json" }))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

app.get("/", (_req: Request, res: Response) => {
  res.send("Server is running")
})

app.use("/api/auth", authRouter)
app.use("/api/categories", categoryRouter)

app.use(notFound)
app.use(errorHandler)

export default app
