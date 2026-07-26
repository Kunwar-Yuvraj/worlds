import React from 'react';
import { useUIStore } from '../../store/useUIStore';
import { SidebarExplorer } from './SidebarExplorer';
import { X } from 'lucide-react';

interface SidebarContainerProps {
  novelId?: string;
  children?: React.ReactNode;
}

export const SidebarContainer: React.FC<SidebarContainerProps> = ({ novelId, children }) => {
  const { activeSidebarTab, isSidebarOpen, toggleSidebar } = useUIStore();

  if (!isSidebarOpen) return null;

  const tabTitles: Record<string, string> = {
    chapters: 'Explorer: Chapters',
    characters: 'Story World: Characters',
    locations: 'Story World: Locations',
    timeline: 'Plot: Timeline Events',
    outline: 'Plot: Novel Outlines',
    'world-rules': 'Worldbuilding: Rules',
    search: 'Semantic Vector Search',
  };

  return (
    <aside className="workspace-sidebar flex w-[290px] shrink-0 select-none flex-col overflow-hidden rounded-[20px] border border-white/[.09] bg-[#0c1019]/90 shadow-[0_24px_70px_rgba(0,0,0,.22)] backdrop-blur-xl">
      {/* Sidebar Header */}
      <div className="flex min-h-14 items-center justify-between border-b border-white/[.07] px-4">
        <span className="text-[9px] font-bold uppercase tracking-[.18em] text-[#7d8597]">
          {tabTitles[activeSidebarTab] || 'Explorer'}
        </span>
        <button
          type="button"
          onClick={toggleSidebar}
          className="grid h-8 w-8 place-items-center rounded-lg text-vscode-muted transition hover:bg-white/[.06] hover:text-white"
          aria-label="Close explorer"
          title="Close explorer (Ctrl+B)"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Sidebar Content View */}
      <div className="flex-1 overflow-y-auto p-3.5">
        {children || (novelId ? <SidebarExplorer novelId={novelId} /> : null)}
      </div>
    </aside>
  );
};
