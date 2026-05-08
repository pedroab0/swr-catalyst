import App from "@demo/App";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { describe, expect, it } from "vitest";

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

describe("todos feature", () => {
  it("should create, update and delete todos", async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Document API behavior")).toBeTruthy();
    });

    await createTodo("Write demo regression test");

    const createdTodoLabel = screen.getByText("Write demo regression test");
    const createdTodoItem = createdTodoLabel.closest("li");
    if (!createdTodoItem) {
      throw new Error("Created todo item not found");
    }

    const createdRenameButton = await within(createdTodoItem).findByRole(
      "button",
      { name: "Rename" }
    );
    expect(createdRenameButton).toBeTruthy();

    fireEvent.click(createdRenameButton);

    const renameInput = screen.getByDisplayValue("Write demo regression test");
    fireEvent.change(renameInput, { target: { value: "Renamed item" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    const deleteButton = await waitFor(() => {
      const renamedLabel = screen.getByText("Renamed item");
      const renamedTodoItem = renamedLabel.closest("li");
      if (!renamedTodoItem) {
        throw new Error("Renamed todo item not found");
      }
      const btn = within(renamedTodoItem).queryByRole("button", {
        name: "Delete",
      });
      if (!btn) {
        throw new Error("Delete button not found yet");
      }
      return btn;
    });

    expect(deleteButton.textContent).toBe("Delete");

    const totalBeforeDelete = screen.getAllByRole("button", {
      name: "Delete",
    }).length;
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: "Delete" }).length).toBe(
        totalBeforeDelete - 1
      );
    });
  });
});
