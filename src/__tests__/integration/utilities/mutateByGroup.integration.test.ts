import { act, waitFor } from "@testing-library/react";
import useSWR from "swr";
import { describe, expect, it } from "vitest";

import type { SWRKey } from "@/types";
import type { Todo } from "../helpers";

import { mutateByGroup } from "@/utils";
import { fetchTodos, renderHookWithGlobalCache, uniqueKeyId } from "../helpers";

/** Asserts that todos data matches expected values */
function assertTodosData(
  data: Todo[] | undefined,
  expected: { length: number; firstId: number; firstTitle: string }
) {
  expect(data?.length).toBe(expected.length);
  expect(data?.[0].id).toBe(expected.firstId);
  expect(data?.[0].title).toBe(expected.firstTitle);
}

describe("mutateByGroup - Integration Tests", () => {
  it("should revalidate cache entries by group", async () => {
    const groupName = uniqueKeyId("group-revalidate");
    const keyId1 = uniqueKeyId("user-todos");
    const keyId2 = uniqueKeyId("user-settings");

    const userTodosKey: SWRKey<Todo> = {
      id: keyId1,
      group: groupName,
      data: { id: 1, completed: false, title: "" },
    };

    const userSettingsKey: SWRKey<Todo> = {
      id: keyId2,
      group: groupName,
      data: { id: 2, completed: false, title: "" },
    };

    let todosFetchCount = 0;
    let settingsFetchCount = 0;

    const { result } = renderHookWithGlobalCache(() => {
      const todos = useSWR(userTodosKey, () => {
        todosFetchCount += 1;
        return fetchTodos();
      });

      const settings = useSWR(userSettingsKey, () => {
        settingsFetchCount += 1;
        return fetchTodos();
      });

      return { todos, settings };
    });

    await waitFor(() => {
      expect(result.current.todos.data).toBeDefined();
      expect(result.current.settings.data).toBeDefined();
    });

    expect(todosFetchCount).toBe(1);
    expect(settingsFetchCount).toBe(1);

    await act(async () => {
      await mutateByGroup(groupName);
    });

    await waitFor(() => {
      expect(todosFetchCount).toBe(2);
      expect(settingsFetchCount).toBe(2);
    });
  });

  it("should update cache entries by group with new data", async () => {
    const groupName = uniqueKeyId("group-update");
    const keyId1 = uniqueKeyId("todos-update");
    const keyId2 = uniqueKeyId("settings-update");

    const userTodosKey: SWRKey<Todo> = {
      id: keyId1,
      group: groupName,
      data: { id: 1, completed: false, title: "" },
    };

    const userSettingsKey: SWRKey<Todo> = {
      id: keyId2,
      group: groupName,
      data: { id: 2, completed: false, title: "" },
    };

    const { result } = renderHookWithGlobalCache(() => {
      const todos = useSWR(userTodosKey, fetchTodos, {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      });

      const settings = useSWR(userSettingsKey, fetchTodos, {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      });

      return { todos, settings };
    });

    await waitFor(() => {
      expect(result.current.todos.data).toBeDefined();
      expect(result.current.settings.data).toBeDefined();
    });

    expect(result.current.todos.data?.[0].title).toBe("Test Todo 1");
    expect(result.current.settings.data?.[0].title).toBe("Test Todo 1");

    const newData: Todo[] = [
      { id: 999, title: "Group Mutated", completed: true },
    ];

    await act(async () => {
      await mutateByGroup(groupName, newData, { revalidate: false });
    });

    const expectedData = {
      length: 1,
      firstId: 999,
      firstTitle: "Group Mutated",
    };

    await waitFor(() => {
      assertTodosData(result.current.todos.data, expectedData);
      assertTodosData(result.current.settings.data, expectedData);
    });
  });

  it("should handle multiple groups", async () => {
    const groupA = uniqueKeyId("group-a");
    const groupB = uniqueKeyId("group-b");
    const keyIdA = uniqueKeyId("todos-a");
    const keyIdB = uniqueKeyId("todos-b");

    const groupAKey: SWRKey<Todo> = {
      id: keyIdA,
      group: groupA,
      data: { id: 1, completed: false, title: "" },
    };

    const groupBKey: SWRKey<Todo> = {
      id: keyIdB,
      group: groupB,
      data: { id: 2, completed: false, title: "" },
    };

    let fetchCountA = 0;
    let fetchCountB = 0;

    const { result } = renderHookWithGlobalCache(() => {
      const swrA = useSWR(groupAKey, () => {
        fetchCountA += 1;

        return fetchTodos();
      });

      const swrB = useSWR(groupBKey, () => {
        fetchCountB += 1;

        return fetchTodos();
      });

      return { swrA, swrB };
    });

    await waitFor(() => {
      expect(result.current.swrA.data).toBeDefined();
      expect(result.current.swrB.data).toBeDefined();
    });

    expect(fetchCountA).toBe(1);
    expect(fetchCountB).toBe(1);

    await act(async () => {
      await mutateByGroup([groupA, groupB]);
    });

    await waitFor(() => {
      expect(fetchCountA).toBe(2);
      expect(fetchCountB).toBe(2);
    });
  });
});
