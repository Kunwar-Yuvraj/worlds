import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { GitBranch, CheckCircle2 } from 'lucide-react';
import { apiClient } from '../../app/apiClient';
import { Chapter } from '../../types';
import { Button } from '../../components/Button';

interface AIRevisionTabProps {
  novelId: string;
  chapters: Chapter[];
}

export const AIRevisionTab: React.FC<AIRevisionTabProps> = ({ novelId, chapters }) => {
  const queryClient = useQueryClient();
  const [instruction, setInstruction] = useState('');
  const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>([]);
  const [isRevising, setIsRevising] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleChapter = (id: string) => {
    setSelectedChapterIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleReviseStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instruction.trim() || selectedChapterIds.length === 0) return;

    setIsRevising(true);
    setError(null);
    try {
      const res = await apiClient.post('/ai/revise-story', {
        novel_id: novelId,
        revision_instruction: instruction,
        target_chapter_ids: selectedChapterIds,
      });
      setResult(res.data);

      // The revision endpoint persists chapters and reconciles all structured
      // story context. Refresh every workspace view that can be affected.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['chapters', novelId] }),
        queryClient.invalidateQueries({ queryKey: ['characters', novelId] }),
        queryClient.invalidateQueries({ queryKey: ['locations', novelId] }),
        queryClient.invalidateQueries({ queryKey: ['timeline', novelId] }),
        queryClient.invalidateQueries({ queryKey: ['outlines', novelId] }),
        queryClient.invalidateQueries({ queryKey: ['world-rules', novelId] }),
      ]);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Story revision failed.');
    } finally {
      setIsRevising(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 text-xs select-none">
      <form onSubmit={handleReviseStory} className="flex flex-col gap-3">
        <label className="font-semibold text-vscode-text flex items-center gap-1.5">
          <GitBranch className="w-3.5 h-3.5 text-vscode-accent" />
          Story-Wide Revision Instruction
        </label>
        <textarea
          rows={3}
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="e.g. Ensure Captain Leo's injured arm is consistently referenced during battle dialogues..."
          className="bg-vscode-input border border-vscode-border text-vscode-text rounded-lg p-2.5 focus:outline-none focus:border-vscode-accent transition-colors resize-none placeholder:text-vscode-muted"
        />

        {/* Target Chapters Multi-select */}
        <div>
          <span className="font-semibold text-vscode-muted block mb-1.5">
            Select Target Chapters ({selectedChapterIds.length})
          </span>
          <div className="max-h-36 overflow-y-auto space-y-1 bg-vscode-bg border border-vscode-border rounded-lg p-2">
            {chapters.map((chap) => {
              const isSelected = selectedChapterIds.includes(chap.id);
              return (
                <div
                  key={chap.id}
                  onClick={() => toggleChapter(chap.id)}
                  className={`flex items-center justify-between p-1.5 rounded cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-vscode-accent/20 border border-vscode-accent/40 text-vscode-text'
                      : 'text-vscode-muted hover:bg-vscode-hover hover:text-vscode-text'
                  }`}
                >
                  <span>Ch. {chap.chapter_number}: {chap.title}</span>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="rounded accent-vscode-accent"
                  />
                </div>
              );
            })}
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="sm"
          isLoading={isRevising}
          disabled={!instruction.trim() || selectedChapterIds.length === 0}
          className="w-full gap-2 shadow"
        >
          <GitBranch className="w-3.5 h-3.5" />
          Execute Multi-Chapter Revision
        </Button>
      </form>

      {error && (
        <div className="text-red-400 bg-red-500/10 border border-red-500/20 p-2.5 rounded-lg">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-2 pt-2 border-t border-vscode-border animate-fade-in">
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Revised {result.revised_chapters_count} Chapters</span>
          </div>
          <div className="text-vscode-muted bg-vscode-bg border border-vscode-border rounded-lg p-2.5">
            Story context synchronized:{' '}
            {result.revision_details.reduce(
              (total: number, detail: any) =>
                total +
                (detail.context_updates?.changes?.created || 0) +
                (detail.context_updates?.changes?.updated || 0) +
                (detail.context_updates?.changes?.deleted || 0),
              0
            )}{' '}
            updates across timeline, characters, locations, world rules, outlines, relationships,
            and plot threads.
          </div>
          {result.revision_details.some(
            (detail: any) => detail.context_updates?.status === 'reconciliation_failed'
          ) && (
            <div className="text-amber-400 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg">
              Chapters were revised, but some story-context updates could not be completed.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
