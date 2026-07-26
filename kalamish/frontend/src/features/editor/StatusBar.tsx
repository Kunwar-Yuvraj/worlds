import React from 'react';
import { Book, Cpu, Wifi } from 'lucide-react';

interface StatusBarProps {
  novelTitle?: string;
  chapterTitle?: string;
  wordCount?: number;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  novelTitle = 'Untitled Novel',
  chapterTitle,
  wordCount = 0,
}) => {
  return (
    <footer className="mx-3 mb-2 mt-2 flex min-h-7 shrink-0 select-none items-center justify-between rounded-lg border border-white/[.06] bg-[#0c1019]/75 px-3 text-[9px] uppercase tracking-[.1em] text-[#687084]">
      {/* Left: Status & Context */}
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Book className="w-3 h-3" />
          <span className="max-w-28 truncate text-[#929aac] sm:max-w-none">{novelTitle}</span>
          {chapterTitle && <span className="hidden opacity-80 sm:inline">/ {chapterTitle}</span>}
        </div>

        <div className="h-3 w-px bg-white/10" />

        <div>
          <span>{wordCount.toLocaleString()} words</span>
        </div>
      </div>

      {/* Right: Environment & Engine */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Cpu className="w-3 h-3 opacity-90" />
          <span className="hidden sm:inline">Gemini narrative engine</span>
        </div>

        <div className="flex items-center gap-1.5">
          <Wifi className="h-3 w-3 text-[#6ee7f2]" />
          <span className="text-[#8eeaf2]">Synced</span>
        </div>

        <span className="hidden sm:inline">UTF-8</span>
      </div>
    </footer>
  );
};
