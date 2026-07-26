import React from 'react';
import { Sparkles, Edit3, MessageSquare, GitBranch, Search, X } from 'lucide-react';
import { useUIStore, AITab } from '../../store/useUIStore';
import { Chapter } from '../../types';
import { AIGenerateTab } from '../ai/AIGenerateTab';
import { AIRewriteTab } from '../ai/AIRewriteTab';
import { AIChatTab } from '../ai/AIChatTab';
import { AIRevisionTab } from '../ai/AIRevisionTab';
import { AISearchTab } from '../ai/AISearchTab';

interface AIPanelContainerProps {
  novelId?: string;
  chapterId?: string | null;
  chapters?: Chapter[];
  onApplyProse?: (prose: string) => void | Promise<void>;
  onReplaceProse?: (prose: string) => void | Promise<void>;
  children?: React.ReactNode;
}

export const AIPanelContainer: React.FC<AIPanelContainerProps> = ({
  novelId,
  chapterId = null,
  chapters = [],
  onApplyProse = () => {},
  onReplaceProse = () => {},
  children,
}) => {
  const { isAIPanelOpen, toggleAIPanel, activeAITab, setActiveAITab } = useUIStore();

  if (!isAIPanelOpen) return null;

  const tabs: { id: AITab; label: string; icon: React.ReactNode }[] = [
    { id: 'generate', label: 'Generate', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'rewrite', label: 'Rewrite', icon: <Edit3 className="w-3.5 h-3.5" /> },
    { id: 'chat', label: 'Chat', icon: <MessageSquare className="w-3.5 h-3.5" /> },
    { id: 'revision', label: 'Revise', icon: <GitBranch className="w-3.5 h-3.5" /> },
    { id: 'search', label: 'Search', icon: <Search className="w-3.5 h-3.5" /> },
  ];

  return (
    <aside className="ai-drawer relative flex w-[360px] shrink-0 select-none flex-col overflow-hidden rounded-[22px] border border-white/[0.09] bg-[#0c1019]/95 shadow-[0_22px_70px_rgba(0,0,0,.38)] backdrop-blur-2xl">
      {/* Panel Header */}
      <div className="flex min-h-[66px] items-center justify-between border-b border-white/[0.08] px-5">
        <div>
          <div className="eyebrow mb-1 flex items-center gap-2">
            <span className="live-dot" />
            Creative intelligence
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-vscode-text">
            <Sparkles className="h-4 w-4 text-vscode-accent" />
            <span>Muse studio</span>
          </div>
        </div>
        <button
          onClick={toggleAIPanel}
          className="grid h-9 w-9 place-items-center rounded-xl border border-transparent text-vscode-muted transition hover:border-white/10 hover:bg-white/[0.05] hover:text-vscode-text"
          title="Close AI Panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-white/[0.08] bg-black/10 px-3 py-2">
        {tabs.map((tab) => {
          const isActive = activeAITab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveAITab(tab.id)}
              className={`flex min-h-9 items-center gap-1.5 whitespace-nowrap rounded-xl border px-2.5 py-2 text-[11px] font-semibold transition-all ${
                isActive
                  ? 'border-vscode-accent/30 bg-vscode-accent/15 text-vscode-accent shadow-[inset_0_0_18px_rgba(139,124,255,.08)]'
                  : 'border-transparent text-vscode-muted hover:bg-white/[0.04] hover:text-vscode-text'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Panel Body */}
      <div className="flex-1 overflow-y-auto p-5">
        {children || (
          <>
            {novelId && activeAITab === 'generate' && (
              <AIGenerateTab
                novelId={novelId}
                chapterId={chapterId}
                onApplyProse={onApplyProse}
              />
            )}

            {activeAITab === 'rewrite' && (
              <AIRewriteTab chapterId={chapterId} onReplaceProse={onReplaceProse} />
            )}

            {novelId && activeAITab === 'chat' && <AIChatTab novelId={novelId} />}

            {novelId && activeAITab === 'revision' && (
              <AIRevisionTab novelId={novelId} chapters={chapters} />
            )}

            {novelId && activeAITab === 'search' && <AISearchTab novelId={novelId} />}
          </>
        )}
      </div>
    </aside>
  );
};
