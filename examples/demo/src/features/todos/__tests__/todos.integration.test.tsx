import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import App from "@demo/App";

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
    expect(createdTodoItem).toBeTruthy();

    const createdRenameButton = createdTodoItem?.querySelector("button");
    expect(createdRenameButton?.textContent).toBe("Rename");
    if (!createdRenameButton) {
      throw new Error("Rename button not found for created todo.");
    }

    fireEvent.click(createdRenameButton);

    const renameInput = screen.getByDisplayValue("Write demo regression test");
    fireEvent.change(renameInput, { target: { value: "Renamed item" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(screen.getByText("Renamed item")).toBeTruthy();
    });

    const renamedLabel = screen.getByText("Renamed item");
    const renamedTodoItem = renamedLabel.closest("li");
    expect(renamedTodoItem).toBeTruthy();
    const deleteButton = renamedTodoItem?.querySelector("button.danger");
    expect(deleteButton?.textContent).toBe("Delete");
    if (!deleteButton) {
      throw new Error("Delete button not found for renamed todo.");
    }
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
