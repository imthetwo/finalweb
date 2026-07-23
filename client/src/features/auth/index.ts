// ── Public API (gatekeeper) for the `auth` feature ──────────────────────────
// Other features / shared modules must import auth's surface from here, never by
// reaching into internal subfolders. Everything not re-exported below is private.
export { LoginOverlay } from "./LoginOverlay";
export { RegisterOverlay } from "./RegisterOverlay";
export { ForgotPasswordForm } from "./components/ForgotPasswordForm";
export { ResetPasswordForm } from "./components/ResetPasswordForm";
export { AuthCallback } from "./components/AuthCallback";
export { VerifyEmailPage } from "./components/VerifyEmailPage";
