import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  Layers,
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  X,
  ExternalLink,
  ChevronRight,
  ArrowLeft,
  User,
  Tag,
  AlertCircle,
  Filter,
  ArrowUpDown,
  CornerDownRight,
  ListTodo,
} from 'lucide-react';
import { ColumnStatus, Priority, StickyColor, SubtaskItem, ViewStyle } from '../types';
import { calculateTaskProgress, getBreadcrumbTrail } from '../utils/taskTreeUtils';
import { TaskCard } from './TaskCard';

interface TaskDetailPanelProps {
  selectedTask: SubtaskItem;
  allTasks: SubtaskItem[];
  viewStyle: ViewStyle;
  onClose: () => void;
  onSelectTask: (task: SubtaskItem) => void;
  onDrillDown: (task: SubtaskItem) => void;
  onEditTask: (task: SubtaskItem) => void;
  onDeleteTask: (taskId: string) => void;
  onAddSubtask: (parentTask: SubtaskItem) => void;
  onToggleComplete: (task: SubtaskItem) => void;
  onUpdateTask: (taskId: string, updates: Partial<SubtaskItem>) => void;
  onMoveTask: (taskId: string, targetStatus: ColumnStatus, targetIndex?: number) => void;
  onQuickAddSubtaskWithDateline?: (
    parentTaskId: string,
    subtaskData: {
      title: string;
      status: ColumnStatus;
      priority: Priority;
      dueDate?: string;
      assigneeName?: string;
    }
  ) => void;
}

const PRIORITY_BADGES: Record<Priority, { label: string; bg: string; text: string; border: string }> = {
  urgent: { label: 'Urgent', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  high: { label: 'High', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  medium: { label: 'Medium', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  low: { label: 'Low', bg: 'bg-stone-50', text: 'text-stone-600', border: 'border-stone-200' },
};

const STATUS_BADGES: Record<ColumnStatus, { label: string; bg: string; text: string; dot: string }> = {
  todo: { label: 'To Do', bg: 'bg-stone-100', text: 'text-stone-700', dot: 'bg-stone-400' },
  in_progress: { label: 'In Progress', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  review: { label: 'In Review', bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
  done: { label: 'Completed', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
};

export const TaskDetailPanel: React.FC<TaskDetailPanelProps> = ({
  selectedTask,
  allTasks,
  viewStyle,
  onClose,
  onSelectTask,
  onDrillDown,
  onEditTask,
  onDeleteTask,
  onAddSubtask,
  onToggleComplete,
  onUpdateTask,
  onMoveTask,
  onQuickAddSubtaskWithDateline,
}) => {
  // Inline quick-add state for the Dateline table
  const [newTitle, setNewTitle] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('medium');
  const [newStatus, setNewStatus] = useState<ColumnStatus>('todo');
  const [newAssignee, setNewAssignee] = useState('');
  const [isAddingRow, setIsAddingRow] = useState(false);

  // Table filter/sort
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'order' | 'dueDate' | 'priority' | 'status'>('order');

  const progress = calculateTaskProgress(selectedTask);
  const breadcrumbs = getBreadcrumbTrail(allTasks, selectedTask.id);
  const subtasks = selectedTask.subtasks || [];
  const isLeaf = selectedTask.level === 4 || subtasks.length === 0;
  const nextLevel = Math.min(selectedTask.level + 1, 4) as 1 | 2 | 3 | 4;

  // Filtered & sorted subtasks
  const displayedSubtasks = React.useMemo(() => {
    let list = [...subtasks];

    if (statusFilter !== 'all') {
      list = list.filter((st) => st.status === statusFilter);
    }

    if (sortBy === 'dueDate') {
      list.sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
    } else if (sortBy === 'priority') {
      const pWeights: Record<Priority, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
      list.sort((a, b) => pWeights[b.priority] - pWeights[a.priority]);
    } else if (sortBy === 'status') {
      const sWeights: Record<ColumnStatus, number> = { todo: 1, in_progress: 2, review: 3, done: 4 };
      list.sort((a, b) => sWeights[a.status] - sWeights[b.status]);
    }

    return list;
  }, [subtasks, statusFilter, sortBy]);

  // Handle Quick Add Submit
  const handleCreateSubtaskRow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    if (onQuickAddSubtaskWithDateline) {
      onQuickAddSubtaskWithDateline(selectedTask.id, {
        title: newTitle.trim(),
        status: newStatus,
        priority: newPriority,
        dueDate: newDueDate || undefined,
        assigneeName: newAssignee.trim() || undefined,
      });
    } else {
      // Fallback
      onAddSubtask(selectedTask);
    }

    setNewTitle('');
    setNewDueDate('');
    setNewAssignee('');
    setIsAddingRow(false);
  };

  // Helper for dateline status (overdue, due today, upcoming)
  const getDatelineInfo = (dueDateStr?: string) => {
    if (!dueDateStr) return null;
    const due = new Date(dueDateStr);
    if (isNaN(due.getTime())) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDay = new Date(due);
    dueDay.setHours(0, 0, 0, 0);

    const diffMs = dueDay.getTime() - today.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    const formatted = due.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    if (diffDays < 0) {
      return {
        formatted,
        text: `Overdue by ${Math.abs(diffDays)}d`,
        color: 'text-rose-700 bg-rose-50 border-rose-200',
        isOverdue: true,
      };
    }
    if (diffDays === 0) {
      return {
        formatted,
        text: 'Due Today',
        color: 'text-amber-700 bg-amber-50 border-amber-200',
        isOverdue: false,
      };
    }
    if (diffDays <= 3) {
      return {
        formatted,
        text: `Due in ${diffDays}d`,
        color: 'text-amber-700 bg-amber-50 border-amber-200',
        isOverdue: false,
      };
    }
    return {
      formatted,
      text: `${diffDays}d left`,
      color: 'text-stone-600 bg-stone-100 border-stone-200',
      isOverdue: false,
    };
  };

  const selectedDateline = getDatelineInfo(selectedTask.dueDate);

  return (
    <div className="w-full flex-1 flex flex-col lg:flex-row items-stretch bg-dotted-canvas overflow-hidden min-h-[calc(100vh-130px)]">
      {/* ========================================================================= */}
      {/* LEFT SIDE (30% WIDTH): Task Card view & quick actions */}
      {/* ========================================================================= */}
      <div className="w-full lg:w-[30%] lg:min-w-[320px] lg:max-w-[420px] bg-[#F5F5F3]/90 border-r border-stone-200/90 flex flex-col p-4 overflow-y-auto shrink-0 shadow-xs">
        {/* Left Side Header */}
        <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-stone-200 text-[#2D2D2D]">
              L{selectedTask.level} CARD
            </span>
            <span className="text-xs font-semibold text-stone-600">Focused View</span>
          </div>

          <button
            id="close-split-view-btn"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-stone-200 text-stone-500 hover:text-[#2D2D2D] transition-colors cursor-pointer flex items-center gap-1 text-xs"
            title="Return to full board"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium">Back to Board</span>
          </button>
        </div>

        {/* The Task Card */}
        <div className="my-auto py-2">
          <TaskCard
            task={selectedTask}
            viewStyle={viewStyle}
            isSelected={true}
            onSelectTask={onSelectTask}
            onDrillDown={onDrillDown}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
            onAddSubtask={onAddSubtask}
            onToggleComplete={onToggleComplete}
            onDragStart={() => {}}
            onDragEnd={() => {}}
            onDragOverCard={() => {}}
          />
        </div>

        {/* Quick Context & Actions */}
        <div className="mt-4 pt-3 border-t border-stone-200 text-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500 text-[11px]">
            <span>Level Depth:</span>
            <span className="font-semibold text-stone-800">
              Level {selectedTask.level} {selectedTask.level === 4 ? '(Leaf Task)' : ''}
            </span>
          </div>

          {selectedTask.level < 4 && (
            <button
              onClick={() => onDrillDown(selectedTask)}
              className="w-full py-2 px-3 rounded-xl bg-[#2D2D2D] hover:bg-black text-amber-300 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <span>Drill Down into Level {nextLevel} Kanban</span>
              <CornerDownRight className="w-3.5 h-3.5 text-amber-300" />
            </button>
          )}

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => onEditTask(selectedTask)}
              className="flex-1 py-1.5 px-2.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 text-stone-700 font-medium text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <Edit2 className="w-3 h-3" />
              <span>Edit Card</span>
            </button>
            <button
              onClick={() => onAddSubtask(selectedTask)}
              className="flex-1 py-1.5 px-2.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 text-stone-700 font-medium text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Add Subtask</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT SIDE (70% WIDTH): Task Details & Dateline Table List */}
      {/* ========================================================================= */}
      <div className="w-full lg:w-[70%] flex-1 bg-white flex flex-col overflow-y-auto">
        {/* Top Breadcrumbs & Control Bar */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-stone-200/90 px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          {/* Breadcrumb Trail */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs text-stone-500 min-w-0">
            {breadcrumbs.map((step, idx) => (
              <React.Fragment key={step.id}>
                {idx > 0 && <ChevronRight className="w-3 h-3 text-stone-300 shrink-0" />}
                <button
                  onClick={() => onSelectTask(allTasks.find((t) => t.id === step.id) || selectedTask)}
                  className={`px-2 py-0.5 rounded-md font-mono text-xs font-bold transition-all cursor-pointer ${
                    step.id === selectedTask.id
                      ? 'bg-amber-100 text-amber-950 border border-amber-300'
                      : 'hover:bg-stone-100 text-stone-600'
                  }`}
                  title={step.title}
                >
                  L{step.level}
                </button>
              </React.Fragment>
            ))}
            <span className="text-stone-300">/</span>
            <span className="font-semibold text-stone-700 truncate max-w-[200px] sm:max-w-[320px]">
              {selectedTask.title}
            </span>
          </div>

          {/* Close Details Button */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-[#2D2D2D] transition-colors cursor-pointer shrink-0"
            title="Close details view"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Task Details Content */}
        <div className="p-4 sm:p-6 space-y-6 flex-1">
          {/* Main Info Card */}
          <div className="bg-[#F9F9F7] border border-stone-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#2D2D2D] text-amber-300">
                    Level {selectedTask.level}
                  </span>

                  {/* Status Dropdown */}
                  <select
                    id="selected-task-status-select"
                    value={selectedTask.status}
                    onChange={(e) => onUpdateTask(selectedTask.id, { status: e.target.value as ColumnStatus })}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-lg border cursor-pointer ${
                      STATUS_BADGES[selectedTask.status]?.bg || 'bg-stone-100'
                    } ${STATUS_BADGES[selectedTask.status]?.text || 'text-stone-700'} border-stone-200`}
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">In Review</option>
                    <option value="done">Completed</option>
                  </select>

                  {/* Priority Dropdown */}
                  <select
                    id="selected-task-priority-select"
                    value={selectedTask.priority}
                    onChange={(e) => onUpdateTask(selectedTask.id, { priority: e.target.value as Priority })}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-lg border cursor-pointer ${
                      PRIORITY_BADGES[selectedTask.priority]?.bg || 'bg-stone-100'
                    } ${PRIORITY_BADGES[selectedTask.priority]?.text || 'text-stone-700'} ${
                      PRIORITY_BADGES[selectedTask.priority]?.border || 'border-stone-200'
                    }`}
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <h1 className="text-xl sm:text-2xl font-bold text-[#2D2D2D] tracking-tight">
                  {selectedTask.title}
                </h1>
              </div>

              {/* Quick Dateline Pill */}
              {selectedDateline && (
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${selectedDateline.color} shadow-2xs self-start sm:self-auto`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Dateline: {selectedDateline.formatted}</span>
                  <span className="font-mono text-[11px] font-bold">({selectedDateline.text})</span>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="pt-2 border-t border-stone-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
                Description & Notes
              </h3>
              <p className="text-sm text-stone-700 whitespace-pre-wrap leading-relaxed">
                {selectedTask.description || (
                  <span className="italic text-stone-400">No description provided for this task.</span>
                )}
              </p>
            </div>

            {/* Meta badges (Assignee, Tags, Progress) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-stone-200">
              {/* Assignee */}
              <div className="flex items-center gap-2 text-xs">
                <div className="w-6 h-6 rounded-full bg-[#2D2D2D] text-amber-300 flex items-center justify-center font-bold text-[10px] shrink-0">
                  {selectedTask.assignee ? selectedTask.assignee.initials : <User className="w-3 h-3" />}
                </div>
                <div>
                  <span className="text-stone-400 text-[10px] block">Assignee</span>
                  <span className="font-semibold text-stone-700">
                    {selectedTask.assignee ? selectedTask.assignee.name : 'Unassigned'}
                  </span>
                </div>
              </div>

              {/* Progress Summary */}
              <div className="text-xs">
                <span className="text-stone-400 text-[10px] block">Subtree Completion</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex-1 h-2 bg-stone-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${progress.deepPercentage}%` }}
                    />
                  </div>
                  <span className="font-mono font-bold text-stone-800 text-[11px]">
                    {progress.deepPercentage}%
                  </span>
                </div>
              </div>

              {/* Dateline / Due Date edit */}
              <div className="text-xs">
                <span className="text-stone-400 text-[10px] block">Dateline / Due Date</span>
                <input
                  type="date"
                  value={selectedTask.dueDate || ''}
                  onChange={(e) => onUpdateTask(selectedTask.id, { dueDate: e.target.value })}
                  className="mt-0.5 px-2 py-0.5 bg-white border border-stone-200 rounded text-xs text-stone-700 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SUBTASKS & DATELINE TABLE LIST */}
          {/* ========================================================================= */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ListTodo className="w-4 h-4 text-stone-600" />
                <h2 className="text-sm sm:text-base font-bold text-[#2D2D2D]">
                  Level {nextLevel} Subtasks & Dateline Schedule
                </h2>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-stone-100 border border-stone-200 text-stone-600">
                  {subtasks.length} {subtasks.length === 1 ? 'task' : 'tasks'}
                </span>
              </div>

              {/* Filter & Sort Controls */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs font-medium px-2 py-1 bg-white border border-stone-200 rounded-lg text-stone-600 cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="review">In Review</option>
                  <option value="done">Completed</option>
                </select>

                {/* Sort By */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="text-xs font-medium px-2 py-1 bg-white border border-stone-200 rounded-lg text-stone-600 cursor-pointer"
                >
                  <option value="order">Default Order</option>
                  <option value="dueDate">Sort by Dateline</option>
                  <option value="priority">Sort by Priority</option>
                  <option value="status">Sort by Status</option>
                </select>

                {/* Toggle Add Subtask */}
                <button
                  id="add-subtask-table-btn"
                  onClick={() => setIsAddingRow((prev) => !prev)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#2D2D2D] hover:bg-black text-amber-300 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAddingRow ? 'Cancel' : 'Add Dateline Row'}</span>
                </button>
              </div>
            </div>

            {/* Quick Add Form Row (if active) */}
            {isAddingRow && (
              <form
                onSubmit={handleCreateSubtaskRow}
                className="bg-amber-50/60 border border-amber-200 rounded-xl p-3 shadow-2xs space-y-2 animate-in fade-in duration-150"
              >
                <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Level {nextLevel} Subtask with Dateline</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder="Subtask title *"
                      required
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs text-[#2D2D2D] focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                      autoFocus
                    />
                  </div>

                  <div>
                    <input
                      type="date"
                      value={newDueDate}
                      onChange={(e) => setNewDueDate(e.target.value)}
                      className="w-full px-2 py-1.5 bg-white border border-stone-200 rounded-lg text-xs text-stone-700 focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                      title="Set Dateline / Due Date"
                    />
                  </div>

                  <div>
                    <select
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value as Priority)}
                      className="w-full px-2 py-1.5 bg-white border border-stone-200 rounded-lg text-xs text-stone-700"
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <button
                      type="submit"
                      className="w-full py-1.5 px-3 bg-[#2D2D2D] hover:bg-black text-amber-300 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                    >
                      Save to Table
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Dateline Table */}
            <div className="border border-stone-200 rounded-xl overflow-hidden shadow-2xs bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-stone-600 border-collapse">
                  <thead className="bg-[#F9F9F7] border-b border-stone-200 text-stone-500 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">Status</th>
                      <th className="py-2.5 px-3 w-14 text-center">Level</th>
                      <th className="py-2.5 px-4 min-w-[200px]">Subtask Title</th>
                      <th className="py-2.5 px-3 min-w-[150px]">Dateline / Due Date</th>
                      <th className="py-2.5 px-3 w-28">Priority</th>
                      <th className="py-2.5 px-3 w-32">Assignee</th>
                      <th className="py-2.5 px-3 w-28 text-center">Sub-items</th>
                      <th className="py-2.5 px-3 w-28 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-stone-100 font-normal">
                    {displayedSubtasks.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-stone-400">
                          <div className="flex flex-col items-center justify-center gap-1.5">
                            <Layers className="w-6 h-6 text-stone-300" />
                            <p className="font-medium text-xs">No subtasks found in this list.</p>
                            <button
                              onClick={() => setIsAddingRow(true)}
                              className="text-[11px] text-amber-600 hover:underline font-semibold cursor-pointer"
                            >
                              + Add the first subtask & dateline
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      displayedSubtasks.map((st) => {
                        const stDateline = getDatelineInfo(st.dueDate);
                        const isStDone = st.status === 'done';
                        const stSubtasksCount = st.subtasks ? st.subtasks.length : 0;

                        return (
                          <tr
                            key={st.id}
                            className="hover:bg-stone-50/80 transition-colors group cursor-pointer"
                            onClick={() => onSelectTask(st)}
                            title="Click to view this subtask details"
                          >
                            {/* Status Checkbox / Quick Toggle */}
                            <td
                              className="py-2.5 px-3 text-center"
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleComplete(st);
                              }}
                            >
                              <button
                                className="cursor-pointer inline-flex items-center justify-center"
                                title={isStDone ? 'Mark Incomplete' : 'Mark Done'}
                              >
                                {isStDone ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-50" />
                                ) : (
                                  <Circle className="w-4 h-4 text-stone-300 hover:text-stone-500" />
                                )}
                              </button>
                            </td>

                            {/* Level Badge */}
                            <td className="py-2.5 px-3 text-center">
                              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200">
                                L{st.level}
                              </span>
                            </td>

                            {/* Title & Description preview */}
                            <td className="py-2.5 px-4">
                              <div className="font-semibold text-stone-800 text-xs">
                                <span className={isStDone ? 'line-through text-stone-400' : ''}>
                                  {st.title}
                                </span>
                              </div>
                              {st.description && (
                                <p className="text-[11px] text-stone-400 truncate max-w-[280px]">
                                  {st.description}
                                </p>
                              )}
                            </td>

                            {/* Dateline / Due Date */}
                            <td className="py-2.5 px-3">
                              {stDateline ? (
                                <div
                                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-medium ${stDateline.color}`}
                                >
                                  <Calendar className="w-3 h-3 shrink-0" />
                                  <span>{stDateline.formatted}</span>
                                  <span className="font-mono font-bold text-[10px]">
                                    ({stDateline.text})
                                  </span>
                                </div>
                              ) : (
                                <span className="text-stone-300 italic text-[11px]">No dateline</span>
                              )}
                            </td>

                            {/* Priority */}
                            <td className="py-2.5 px-3">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                                  PRIORITY_BADGES[st.priority]?.bg || 'bg-stone-50'
                                } ${PRIORITY_BADGES[st.priority]?.text || 'text-stone-600'} ${
                                  PRIORITY_BADGES[st.priority]?.border || 'border-stone-200'
                                }`}
                              >
                                {PRIORITY_BADGES[st.priority]?.label || st.priority}
                              </span>
                            </td>

                            {/* Assignee */}
                            <td className="py-2.5 px-3">
                              {st.assignee ? (
                                <div className="flex items-center gap-1.5 text-[11px] text-stone-700">
                                  <div className="w-4 h-4 rounded-full bg-[#2D2D2D] text-amber-300 flex items-center justify-center text-[9px] font-bold">
                                    {st.assignee.initials}
                                  </div>
                                  <span className="truncate max-w-[90px]">{st.assignee.name}</span>
                                </div>
                              ) : (
                                <span className="text-stone-300 text-[11px]">-</span>
                              )}
                            </td>

                            {/* Sub-items count */}
                            <td className="py-2.5 px-3 text-center">
                              {stSubtasksCount > 0 ? (
                                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">
                                  {stSubtasksCount} sub-items
                                </span>
                              ) : (
                                <span className="text-stone-300 text-[11px]">0</span>
                              )}
                            </td>

                            {/* Action Buttons */}
                            <td
                              className="py-2.5 px-3 text-right"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100">
                                {st.level < 4 && (
                                  <button
                                    onClick={() => onDrillDown(st)}
                                    className="p-1 rounded hover:bg-stone-100 text-stone-600 hover:text-[#2D2D2D] transition-colors cursor-pointer"
                                    title={`Drill down to L${st.level + 1} Kanban board`}
                                  >
                                    <CornerDownRight className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  onClick={() => onEditTask(st)}
                                  className="p-1 rounded hover:bg-stone-100 text-stone-600 hover:text-[#2D2D2D] transition-colors cursor-pointer"
                                  title="Edit subtask"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => onDeleteTask(st.id)}
                                  className="p-1 rounded hover:bg-rose-50 text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                                  title="Delete subtask"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
