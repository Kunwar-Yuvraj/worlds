import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LayoutList, Plus, Edit2, Trash2, Hash, Layers, CheckCircle2 } from 'lucide-react';
import { apiClient } from '../../app/apiClient';
import { Outline } from '../../types';
import { OutlineModal } from './OutlineModal';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { LoadingSpinner } from '../../components/LoadingSpinner';

interface OutlinesManagerProps {
  novelId: string;
}

export const OutlinesManager: React.FC<OutlinesManagerProps> = ({ novelId }) => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOutline, setSelectedOutline] = useState<Outline | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: outlines = [], isLoading } = useQuery<Outline[]>({
    queryKey: ['outlines', novelId],
    queryFn: async () => (await apiClient.get(`/novels/${novelId}/outlines`)).data,
    enabled: !!novelId,
  });

  const sortedOutlines = [...outlines].sort((a, b) => a.chapter_number - b.chapter_number);

  const nextChapterNumber =
    sortedOutlines.length > 0
      ? Math.max(...sortedOutlines.map((o) => o.chapter_number)) + 1
      : 1;

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['outlines', novelId] });
  };

  const handleDelete = async (outlineId: string) => {
    if (!confirm('Are you sure you want to delete this chapter outline?')) return;
    setDeletingId(outlineId);
    try {
      await apiClient.delete(`/outlines/${outlineId}`);
      handleRefresh();
    } catch (err) {
      alert('Failed to delete outline.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto p-5 text-vscode-text sm:p-7">
      {/* Header Bar */}
      <div className="mb-7 flex flex-col gap-4 border-b border-white/[0.08] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <LayoutList className="w-5 h-5 text-vscode-accent" />
            Chapter Outline Planning Board ({sortedOutlines.length})
          </h2>
          <p className="text-xs text-vscode-muted mt-0.5">
            Plan chapter synopses, key narrative beats, and target word count milestones
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setSelectedOutline(null);
            setIsModalOpen(true);
          }}
          className="gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add Chapter Outline
        </Button>
      </div>

      {isLoading ? (
        <LoadingSpinner size={32} />
      ) : sortedOutlines.length === 0 ? (
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-vscode-border rounded-xl p-12 text-center bg-vscode-sidebar/20">
          <Layers className="w-10 h-10 text-vscode-muted mb-3" />
          <h3 className="text-sm font-bold mb-1">No Chapter Outlines Found</h3>
          <p className="text-xs text-vscode-muted mb-4">
            Outline your novel structure by mapping out chapter goals.
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setSelectedOutline(null);
              setIsModalOpen(true);
            }}
          >
            <Plus className="w-4 h-4" /> Add First Outline
          </Button>
        </div>
      ) : (
        /* Outlines Board Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sortedOutlines.map((out) => (
            <div
              key={out.id}
              className="glass-card flex flex-col justify-between rounded-[18px] p-5 transition-all hover:-translate-y-0.5 hover:border-vscode-accent/30"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="text-[11px] font-mono font-bold text-vscode-accent bg-vscode-accent/10 border border-vscode-accent/30 px-2 py-0.5 rounded">
                      Ch. {out.chapter_number}
                    </span>
                    <h4 className="text-sm font-bold text-vscode-text mt-1.5">{out.title}</h4>
                  </div>
                  <Badge variant="blue">{out.target_word_count || 2000}w Target</Badge>
                </div>

                <p className="text-xs text-vscode-muted mb-3 line-clamp-3 leading-relaxed">
                  {out.synopsis}
                </p>

                {/* Key Events / Narrative Beats */}
                {Array.isArray(out.key_events) && out.key_events.length > 0 && (
                  <div className="bg-vscode-bg border border-vscode-border/50 rounded-lg p-2.5 text-[11px] space-y-1 mb-3">
                    <span className="font-semibold text-vscode-muted text-[10px] uppercase block mb-1">
                      Key Narrative Beats:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {out.key_events.map((beat, i) => (
                        <span
                          key={i}
                          className="bg-vscode-sidebar border border-vscode-border text-vscode-text px-2 py-0.5 rounded text-[10px]"
                        >
                          • {beat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Controls */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-vscode-border/50">
                <button
                  onClick={() => {
                    setSelectedOutline(out);
                    setIsModalOpen(true);
                  }}
                  className="p-1.5 text-vscode-muted hover:text-vscode-text rounded hover:bg-vscode-hover transition-colors text-xs flex items-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={() => handleDelete(out.id)}
                  disabled={deletingId === out.id}
                  className="p-1.5 text-vscode-muted hover:text-red-400 rounded hover:bg-vscode-hover transition-colors text-xs flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <OutlineModal
        novelId={novelId}
        nextChapterNumber={nextChapterNumber}
        outline={selectedOutline}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleRefresh}
      />
    </div>
  );
};
