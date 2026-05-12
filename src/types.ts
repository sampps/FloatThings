export type BulbState = "green" | "yellow" | "red";
export type TodoStatus = "active" | "completed" | "discarded";
export type PanelTab = "todo" | "completed";

export interface TodoItem {
  id: string;
  text: string;
  status: TodoStatus;
  bulbState: BulbState;
  createdAt: number;
  completedAt: number | null;
}

export type AppView = "bubble" | "panel";
