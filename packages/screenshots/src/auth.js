import { VisualDiffError } from "@pr-visual-diff/core";

export async function setVisualDiffBypassCookie({
  page,
  context = page?.context?.(),
  baseUrl,
  secret,
  cookieName = "visual_diff_bypass",
  sameSite = "Lax",
  httpOnly = true
}) {
  if (!context) {
    throw new VisualDiffError("setVisualDiffBypassCookie requires a Playwright page or context", {
      code: "AUTH_SETUP_INVALID"
    });
  }

  if (!baseUrl) {
    throw new VisualDiffError("setVisualDiffBypassCookie requires baseUrl", {
      code: "AUTH_SETUP_INVALID"
    });
  }

  if (!secret) {
    throw new VisualDiffError("Missing visual diff bypass secret", {
      code: "AUTH_SETUP_INVALID"
    });
  }

  const cookie = {
    name: cookieName,
    value: secret,
    url: baseUrl,
    httpOnly,
    sameSite,
    secure: new URL(baseUrl).protocol === "https:"
  };

  await context.addCookies([cookie]);
  return cookie;
}
