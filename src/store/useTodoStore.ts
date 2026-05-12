import { create } from "zustand";
import type { BulbState, PanelTab, TodoItem, AppView } from "../types";

let nextId = 1;
const genId = () => `todo-${nextId++}-${Date.now()}`;

interface TodoStore {
  todos: TodoItem[];
  view: AppView;
  tab: PanelTab;
  showDiscardPool: boolean;

  // Actions
  setView: (v: AppView) => void;
  setTab: (t: PanelTab) => void;
  setShowDiscardPool: (s: boolean) => void;

  addTodo: (text: string) => void;
  completeTodo: (id: string) => void;
  discardTodo: (id: string) => void;
  restoreTodo: (id: string) => void;
  cycleBulb: (id: string) => void;
}

const bulbCycle: Record<BulbState, BulbState> = {
  green: "yellow",
  yellow: "red",
  red: "green",
};

export const useTodoStore = create<TodoStore>((set) => ({
  todos: [],
  view: "bubble",
  tab: "todo",
  showDiscardPool: false,

  setView: (v) => set({ view: v }),
  setTab: (t) => set({ tab: t }),
  setShowDiscardPool: (s) => set({ showDiscardPool: s }),

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

  cycleBulb: (id) =>
    set((s) => ({
      todos: s.todos.map((t) =>
        t.id === id ? { ...t, bulbState: bulbCycle[t.bulbState] } : t
      ),
    })),
}));

// Selectors
export const selectActiveTodos = (s: TodoStore) =>
  s.todos.filter((t) => t.status === "active");

export const selectCompletedTodos = (s: TodoStore) =>
  s.todos.filter((t) => t.status === "completed");

export const selectDiscardedTodos = (s: TodoStore) =>
  s.todos.filter((t) => t.status === "discarded");
