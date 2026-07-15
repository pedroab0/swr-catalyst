import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const TITLE_MUST_HAVE_3_CHARS = /Title must have at least 3 characters/;
const RE_RENDER_ONLY = /Re-render only/;
const TOGGLE_FILTER = /Toggle filter/;
const MUTATE_BY_GROUP_REVALIDATED = /mutateByGroup revalidated/;

test.describe("swr-catalyst demo app", () => {
  test.beforeEach(async ({ page }) => {
    // Dismiss the tour overlay by setting the localStorage item before loading the page
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "swr-catalyst-demo-tour-dismissed-v1",
        "true"
      );
    });
    await page.goto("/");
  });

  test("should pass accessibility checks", async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("should match baseline screenshot", async ({ page }) => {
    // Wait for initial data to load
    await expect(page.getByText("Document API behavior")).toBeVisible();

    // Take a screenshot of the main layout
    await expect(page.locator(".layout")).toHaveScreenshot("initial-load.png", {
      mask: [page.locator(".stats")], // Mask stats as they might vary slightly in timing
    });
  });

  test("should perform basic CRUD operations", async ({ page }) => {
    const input = page.getByPlaceholder("Create a todo");
    const createButton = page.getByRole("button", {
      exact: true,
      name: "Create",
    });

    // CREATE
    await input.fill("E2E Test Todo");
    await createButton.click();

    const todoItem = page
      .locator(".todoList li")
      .filter({ hasText: "E2E Test Todo" });
    await expect(todoItem).toBeVisible();

    // UPDATE (Toggle)
    const checkbox = todoItem.getByRole("checkbox");
    await checkbox.check();
    await expect(checkbox).toBeChecked();

    // RENAME
    await todoItem.getByRole("button", { name: "Rename" }).click();
    const renameInput = todoItem.getByRole("textbox");
    await renameInput.fill("Renamed E2E Todo");
    await todoItem.getByRole("button", { name: "Save" }).click();

    const renamedTodoItem = page
      .locator(".todoList li")
      .filter({ hasText: "Renamed E2E Todo" });
    await expect(renamedTodoItem).toBeVisible();

    // DELETE
    await renamedTodoItem.getByRole("button", { name: "Delete" }).click();
    await expect(renamedTodoItem).not.toBeVisible();
  });

  test("should show validation error in error inspector", async ({ page }) => {
    // Switch to validation preset
    await page.getByRole("button", { name: "Validation errors" }).click();

    const input = page.getByPlaceholder("Create a todo");
    const createButton = page.getByRole("button", {
      exact: true,
      name: "Create",
    });

    await input.fill("No"); // Too short, triggers validation error
    await createButton.click();

    // Verify error inspector
    await expect(page.getByText("MutationError Inspector")).toBeVisible();
    await expect(page.getByText(TITLE_MUST_HAVE_3_CHARS).first()).toBeVisible();

    // Check visual state of error inspector
    await expect(
      page.locator(".panel").filter({ hasText: "MutationError Inspector" })
    ).toHaveScreenshot("validation-error.png", {
      mask: [
        page
          .locator(".panel")
          .filter({ hasText: "MutationError Inspector" })
          .locator("pre"),
      ],
    });
  });

  test("should verify useStableKey referential stability", async ({ page }) => {
    const section = page
      .locator(".panel")
      .filter({ hasText: "useStableKey Demo" });
    const stabilityStatus = section
      .locator("div", {
        has: page.locator("dt", {
          hasText: "Reference stable on last render?",
        }),
      })
      .locator("dd");

    // Initial state
    await expect(stabilityStatus).toHaveText("yes");

    // Re-render (should stay stable)
    await section.getByRole("button", { name: RE_RENDER_ONLY }).click();
    await expect(stabilityStatus).toHaveText("yes");

    // Toggle filter (should change reference)
    await section.getByRole("button", { name: TOGGLE_FILTER }).click();
    await expect(stabilityStatus).toHaveText("no");
  });

  test("should replay actions from the timeline", async ({ page }) => {
    // 1. Create a todo
    const input = page.getByPlaceholder("Create a todo");
    await input.fill("Replay Target");
    await page.getByRole("button", { exact: true, name: "Create" }).click();

    // 2. Locate timeline entry and replay
    const timelineEntry = page
      .locator(".timelineItem")
      .filter({ hasText: "Create todo" })
      .first();
    await expect(timelineEntry).toBeVisible();
    await timelineEntry.getByRole("button", { name: "Replay" }).click();

    // 3. Verify side effect occurred again (two todos with same name)
    await expect(
      page.locator(".todoList li").filter({ hasText: "Replay Target" })
    ).toHaveCount(2);

    // 4. Verify a "Replay timeline event" system event was added
    await expect(
      page.locator(".timelineItem").filter({ hasText: "Replay timeline event" })
    ).toBeVisible();
  });

  test("should show correct toast notifications", async ({ page }) => {
    // 1. Success toast
    await page.getByRole("button", { name: "Reset demo state" }).click();
    await expect(page.locator(".toast-success")).toContainText(
      "Demo state reset"
    );

    // 2. Error toast
    await page.getByRole("button", { name: "Validation errors" }).click();
    await page.getByPlaceholder("Create a todo").fill("x"); // Trigger validation
    await page.getByRole("button", { exact: true, name: "Create" }).click();
    await expect(page.locator(".toast-error")).toBeVisible();
  });

  test("should verify mutateByGroup targeting", async ({ page }) => {
    const utilities = page
      .locator(".panel")
      .filter({ hasText: "Utilities Demo" });

    // Target 'tasks' group
    await utilities.getByLabel("Target groups").fill("tasks");
    await utilities
      .getByRole("button", { name: "mutateByGroup revalidate" })
      .click();

    // Verify status message
    await expect(
      utilities.getByText(MUTATE_BY_GROUP_REVALIDATED)
    ).toBeVisible();

    // Verify timeline entry
    await expect(
      page
        .locator(".timelineItem")
        .filter({ hasText: "mutateByGroup revalidate" })
    ).toBeVisible();
  });

  test("should verify low-level cache utilities and reset", async ({
    page,
  }) => {
    const utilities = page
      .locator(".panel")
      .filter({ hasText: "Utilities Demo" });

    // 1. swrGetCache / extractSWRKey
    await utilities.getByRole("button", { name: "swrGetCache read" }).click();
    await expect(utilities.locator("pre").first()).not.toBeEmpty();

    await utilities
      .getByRole("button", { name: "extractSWRKey parse" })
      .click();
    await expect(
      page.locator(".timelineItem").filter({ hasText: "extractSWRKey parse" })
    ).toBeVisible();

    // 2. resetCache
    await utilities
      .getByRole("button", { name: "resetCache preserve app-config" })
      .click();
    await expect(page.locator(".toast-success")).toContainText(
      "resetCache cleared"
    );
  });
});
