import { Request, Response, NextFunction, Express } from "express";
import multer from "multer";
import path from "path";

const configureFileUpload = () => {
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      if (file.mimetype.startsWith("image/")) {
        cb(null, path.join(__dirname, "../public/uploads/images"));
      } else if (file.mimetype.startsWith("video/")) {
        cb(null, path.join(__dirname, "../public/uploads/videos"));
      } else if (file.mimetype.startsWith("audio/")) {
        cb(null, path.join(__dirname, "../public/uploads/audios"));
      } else if (file.mimetype === "application/pdf") {
        cb(null, path.join(__dirname, "../public/uploads/pdfs"));
      } else {
        cb(new Error("Invalid file type"), "");
      }
    },
    filename: function (req, file, cb) {
      const name = Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
      cb(null, name);
    },
  });

  const fileFilter = (req: Request, file: Express.Multer.File, cb: any) => {
    const allowedFieldnames = [
      "productImage",
      "image",
      "categoryImage",
      "videoFile",
      "audioFile",
      "pdfFiles",
      "previewPdfFiles",
      "passportIdFront",
      "passportIdBack",
      "drivingLicenseFront",
      "drivingLicenseBack",
      "carImages",
    ];

    if (file.fieldname === undefined) {
      cb(null, true);
    } else if (allowedFieldnames.includes(file.fieldname)) {
      if (
        file.mimetype.startsWith("image/") ||
        file.mimetype.startsWith("video/") ||
        file.mimetype.startsWith("audio/") ||
        file.mimetype === "application/pdf"
      ) {
        cb(null, true);
      } else {
        cb(new Error("Invalid file type"));
      }
    } else {
      cb(new Error("Invalid fieldname"));
    }
  };

  const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
  }).fields([
    { name: "productImage", maxCount: 10 },
    { name: "image", maxCount: 1 },
    { name: "categoryImage", maxCount: 1 },
    { name: "videoFile", maxCount: 1 },
    { name: "audioFile", maxCount: 1 },
    { name: "pdfFiles", maxCount: 5 },
    { name: "previewPdfFiles", maxCount: 3 },
    { name: "passportIdFront", maxCount: 1 },
    { name: "passportIdBack", maxCount: 1 },
    { name: "drivingLicenseFront", maxCount: 1 },
    { name: "drivingLicenseBack", maxCount: 1 },
    { name: "carImages", maxCount: 10 },
  ]);

  return upload;
};

export default configureFileUpload;
