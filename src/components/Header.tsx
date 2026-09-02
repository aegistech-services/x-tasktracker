import React, { useState, useRef, useEffect } from 'react';
import {
  Layers,
  LayoutGrid,
  StickyNote,
  Plus,
  RotateCcw,
  Search,
  Network,
  ChevronDown,
  Check,
} from 'lucide-react';
import { SubtaskItem, ViewStyle } from '../types';

interface HeaderProps {
  rootTasks: SubtaskItem[];
  activeL1Id: string;
  onSelectL1Task: (taskId: string) => void;
  viewStyle: ViewStyle;
  onToggleViewStyle: (style: ViewStyle) => void;
  onOpenCreateModal: (level: 1 | 2 | 3 | 4, parentId?: string | null) => void;
  onOpenTreeDrawer: () => void;
  onResetData: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  rootTasks,
  activeL1Id,
  onSelectL1Task,
  viewStyle,
  onToggleViewStyle,
  onOpenCreateModal,
  onOpenTreeDrawer,
  onResetData,
  searchQuery,
  onSearchChange,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeRoot = rootTasks.find((t) => t.id === activeL1Id) || rootTasks[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDropdownOpen]);

  return (
    <header className="sticky top-0 z-30 bg-[#F9F9F7]/95 backdrop-blur-md border-b border-stone-200/90 px-3 sm:px-6 py-3 transition-colors">
      <div className="w-full flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Left Section: Only Logo & Initiative Droplist */}
        <div className="flex items-center gap-3">
          {/* Only Logo Icon */}
          <div
            id="app-logo"
            className="w-8 h-8 rounded-lg bg-[#2D2D2D] text-amber-300 flex items-center justify-center font-bold text-sm shadow-2xs shrink-0 cursor-default"
            title="Hierarchical Kanban (4 Levels)"
          >
            <Layers className="w-4 h-4" />
          </div>

          <div className="h-4 w-px bg-stone-200" />

          {/* Initiative Dropdown List */}
          <div className="relative" ref={dropdownRef}>
            <button
              id="initiative-dropdown-btn"
              type="button"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-[#2D2D2D] text-xs font-semibold shadow-2xs transition-all cursor-pointer min-w-[160px] max-w-[260px] justify-between group"
              aria-haspopup="listbox"
              aria-expanded={isDropdownOpen}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-stone-400 font-medium text-[11px] shrink-0">Initiative:</span>
                <span className="truncate text-[#2D2D2D]">
                  {activeRoot ? activeRoot.title : 'Select Initiative'}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {activeRoot?.subtasks && activeRoot.subtasks.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-stone-100 text-stone-600 font-bold">
                    {activeRoot.subtasks.length}
                  </span>
                )}
                <ChevronDown
                  className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-200 ${
                    isDropdownOpen ? 'rotate-180 text-[#2D2D2D]' : ''
                  }`}
                />
              </div>
            </button>

            {/* Droplist Popover Menu */}
            {isDropdownOpen && (
              <div
                id="initiative-dropdown-menu"
                className="absolute left-0 mt-1.5 w-72 bg-white rounded-xl border border-stone-200 shadow-lg py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
                role="listbox"
              >
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-400 border-b border-stone-100 mb-1 flex items-center justify-between">
                  <span>Level 1 Initiatives</span>
                  <span>{rootTasks.length} Total</span>
                </div>

                <div className="max-h-60 overflow-y-auto px-1 space-y-0.5">
                  {rootTasks.map((task) => {
                    const isActive = task.id === activeL1Id;
                    return (
                      <button
                        key={task.id}
                        id={`initiative-option-${task.id}`}
                        type="button"
                        onClick={() => {
                          onSelectL1Task(task.id);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full px-2.5 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-between gap-2 cursor-pointer text-left ${
                          isActive
                            ? 'bg-amber-50/80 text-amber-950 font-semibold border border-amber-200/80'
                            : 'text-[#2D2D2D] hover:bg-stone-100 border border-transparent'
                        }`}
                        role="option"
                        aria-selected={isActive}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-stone-100 text-stone-700 font-bold border border-stone-200 shrink-0">
                            L1
                          </span>
                          <span className="truncate">{task.title}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-stone-100 text-stone-600 font-medium">
                            {task.subtasks?.length || 0} subtasks
                          </span>
                          {isActive && <Check className="w-3.5 h-3.5 text-amber-600" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="border-t border-stone-100 mt-1.5 pt-1 px-1">
                  <button
                    id="new-initiative-from-dropdown-btn"
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onOpenCreateModal(1, null);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg text-xs font-medium text-stone-600 hover:text-[#2D2D2D] hover:bg-stone-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-stone-500" />
                    <span>Create New Initiative</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Add Initiative Button */}
          <button
            id="new-l1-initiative-btn"
            onClick={() => onOpenCreateModal(1, null)}
            className="p-1.5 text-stone-500 hover:text-[#2D2D2D] hover:bg-white rounded-lg text-xs flex items-center justify-center transition-colors cursor-pointer border border-dashed border-stone-300 bg-white/50 shadow-2xs"
            title="Create New Level 1 Initiative"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right Section: Search, View Switcher & Actions */}
        <div className="flex items-center gap-2.5 justify-between md:justify-end flex-wrap">
          {/* Search Box */}
          <div className="relative flex-1 sm:flex-initial min-w-[160px] sm:w-48">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              id="global-search-input"
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-[#2D2D2D] transition-all placeholder:text-stone-400"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs font-bold"
              >
                ×
              </button>
            )}
          </div>

          {/* View Style Toggle (Post-It vs Professional Grid) */}
          <div className="inline-flex rounded-lg p-0.5 bg-white border border-stone-200 shadow-2xs">
            <button
              id="view-toggle-postit"
              onClick={() => onToggleViewStyle('postit')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                viewStyle === 'postit'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300 font-semibold shadow-2xs'
                  : 'text-stone-600 hover:text-[#2D2D2D]'
              }`}
              title="Sticky Post-It Notes View"
            >
              <StickyNote className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">Post-It</span>
            </button>
            <button
              id="view-toggle-professional"
              onClick={() => onToggleViewStyle('professional')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                viewStyle === 'professional'
                  ? 'bg-[#2D2D2D] text-white shadow-2xs font-semibold'
                  : 'text-stone-600 hover:text-[#2D2D2D]'
              }`}
              title="Professional Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Professional</span>
            </button>
          </div>

          {/* Hierarchy Tree Drawer Button */}
          <button
            id="open-tree-drawer-btn"
            onClick={onOpenTreeDrawer}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-[#2D2D2D] text-xs font-medium transition-all cursor-pointer shadow-2xs"
            title="View Full 4-Level Tree Map"
          >
            <Network className="w-3.5 h-3.5 text-stone-600" />
            <span className="hidden md:inline">Tree Map</span>
          </button>

          {/* Reset Demo Data Button */}
          <button
            id="reset-demo-data-btn"
            onClick={onResetData}
            className="p-1.5 rounded-lg text-stone-400 hover:text-[#2D2D2D] hover:bg-white transition-colors cursor-pointer border border-transparent hover:border-stone-200"
            title="Reset to Sample Demo Tasks"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
