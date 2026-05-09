import { setVisualDiffBypassCookie } from "pr-visual-diff/auth";

export default async function setup({ page, baseUrl }) {
  await setVisualDiffBypassCookie({
    page,
    baseUrl,
    secret: process.env.VISUAL_DIFF_BYPASS_SECRET
  });
}
