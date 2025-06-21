import express from "express";

import {
  signup,
  becomeADriver,
  approveDriver,
  rejectDriver,
} from "../controllers/auth.controller";
import {
  searchDrivers,
  requestRide,
  estimateRide,
  findRequestedRidesForDriver,
  requestedRideById,
  acceptRideRequestByDriver,
  arrivedAtPickup,
  startRide,
  completeRide,
  getOverview,
  getAllRequestedRides,
} from "../controllers/driver.controller";
import multer from "multer";

import {
  userValidator,
  authValidator,
  driverValidator,
} from "../middlewares/validation";
import {
  isAuthorizedUser,
  isAuthorizedAdmin,
  isAuthorizedSuperAdmin,
} from "../middlewares/authValidationJWT";

import fileUpload from "../middlewares/fileUpload";

const routes = express();
const upload = multer();

// for signing up
routes.post(
  "/signup",
  // userValidator.create,
  // authValidator.create,
  upload.none(),
  signup
);

routes.get("/search-drivers", upload.none(), isAuthorizedUser, searchDrivers);
routes.post("/request-ride", upload.none(), isAuthorizedUser, requestRide);

routes.post(
  "/become-a-driver",
  // userValidator.create,
  // authValidator.create,
  isAuthorizedUser,
  fileUpload(),
  driverValidator.becomeADriver,
  becomeADriver
);

routes.post(
  "/approve-driver",
  // userValidator.create,
  // authValidator.create,
  // isAuthorizedAdmin,
  upload.none(),
  approveDriver
);

routes.post(
  "/reject-driver",
  // userValidator.create,
  // authValidator.create,
  // isAuthorizedAdmin,
  upload.none(),
  rejectDriver
);

routes.post("/estimate-ride", upload.none(), estimateRide);

routes.get(
  "/find-requested-rides-for-driver",
  upload.none(),
  isAuthorizedUser,
  findRequestedRidesForDriver
);

routes.get("/get-all-requested-rides", getAllRequestedRides);

routes.get("/requested-ride/:id", upload.none(), requestedRideById);

routes.post(
  "/accept-ride-request-by-driver/:requestedRideId",
  upload.none(),
  isAuthorizedUser,
  acceptRideRequestByDriver
);

routes.post(
  "/arrived-at-pickup/:requestedRideId",
  // upload.none(),
  // isAuthorizedUser,
  arrivedAtPickup
);

routes.post(
  "/start-ride/:requestedRideId",
  // upload.none(),
  // isAuthorizedUser,
  startRide
);

routes.post(
  "/complete-ride/:requestedRideId",
  // upload.none(),
  // isAuthorizedUser,
  completeRide
);

routes.get("/get-overview", upload.none(), isAuthorizedUser, getOverview);

export default routes;
