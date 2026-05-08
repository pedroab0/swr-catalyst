import App from "@demo/App";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

const VALIDATION_ERRORS = /Validation errors/;
const VALIDATION_MODE_ENABLED = /Validation mode enabled/i;
const MUTATION_ERROR_INSPECTOR = /MutationError Inspector/i;

async function createTodo(title: string) {
  const input = screen.getByPlaceholderText("Create a todo");
  fireEvent.change(input, {
    target: { value: title },
  });
  fireEvent.click(screen.getByRole("button", { name: "Create" }));

  await waitFor(() => {
    expect(screen.getByText(title)).toBeTruthy();
  });
}

describe("scenario feature", () => {
  it("should reset created todos when resetting demo state", async () => {
    render(<App />);

    await createTodo("Todo to be reset");

    fireEvent.click(screen.getByRole("button", { name: "Reset demo state" }));

    await waitFor(() => {
      expect(screen.queryByText("Todo to be reset")).toBeNull();
      expect(screen.getByText("Document API behavior")).toBeTruthy();
    });
  });

  it("should render mutation errors when validation mode is enabled", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: VALIDATION_ERRORS }));

    const input = screen.getByPlaceholderText("Create a todo");
    fireEvent.change(input, { target: { value: "Fail" } });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => {
      expect(
        screen.getAllByText(VALIDATION_MODE_ENABLED).length
      ).toBeGreaterThan(0);
      expect(screen.getByText(MUTATION_ERROR_INSPECTOR)).toBeTruthy();
    });
  });
});
