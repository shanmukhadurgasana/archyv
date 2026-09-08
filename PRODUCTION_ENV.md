# Production Environment Configuration

This document outlines the environment variables required for deploying the ARCHYV application with Passkey support.

## WebAuthn / Passkeys Configuration

For production deployments, the backend **MUST** be configured with the exact relying party (RP) and origin definitions corresponding to your public-facing domain. Passkey assertions will fail if these do not exactly match the browser's context.

### Required Environment Variables

```env
# The human-readable name of your application shown during the Passkey prompt.
WEBAUTHN_RP_NAME="Archyv Platform"

# The Relying Party ID. This MUST be the exact domain name (without protocol or ports) 
# where the frontend is hosted. 
# Example: If frontend is at https://archyv.college.edu, then WEBAUTHN_RP_ID="archyv.college.edu"
# DO NOT include "https://" or slashes.
WEBAUTHN_RP_ID="your-frontend-domain.com"

# The Expected Origin. This MUST be the exact, fully-qualified URL of your frontend.
# Example: "https://archyv.college.edu"
# This MUST include "https://" and NO trailing slash.
WEBAUTHN_ORIGIN="https://your-frontend-domain.com"
```

> [!WARNING]
> **Domain Mismatch:** If your frontend is hosted at `https://frontend.com` and your backend is hosted at `https://api.com`, `WEBAUTHN_RP_ID` MUST be `frontend.com`. Do not use the backend's API domain as the RP ID, or the browser will reject the WebAuthn challenge.

> [!IMPORTANT]  
> **HTTPS Requirement:** WebAuthn requires a secure context. The `WEBAUTHN_ORIGIN` must use `https://` in production. Localhost (`http://localhost:3000`) is the only permitted exception by browsers.

### Local Development Default
If you omit these variables locally, the application automatically falls back to:
- `WEBAUTHN_RP_NAME` = "Archyv Platform"
- `WEBAUTHN_RP_ID` = "localhost"
- `WEBAUTHN_ORIGIN` = "http://localhost:3000"
