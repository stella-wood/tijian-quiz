import { expect, test } from "@playwright/test";

test("import, resume, practice, report and wrong-question flow", async ({ page }) => {
  await page.goto("/import");
  await page.locator('input[type="file"]').setInputFiles({
    name: "e2e-questions.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("1. 中国的首都是？\nA. 上海\nB. 北京\n答案: B\n\n2. TCP 是面向连接的协议。\n答案: 对"),
  });
  await page.getByRole("button", { name: "开始解析" }).click();
  await expect(page.getByText("共 2 道题目")).toBeVisible();
  await Promise.all([
    page.waitForURL(/\/banks\//),
    page.getByRole("button", { name: "确认导入" }).click(),
  ]);
  await expect(page.getByText("2 道题目", { exact: true })).toBeVisible();
  const bankUrl = page.url();

  await page.getByRole("button", { name: /顺序练习/ }).click();
  await page.goto(bankUrl);
  await expect(page.getByText("检测到未完成的练习")).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: "继续练习" }).click();

  await page.getByRole("button", { name: /A\.\s*上海/ }).click();
  await page.getByRole("button", { name: "提交答案" }).click();
  await expect(page.getByText("✗ 回答错误")).toBeVisible();
  await page.getByRole("button", { name: "下一题" }).click();
  await page.getByRole("button", { name: /对\.\s*对/ }).click();
  await page.getByRole("button", { name: "提交答案" }).click();
  await page.getByRole("button", { name: "查看报告" }).click();
  await expect(page.getByRole("heading", { name: "练习报告" })).toBeVisible();

  await page.getByRole("link", { name: "错题本" }).click();
  await expect(page.getByText("中国的首都是？")).toBeVisible();
});
