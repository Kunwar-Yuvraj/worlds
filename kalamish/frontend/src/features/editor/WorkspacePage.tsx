import React, { Suspense, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../app/apiClient';
import { useUIStore } from '../../store/useUIStore';
import { Novel, Chapter } from '../../types';
import { TopBar } from './TopBar';
import { ActivityBar } from './ActivityBar';
import { SidebarContainer } from './SidebarContainer';
import { StatusBar } from './StatusBar';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { parseTitleAndCleanProse } from '../../utils/proseCleaner';
import { ArrowLeft, BookOpenText } from 'lucide-react';

const AIPanelContainer = React.lazy(() =>
  import('./AIPanelContainer').then((module) => ({ default: module.AIPanelContainer }))
);
const MonacoProseEditor = React.lazy(() =>
  import('./MonacoProseEditor').then((module) => ({ default: module.MonacoProseEditor }))
);
const CharactersManager = React.lazy(() =>
  import('../characters/CharactersManager').then((module) => ({ default: module.CharactersManager }))
);
const LocationsManager = React.lazy(() =>
  import('../locations/LocationsManager').then((module) => ({ default: module.LocationsManager }))
);
const TimelineManager = React.lazy(() =>
  import('../timeline/TimelineManager').then((module) => ({ default: module.TimelineManager }))
);
const OutlinesManager = React.lazy(() =>
  import('../outline/OutlinesManager').then((module) => ({ default: module.OutlinesManager }))
);
const WorldRulesManager = React.lazy(() =>
  import('../world-rules/WorldRulesManager').then((module) => ({ default: module.WorldRulesManager }))
);
const GlobalSearchModal = React.lazy(() =>
  import('../search/GlobalSearchModal').then((module) => ({ default: module.GlobalSearchModal }))
);
const ShortcutsHelpModal = React.lazy(() =>
  import('../../components/ShortcutsHelpModal').then((module) => ({ default: module.ShortcutsHelpModal }))
);

const PanelFallback = () => (
  <div className="grid h-full min-h-0 flex-1 place-items-center">
    <LoadingSpinner size={24} />
  </div>
);

export const WorkspacePage: React.FC = () => {
  const { novelId } = useParams<{ novelId: string }>();
  const queryClient = useQueryClient();
  const {
    setActiveNovelId,
    activeChapterId,
    setActiveChapterId,
    activeSidebarTab,
    setActiveSidebarTab,
    isSidebarOpen,
    isAIPanelOpen,
    toggleSidebar,
    toggleAIPanel,
  } = useUIStore();
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = React.useState(false);

  useEffect(() => {
    if (novelId) {
      setActiveNovelId(novelId);
    }
  }, [novelId, setActiveNovelId]);

  // Global Keyboard Shortcuts (Ctrl+K, Ctrl+B, Ctrl+I, Ctrl+/)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'k') {
          e.preventDefault();
          setIsSearchOpen(true);
        } else if (e.key === 'b') {
          e.preventDefault();
          toggleSidebar();
        } else if (e.key === 'i') {
          e.preventDefault();
          toggleAIPanel();
        } else if (e.key === '/') {
          e.preventDefault();
          setIsShortcutsOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar, toggleAIPanel]);

  // Fetch novel details
  const { data: novel, isLoading: isNovelLoading } = useQuery<Novel>({
    queryKey: ['novel', novelId],
    queryFn: async () => {
      const res = await apiClient.get(`/novels/${novelId}`);
      return res.data;
    },
    enabled: !!novelId,
  });

  // Fetch chapters list
  const { data: chapters = [], isLoading: isChaptersLoading } = useQuery<Chapter[]>({
    queryKey: ['chapters', novelId],
    queryFn: async () => {
      const res = await apiClient.get(`/novels/${novelId}/chapters`);
      return res.data;
    },
    enabled: !!novelId,
  });

  // Set default active chapter if none selected
  useEffect(() => {
    if (chapters.length > 0 && !activeChapterId) {
      setActiveChapterId(chapters[0].id);
    }
  }, [chapters, activeChapterId, setActiveChapterId]);

  const activeChapter = chapters.find((c) => c.id === activeChapterId);

  const persistAIProse = async (proseToApply: string, mode: 'append' | 'replace') => {
    if (!activeChapterId || !activeChapter) {
      throw new Error('Please select or create an active chapter first.');
    }

    const chaptersQueryKey = ['chapters', novelId];
    const previousChapters = queryClient.getQueryData<Chapter[]>(chaptersQueryKey);

    try {
      const { extractedTitle, cleanProse } = parseTitleAndCleanProse(proseToApply);

      if (!cleanProse) {
        throw new Error('The AI returned no prose to apply.');
      }

      const newContent =
        mode === 'replace'
          ? cleanProse
          : activeChapter.content
            ? `${activeChapter.content}\n\n${cleanProse}`
            : cleanProse;

      const payload: { content: string; title?: string } = {
        content: newContent,
      };

      // If AI generated a chapter title (e.g. "The Inventory of Solitude") and active title is generic, update title too!
      const isGenericTitle =
        activeChapter.title.toLowerCase().startsWith('chapter') ||
        activeChapter.title === 'Untitled Chapter';

      if (extractedTitle && isGenericTitle) {
        payload.title = extractedTitle;
      }

      await queryClient.cancelQueries({ queryKey: chaptersQueryKey });

      // Update the controlled editor immediately. This also lets it cancel any
      // pending autosave of the old canvas before the request completes.
      queryClient.setQueryData<Chapter[]>(chaptersQueryKey, (current = []) =>
        current.map((chapter) =>
          chapter.id === activeChapterId
            ? {
                ...chapter,
                ...payload,
                word_count: newContent.trim().split(/\s+/).filter(Boolean).length,
              }
            : chapter
        )
      );

      const response = await apiClient.put(`/chapters/${activeChapterId}`, payload);

      queryClient.setQueryData<Chapter[]>(chaptersQueryKey, (current = []) =>
        current.map((chapter) => (chapter.id === activeChapterId ? response.data : chapter))
      );

      // Refetch chapters, characters, locations, timeline, outlines & world-rules caches so all views update instantly!
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: chaptersQueryKey }),
        queryClient.invalidateQueries({ queryKey: ['characters', novelId] }),
        queryClient.invalidateQueries({ queryKey: ['locations', novelId] }),
        queryClient.invalidateQueries({ queryKey: ['timeline', novelId] }),
        queryClient.invalidateQueries({ queryKey: ['outlines', novelId] }),
        queryClient.invalidateQueries({ queryKey: ['world-rules', novelId] }),
      ]);
    } catch (err) {
      if (previousChapters) {
        queryClient.setQueryData(chaptersQueryKey, previousChapters);
      }
      console.error(`Failed to ${mode} AI prose in chapter:`, err);
      throw err;
    }
  };

  // Story generation extends the current chapter.
  const handleApplyProse = (proseToApply: string) => persistAIProse(proseToApply, 'append');

  // Story rewriting replaces the current chapter canvas.
  const handleReplaceProse = (proseToApply: string) => persistAIProse(proseToApply, 'replace');

  if (isNovelLoading || isChaptersLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-vscode-bg text-vscode-text">
        <div className="flex flex-col items-center gap-3">
          <LoadingSpinner size={32} />
          <span className="text-xs text-vscode-muted">Loading Workspace Shell...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden text-vscode-text">
      {/* Top Header Bar */}
      <TopBar
        novel={novel || null}
        chapters={chapters}
        saveStatus="saved"
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* Main Workspace Workspace Area */}
      <div className="flex min-h-0 flex-1 gap-2 overflow-hidden px-3 pb-1 md:gap-3">
        {isSidebarOpen && (
          <button
            type="button"
            className="workspace-drawer-scrim"
            onClick={toggleSidebar}
            aria-label="Close explorer"
          />
        )}

        {/* Far-left Activity Icon Bar */}
        <ActivityBar />

        {/* Left Navigation Sidebar */}
        <SidebarContainer novelId={novelId} />

        {/* Center Main Workspace Area */}
        <main className="spectral-panel flex min-w-0 flex-1 flex-col overflow-hidden rounded-[22px] pb-16 md:pb-0">
          {activeSidebarTab !== 'chapters' && activeSidebarTab !== 'search' && (
            <div className="flex min-h-14 shrink-0 items-center justify-between gap-4 border-b border-white/[.07] bg-[#0c1019] px-4 sm:px-5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-vscode-accent/10 text-vscode-accent">
                  <BookOpenText className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold capitalize text-vscode-text">
                    {activeSidebarTab.replace('-', ' ')}
                  </p>
                  <p className="hidden text-[10px] text-vscode-muted sm:block">Story reference workspace</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveSidebarTab('chapters')}
                className="inline-flex h-9 shrink-0 items-center gap-2 rounded-xl border border-white/[.09] px-3 text-xs font-semibold text-vscode-muted transition hover:border-vscode-accent/30 hover:bg-vscode-accent/[.06] hover:text-white"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Manuscript
              </button>
            </div>
          )}
          <Suspense fallback={<PanelFallback />}>
            {activeSidebarTab === 'characters' && novelId ? (
              <CharactersManager novelId={novelId} />
            ) : activeSidebarTab === 'locations' && novelId ? (
              <LocationsManager novelId={novelId} />
            ) : activeSidebarTab === 'timeline' && novelId ? (
              <TimelineManager novelId={novelId} chapters={chapters} />
            ) : activeSidebarTab === 'outline' && novelId ? (
              <OutlinesManager novelId={novelId} />
            ) : activeSidebarTab === 'world-rules' && novelId ? (
              <WorldRulesManager novelId={novelId} />
            ) : (
              <MonacoProseEditor
                chapter={activeChapter || null}
                onChapterUpdate={() => {}}
              />
            )}
          </Suspense>
        </main>

        {/* Far-right AI Assistant Side Drawer */}
        {isAIPanelOpen && (
          <Suspense fallback={null}>
            <AIPanelContainer
              novelId={novelId}
              chapterId={activeChapterId}
              chapters={chapters}
              onApplyProse={handleApplyProse}
              onReplaceProse={handleReplaceProse}
            />
          </Suspense>
        )}
      </div>

      {/* Fixed Bottom Status Bar */}
      <StatusBar
        novelTitle={novel?.title}
        chapterTitle={activeChapter ? `Ch. ${activeChapter.chapter_number}` : undefined}
        wordCount={activeChapter?.word_count || 0}
      />

      {/* Global Vector Search Modal */}
      {isSearchOpen && (
        <Suspense fallback={null}>
          <GlobalSearchModal
            novelId={novelId || null}
            isOpen
            onClose={() => setIsSearchOpen(false)}
          />
        </Suspense>
      )}

      {/* Keyboard Shortcuts Guide Modal */}
      {isShortcutsOpen && (
        <Suspense fallback={null}>
          <ShortcutsHelpModal
            isOpen
            onClose={() => setIsShortcutsOpen(false)}
          />
        </Suspense>
      )}
    </div>
  );
};

export default WorkspacePage;
