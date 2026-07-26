import React from 'react';
import {
  FileText,
  Users,
  MapPin,
  Clock,
  LayoutList,
  ShieldAlert,
  Search,
} from 'lucide-react';
import { useUIStore, SidebarTab } from '../../store/useUIStore';

export const ActivityBar: React.FC = () => {
  const { activeSidebarTab, isSidebarOpen, setActiveSidebarTab, toggleSidebar } = useUIStore();

  const items: { id: SidebarTab; label: string; icon: React.ReactNode }[] = [
    { id: 'chapters', label: 'Chapters', icon: <FileText className="w-5 h-5" /> },
    { id: 'characters', label: 'Characters', icon: <Users className="w-5 h-5" /> },
    { id: 'locations', label: 'Locations', icon: <MapPin className="w-5 h-5" /> },
    { id: 'timeline', label: 'Timeline', icon: <Clock className="w-5 h-5" /> },
    { id: 'outline', label: 'Outline', icon: <LayoutList className="w-5 h-5" /> },
    { id: 'world-rules', label: 'World Rules', icon: <ShieldAlert className="w-5 h-5" /> },
    { id: 'search', label: 'Vector Search', icon: <Search className="w-5 h-5" /> },
  ];

  return (
    <aside className="fixed bottom-3 left-1/2 z-40 flex -translate-x-1/2 items-center rounded-2xl border border-white/[.1] bg-[#0c1019]/95 p-1.5 shadow-[0_20px_60px_rgba(0,0,0,.5)] backdrop-blur-xl md:static md:z-auto md:w-14 md:translate-x-0 md:flex-col md:self-stretch md:rounded-[18px] md:bg-[#090c14]/85 md:py-2 md:shadow-none">
      <div className="flex items-center gap-1 md:w-full md:flex-col md:gap-1.5">
        {items.map((item) => {
          const isActive = activeSidebarTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === activeSidebarTab && isSidebarOpen) {
                  toggleSidebar();
                } else {
                  setActiveSidebarTab(item.id);
                }
              }}
              title={item.label}
              className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                isActive
                  ? 'bg-[#8b7cff]/12 text-[#b1a7ff] shadow-[inset_0_0_0_1px_rgba(139,124,255,.18)]'
                  : 'text-vscode-muted hover:bg-white/[.05] hover:text-vscode-text'
              }`}
            >
              {/* Active Indicator Strip */}
              {isActive && (
                <div className="absolute -left-1 h-5 w-0.5 rounded-full bg-[#8b7cff] shadow-[0_0_10px_rgba(139,124,255,.75)] md:left-0" />
              )}
              {item.icon}
            </button>
          );
        })}
      </div>
    </aside>
  );
};
