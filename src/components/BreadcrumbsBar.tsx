import React, { useState } from 'react';
import {
  ChevronRight,
  ArrowUpLeft,
  CheckCircle2,
  Plus,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { BreadcrumbStep, SubtaskItem } from '../types';
import { calculateTaskProgress } from '../utils/taskTreeUtils';

interface BreadcrumbsBarProps {
  breadcrumbs: BreadcrumbStep[];
  currentTask: SubtaskItem | null;
  onNavigateToLevel: (taskId: string) => void;
  onLevelUp: () => void;
  onOpenCreateModal: (level: 1 | 2 | 3 | 4, parentId?: string | null) => void;
  currentLevelTasks: SubtaskItem[];
}

const truncateTitle = (text: string, max: number = 100): string => {
  if (!text) return '';
  return text.length > max ? text.slice(0, max) + '…' : text;
};

export const BreadcrumbsBar: React.FC<BreadcrumbsBarProps> = ({
  breadcrumbs,
  currentTask,
  onNavigateToLevel,
  onLevelUp,
  onOpenCreateModal,
  currentLevelTasks,
}) => {
  // Hidden / collapsed by default on page load as requested
  const [isOpen, setIsOpen] = useState(false);

  const currentLevel = currentTask ? ((currentTask.level + 1) as 1 | 2 | 3 | 4) : 1;
  const progress = currentTask ? calculateTaskProgress(currentTask) : null;

  const levelLabels: Record<number, { title: string; desc: string; badgeColor: string }> = {
    1: { title: 'Level 1: Initiatives', desc: 'Top-Level Vision & Projects', badgeColor: 'bg-[#2D2D2D] text-white' },
    2: { title: 'Level 2: Modules & Epics', desc: 'Core Subtask Kanban', badgeColor: 'bg-amber-600 text-white' },
    3: { title: 'Level 3: Feature Subtasks', desc: 'Deep Hierarchical Kanban', badgeColor: 'bg-blue-600 text-white' },
    4: { title: 'Level 4: Leaf Tasks', desc: 'Atomic Execution Units (Max Depth)', badgeColor: 'bg-emerald-600 text-white' },
  };

  const isAtMaxLevel = currentLevel === 4;

  return (
    <div className="relative z-20 transition-all duration-300">
      {/* Collapsible Secondary Header Content */}
      {isOpen && (
        <div className="bg-white/95 border-b border-stone-200/90 px-3 sm:px-6 py-2.5 shadow-2xs backdrop-blur-xs animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Left: Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {breadcrumbs.length > 1 && (
                <button
                  id="level-up-btn"
                  onClick={onLevelUp}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-[#2D2D2D] font-medium text-xs transition-colors cursor-pointer mr-1 border border-stone-200"
                  title="Navigate up one level (Shortcut: Esc / Backspace)"
                >
                  <ArrowUpLeft className="w-3.5 h-3.5" />
                  <span>Level Up</span>
                </button>
              )}

              {/* Breadcrumb level badge(s) with full task name (max 100 chars) */}
              {breadcrumbs.length > 0 ? (
                breadcrumbs.map((step, idx) => {
                  const isLast = idx === breadcrumbs.length - 1;
                  const displayedTitle = truncateTitle(step.title, 100);
                  return (
                    <React.Fragment key={step.id}>
                      {idx > 0 && <ChevronRight className="w-3 h-3 text-stone-400 shrink-0" />}
                      <button
                        id={`breadcrumb-step-${step.id}`}
                        onClick={() => onNavigateToLevel(step.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border max-w-[min(100%,420px)] ${
                          isLast
                            ? 'bg-amber-100 text-amber-950 border-amber-300 shadow-2xs'
                            : 'bg-stone-100 text-stone-600 hover:text-[#2D2D2D] border-stone-200 hover:bg-stone-200'
                        }`}
                        title={step.title}
                      >
                        <span className="font-mono text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-white text-[#2D2D2D] border border-stone-200 shrink-0">
                          L{step.level}
                        </span>
                        <span className="truncate">{displayedTitle}</span>
                      </button>
                    </React.Fragment>
                  );
                })
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-100 text-amber-950 border border-amber-300 shadow-2xs max-w-[min(100%,420px)]">
                  <span className="font-mono text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-white text-[#2D2D2D] border border-stone-200 shrink-0">
                    L1
                  </span>
                  <span className="truncate">
                    {truncateTitle(currentTask?.title || 'Initiative', 100)}
                  </span>
                </span>
              )}

              {/* Showing : Level X Board Badge */}
              <span
                className={`text-xs px-2.5 py-1 rounded-lg font-semibold shadow-2xs flex items-center gap-1.5 shrink-0 ${
                  levelLabels[currentLevel]?.badgeColor || 'bg-[#2D2D2D] text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Showing : Level {currentLevel} Board</span>
              </span>

              {isAtMaxLevel && (
                <span className="text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3 h-3" />
                  Atomic Depth
                </span>
              )}
            </div>

            {/* Right: Overall Completion & Add Level X Task */}
            <div className="flex items-center gap-3 flex-wrap sm:justify-end">
              {/* Overall Completion Progress */}
              {progress && (
                <div className="bg-[#F9F9F7] border border-stone-200/90 rounded-xl px-3.5 py-1.5 flex items-center gap-3 min-w-[200px] shadow-2xs">
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-stone-600 font-medium flex items-center gap-1 text-[11px]">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        Overall Completion
                      </span>
                      <span className="font-bold text-[#2D2D2D] font-mono text-xs">
                        {progress.deepPercentage}%
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
                        style={{ width: `${progress.deepPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Add Subtask to this board */}
              <button
                id="quick-add-subtask-btn"
                onClick={() => onOpenCreateModal(currentLevel, currentTask ? currentTask.id : null)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2D2D2D] hover:bg-black text-amber-300 hover:text-amber-200 font-semibold text-xs transition-all shadow-xs cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 text-amber-300" />
                <span>Add Level {currentLevel} Task</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pull Tab Control */}
      <div className="flex justify-center -mb-2 relative z-20 pointer-events-auto">
        <button
          id="toggle-secondary-header-pull-tab"
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="group inline-flex items-center gap-1 px-3 py-0.5 bg-white border border-stone-200/90 hover:border-stone-300 rounded-b-lg shadow-2xs text-[11px] font-medium text-stone-500 hover:text-[#2D2D2D] transition-all cursor-pointer hover:bg-stone-50"
          title={isOpen ? 'Collapse navigation bar' : 'Pull down to view Level Details, Completion & Actions'}
        >
          {isOpen ? (
            <>
              <ChevronUp className="w-3 h-3 group-hover:-translate-y-0.5 transition-transform" />
              <span>Hide Details</span>
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span className="font-semibold text-stone-700">Level {currentLevel} Info</span>
              <ChevronDown className="w-3 h-3 group-hover:translate-y-0.5 transition-transform" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
