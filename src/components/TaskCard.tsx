import React from 'react';
import {
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  CornerDownRight,
  Edit2,
  GripVertical,
  Layers,
  MoreVertical,
  Plus,
  Trash2,
  User,
  AlertCircle,
  Tag,
} from 'lucide-react';
import { Priority, StickyColor, SubtaskItem, ViewStyle } from '../types';
import { calculateTaskProgress } from '../utils/taskTreeUtils';

interface TaskCardProps {
  task: SubtaskItem;
  viewStyle: ViewStyle;
  isSelected?: boolean;
  onSelectTask?: (task: SubtaskItem) => void;
  onDrillDown: (task: SubtaskItem) => void;
  onEditTask: (task: SubtaskItem) => void;
  onDeleteTask: (taskId: string) => void;
  onAddSubtask: (parentTask: SubtaskItem) => void;
  onToggleComplete: (task: SubtaskItem) => void;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDragOverCard: (e: React.DragEvent, taskId: string) => void;
  isDragOver?: boolean;
}

const colorPostItClasses: Record<StickyColor, string> = {
  yellow: 'postit-yellow',
  blue: 'postit-blue',
  green: 'postit-green',
  pink: 'postit-pink',
  purple: 'postit-purple',
  orange: 'postit-orange',
};

const priorityStyles: Record<Priority, { label: string; bg: string; text: string; dot: string }> = {
  urgent: { label: 'Urgent', bg: 'bg-rose-50', text: 'text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  high: { label: 'High', bg: 'bg-amber-50', text: 'text-amber-800 border-amber-200', dot: 'bg-amber-500' },
  medium: { label: 'Medium', bg: 'bg-sky-50', text: 'text-sky-800 border-sky-200', dot: 'bg-sky-500' },
  low: { label: 'Low', bg: 'bg-stone-50', text: 'text-stone-600 border-stone-200', dot: 'bg-stone-400' },
};

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  viewStyle,
  isSelected,
  onSelectTask,
  onDrillDown,
  onEditTask,
  onDeleteTask,
  onAddSubtask,
  onToggleComplete,
  onDragStart,
  onDragEnd,
  onDragOverCard,
  isDragOver,
}) => {
  const progress = calculateTaskProgress(task);
  const isLeaf = task.level === 4;
  const subtaskCount = task.subtasks ? task.subtasks.length : 0;
  const nextLevel = Math.min(task.level + 1, 4) as 1 | 2 | 3 | 4;

  const isDone = task.status === 'done';

  // Format due date if available
  const formattedDueDate = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })
    : null;

  // Pseudo-random but deterministic tilt angle based on task ID for natural Post-it look
  const tiltDegrees = React.useMemo(() => {
    let hash = 0;
    for (let i = 0; i < task.id.length; i++) {
      hash = (hash << 5) - hash + task.id.charCodeAt(i);
      hash |= 0;
    }
    // Yield tilt between -1.8deg and +1.8deg
    const angles = [-1.8, 1.2, -0.9, 1.6, -1.4, 0.8, -1.2, 1.4, -0.6, 1.0];
    const index = Math.abs(hash) % angles.length;
    return angles[index];
  }, [task.id]);

  const handleCardClick = () => {
    if (onSelectTask) {
      onSelectTask(task);
    }
  };

  if (viewStyle === 'postit') {
    const postitColorClass = colorPostItClasses[task.color || 'yellow'];

    return (
      <div
        id={`task-card-${task.id}`}
        draggable
        onClick={handleCardClick}
        onDragStart={(e) => onDragStart(e, task.id)}
        onDragEnd={onDragEnd}
        onDragOver={(e) => onDragOverCard(e, task.id)}
        style={{
          transform: isDragOver || isSelected ? 'scale(1.02) rotate(0deg)' : `rotate(${tiltDegrees}deg)`,
        }}
        className={`group relative rounded-xl p-4 transition-all duration-200 cursor-pointer active:cursor-grabbing hover:scale-[1.02] hover:z-20 hover:shadow-md ${postitColorClass} ${
          isDragOver ? 'ring-2 ring-amber-600 z-30' : ''
        } ${isSelected ? 'ring-2 ring-[#2D2D2D] shadow-md z-20' : ''}`}
      >
        {/* Post-it Tape Strip */}
        <div className="tape-strip" />

        {/* Top Header inside Post-it Card */}
        <div className="flex items-start justify-between gap-2 mb-2 pt-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-black/8 font-mono text-[#2D2D2D]">
              L{task.level}
            </span>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                priorityStyles[task.priority]?.text || 'text-stone-700'
              } ${priorityStyles[task.priority]?.bg || 'bg-black/5'}`}
            >
              {priorityStyles[task.priority]?.label || task.priority}
            </span>
          </div>

          {/* Quick Actions Dropdown / Icons */}
          <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditTask(task);
              }}
              className="p-1 rounded hover:bg-black/10 text-stone-700 transition-colors cursor-pointer"
              title="Edit Task"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteTask(task.id);
              }}
              className="p-1 rounded hover:bg-rose-500/20 text-rose-800 transition-colors cursor-pointer"
              title="Delete Task"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Title & Quick Done Checkbox */}
        <div className="flex items-start gap-2 mb-2">
          {isLeaf && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleComplete(task);
              }}
              className="mt-0.5 text-stone-700 hover:text-stone-950 transition-colors cursor-pointer shrink-0"
              title={isDone ? 'Mark Incomplete' : 'Mark Complete'}
            >
              {isDone ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-700 fill-emerald-100" />
              ) : (
                <Circle className="w-4 h-4 text-stone-400" />
              )}
            </button>
          )}

          <h3
            className={`font-semibold text-sm leading-snug flex-1 text-[#2D2D2D] ${
              isDone ? 'line-through opacity-60' : ''
            }`}
          >
            {task.title}
          </h3>
        </div>

        {/* Description preview */}
        {task.description && (
          <p className="text-xs text-stone-700 line-clamp-2 mb-3 leading-relaxed opacity-90">
            {task.description}
          </p>
        )}

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap mb-3">
            {task.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-1.5 py-0.5 rounded bg-black/6 text-stone-800 font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Subtasks Progress / Hierarchical Indicator */}
        {!isLeaf && (
          <div className="mt-3 pt-2.5 border-t border-black/10">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="font-semibold flex items-center gap-1 text-[#2D2D2D]">
                <Layers className="w-3 h-3" />
                <span>
                  L{nextLevel} Subtasks ({progress.directCompleted}/{progress.directTotal})
                </span>
              </span>
              <span className="font-mono font-bold text-[#2D2D2D]">{progress.directPercentage}%</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-black/10 rounded-full overflow-hidden mb-2.5">
              <div
                className="h-full bg-[#2D2D2D] rounded-full transition-all duration-300"
                style={{ width: `${progress.directPercentage}%` }}
              />
            </div>

            {/* Drill Down to Kanban Button */}
            <div className="flex items-center gap-1.5">
              <button
                id={`drill-down-btn-${task.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onDrillDown(task);
                }}
                className="flex-1 py-1.5 px-2.5 rounded-lg bg-black/10 hover:bg-black/15 text-[#2D2D2D] font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <span>Open Subtasks Kanban</span>
                <CornerDownRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddSubtask(task);
                }}
                className="p-1.5 rounded-lg bg-black/10 hover:bg-black/15 text-[#2D2D2D] transition-colors cursor-pointer"
                title={`Add L${nextLevel} Subtask`}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Footer Meta (Due Date & Assignee) */}
        <div className="mt-3 pt-2 border-t border-black/10 flex items-center justify-between text-[11px] opacity-85">
          <div className="flex items-center gap-2">
            {formattedDueDate && (
              <span className="flex items-center gap-1 text-stone-700 font-medium">
                <Calendar className="w-3 h-3 text-stone-500" />
                <span>{formattedDueDate}</span>
              </span>
            )}
            {isLeaf && (
              <span className="text-[10px] font-medium bg-black/8 text-[#2D2D2D] px-1.5 py-0.2 rounded">
                Leaf Task
              </span>
            )}
          </div>

          {task.assignee && (
            <div
              className="w-5 h-5 rounded-full bg-[#2D2D2D] text-amber-300 flex items-center justify-center text-[10px] font-bold shadow-2xs"
              title={`Assignee: ${task.assignee.name}`}
            >
              {task.assignee.initials}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Professional Grid View Mode
  return (
    <div
      id={`task-card-${task.id}`}
      draggable
      onClick={handleCardClick}
      onDragStart={(e) => onDragStart(e, task.id)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => onDragOverCard(e, task.id)}
      className={`group relative bg-white rounded-xl border border-stone-200/90 p-4 transition-all duration-200 cursor-pointer active:cursor-grabbing shadow-2xs hover:shadow-xs hover:border-stone-300 ${
        isDragOver ? 'ring-2 ring-[#2D2D2D] scale-[1.02]' : ''
      } ${isSelected ? 'ring-2 ring-[#2D2D2D] border-[#2D2D2D] shadow-sm' : ''}`}
    >
      {/* Top Header inside Professional Card */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-stone-100 text-[#2D2D2D] border border-stone-200 font-mono">
            L{task.level}
          </span>
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
              priorityStyles[task.priority]?.text || 'text-stone-700'
            } ${priorityStyles[task.priority]?.bg || 'bg-stone-50'}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                priorityStyles[task.priority]?.dot || 'bg-stone-400'
              }`}
            />
            {priorityStyles[task.priority]?.label || task.priority}
          </span>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditTask(task);
            }}
            className="p-1 rounded hover:bg-stone-100 text-stone-500 hover:text-[#2D2D2D] transition-colors cursor-pointer"
            title="Edit Task"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteTask(task.id);
            }}
            className="p-1 rounded hover:bg-rose-50 text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
            title="Delete Task"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Title with checkbox if leaf */}
      <div className="flex items-start gap-2 mb-1.5">
        {isLeaf && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleComplete(task);
            }}
            className="mt-0.5 text-stone-700 hover:text-stone-950 transition-colors cursor-pointer shrink-0"
            title={isDone ? 'Mark Incomplete' : 'Mark Complete'}
          >
            {isDone ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-50" />
            ) : (
              <Circle className="w-4 h-4 text-stone-400" />
            )}
          </button>
        )}

        <h3
          className={`font-semibold text-[#2D2D2D] text-sm leading-snug flex-1 ${
            isDone ? 'line-through text-stone-400' : ''
          }`}
        >
          {task.title}
        </h3>
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-stone-600 line-clamp-2 mb-3 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap mb-3">
          {task.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-medium border border-stone-200/60"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Subtasks Progress for Non-Leaf */}
      {!isLeaf && (
        <div className="mt-3 pt-3 border-t border-stone-100 bg-[#F9F9F7] -mx-4 -mb-4 p-3.5 rounded-b-xl border-b border-stone-200/50">
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <span className="font-semibold text-stone-700 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-stone-500" />
              <span>Level {nextLevel} Subtasks</span>
            </span>
            <span className="font-mono font-bold text-[#2D2D2D] text-xs">
              {progress.directCompleted}/{progress.directTotal} ({progress.directPercentage}%)
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden mb-3">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                progress.directPercentage === 100 ? 'bg-emerald-500' : 'bg-[#2D2D2D]'
              }`}
              style={{ width: `${progress.directPercentage}%` }}
            />
          </div>

          {/* Drill Down to Kanban Button */}
          <div className="flex items-center gap-1.5">
            <button
              id={`drill-down-btn-${task.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onDrillDown(task);
              }}
              className="flex-1 py-1.5 px-3 rounded-lg bg-[#2D2D2D] hover:bg-black text-white font-medium text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <span>Explore Subtasks (L{nextLevel})</span>
              <CornerDownRight className="w-3.5 h-3.5 text-amber-400" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddSubtask(task);
              }}
              className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 text-stone-700 transition-colors cursor-pointer"
              title={`Add L${nextLevel} Subtask`}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Meta Footer */}
      <div className={`flex items-center justify-between text-[11px] text-stone-500 ${isLeaf ? 'mt-3 pt-2.5 border-t border-stone-100' : 'hidden'}`}>
        <div className="flex items-center gap-2">
          {formattedDueDate && (
            <span className="flex items-center gap-1 bg-stone-100 px-2 py-0.5 rounded text-[#2D2D2D] font-medium">
              <Calendar className="w-3 h-3 text-stone-400" />
              <span>{formattedDueDate}</span>
            </span>
          )}
          <span className="text-[10px] font-medium bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">
            Leaf Task
          </span>
        </div>

        {task.assignee && (
          <div
            className="flex items-center gap-1.5 bg-stone-100 px-2 py-0.5 rounded-full border border-stone-200"
            title={`Assignee: ${task.assignee.name}`}
          >
            <span className="w-4 h-4 rounded-full bg-[#2D2D2D] text-amber-300 flex items-center justify-center text-[9px] font-bold">
              {task.assignee.initials}
            </span>
            <span className="text-[10px] font-medium text-stone-700 hidden sm:inline">
              {task.assignee.name.split(' ')[0]}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
