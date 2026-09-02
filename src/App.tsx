import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { BreadcrumbsBar } from './components/BreadcrumbsBar';
import { KanbanBoard } from './components/KanbanBoard';
import { TaskModal } from './components/TaskModal';
import { TaskDetailPanel } from './components/TaskDetailPanel';
import { HierarchyTreeDrawer } from './components/HierarchyTreeDrawer';
import { INITIAL_TASKS } from './data/initialTasks';
import { ColumnStatus, Priority, SubtaskItem, ViewStyle } from './types';
import {
  addSubtaskToTree,
  calculateTaskProgress,
  deleteTaskFromTree,
  filterTasks,
  findTaskById,
  getBreadcrumbTrail,
  moveTaskInTree,
  updateTaskInTree,
} from './utils/taskTreeUtils';

const STORAGE_KEY = 'nested_kanban_tasks_v1';
const VIEW_STYLE_STORAGE_KEY = 'nested_kanban_view_style_v1';

export default function App() {
  // Load tasks from LocalStorage or default to INITIAL_TASKS
  const [tasks, setTasks] = useState<SubtaskItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load tasks from localStorage', e);
    }
    return INITIAL_TASKS;
  });

  // View Style: 'postit' vs 'professional'
  const [viewStyle, setViewStyle] = useState<ViewStyle>(() => {
    try {
      const saved = localStorage.getItem(VIEW_STYLE_STORAGE_KEY);
      if (saved === 'postit' || saved === 'professional') {
        return saved;
      }
    } catch (e) {
      console.error('Failed to load view style from localStorage', e);
    }
    return 'postit';
  });

  // Active top-level initiative ID
  const [activeL1Id, setActiveL1Id] = useState<string>(() => {
    return tasks[0]?.id || 'l1-saas-platform';
  });

  // Active Parent Task ID whose subtasks are currently displayed in the Kanban
  // If activeParentId is an L1 task -> Kanban shows its L2 subtasks
  // If activeParentId is an L2 task -> Kanban shows its L3 subtasks
  // If activeParentId is an L3 task -> Kanban shows its L4 leaf subtasks
  const [activeParentId, setActiveParentId] = useState<string>(() => {
    return tasks[0]?.id || 'l1-saas-platform';
  });

  // Selected Task ID for the 30% card / 70% detail & dateline table split view
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Global search query
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Tree Drawer Open State
  const [isTreeDrawerOpen, setIsTreeDrawerOpen] = useState<boolean>(false);

  // Task Create/Edit Modal State
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    initialTask: SubtaskItem | null;
    targetLevel: 1 | 2 | 3 | 4;
    parentTask: SubtaskItem | null;
    defaultStatus: ColumnStatus;
  }>({
    isOpen: false,
    initialTask: null,
    targetLevel: 2,
    parentTask: null,
    defaultStatus: 'todo',
  });

  // Persist tasks to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.error('Failed to persist tasks to localStorage', e);
    }
  }, [tasks]);

  // Persist view style
  const handleToggleViewStyle = (style: ViewStyle) => {
    setViewStyle(style);
    try {
      localStorage.setItem(VIEW_STYLE_STORAGE_KEY, style);
    } catch (e) {
      console.error('Failed to persist view style to localStorage', e);
    }
  };

  // Find the active parent task object
  const activeParentTask = useMemo(() => {
    return findTaskById(tasks, activeParentId) || tasks[0] || null;
  }, [tasks, activeParentId]);

  // Find the currently selected task for the 30%/70% split view
  const selectedTask = useMemo(() => {
    if (!selectedTaskId) return null;
    return findTaskById(tasks, selectedTaskId);
  }, [tasks, selectedTaskId]);

  // Compute breadcrumbs trail
  const breadcrumbs = useMemo(() => {
    if (!activeParentTask) return [];
    return getBreadcrumbTrail(tasks, activeParentTask.id);
  }, [tasks, activeParentTask]);

  // Tasks to display in the current active Kanban board
  const currentBoardTasks = useMemo(() => {
    if (!activeParentTask) return [];
    const directSubtasks = activeParentTask.subtasks || [];
    return filterTasks(directSubtasks, searchQuery, 'all', 'all');
  }, [activeParentTask, searchQuery]);

  // Current level of the board
  const currentBoardLevel = (
    activeParentTask ? Math.min(activeParentTask.level + 1, 4) : 2
  ) as 1 | 2 | 3 | 4;

  // Handle switching top-level initiative
  const handleSelectL1Task = (taskId: string) => {
    setActiveL1Id(taskId);
    setActiveParentId(taskId);
    setSelectedTaskId(null);
  };

  // Handle drilling down into a task's subtasks Kanban board
  const handleDrillDown = (task: SubtaskItem) => {
    if (task.level >= 4) return; // Cannot drill deeper than level 4
    setActiveParentId(task.id);
    setSelectedTaskId(null);
  };

  // Handle clicking a breadcrumb step
  const handleNavigateToBreadcrumb = (targetId: string) => {
    const target = findTaskById(tasks, targetId);
    if (!target) return;

    if (target.level === 1) {
      setActiveL1Id(target.id);
    }
    setActiveParentId(target.id);
    setSelectedTaskId(null);
  };

  // Handle level up (go to parent)
  const handleLevelUp = useCallback(() => {
    if (breadcrumbs.length <= 1) return;
    const parentStep = breadcrumbs[breadcrumbs.length - 2];
    if (parentStep) {
      handleNavigateToBreadcrumb(parentStep.id);
    }
  }, [breadcrumbs]);

  // Keyboard shortcut: Escape to close split view or navigate Level Up
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (modalConfig.isOpen || isTreeDrawerOpen) return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        return;
      }

      if (e.key === 'Escape') {
        if (selectedTaskId) {
          e.preventDefault();
          setSelectedTaskId(null);
        } else if (breadcrumbs.length > 1) {
          e.preventDefault();
          handleLevelUp();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalConfig.isOpen, isTreeDrawerOpen, selectedTaskId, breadcrumbs, handleLevelUp]);

  // Drag-and-drop task movement
  const handleMoveTask = (taskId: string, targetStatus: ColumnStatus, targetIndex?: number) => {
    if (!activeParentTask) return;
    setTasks((prevTasks) =>
      moveTaskInTree(prevTasks, taskId, targetStatus, activeParentTask.id, targetIndex)
    );
  };

  // Update task directly (e.g., status, priority, dueDate from details panel)
  const handleUpdateTaskDirectly = (taskId: string, updates: Partial<SubtaskItem>) => {
    setTasks((prevTasks) =>
      updateTaskInTree(prevTasks, taskId, (t) => ({
        ...t,
        ...updates,
      }))
    );
  };

  // Quick add subtask with dateline from the table
  const handleQuickAddSubtaskWithDateline = (
    parentTaskId: string,
    subtaskData: {
      title: string;
      status: ColumnStatus;
      priority: Priority;
      dueDate?: string;
      assigneeName?: string;
    }
  ) => {
    const parent = findTaskById(tasks, parentTaskId);
    const targetLevel = (parent ? Math.min(parent.level + 1, 4) : 2) as 1 | 2 | 3 | 4;
    const newId = `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const initials = subtaskData.assigneeName
      ? subtaskData.assigneeName
          .trim()
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .substring(0, 2)
      : 'U';

    const newSubtask: SubtaskItem = {
      id: newId,
      title: subtaskData.title,
      description: '',
      status: subtaskData.status,
      priority: subtaskData.priority,
      color: 'yellow',
      dueDate: subtaskData.dueDate,
      assignee: subtaskData.assigneeName
        ? {
            name: subtaskData.assigneeName,
            initials,
          }
        : undefined,
      tags: [],
      level: targetLevel,
      parentId: parentTaskId,
      subtasks: [],
      order: 999,
      createdAt: new Date().toISOString(),
    };

    setTasks((prevTasks) => addSubtaskToTree(prevTasks, parentTaskId, newSubtask));
  };

  // Toggle complete for leaf tasks
  const handleToggleComplete = (task: SubtaskItem) => {
    const nextStatus: ColumnStatus = task.status === 'done' ? 'in_progress' : 'done';
    setTasks((prevTasks) =>
      updateTaskInTree(prevTasks, task.id, (t) => ({
        ...t,
        status: nextStatus,
      }))
    );
  };

  // Open modal to create task at a specific level
  const handleOpenCreateModal = (
    level: 1 | 2 | 3 | 4,
    parentId?: string | null,
    defaultStatus: ColumnStatus = 'todo'
  ) => {
    const parent = parentId ? findTaskById(tasks, parentId) : null;
    setModalConfig({
      isOpen: true,
      initialTask: null,
      targetLevel: level,
      parentTask: parent,
      defaultStatus,
    });
  };

  // Open modal to edit existing task
  const handleOpenEditModal = (task: SubtaskItem) => {
    const parent = task.parentId ? findTaskById(tasks, task.parentId) : null;
    setModalConfig({
      isOpen: true,
      initialTask: task,
      targetLevel: task.level,
      parentTask: parent,
      defaultStatus: task.status,
    });
  };

  // Delete task
  const handleDeleteTask = (taskId: string) => {
    setTasks((prevTasks) => {
      const updated = deleteTaskFromTree(prevTasks, taskId);
      // If deleted task was the active parent, reset to root
      if (taskId === activeParentId) {
        setActiveParentId(updated[0]?.id || '');
        setActiveL1Id(updated[0]?.id || '');
      }
      return updated;
    });
  };

  // Save task from modal (create or update)
  const handleSaveTaskModal = (taskData: Partial<SubtaskItem>) => {
    if (modalConfig.initialTask) {
      // Edit existing task
      const updatedId = modalConfig.initialTask.id;
      setTasks((prevTasks) =>
        updateTaskInTree(prevTasks, updatedId, (t) => ({
          ...t,
          ...taskData,
        }))
      );
    } else {
      // Create new task
      const newId = `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newTask: SubtaskItem = {
        id: newId,
        title: taskData.title || 'Untitled Task',
        description: taskData.description || '',
        status: taskData.status || 'todo',
        priority: taskData.priority || 'medium',
        color: taskData.color || 'yellow',
        dueDate: taskData.dueDate,
        assignee: taskData.assignee,
        tags: taskData.tags || [],
        level: modalConfig.targetLevel,
        parentId: modalConfig.parentTask ? modalConfig.parentTask.id : null,
        subtasks: [],
        order: 999,
        createdAt: new Date().toISOString(),
      };

      setTasks((prevTasks) =>
        addSubtaskToTree(prevTasks, modalConfig.parentTask ? modalConfig.parentTask.id : null, newTask)
      );

      // If created an L1 task, select it
      if (modalConfig.targetLevel === 1) {
        setActiveL1Id(newId);
        setActiveParentId(newId);
      }
    }
  };

  // Reset to initial demo dataset
  const handleResetData = () => {
    if (window.confirm('Reset task tracker to sample demo data? All current changes will be replaced.')) {
      setTasks(INITIAL_TASKS);
      setActiveL1Id(INITIAL_TASKS[0].id);
      setActiveParentId(INITIAL_TASKS[0].id);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-[#F9F9F7] text-[#2D2D2D]">
      {/* Top Header with L1 Switcher, View Toggle & Actions */}
      <Header
        rootTasks={tasks}
        activeL1Id={activeL1Id}
        onSelectL1Task={handleSelectL1Task}
        viewStyle={viewStyle}
        onToggleViewStyle={handleToggleViewStyle}
        onOpenCreateModal={handleOpenCreateModal}
        onOpenTreeDrawer={() => setIsTreeDrawerOpen(true)}
        onResetData={handleResetData}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Breadcrumbs & Level Navigation Bar */}
      <BreadcrumbsBar
        breadcrumbs={breadcrumbs}
        currentTask={activeParentTask}
        onNavigateToLevel={handleNavigateToBreadcrumb}
        onLevelUp={handleLevelUp}
        onOpenCreateModal={handleOpenCreateModal}
        currentLevelTasks={currentBoardTasks}
      />

      {/* Main Kanban Workspace / Split Task Detail & Dateline Table */}
      <main className="flex-1 w-full overflow-y-auto bg-dotted-canvas flex flex-col">
        {selectedTask ? (
          <TaskDetailPanel
            selectedTask={selectedTask}
            allTasks={tasks}
            viewStyle={viewStyle}
            onClose={() => setSelectedTaskId(null)}
            onSelectTask={(task) => setSelectedTaskId(task.id)}
            onDrillDown={(task) => {
              handleDrillDown(task);
              setSelectedTaskId(null);
            }}
            onEditTask={handleOpenEditModal}
            onDeleteTask={(taskId) => {
              handleDeleteTask(taskId);
              if (selectedTaskId === taskId) {
                setSelectedTaskId(null);
              }
            }}
            onAddSubtask={(parent) =>
              handleOpenCreateModal(
                Math.min(parent.level + 1, 4) as 1 | 2 | 3 | 4,
                parent.id
              )
            }
            onToggleComplete={handleToggleComplete}
            onUpdateTask={handleUpdateTaskDirectly}
            onMoveTask={handleMoveTask}
            onQuickAddSubtaskWithDateline={handleQuickAddSubtaskWithDateline}
          />
        ) : (
          <KanbanBoard
            tasks={currentBoardTasks}
            viewStyle={viewStyle}
            selectedTaskId={selectedTaskId}
            onSelectTask={(task) => setSelectedTaskId(task.id)}
            onDrillDown={handleDrillDown}
            onEditTask={handleOpenEditModal}
            onDeleteTask={handleDeleteTask}
            onAddSubtask={(parent) =>
              handleOpenCreateModal(
                Math.min(parent.level + 1, 4) as 1 | 2 | 3 | 4,
                parent.id
              )
            }
            onToggleComplete={handleToggleComplete}
            onMoveTask={handleMoveTask}
            onQuickAddTaskToColumn={(status) =>
              handleOpenCreateModal(currentBoardLevel, activeParentTask ? activeParentTask.id : null, status)
            }
            currentLevel={currentBoardLevel}
          />
        )}
      </main>

      {/* Create / Edit Task Modal */}
      <TaskModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
        onSave={handleSaveTaskModal}
        initialTask={modalConfig.initialTask}
        targetLevel={modalConfig.targetLevel}
        parentTask={modalConfig.parentTask}
        defaultStatus={modalConfig.defaultStatus}
      />

      {/* 4-Level Hierarchy Tree Map Slide-over Drawer */}
      <HierarchyTreeDrawer
        isOpen={isTreeDrawerOpen}
        onClose={() => setIsTreeDrawerOpen(false)}
        rootTasks={tasks}
        onSelectTask={(taskId) => {
          const selectedItem = findTaskById(tasks, taskId);
          if (selectedItem) {
            // Find root L1 ancestor
            const trail = getBreadcrumbTrail(tasks, taskId);
            if (trail[0]) {
              setActiveL1Id(trail[0].id);
            }
            setActiveParentId(taskId);
            setSelectedTaskId(taskId);
            setIsTreeDrawerOpen(false);
          }
        }}
        activeTaskId={activeParentId}
      />
    </div>
  );
}
