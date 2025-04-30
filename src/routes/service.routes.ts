import express from "express";
import multer from "multer";
const routes = express();
const upload = multer();
import {
  addService,
  addFileToService,
  removeFileFromService,
  getAllServices,
  getAllCategories,
  getServiceById,
  getServiceByContributor,
  updateServiceById,
  deleteServiceById,
  generateReplyForService,
  //   disableServiceById,
  //   enableServiceById,
  //   approveServiceById,
  //   cancelServiceById,
} from "../controllers/service.controller";
import { userValidator, authValidator } from "../middlewares/validation";
import {
  isAuthorizedUser,
  isAuthorizedAdmin,
} from "../middlewares/authValidationJWT";

import fileUpload from "../middlewares/fileUpload";

// const { authValidator } = require("../middleware/authValidation");

routes.post("/become-contributor", isAuthorizedUser, fileUpload(), addService);

routes.post("/add-file-to-service/:id", fileUpload(), addFileToService);

routes.delete(
  "/remove-file-from-service/:id",
  upload.none(),
  removeFileFromService
);

routes.get("/get-all-services", getAllServices);

routes.get("/all-categories", getAllCategories);

routes.get(
  "/get-service-by-id/:id",

  getServiceById
);

routes.get(
  "/get-service-by-contributor",
  isAuthorizedUser,
  getServiceByContributor
);

routes.put("/update-service-by-id/:id", fileUpload(), updateServiceById);

routes.delete(
  "/delete-service-by-id/:id",

  deleteServiceById
);

routes.post(
  "/generate-reply-for-service/:serviceId",
  upload.none(),
  generateReplyForService
);

// routes.patch(
//   "/disable-service-by-id/:id",
//   isAuthorizedAdmin,
//   disableServiceById
// );

// routes.patch(
//   "/enable-service-by-id/:id",

//   isAuthorizedAdmin,
//   enableServiceById
// );

// routes.patch(
//   "/approve-service-by-id/:id",

//   isAuthorizedAdmin,
//   approveServiceById
// );

// routes.patch(
//   "/cancel-service-by-id/:id",

//   isAuthorizedAdmin,
//   cancelServiceById
// );

export default routes;
