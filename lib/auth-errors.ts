export type AuthErrorLike = {
  code?: string;
  status?: number;
};

export type MappedAuthError =
  | "generic"
  | "unverified"
  | "invalidCredentials"
  | "invalidCode"
  | "otpSendFailed"
  | "passwordTooShort"
  | "passwordTooLong"
  | "invalidToken"
  | "wrongPassword"
  | "existingUser";

export function isExistingUserSignupError(error: AuthErrorLike) {
  const code = error.code ?? "";
  return code === "USER_ALREADY_EXISTS" || code.startsWith("USER_ALREADY_EXISTS");
}

export function isUnverifiedAuthError(error: AuthErrorLike) {
  return error.status === 403 || error.code === "EMAIL_NOT_VERIFIED";
}

export function mapAuthError(error: AuthErrorLike | null | undefined): MappedAuthError {
  if (!error) return "generic";
  if (isExistingUserSignupError(error)) return "existingUser";
  switch (error.code) {
    case "EMAIL_NOT_VERIFIED":
      return "unverified";
    case "INVALID_EMAIL_OR_PASSWORD":
      return "invalidCredentials";
    case "INVALID_PASSWORD":
      return "wrongPassword";
    case "INVALID_OTP":
    case "OTP_EXPIRED":
      return "invalidCode";
    case "PASSWORD_TOO_SHORT":
      return "passwordTooShort";
    case "PASSWORD_TOO_LONG":
      return "passwordTooLong";
    case "INVALID_TOKEN":
      return "invalidToken";
    default:
      return "generic";
  }
}
