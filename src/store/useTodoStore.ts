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
  panelWidth: number;
  panelHeight: number;

  // Actions
  setView: (v: AppView) => void;
  setTab: (t: PanelTab) => void;
  setShowDiscardPool: (s: boolean) => void;
  toggleTheme: () => void;
  setPanelSize: (w: number, h: number) => void;

  addTodo: (text: string) => void;
  editTodo: (id: string, text: string) => void;
  completeTodo: (id: string) => void;
  discardTodo: (id: string) => void;
  restoreTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  cycleBulb: (id: string) => void;
  reorderTodos: (orderedIds: string[]) => void;
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
      panelWidth: 310,
      panelHeight: 480,

      setView: (v) => set({ view: v }),
      setTab: (t) => set({ tab: t }),
      setShowDiscardPool: (s) => set({ showDiscardPool: s }),
      toggleTheme: () => set((s) => ({ theme: s.theme === "dark" ? "light" : "dark" })),
      setPanelSize: (w, h) => set({ panelWidth: w, panelHeight: h }),

      addTodo: (text) =>
        set((s) => ({
          todos: [
            {
              id: genId(),
              text: text.trim(),
              status: "active",
              bulbState: "green",
              order: Date.now(),
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

      reorderTodos: (orderedIds) =>
        set((s) => {
          const urgencyOrder: Record<string, number> = { red: 0, yellow: 1, green: 2 };
          // Filter orderedIds to only active todos that exist in state
          const validIds = orderedIds.filter((id) =>
            s.todos.some((t) => t.id === id && t.status === "active")
          );
          // Group valid IDs by priority
          const groups: Record<string, string[]> = { red: [], yellow: [], green: [] };
          for (const id of validIds) {
            const t = s.todos.find((t) => t.id === id);
            if (t) groups[t.bulbState].push(id);
          }
          // Assign sequential order values within each priority group
          const updated = new Map<string, number>();
          let base = 0;
          for (const state of ["red", "yellow", "green"]) {
            groups[state].forEach((id, i) => updated.set(id, base + i));
            base += Math.max(groups[state].length, 1) * 1000;
          }
          return {
            todos: s.todos.map((t) =>
              updated.has(t.id) ? { ...t, order: updated.get(t.id)! } : t
            ),
          };
        }),

      cycleBulb: (id) =>
        set((s) => ({
          todos: s.todos.map((t) =>
            t.id === id
              ? { ...t, bulbState: bulbCycle[t.bulbState], order: Date.now() }
              : t
          ),
        })),
    }),
    {
      name: "floatthings-todos",
      partialize: (state) => ({
        todos: state.todos,
        theme: state.theme,
        panelWidth: state.panelWidth,
        panelHeight: state.panelHeight,
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