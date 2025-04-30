export type TUploadFields = {
  image?: Express.Multer.File[];
  videoFile?: Express.Multer.File[];
  pdfFiles?: Express.Multer.File[];
  [key: string]: Express.Multer.File[] | undefined;
};
