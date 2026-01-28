export interface Pagination {
  page: number;
  per_page: number;
  total: number;
  total_pages?: number; // Backend might not return this, can calculate
  has_next: boolean;
  has_prev: boolean;
}

// Backend seems to return flat structure
export interface PaginatedResponse<T> extends Pagination {
  items: T[];
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  permissions: number;
  projects?: Project[];
  tasks?: Task[];
}

export interface Project {
  id: string;
  name: string;
  email: string | null;
  send_email: boolean;
  archived: boolean;
  developers: User[];
  tasks: Task[];
}

export interface Task {
  id: string;
  project_id: string;
  project_name: string;
  user_id: string;
  user_name: string;
  title: string;
  hours_required: number;
  hours_worked: number;
  returned: boolean;
  description: string;
  logs: Log[];
  status: string | null;
  updated_at: number | null;
  created_at: number;
}

export interface Log {
  id: string;
  task_id: string;
  task_name: string;
  description: string;
  user_id: string;
  user_name: string;
  project_id: string;
  project_name: string;
  hours_spent: number;
  task_status: string;
  created_at: number;
}

export const TaskStatus = {
  PLANNING: "Planning",
  RESEARCH: "Research",
  IMPLEMENTATION: "Implementation",
  DONE: "Done",
  CANCELLED: "Cancelled",
  ON_HOLD: "On Hold",
  TESTING: "Testing",
  REVIEW: "Review",
} as const;

export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export const PERMISSIONS = {
  ADMIN: 127, 
  MANAGE_USERS: 1,
};
