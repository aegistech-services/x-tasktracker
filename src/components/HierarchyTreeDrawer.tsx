import React, { useState } from 'react';
import {
  X,
  ChevronRight,
  ChevronDown,
  Layers,
  CheckCircle2,
  Circle,
  CornerDownRight,
  Sparkles,
  Search,
} from 'lucide-react';
import { SubtaskItem } from '../types';
import { calculateTaskProgress } from '../utils/taskTreeUtils';

interface HierarchyTreeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  rootTasks: SubtaskItem[];
  onSelectTask: (taskId: string) => void;
  activeTaskId: string;
}

const TreeNode: React.FC<{
  task: SubtaskItem;
  onSelectTask: (taskId: string) => void;
  activeTaskId: string;
  searchFilter: string;
}> = ({ task, onSelectTask, activeTaskId, searchFilter }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const progress = calculateTaskProgress(task);
  const hasChildren = task.subtasks && task.subtasks.length > 0;
  const isLeaf = task.level === 4;
  const isSelected = task.id === activeTaskId;

  const levelBadges: Record<number, string> = {
    1: 'bg-[#2D2D2D] text-white',
    2: 'bg-amber-100 text-amber-950 border border-amber-300',
    3: 'bg-blue-100 text-blue-950 border border-blue-300',
    4: 'bg-emerald-100 text-emerald-950 border border-emerald-300',
  };

  const statusColors: Record<string, string> = {
    todo: 'bg-stone-100 text-stone-700',
    in_progress: 'bg-blue-100 text-blue-800',
    review: 'bg-purple-100 text-purple-800',
    done: 'bg-emerald-100 text-emerald-800',
  };

  // Check if matches search
  const matchesSearch =
    !searchFilter ||
    task.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
    (task.description && task.description.toLowerCase().includes(searchFilter.toLowerCase()));

  return (
    <div className="space-y-1">
      <div
        className={`group flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
          isSelected
            ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400/50 shadow-2xs'
            : 'bg-white border-stone-200/90 hover:bg-[#F9F9F7] hover:border-stone-300 shadow-2xs'
        } ${!matchesSearch && searchFilter ? 'opacity-40' : ''}`}
        onClick={() => onSelectTask(task.id)}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Expand/Collapse Chevron */}
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="p-1 rounded hover:bg-stone-200/60 text-stone-500 transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          ) : (
            <div className="w-5" />
          )}

          {/* Level Tag */}
          <span
            className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
              levelBadges[task.level] || 'bg-stone-200'
            }`}
          >
            L{task.level}
          </span>

          {/* Title */}
          <span
            className={`text-xs font-semibold truncate ${
              task.status === 'done' ? 'line-through text-stone-400' : 'text-[#2D2D2D]'
            }`}
          >
            {task.title}
          </span>
        </div>

        {/* Right Info: Status & Progress */}
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {/* Status Badge */}
          <span
            className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${
              statusColors[task.status] || 'bg-stone-100'
            }`}
          >
            {task.status.replace('_', ' ')}
          </span>

          {/* Subtask count and progress */}
          {!isLeaf && (
            <div className="text-[10px] font-mono font-semibold text-stone-700 bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200">
              {progress.directCompleted}/{progress.directTotal} ({progress.directPercentage}%)
            </div>
          )}

          <CornerDownRight className="w-3 h-3 text-stone-400 group-hover:text-amber-600 transition-colors" />
        </div>
      </div>

      {/* Child Subtasks */}
      {hasChildren && isExpanded && (
        <div className="pl-5 border-l-2 border-dashed border-stone-200 ml-3.5 space-y-1 my-1">
          {task.subtasks.map((subtask) => (
            <TreeNode
              key={subtask.id}
              task={subtask}
              onSelectTask={onSelectTask}
              activeTaskId={activeTaskId}
              searchFilter={searchFilter}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const HierarchyTreeDrawer: React.FC<HierarchyTreeDrawerProps> = ({
  isOpen,
  onClose,
  rootTasks,
  onSelectTask,
  activeTaskId,
}) => {
  const [searchFilter, setSearchFilter] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-900/40 backdrop-blur-xs animate-in fade-in">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div
          id="hierarchy-tree-drawer"
          className="w-screen max-w-xl bg-[#F9F9F7] border-l border-stone-200 shadow-xl flex flex-col"
        >
          {/* Drawer Header */}
          <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-white">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#2D2D2D] text-amber-300 flex items-center justify-center font-bold">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-[#2D2D2D] text-base">Hierarchical Tree Map</h2>
                <p className="text-xs text-stone-500">
                  Full 4-level nesting overview • Click any node to open its Kanban board
                </p>
              </div>
            </div>

            <button
              id="close-tree-drawer-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-[#2D2D2D] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="p-3 border-b border-stone-200 bg-white">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Search across all 4 levels..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-stone-200 bg-[#F9F9F7] focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-[#2D2D2D]"
              />
            </div>
          </div>

          {/* Tree list */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
            {rootTasks.map((task) => (
              <TreeNode
                key={task.id}
                task={task}
                onSelectTask={(id) => {
                  onSelectTask(id);
                  onClose();
                }}
                activeTaskId={activeTaskId}
                searchFilter={searchFilter}
              />
            ))}
          </div>

          {/* Footer Guide */}
          <div className="p-4 border-t border-stone-200 bg-white text-xs text-stone-500 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px] flex-wrap">
              <span className="font-semibold text-stone-700">Level Legend:</span>
              <span className="px-1.5 py-0.5 rounded bg-[#2D2D2D] text-white font-mono text-[9px] font-bold">L1</span> Project
              <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-mono text-[9px] font-bold">L2</span> Epic
              <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 font-mono text-[9px] font-bold">L3</span> Subtask
              <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 font-mono text-[9px] font-bold">L4</span> Leaf
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
