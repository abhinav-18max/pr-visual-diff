export default async function setup({ page, baseUrl }) {
  await page.goto(`${baseUrl}/login`);
  await page.getByLabel("Email").fill("demo@example.com");
  await page.getByLabel("Password").fill("password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(`${baseUrl}/dashboard`);
}
