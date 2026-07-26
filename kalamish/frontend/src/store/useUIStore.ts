import { create } from 'zustand';

export type SidebarTab =
  | 'chapters'
  | 'characters'
  | 'locations'
  | 'timeline'
  | 'outline'
  | 'world-rules'
  | 'search';

export type AITab = 'generate' | 'rewrite' | 'chat' | 'revision' | 'search';

interface UIState {
  activeNovelId: string | null;
  activeChapterId: string | null;
  activeSidebarTab: SidebarTab;
  isSidebarOpen: boolean;
  isAIPanelOpen: boolean;
  activeAITab: AITab;

  setActiveNovelId: (id: string | null) => void;
  setActiveChapterId: (id: string | null) => void;
  setActiveSidebarTab: (tab: SidebarTab) => void;
  toggleSidebar: () => void;
  toggleAIPanel: () => void;
  setActiveAITab: (tab: AITab) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeNovelId: null,
  activeChapterId: null,
  activeSidebarTab: 'chapters',
  isSidebarOpen: true,
  isAIPanelOpen: true,
  activeAITab: 'generate',

  setActiveNovelId: (id: string | null) => set({ activeNovelId: id }),
  setActiveChapterId: (id: string | null) => set({ activeChapterId: id }),
  setActiveSidebarTab: (tab: SidebarTab) => set({ activeSidebarTab: tab, isSidebarOpen: true }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  toggleAIPanel: () => set((state) => ({ isAIPanelOpen: !state.isAIPanelOpen })),
  setActiveAITab: (tab: AITab) => set({ activeAITab: tab, isAIPanelOpen: true }),
}));
