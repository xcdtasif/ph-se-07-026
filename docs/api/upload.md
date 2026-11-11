# Upload

| Group       | Base path          | Access                                            |
| ----------- | ------------------ | ------------------------------------------------- |
| UploadThing | `/api/uploadthing` | Landlord (UploadThing signature for its callback) |

Property images are hosted on UploadThing. The browser uploads files straight to UploadThing, so
image bytes never pass through this API. The API only authorizes the upload and later stores the
returned URLs on a property.

## Flow

1. The landlord signs in and the client calls `/api/uploadthing` with the `propertyImage` route
   (use `generateReactHelpers` or `uploadFiles` from `uploadthing/client`, pointed at this API with
   `credentials: "include"`).
2. The API checks the `accessToken` cookie and the `LANDLORD` role, then returns presigned upload
   details.
3. The browser uploads the files to UploadThing and receives a URL for each one, in the form
   `https://<appId>.ufs.sh/f/<key>`.
4. The client sends those URLs as `images` in [Create Property](property.md#create-property) or
   [Update Property](property.md#update-property).

## `propertyImage` route

| Rule      | Value                   |
| --------- | ----------------------- |
| File type | Images only             |
| Max size  | 2 MB per file           |
| Max files | 2 per upload            |
| Access    | Signed-in landlord only |

Upload landscape images with a 3:2 aspect ratio (for example 1200 x 800). The API does not enforce
the ratio, so crop on the client before uploading.

## UploadThing callback

When an upload finishes, UploadThing calls `/api/uploadthing` from its own servers with an
`uploadthing-hook` header. That call has no cookie, so it skips the auth check and is verified by
UploadThing's signature instead. Clients never call it.

## Stored images

- `images` on a property only accepts URLs that start with this app's UploadThing URL
  (`https://<appId>.ufs.sh/f/`). Any other URL is rejected with `Validation of body failed`.
- Files are deleted from UploadThing when a property is deleted, or when an update replaces them
  with a list that no longer contains them. A file that another property still uses is kept, and so
  is the shared placeholder image used by seeded properties.
- Deleting files is best effort and runs after the database change. If UploadThing is
  unreachable, the request still succeeds and the file stays orphaned.

## Responses

| Status | When              | Message                                |
| ------ | ----------------- | -------------------------------------- |
| 401    | Not signed in     | `Authentication required`              |
| 403    | Not a landlord    | `You don't have permission to do this` |
| 403    | Account is banned | `Your account has been banned`         |
