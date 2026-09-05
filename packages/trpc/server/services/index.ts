import AuthServices from "@repo/services/auth";

import EmailServices from "@repo/services/email";
import UploadService from "@repo/services/upload";

export const authService = new AuthServices();

export const emailServices = new EmailServices();
export const uploadService = new UploadService();
