import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  Eye,
  Plus,
  ArrowRight,
  Inbox,
  Filter,
} from 'lucide-react';
import { ColumnDefinition, ColumnStatus, SubtaskItem, ViewStyle } from '../types';
import { TaskCard } from './TaskCard';

interface KanbanBoardProps {
  tasks: SubtaskItem[];
  viewStyle: ViewStyle;
  selectedTaskId?: string | null;
  onSelectTask?: (task: SubtaskItem) => void;
  onDrillDown: (task: SubtaskItem) => void;
  onEditTask: (task: SubtaskItem) => void;
  onDeleteTask: (taskId: string) => void;
  onAddSubtask: (parentTask: SubtaskItem) => void;
  onToggleComplete: (task: SubtaskItem) => void;
  onMoveTask: (taskId: string, targetStatus: ColumnStatus, targetIndex?: number) => void;
  onQuickAddTaskToColumn: (status: ColumnStatus) => void;
  currentLevel: 1 | 2 | 3 | 4;
}

const COLUMNS: ColumnDefinition[] = [
  {
    id: 'todo',
    title: 'To Do',
    color: 'text-[#2D2D2D]',
    accent: 'bg-stone-400',
    bgPastel: 'bg-white border-stone-200',
  },
  {
    id: 'in_progress',
    title: 'In Progress',
    color: 'text-blue-700',
    accent: 'bg-blue-500',
    bgPastel: 'bg-white border-stone-200',
  },
  {
    id: 'review',
    title: 'In Review',
    color: 'text-purple-700',
    accent: 'bg-purple-500',
    bgPastel: 'bg-white border-stone-200',
  },
  {
    id: 'done',
    title: 'Completed',
    color: 'text-emerald-700',
    accent: 'bg-emerald-500',
    bgPastel: 'bg-white border-stone-200',
  },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  viewStyle,
  selectedTaskId,
  onSelectTask,
  onDrillDown,
  onEditTask,
  onDeleteTask,
  onAddSubtask,
  onToggleComplete,
  onMoveTask,
  onQuickAddTaskToColumn,
  currentLevel,
}) => {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<ColumnStatus | null>(null);
  const [dragOverCardId, setDragOverCardId] = useState<string | null>(null);

  // Filter tasks per column
  const getTasksByStatus = (status: ColumnStatus) => {
    return tasks.filter((t) => t.status === status);
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTaskId(taskId);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverColumn(null);
    setDragOverCardId(null);
  };

  const handleDragOverColumn = (e: React.DragEvent, status: ColumnStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== status) {
      setDragOverColumn(status);
    }
  };

  const handleDragOverCard = (e: React.DragEvent, targetCardId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragOverCardId !== targetCardId) {
      setDragOverCardId(targetCardId);
    }
  };

  const handleDropOnColumn = (e: React.DragEvent, status: ColumnStatus) => {
    e.preventDefault();
    e.stopPropagation();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;

    if (taskId) {
      onMoveTask(taskId, status);
    }

    setDraggedTaskId(null);
    setDragOverColumn(null);
    setDragOverCardId(null);
  };

  const handleDropOnCard = (e: React.DragEvent, targetTask: SubtaskItem, targetIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;

    if (taskId && taskId !== targetTask.id) {
      onMoveTask(taskId, targetTask.status, targetIndex);
    }

    setDraggedTaskId(null);
    setDragOverColumn(null);
    setDragOverCardId(null);
  };

  return (
    <div className="flex-1 w-full px-2 sm:px-4 py-3 overflow-x-auto">
      {/* 4-Column Responsive Kanban Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 min-w-[320px] lg:min-w-0 items-start">
        {COLUMNS.map((column) => {
          const columnTasks = getTasksByStatus(column.id);
          const isColumnTarget = dragOverColumn === column.id;

          return (
            <div
              key={column.id}
              id={`kanban-col-${column.id}`}
              onDragOver={(e) => handleDragOverColumn(e, column.id)}
              onDragLeave={() => {
                if (dragOverColumn === column.id) setDragOverColumn(null);
              }}
              onDrop={(e) => handleDropOnColumn(e, column.id)}
              className={`flex flex-col transition-all duration-200 min-h-[520px] ${
                viewStyle === 'postit'
                  ? 'bg-stone-100/40 rounded-2xl border-2 border-dashed border-stone-200/80 p-1.5'
                  : 'bg-white/80 border border-stone-200 rounded-2xl shadow-2xs'
              } ${isColumnTarget ? 'ring-2 ring-amber-500/40 bg-amber-50/40 border-amber-300' : ''}`}
            >
              {/* Column Header */}
              <div
                className={`p-3 flex items-center justify-between ${
                  viewStyle === 'postit'
                    ? 'border-b border-dashed border-stone-200 mb-1'
                    : 'border-b border-stone-200/80'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${column.accent}`} />
                  <h2 className={`font-semibold text-xs tracking-wide uppercase ${column.color}`}>
                    {column.title}
                  </h2>
                  <span
                    className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                      viewStyle === 'postit'
                        ? 'bg-white text-stone-700 border border-stone-200 shadow-2xs'
                        : 'bg-white border border-stone-200 text-[#2D2D2D] shadow-2xs'
                    }`}
                  >
                    {columnTasks.length}
                  </span>
                </div>

                {/* Quick Add in this column */}
                <button
                  id={`add-task-${column.id}-btn`}
                  onClick={() => onQuickAddTaskToColumn(column.id)}
                  className="p-1 rounded-lg hover:bg-stone-200/60 text-stone-400 hover:text-[#2D2D2D] transition-colors cursor-pointer border border-transparent hover:border-stone-200"
                  title={`Add Task in ${column.title}`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Task Cards List / Drop Target */}
              <div className="flex-1 p-2 space-y-4 overflow-y-auto max-h-[calc(100vh-230px)]">
                {columnTasks.length === 0 ? (
                  <div
                    onClick={() => onQuickAddTaskToColumn(column.id)}
                    className="h-32 border border-dashed border-stone-200 hover:border-stone-400 rounded-xl flex flex-col items-center justify-center text-stone-400 hover:text-[#2D2D2D] bg-white/40 hover:bg-white transition-all cursor-pointer p-4 text-center group shadow-2xs"
                  >
                    <Plus className="w-4 h-4 mb-1 group-hover:scale-110 transition-transform text-stone-400 group-hover:text-stone-700" />
                    <span className="text-xs font-medium">Add {column.title} Task</span>
                    <span className="text-[10px] text-stone-400">or drop notes here</span>
                  </div>
                ) : (
                  columnTasks.map((task, index) => (
                    <div
                      key={task.id}
                      className="py-1"
                      onDrop={(e) => handleDropOnCard(e, task, index)}
                    >
                      <TaskCard
                        task={task}
                        viewStyle={viewStyle}
                        isSelected={task.id === selectedTaskId}
                        onSelectTask={onSelectTask}
                        onDrillDown={onDrillDown}
                        onEditTask={onEditTask}
                        onDeleteTask={onDeleteTask}
                        onAddSubtask={onAddSubtask}
                        onToggleComplete={onToggleComplete}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onDragOverCard={handleDragOverCard}
                        isDragOver={dragOverCardId === task.id}
                      />
                    </div>
                  ))
                )}
              </div>

              {/* Column Footer Quick Add */}
              <div className="p-2 pt-0">
                <button
                  onClick={() => onQuickAddTaskToColumn(column.id)}
                  className="w-full py-2 px-3 rounded-xl border border-dashed border-stone-200 hover:border-stone-300 hover:bg-white text-stone-500 hover:text-[#2D2D2D] text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Level {currentLevel} note</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
