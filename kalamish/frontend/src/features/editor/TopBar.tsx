import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Sparkles, PanelLeft, PanelRight, CheckCircle2, BookOpen, Search } from 'lucide-react';
import { Novel, Chapter } from '../../types';
import { useUIStore } from '../../store/useUIStore';
import { formatChapterLabel } from '../../utils/proseCleaner';
import { Brand } from '../../components/Brand';

interface TopBarProps {
  novel: Novel | null;
  chapters: Chapter[];
  saveStatus?: 'saved' | 'saving' | 'unsaved';
  onOpenSearch?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  novel,
  chapters,
  saveStatus = 'saved',
  onOpenSearch = () => {},
}) => {
  const navigate = useNavigate();
  const {
    activeChapterId, setActiveChapterId, isSidebarOpen, toggleSidebar, isAIPanelOpen, toggleAIPanel,
  } = useUIStore();

  return (
    <header className="flex min-h-[68px] shrink-0 select-none items-center justify-between gap-3 px-3 sm:px-4">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <Brand compact />
        <button
          onClick={() => navigate('/dashboard')}
          className="grid h-9 w-9 place-items-center rounded-xl text-vscode-muted transition hover:bg-white/[.05] hover:text-white"
          title="Back to story library"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={toggleSidebar}
          className={`grid h-9 w-9 place-items-center rounded-xl transition ${isSidebarOpen ? 'bg-[#8b7cff]/10 text-[#a99dff]' : 'text-vscode-muted hover:bg-white/[.05] hover:text-white'}`}
          title="Toggle story navigator"
        >
          <PanelLeft className="h-4 w-4" />
        </button>
        <div className="hidden h-6 w-px bg-white/[.08] sm:block" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <BookOpen className="hidden h-3.5 w-3.5 text-[#a99dff] sm:block" />
            <h1 className="max-w-40 truncate text-xs font-semibold tracking-[-.015em] sm:max-w-64 sm:text-sm">
              {novel?.title || 'Opening story…'}
            </h1>
          </div>
          <p className="mt-0.5 hidden text-[9px] font-bold uppercase tracking-[.14em] text-[#687084] sm:block">
            {novel?.genre || 'Narrative workspace'}
          </p>
        </div>
      </div>

      <div className="hidden min-w-0 items-center gap-2 md:flex">
        {chapters.length > 0 && (
          <select
            aria-label="Active chapter"
            value={activeChapterId || ''}
            onChange={(event) => setActiveChapterId(event.target.value || null)}
            className="max-w-72 rounded-xl border border-white/[.09] bg-[#0c1019] px-3 py-2 text-xs text-[#cbd0db] outline-none hover:border-white/15 focus:border-vscode-accent"
          >
            {chapters.map((chapter) => (
              <option key={chapter.id} value={chapter.id}>{formatChapterLabel(chapter.chapter_number, chapter.title)}</option>
            ))}
          </select>
        )}
        <span className="flex items-center gap-2 rounded-full border border-[#6ee7f2]/15 bg-[#6ee7f2]/[.045] px-3 py-2 text-[9px] font-bold uppercase tracking-[.13em] text-[#82dce5]">
          <CheckCircle2 className={`h-3.5 w-3.5 ${saveStatus === 'saving' ? 'animate-pulse' : ''}`} />
          {saveStatus === 'saving' ? 'Syncing' : 'Synced'}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onOpenSearch}
          className="grid h-9 w-9 place-items-center rounded-xl border border-white/[.08] text-vscode-muted transition hover:border-[#8b7cff]/35 hover:bg-[#8b7cff]/[.06] hover:text-white sm:flex sm:w-auto sm:gap-2 sm:px-3"
          title="Search story memory (Ctrl+K)"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden text-[9px] uppercase tracking-[.12em] sm:inline">Ctrl K</span>
        </button>
        <button
          onClick={toggleAIPanel}
          className={`flex h-9 items-center gap-2 rounded-xl border px-3 text-xs font-semibold transition ${isAIPanelOpen ? 'border-[#8b7cff]/35 bg-[#8b7cff]/15 text-[#c1b9ff]' : 'border-white/[.08] text-vscode-muted hover:border-[#8b7cff]/30 hover:text-white'}`}
          title="Toggle narrative intelligence"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Muse</span>
          <PanelRight className="hidden h-3.5 w-3.5 lg:block" />
        </button>
      </div>
    </header>
  );
};
