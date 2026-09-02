import { BreadcrumbStep, ColumnStatus, SubtaskItem } from '../types';

/**
 * Recursively find a task by its ID in the task tree
 */
export function findTaskById(tasks: SubtaskItem[], id: string): SubtaskItem | null {
  for (const task of tasks) {
    if (task.id === id) return task;
    if (task.subtasks && task.subtasks.length > 0) {
      const found = findTaskById(task.subtasks, id);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Builds the breadcrumb trail from root (Level 1) down to the given task ID
 */
export function getBreadcrumbTrail(tasks: SubtaskItem[], targetId: string): BreadcrumbStep[] {
  const trail: BreadcrumbStep[] = [];

  function traverse(currentTasks: SubtaskItem[], target: string): boolean {
    for (const task of currentTasks) {
      if (task.id === target) {
        trail.unshift({ id: task.id, title: task.title, level: task.level });
        return true;
      }
      if (task.subtasks && task.subtasks.length > 0) {
        if (traverse(task.subtasks, target)) {
          trail.unshift({ id: task.id, title: task.title, level: task.level });
          return true;
        }
      }
    }
    return false;
  }

  traverse(tasks, targetId);
  return trail;
}

/**
 * Calculates progress roll-up for a task:
 * Returns { completed, total, percentage, deepTotal, deepCompleted, deepPercentage }
 */
export function calculateTaskProgress(task: SubtaskItem): {
  directTotal: number;
  directCompleted: number;
  directPercentage: number;
  deepTotal: number;
  deepCompleted: number;
  deepPercentage: number;
} {
  const directSubtasks = task.subtasks || [];
  const directTotal = directSubtasks.length;
  const directCompleted = directSubtasks.filter((st) => st.status === 'done').length;
  const directPercentage = directTotal > 0 ? Math.round((directCompleted / directTotal) * 100) : task.status === 'done' ? 100 : 0;

  let deepTotal = 0;
  let deepCompleted = 0;

  function countDeep(items: SubtaskItem[]) {
    for (const item of items) {
      deepTotal++;
      if (item.status === 'done') {
        deepCompleted++;
      }
      if (item.subtasks && item.subtasks.length > 0) {
        countDeep(item.subtasks);
      }
    }
  }

  countDeep(directSubtasks);

  const deepPercentage = deepTotal > 0 ? Math.round((deepCompleted / deepTotal) * 100) : task.status === 'done' ? 100 : 0;

  return {
    directTotal,
    directCompleted,
    directPercentage,
    deepTotal,
    deepCompleted,
    deepPercentage,
  };
}

/**
 * Recursively update a task in the tree
 */
export function updateTaskInTree(
  tasks: SubtaskItem[],
  taskId: string,
  updater: (task: SubtaskItem) => SubtaskItem
): SubtaskItem[] {
  return tasks.map((task) => {
    if (task.id === taskId) {
      return updater(task);
    }
    if (task.subtasks && task.subtasks.length > 0) {
      return {
        ...task,
        subtasks: updateTaskInTree(task.subtasks, taskId, updater),
      };
    }
    return task;
  });
}

/**
 * Recursively delete a task from the tree
 */
export function deleteTaskFromTree(tasks: SubtaskItem[], taskId: string): SubtaskItem[] {
  return tasks
    .filter((task) => task.id !== taskId)
    .map((task) => {
      if (task.subtasks && task.subtasks.length > 0) {
        return {
          ...task,
          subtasks: deleteTaskFromTree(task.subtasks, taskId),
        };
      }
      return task;
    });
}

/**
 * Add a new subtask to a parent task or to the top level (if parentId is null)
 */
export function addSubtaskToTree(
  tasks: SubtaskItem[],
  parentId: string | null,
  newTask: SubtaskItem
): SubtaskItem[] {
  if (!parentId) {
    return [...tasks, newTask];
  }

  return tasks.map((task) => {
    if (task.id === parentId) {
      const currentSubtasks = task.subtasks || [];
      return {
        ...task,
        subtasks: [...currentSubtasks, newTask],
      };
    }
    if (task.subtasks && task.subtasks.length > 0) {
      return {
        ...task,
        subtasks: addSubtaskToTree(task.subtasks, parentId, newTask),
      };
    }
    return task;
  });
}

/**
 * Move a task between columns or reorder inside the same column
 * within a specific parent list (or top-level list)
 */
export function moveTaskInList(
  list: SubtaskItem[],
  draggedTaskId: string,
  targetStatus: ColumnStatus,
  targetIndex?: number
): SubtaskItem[] {
  const draggedTask = list.find((t) => t.id === draggedTaskId);
  if (!draggedTask) return list;

  const withoutDragged = list.filter((t) => t.id !== draggedTaskId);
  const updatedTask: SubtaskItem = {
    ...draggedTask,
    status: targetStatus,
  };

  // If specific target index is provided within target status group:
  if (typeof targetIndex === 'number') {
    const statusItems = withoutDragged.filter((t) => t.status === targetStatus);
    const otherItems = withoutDragged.filter((t) => t.status !== targetStatus);

    statusItems.splice(targetIndex, 0, updatedTask);

    // Re-assign order indices
    const updatedStatusItems = statusItems.map((item, idx) => ({
      ...item,
      order: idx,
    }));

    return [...otherItems, ...updatedStatusItems].sort((a, b) => a.order - b.order);
  }

  // Otherwise append to end of that column
  const statusItems = withoutDragged.filter((t) => t.status === targetStatus);
  const otherItems = withoutDragged.filter((t) => t.status !== targetStatus);

  const updatedStatusItems = [...statusItems, { ...updatedTask, order: statusItems.length }];
  return [...otherItems, ...updatedStatusItems].sort((a, b) => a.order - b.order);
}

/**
 * Move a task inside the global tree (either top level or nested inside its parent)
 */
export function moveTaskInTree(
  tasks: SubtaskItem[],
  draggedTaskId: string,
  targetStatus: ColumnStatus,
  parentId: string | null,
  targetIndex?: number
): SubtaskItem[] {
  if (!parentId) {
    return moveTaskInList(tasks, draggedTaskId, targetStatus, targetIndex);
  }

  return tasks.map((task) => {
    if (task.id === parentId) {
      return {
        ...task,
        subtasks: moveTaskInList(task.subtasks || [], draggedTaskId, targetStatus, targetIndex),
      };
    }
    if (task.subtasks && task.subtasks.length > 0) {
      return {
        ...task,
        subtasks: moveTaskInTree(task.subtasks, draggedTaskId, targetStatus, parentId, targetIndex),
      };
    }
    return task;
  });
}

/**
 * Filter tasks based on search and filters
 */
export function filterTasks(
  tasks: SubtaskItem[],
  searchQuery: string,
  priorityFilter: string,
  statusFilter: string
): SubtaskItem[] {
  return tasks.filter((task) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      task.title.toLowerCase().includes(query) ||
      (task.description && task.description.toLowerCase().includes(query)) ||
      (task.tags && task.tags.some((tag) => tag.toLowerCase().includes(query))) ||
      (task.assignee && task.assignee.name.toLowerCase().includes(query));

    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;

    return matchesSearch && matchesPriority && matchesStatus;
  });
}
