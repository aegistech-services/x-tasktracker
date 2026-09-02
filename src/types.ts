export type ColumnStatus = 'todo' | 'in_progress' | 'review' | 'done';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type StickyColor = 'yellow' | 'blue' | 'green' | 'pink' | 'purple' | 'orange';

export interface SubtaskItem {
  id: string;
  title: string;
  description?: string;
  status: ColumnStatus;
  priority: Priority;
  color: StickyColor;
  dueDate?: string;
  assignee?: {
    name: string;
    avatar?: string;
    initials: string;
  };
  tags?: string[];
  level: 1 | 2 | 3 | 4;
  parentId?: string | null;
  subtasks: SubtaskItem[];
  order: number;
  createdAt: string;
}

export type ViewStyle = 'professional' | 'postit';

export interface ColumnDefinition {
  id: ColumnStatus;
  title: string;
  color: string;
  accent: string;
  bgPastel: string;
}

export interface BreadcrumbStep {
  id: string;
  title: string;
  level: 1 | 2 | 3 | 4;
}

export interface TaskFilterOptions {
  searchQuery: string;
  priority: Priority | 'all';
  status: ColumnStatus | 'all';
}
