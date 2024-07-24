import { UploadApiOptions, v2 as cloudinary } from "cloudinary";
import { BadRequestError } from "../error-handler";
import configs from "@/configs";

cloudinary.config({
  cloud_name: configs.CLOUDINARY_NAME,
  api_key: configs.CLOUDINARY_KEY,
  api_secret: configs.CLOUDINARY_SECRET,
});

export function isBase64Data(value: string) {
  const base64Regex =
    /^data:image\/(?:png|jpeg|jpg|webp)(?:;charset=utf-8)?;base64,(?:[A-Za-z0-9]|[+/])+={0,2}/;
  return base64Regex.test(value);
}

export async function getAllImageCloudinary() {
  const images = await cloudinary.search
    .expression("folder:ich/*")
    .sort_by("created_at", "desc")
    .max_results(500)
    .execute();
  return images;
}

export async function uploadImageCloudinary(
  base64: string,
  opts?: UploadApiOptions
) {
  if (!isBase64Data(base64))
    throw new BadRequestError("image upload must be base64 string");
  const options: UploadApiOptions = {
    use_filename: true,
    unique_filename: false,
    overwrite: true,
    folder: "ich",
    resource_type: "image",
    // transformation: [{ width: 640, height: 640, crop: "scale" }],
    tags: ["no-tag"],
    ...opts,
  };
  const { public_id, asset_id, width, height, secure_url, tags } =
    await cloudinary.uploader.upload(base64, options);
  return { public_id, asset_id, width, height, secure_url, tags };
}

export async function deleteImageCloudinary(id: string) {
  await cloudinary.uploader.destroy(id);
}

// const aws = require('aws-sdk');
// const multer = require('multer');
// const multerS3 = require('multer-s3');

// const s3 = new aws.S3({
//   accessKeyId: 'access_key_id',
//   secretAccessKey: 'secret_access_key',
//   region: '<your_region>'
// });

// const fileUploader = multer({
//   storage: multerS3({
//     s3: s3,
//     bucket: '<your_bucket_name>',
//     acl: 'public-read',
//     metadata: function (req, file, cb) {

//       cb(null, {fieldName: file.fieldname});
//     },
//     key: function (req, file, cb) {
//       cb(null, Date.now().toString())
//     }
//   })
// });
