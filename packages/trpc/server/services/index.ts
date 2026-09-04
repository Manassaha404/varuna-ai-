import AuthServices from "@repo/services/auth";
import OauthService from "@repo/services/oAuth";
import EmailServices from "@repo/services/email";
export const authService = new AuthServices();
export const oAuthService = new OauthService();
export const emailServices = new EmailServices();
