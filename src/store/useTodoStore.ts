import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { BulbState, PanelTab, TodoItem, AppView } from "../types";
import type { Theme } from "../theme";

let nextId = 1;
const genId = () => `todo-${nextId++}-${Date.now()}`;

interface TodoStore {
  todos: TodoItem[];
  view: AppView;
  tab: PanelTab;
  showDiscardPool: boolean;
  theme: Theme;

  // Actions
  setView: (v: AppView) => void;
  setTab: (t: PanelTab) => void;
  setShowDiscardPool: (s: boolean) => void;
  toggleTheme: () => void;

  addTodo: (text: string) => void;
  editTodo: (id: string, text: string) => void;
  completeTodo: (id: string) => void;
  discardTodo: (id: string) => void;
  restoreTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  cycleBulb: (id: string) => void;
}

const bulbCycle: Record<BulbState, BulbState> = {
  green: "yellow",
  yellow: "red",
  red: "green",
};

export const useTodoStore = create<TodoStore>()(
  persist(
    (set) => ({
      todos: [],
      view: "panel",
      tab: "todo",
      showDiscardPool: false,
      theme: "dark",

      setView: (v) => set({ view: v }),
      setTab: (t) => set({ tab: t }),
      setShowDiscardPool: (s) => set({ showDiscardPool: s }),
      toggleTheme: () => set((s) => ({ theme: s.theme === "dark" ? "light" : "dark" })),

      addTodo: (text) =>
        set((s) => ({
          todos: [
            {
              id: genId(),
              text: text.trim(),
              status: "active",
              bulbState: "green",
              createdAt: Date.now(),
              completedAt: null,
            },
            ...s.todos,
          ],
        })),

      editTodo: (id, text) =>
        set((s) => ({
          todos: s.todos.map((t) =>
            t.id === id ? { ...t, text: text.trim() } : t
          ),
        })),

      completeTodo: (id) =>
        set((s) => ({
          todos: s.todos.map((t) =>
            t.id === id
              ? { ...t, status: "completed" as const, completedAt: Date.now() }
              : t
          ),
        })),

      discardTodo: (id) =>
        set((s) => ({
          todos: s.todos.map((t) =>
            t.id === id ? { ...t, status: "discarded" as const } : t
          ),
        })),

      restoreTodo: (id) =>
        set((s) => ({
          todos: s.todos.map((t) =>
            t.id === id
              ? { ...t, status: "active" as const, completedAt: null }
              : t
          ),
        })),

      deleteTodo: (id) =>
        set((s) => ({
          todos: s.todos.filter((t) => t.id !== id),
        })),

      cycleBulb: (id) =>
        set((s) => ({
          todos: s.todos.map((t) =>
            t.id === id ? { ...t, bulbState: bulbCycle[t.bulbState] } : t
          ),
        })),
    }),
    {
      name: "floatthings-todos",
      partialize: (state) => ({
        todos: state.todos,
        theme: state.theme,
      }),
    }
  )
);

// Selectors
export const selectActiveTodos = (s: TodoStore) =>
  s.todos.filter((t) => t.status === "active");

export const selectCompletedTodos = (s: TodoStore) =>
  s.todos.filter((t) => t.status === "completed");

export const selectDiscardedTodos = (s: TodoStore) =>
  s.todos.filter((t) => t.status === "discarded");