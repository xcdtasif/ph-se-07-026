import { createUploadthing } from "uploadthing/express"
import type { FileRouter } from "uploadthing/express"

const f = createUploadthing()

/*
Only landlords reach this router (see upload.routes.ts), so the middleware just tags the upload.
The file limits mirror the 1 to 2 images a property accepts.
*/
export const uploadFileRouter: FileRouter = {
  propertyImage: f({
    image: { maxFileSize: "2MB", maxFileCount: 2 },
  })
    .middleware(({ req }) => ({ userId: req.user?.id }))
    .onUploadComplete(() => {}),
}
