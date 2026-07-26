import React, { useState } from 'react';
import { Plus, FileText, Trash2, Hash, Pencil, Check, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Chapter } from '../../types';
import { useUIStore } from '../../store/useUIStore';
import { CreateChapterModal } from './CreateChapterModal';
import { apiClient } from '../../app/apiClient';
import { formatChapterLabel } from '../../utils/proseCleaner';

interface ChaptersExplorerProps {
  novelId: string;
  chapters: Chapter[];
  onRefresh: () => void;
}

export const ChaptersExplorer: React.FC<ChaptersExplorerProps> = ({
  novelId,
  chapters,
  onRefresh,
}) => {
  const { activeChapterId, setActiveChapterId } = useUIStore();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  const nextChapterNumber =
    chapters.length > 0 ? Math.max(...chapters.map((c) => c.chapter_number)) + 1 : 1;

  const handleDelete = async (e: React.MouseEvent, chapterId: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this chapter?')) return;
    setDeletingId(chapterId);
    try {
      await apiClient.delete(`/chapters/${chapterId}`);
      if (activeChapterId === chapterId) {
        const remaining = chapters.filter((c) => c.id !== chapterId);
        setActiveChapterId(remaining.length > 0 ? remaining[0].id : null);
      }
      onRefresh();
    } catch (err) {
      alert('Failed to delete chapter.');
    } finally {
      setDeletingId(null);
    }
  };

  const startRenaming = (e: React.MouseEvent, chapter: Chapter) => {
    e.stopPropagation();
    setEditingId(chapter.id);
    setTitleDraft(chapter.title);
  };

  const cancelRenaming = () => {
    setEditingId(null);
    setTitleDraft('');
  };

  const saveTitle = async (chapter: Chapter) => {
    const nextTitle = titleDraft.trim();
    if (!nextTitle || nextTitle === chapter.title || savingId) {
      if (nextTitle === chapter.title) cancelRenaming();
      return;
    }

    const queryKey = ['chapters', novelId];
    const previous = queryClient.getQueryData<Chapter[]>(queryKey);
    setSavingId(chapter.id);
    queryClient.setQueryData<Chapter[]>(queryKey, (current = []) =>
      current.map((item) => item.id === chapter.id ? { ...item, title: nextTitle } : item)
    );

    try {
      const response = await apiClient.put(`/chapters/${chapter.id}`, { title: nextTitle });
      queryClient.setQueryData<Chapter[]>(queryKey, (current = []) =>
        current.map((item) => item.id === chapter.id ? response.data : item)
      );
      cancelRenaming();
    } catch {
      if (previous) queryClient.setQueryData(queryKey, previous);
      alert('Failed to rename chapter.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="flex flex-col h-full select-none">
      {/* Action Toolbar */}
      <div className="mb-3 flex items-center justify-between px-1">
        <span className="eyebrow flex items-center gap-1.5">
          <Hash className="w-3.5 h-3.5" />
          Chapters ({chapters.length})
        </span>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="grid h-8 w-8 place-items-center rounded-xl border border-white/10 text-vscode-muted transition hover:border-vscode-accent/30 hover:bg-vscode-accent/10 hover:text-vscode-accent"
          title="Add New Chapter"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Chapters Tree List */}
      <div className="flex-1 overflow-y-auto space-y-1 pr-1">
        {chapters.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-5 py-8 text-center text-xs text-vscode-muted">
            <p className="mb-2">No chapters written yet.</p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="text-vscode-accent font-medium hover:underline inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Chapter 1
            </button>
          </div>
        ) : (
          chapters.map((chap) => {
            const isActive = activeChapterId === chap.id;
            return (
              <div
                key={chap.id}
                onClick={() => setActiveChapterId(chap.id)}
                className={`group flex cursor-pointer items-center justify-between rounded-xl border px-3 py-2.5 text-xs transition-all ${
                  isActive
                    ? 'border-vscode-accent/30 bg-vscode-accent/15 font-medium text-vscode-text shadow-[inset_0_0_22px_rgba(139,124,255,.06)]'
                    : 'border-transparent text-vscode-muted hover:border-white/[0.08] hover:bg-white/[0.035] hover:text-vscode-text'
                }`}
              >
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <FileText
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-vscode-accent' : 'text-vscode-muted'
                    }`}
                  />
                  {editingId === chap.id ? (
                    <input
                      autoFocus
                      value={titleDraft}
                      onClick={(event) => event.stopPropagation()}
                      onChange={(event) => setTitleDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          void saveTitle(chap);
                        }
                        if (event.key === 'Escape') cancelRenaming();
                      }}
                      className="h-8 min-w-0 flex-1 rounded-lg border border-vscode-accent/40 bg-[#070a11] px-2 text-xs text-vscode-text outline-none focus:ring-2 focus:ring-vscode-accent/10"
                      aria-label={`Rename chapter ${chap.chapter_number}`}
                    />
                  ) : (
                    <span
                      className="truncate"
                      onDoubleClick={(event) => startRenaming(event, chap)}
                      title="Double-click to rename"
                    >
                      {formatChapterLabel(chap.chapter_number, chap.title)}
                    </span>
                  )}
                </div>

                <div className={`ml-2 flex shrink-0 items-center gap-1 ${editingId === chap.id ? 'opacity-100' : 'opacity-0 transition-opacity group-hover:opacity-100'}`}>
                  {editingId === chap.id ? (
                    <>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          void saveTitle(chap);
                        }}
                        disabled={!titleDraft.trim() || savingId === chap.id}
                        title="Save title"
                        className="rounded p-1 text-emerald-400 hover:bg-emerald-400/10 disabled:opacity-40"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          cancelRenaming();
                        }}
                        title="Cancel rename"
                        className="rounded p-1 text-vscode-muted hover:bg-white/[.06] hover:text-white"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={(event) => startRenaming(event, chap)}
                        title="Rename chapter"
                        className="rounded p-1 text-vscode-muted hover:bg-vscode-bg hover:text-vscode-text"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, chap.id)}
                        disabled={deletingId === chap.id}
                        title="Delete Chapter"
                        className="rounded p-1 text-vscode-muted transition-colors hover:bg-vscode-bg hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <CreateChapterModal
        novelId={novelId}
        nextChapterNumber={nextChapterNumber}
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={(newId) => {
          onRefresh();
          setActiveChapterId(newId);
        }}
      />
    </div>
  );
};
