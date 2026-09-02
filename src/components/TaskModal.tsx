import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Calendar,
  User,
  Tag,
  Flag,
  Palette,
  CheckCircle2,
  Layers,
  Sparkles,
} from 'lucide-react';
import { ColumnStatus, Priority, StickyColor, SubtaskItem } from '../types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Partial<SubtaskItem>) => void;
  initialTask?: SubtaskItem | null;
  targetLevel: 1 | 2 | 3 | 4;
  parentTask?: SubtaskItem | null;
  defaultStatus?: ColumnStatus;
}

const STICKY_COLORS: { id: StickyColor; name: string; bg: string; border: string }[] = [
  { id: 'yellow', name: 'Lemon Yellow', bg: 'bg-[#FEF9C3]', border: 'border-yellow-400' },
  { id: 'blue', name: 'Sky Blue', bg: 'bg-[#DBEAFE]', border: 'border-blue-400' },
  { id: 'green', name: 'Mint Green', bg: 'bg-[#DCFCE7]', border: 'border-green-400' },
  { id: 'pink', name: 'Rose Pink', bg: 'bg-[#FCE7F3]', border: 'border-pink-400' },
  { id: 'purple', name: 'Lavender', bg: 'bg-[#F3E8FF]', border: 'border-purple-400' },
  { id: 'orange', name: 'Peach', bg: 'bg-[#FFEDD5]', border: 'border-orange-400' },
];

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTask,
  targetLevel,
  parentTask,
  defaultStatus = 'todo',
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ColumnStatus>(defaultStatus);
  const [priority, setPriority] = useState<Priority>('medium');
  const [color, setColor] = useState<StickyColor>('yellow');
  const [dueDate, setDueDate] = useState('');
  const [assigneeName, setAssigneeName] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title || '');
      setDescription(initialTask.description || '');
      setStatus(initialTask.status || defaultStatus);
      setPriority(initialTask.priority || 'medium');
      setColor(initialTask.color || 'yellow');
      setDueDate(initialTask.dueDate || '');
      setAssigneeName(initialTask.assignee?.name || '');
      setTags(initialTask.tags || []);
    } else {
      setTitle('');
      setDescription('');
      setStatus(defaultStatus);
      setPriority('medium');
      setColor('yellow');
      setDueDate('');
      setAssigneeName('');
      setTags([]);
    }
  }, [initialTask, defaultStatus, isOpen]);

  if (!isOpen) return null;

  const handleAddTag = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const trimmed = tagInput.trim().replace(/^#/, '');
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const initials = assigneeName.trim()
      ? assigneeName
          .trim()
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      : 'U';

    onSave({
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      color,
      dueDate: dueDate || undefined,
      assignee: assigneeName.trim()
        ? {
            name: assigneeName.trim(),
            initials,
          }
        : undefined,
      tags,
      level: targetLevel,
      parentId: parentTask ? parentTask.id : null,
    });
    onClose();
  };

  const levelName = {
    1: 'Level 1: Top-Level Initiative',
    2: 'Level 2: Epic / Subtask',
    3: 'Level 3: Feature Sub-Task',
    4: 'Level 4: Leaf Task (Max Depth)',
  }[targetLevel];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs animate-in fade-in">
      <div
        id="task-modal-container"
        className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden text-[#2D2D2D]"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-[#F9F9F7]">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#2D2D2D] text-amber-300">
                L{targetLevel}
              </span>
              <span className="text-xs font-semibold text-stone-600">{levelName}</span>
            </div>
            <h2 className="text-base font-bold text-[#2D2D2D]">
              {initialTask ? 'Edit Task Details' : 'Create New Task'}
            </h2>
            {parentTask && (
              <p className="text-xs text-stone-500 truncate max-w-xs sm:max-w-sm">
                Under parent: <span className="font-semibold text-stone-700">{parentTask.title}</span>
              </p>
            )}
          </div>

          <button
            id="close-task-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-stone-200/80 text-stone-400 hover:text-[#2D2D2D] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Title input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input
              id="task-title-input"
              type="text"
              required
              placeholder="e.g. ⚡ Implement OAuth2 PKCE Flow"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white text-[#2D2D2D]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
              Description / Notes
            </label>
            <textarea
              id="task-description-input"
              rows={3}
              placeholder="Provide context, acceptance criteria, or execution notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white leading-relaxed resize-none text-[#2D2D2D]"
            />
          </div>

          {/* Status & Priority Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Status */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                Column Status
              </label>
              <select
                id="task-status-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as ColumnStatus)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-medium text-[#2D2D2D]"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">In Review</option>
                <option value="done">Completed</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                Priority Level
              </label>
              <select
                id="task-priority-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-medium text-[#2D2D2D]"
              >
                <option value="urgent">🔴 Urgent</option>
                <option value="high">🟠 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🟢 Low</option>
              </select>
            </div>
          </div>

          {/* Post-it Note Color Palette */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-stone-500" />
              <span>Sticky Note Pastel Color</span>
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {STICKY_COLORS.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setColor(c.id)}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                    c.bg
                  } ${c.border} ${color === c.id ? 'ring-2 ring-[#2D2D2D] scale-105 font-bold shadow-xs' : 'opacity-80 hover:opacity-100'}`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-black/20" />
                  <span className="text-[#2D2D2D] text-[11px] font-medium">{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Assignee & Due Date Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Assignee */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-stone-500" />
                <span>Assignee Name</span>
              </label>
              <input
                id="task-assignee-input"
                type="text"
                placeholder="e.g. Sarah Lin"
                value={assigneeName}
                onChange={(e) => setAssigneeName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-[#2D2D2D]"
              />
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-stone-500" />
                <span>Target Due Date</span>
              </label>
              <input
                id="task-duedate-input"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-[#2D2D2D]"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-stone-500" />
              <span>Tags & Labels</span>
            </label>
            <div className="flex items-center gap-1.5 mb-2">
              <input
                id="task-tag-input"
                type="text"
                placeholder="Type tag and press Enter..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-[#2D2D2D]"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-[#2D2D2D] font-semibold text-xs rounded-xl transition-colors cursor-pointer border border-stone-200"
              >
                Add
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-stone-100 border border-stone-200 text-[#2D2D2D] font-medium"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-stone-400 hover:text-rose-600 font-bold ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="save-task-submit-btn"
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#2D2D2D] hover:bg-black text-amber-300 font-semibold text-xs transition-all shadow-xs cursor-pointer"
            >
              {initialTask ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
