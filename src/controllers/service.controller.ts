import fs from "fs";
import pdfParse from "pdf-parse";
import { Request, Response } from "express";

import { success, failure } from "../utilities/common";
import { TUploadFields } from "../types/upload-fields";
import HTTP_STATUS from "../constants/statusCodes";
import Service from "../models/service.model";
import User from "../models/user.model";
import Nootification from "../models/notification.model";

import { UserRequest } from "../interfaces/user.interface";

const addService = async (req: UserRequest, res: Response) => {
  try {
    if (!(req as UserRequest).user) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .send(failure("Please login to become a contributor"));
    }
    let {
      title,
      description,
      // prompt,
      price,
      about,
      category,
      explainMembership,
    } = req.body;

    if (typeof explainMembership === "string") {
      explainMembership = JSON.parse(explainMembership);
    }

    const newService = new Service({
      title,

      description,
      price,
      about,
      category,
      explainMembership,
      // contributor: (req as UserRequest).user._id,
      status: "approved",
    });

    if (!newService) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Service could not be added"));
    }

    const documentPaths: string[] = [];
    const files = req.files as TUploadFields;

    let extractedText = "";

    if (files?.pdfFiles) {
      // files.pdfFiles.forEach((file: Express.Multer.File) => {
      //   documentPaths.push(file.path);
      // });
      // newService.files = documentPaths;

      for (const file of files.pdfFiles) {
        documentPaths.push(file.path);

        const dataBuffer = fs.readFileSync(file.path);
        const pdfData = await pdfParse(dataBuffer);
        extractedText += pdfData.text + "\n"; // Append text from each file
        console.log("dataBuffer", dataBuffer);
        console.log("pdfData", pdfData);
        console.log("extractedText", extractedText);
      }

      newService.files = documentPaths;
    }
    let combinedDescription: string = description ? description : "";
    if (extractedText) {
      combinedDescription += `${extractedText}`;
    }

    newService.description = combinedDescription;

    await newService.save();
    const admin = await User.findOne({ roles: "admin" });
    const notification = new Nootification({
      message: `New service has been created: ${newService.title}.`,
      admin: admin && admin._id,
      type: "service",
      serviceId: newService._id, // service id
    });

    if (!notification) {
      return res.status(HTTP_STATUS.BAD_REQUEST).send(failure("Error"));
    }
    await notification.save();

    admin && admin.notifications.push(notification._id);
    admin && (await admin.save());
    return res
      .status(HTTP_STATUS.CREATED)
      .send(success("Service added successfully", newService));
  } catch (err: any) {
    console.log("err", err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error adding service", err.message));
  }
};

const addFileToService = async (req: Request, res: Response) => {
  try {
    if (!req.params.id) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please provide service id"));
    }
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Service not found"));
    }
    const files = req.files as TUploadFields;
    if (!files?.pdfFiles) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Please provide pdf files"));
    }
    const documentPaths: string[] = [];
    files.pdfFiles.forEach((file: Express.Multer.File) => {
      documentPaths.push(file.path);
    });
    service.files = [...service.files, ...documentPaths];

    let extractedText = "";
    for (const file of files.pdfFiles) {
      const dataBuffer = fs.readFileSync(file.path);
      const pdfData = await pdfParse(dataBuffer);
      extractedText += pdfData.text + "\n"; // Append text from each file
      console.log("dataBuffer", dataBuffer);
      console.log("pdfData", pdfData);
      console.log("extractedText", extractedText);
    }

    let combinedDescription: string = service.description
      ? service.description
      : "";

    if (extractedText) {
      combinedDescription += `${extractedText}`;
      service.description = combinedDescription;
    }

    await service.save();
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Files added successfully", service));
  } catch (error: any) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error adding files", error.message));
  }
};

const removeFileFromService = async (req: Request, res: Response) => {
  try {
    if (!req.params.id) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please provide service id"));
    }
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Service not found"));
    }
    const { filePath } = req.body;

    if (!filePath) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Please provide file path"));
    }
    const fileIndex = service.files.indexOf(filePath);

    if (fileIndex === -1) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("File not found in service"));
    }
    fs.unlinkSync(filePath);
    service.files.splice(fileIndex, 1);
    await service.save();
    return res
      .status(HTTP_STATUS.OK)
      .send(success("File removed successfully", service));
  } catch (error: any) {
    console.log("error", error);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error removing file", error.message));
  }
};

const updateServiceById = async (req: Request, res: Response) => {
  try {
    if (!req.params.id) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please provide service id"));
    }

    let { explainMembership } = req.body;
    if (typeof explainMembership === "string") {
      explainMembership = JSON.parse(explainMembership);
    }
    req.body.explainMembership = explainMembership;

    const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!service) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Service not found"));
    }

    return res
      .status(HTTP_STATUS.OK)
      .send(success("Successfully updated service", service));
  } catch (error: any) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure(error.message));
  }
};

const getAllServices = async (req: Request, res: Response) => {
  try {
    let page =
      typeof req.query.page === "string" ? parseInt(req.query.page) || 1 : 1;
    let limit =
      typeof req.query.limit === "string"
        ? parseInt(req.query.limit ?? "10")
        : 10;

    if (page < 1) page = 1;
    if (limit < 1) limit = 10;

    const skip = (page - 1) * limit;

    let query: any = {};

    if (typeof req.query.category === "string") {
      query.category = {
        $regex: new RegExp(req.query.category, "i"),
      };
    }

    const services = await Service.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    const count = await Service.countDocuments(query);
    if (!services) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Services not found"));
    }
    return res.status(HTTP_STATUS.OK).send(
      success("Successfully received all services", {
        result: services,
        count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      })
    );
  } catch (error: any) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error fetching services", error.message));
  }
};

const getAllCategories = async (req: Request, res: Response) => {
  try {
    const categories = await Service.distinct("category");
    if (!categories) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Categories not found"));
    }
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Successfully received all categories", categories));
  } catch (error: any) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error fetching categories", error.message));
  }
};

const getServiceById = async (req: Request, res: Response) => {
  try {
    if (!req.params.id) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please provide service id"));
    }
    const service = await Service.findById(req.params.id).populate("prompt");
    if (!service) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Service not found"));
    }
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Successfully received service", service));
  } catch (error: any) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error fetching service", error.message));
  }
};

const getServiceByContributor = async (req: Request, res: Response) => {
  try {
    // if (!(req as UserRequest).user || !(req as UserRequest).user._id) {
    //   return res
    //     .status(HTTP_STATUS.UNAUTHORIZED)
    //     .send(failure("Please login to become a contributor"));
    // }
    // const service = await Service.find({
    //   contributor: (req as UserRequest).user._id,
    // });

    // if (!service) {
    //   return res
    //     .status(HTTP_STATUS.NOT_FOUND)
    //     .send(failure("Service not found"));
    // }
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Successfully received service"));
  } catch (error: any) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error fetching service", error.message));
  }
};

const deleteServiceById = async (req: Request, res: Response) => {
  try {
    if (!req.params.id) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please provide service id"));
    }
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Service not found"));
    }

    const paths = service.files;
    for (const path of paths) {
      if (fs.existsSync(path)) {
        fs.unlinkSync(path);
      }
    }

    return res
      .status(HTTP_STATUS.OK)
      .send(success("Successfully deleted service", service));
  } catch (error: any) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error deleting service", error.message));
  }
};

const generateReplyForService = async (req: Request, res: Response) => {
  try {
    if (!req.params.serviceId) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please provide service id"));
    }
    const service = await Service.findById(req.params.serviceId);
    if (!service) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Service not found"));
    }
    if (!service.description) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Service description not found or invalid"));
    }
    const { message } = req.body;
    if (!message) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Please provide message"));
    }

    // const promptText = prompt
    //   .map((p) => `${p.question} - ${p.answer}`)
    //   .join("\n");

    return res.status(HTTP_STATUS.OK).send(success("Successfully sent reply"));
  } catch (error: any) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error sending reply", error.message));
  }
};

// const disableServiceById = async (req, res) => {
//   try {
//     if (!req.params.id) {
//       return res
//         .status(HTTP_STATUS.NOT_FOUND)
//         .send(failure("Please provide service id"));
//     }
//     const service = await Service.findByIdAndUpdate(
//       req.params.id,
//       { isDisabled: true },
//       { new: true }
//     );
//     if (!service) {
//       return res
//         .status(HTTP_STATUS.NOT_FOUND)
//         .send(failure("Service not found"));
//     }
//     return res
//       .status(HTTP_STATUS.OK)
//       .send(success("Successfully disabled service", service));
//   } catch (error) {
//     return res
//       .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
//       .send(failure("Error disabling service", error.message));
//   }
// };

// const enableServiceById = async (req, res) => {
//   try {
//     if (!req.params.id) {
//       return res
//         .status(HTTP_STATUS.NOT_FOUND)
//         .send(failure("Please provide service id"));
//     }
//     const service = await Service.findByIdAndUpdate(
//       req.params.id,
//       { isDisabled: false },
//       { new: true }
//     );
//     if (!service) {
//       return res
//         .status(HTTP_STATUS.NOT_FOUND)
//         .send(failure("Service not found"));
//     }
//     return res
//       .status(HTTP_STATUS.OK)
//       .send(success("Successfully enabled service", service));
//   } catch (error) {
//     return res
//       .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
//       .send(failure("Error enabling service", error.message));
//   }
// };

// const approveServiceById = async (req, res) => {
//   try {
//     if (!req.params.id) {
//       return res
//         .status(HTTP_STATUS.NOT_FOUND)
//         .send(failure("Please provide service id"));
//     }
//     const service = await Service.findByIdAndUpdate(
//       req.params.id,
//       { status: "approved" },
//       { new: true }
//     );
//     if (!service) {
//       return res
//         .status(HTTP_STATUS.NOT_FOUND)
//         .send(failure("Service not found"));
//     }
//     return res
//       .status(HTTP_STATUS.OK)
//       .send(success("Successfully approved service", service));
//   } catch (error) {
//     return res
//       .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
//       .send(failure("Error approving service", error.message));
//   }
// };

// const cancelServiceById = async (req, res) => {
//   try {
//     if (!req.params.id) {
//       return res
//         .status(HTTP_STATUS.NOT_FOUND)
//         .send(failure("Please provide service id"));
//     }
//     const service = await Service.findByIdAndUpdate(
//       req.params.id,
//       { status: "cancelled" },
//       { new: true }
//     );
//     if (!service) {
//       return res
//         .status(HTTP_STATUS.NOT_FOUND)
//         .send(failure("Service not found"));
//     }
//     return res
//       .status(HTTP_STATUS.OK)
//       .send(success("Successfully approved service", service));
//   } catch (error) {
//     return res
//       .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
//       .send(failure("Error approving service", error.message));
//   }
// };

export {
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
  // disableServiceById,
  // enableServiceById,
  // approveServiceById,
  // cancelServiceById,
};
