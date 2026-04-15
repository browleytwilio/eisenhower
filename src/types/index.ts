export type Quadrant = "do_first" | "schedule" | "delegate" | "eliminate";

export type Subtask = {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  position: number;
  createdAt: string;
};

export type Task = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  quadrant: Quadrant;
  position: number;
  dueDate: string | null;
  tags: string[] | null;
  completed: boolean;
  completedAt: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  subtaskCount?: number;
  subtaskDoneCount?: number;
};
