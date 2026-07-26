import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Clock, Plus, Edit2, Trash2, Calendar, FileText, Zap } from 'lucide-react';
import { apiClient } from '../../app/apiClient';
import { TimelineEvent, Chapter } from '../../types';
import { TimelineModal } from './TimelineModal';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { LoadingSpinner } from '../../components/LoadingSpinner';

interface TimelineManagerProps {
  novelId: string;
  chapters: Chapter[];
}

export const TimelineManager: React.FC<TimelineManagerProps> = ({ novelId, chapters }) => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: timelineEvents = [], isLoading } = useQuery<TimelineEvent[]>({
    queryKey: ['timeline', novelId],
    queryFn: async () => (await apiClient.get(`/novels/${novelId}/timeline`)).data,
    enabled: !!novelId,
  });

  const sortedEvents = [...timelineEvents].sort((a, b) => a.event_order - b.event_order);

  const nextOrder =
    sortedEvents.length > 0 ? Math.max(...sortedEvents.map((e) => e.event_order)) + 1 : 1;

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['timeline', novelId] });
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this timeline event?')) return;
    setDeletingId(eventId);
    try {
      await apiClient.delete(`/timeline/${eventId}`);
      handleRefresh();
    } catch (err) {
      alert('Failed to delete event.');
    } finally {
      setDeletingId(null);
    }
  };

  const getChapterLabel = (chapId?: string) => {
    if (!chapId) return null;
    const chap = chapters.find((c) => c.id === chapId);
    return chap ? `Ch. ${chap.chapter_number}: ${chap.title}` : null;
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto p-5 text-vscode-text sm:p-7">
      {/* Header Bar */}
      <div className="mb-8 flex flex-col gap-4 border-b border-white/[0.08] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Clock className="w-5 h-5 text-vscode-accent" />
            Chronological Story Timeline ({sortedEvents.length})
          </h2>
          <p className="text-xs text-vscode-muted mt-0.5">
            Sequence plot events, cause-and-effect beats, and chapter associations
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setSelectedEvent(null);
            setIsModalOpen(true);
          }}
          className="gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add Timeline Event
        </Button>
      </div>

      {isLoading ? (
        <LoadingSpinner size={32} />
      ) : sortedEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-vscode-border rounded-xl p-12 text-center bg-vscode-sidebar/20">
          <Calendar className="w-10 h-10 text-vscode-muted mb-3" />
          <h3 className="text-sm font-bold mb-1">No Timeline Events Defined</h3>
          <p className="text-xs text-vscode-muted mb-4">
            Build your narrative structure by sequencing key events.
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setSelectedEvent(null);
              setIsModalOpen(true);
            }}
          >
            <Plus className="w-4 h-4" /> Add First Event
          </Button>
        </div>
      ) : (
        /* Vertical Chronological Timeline Stream */
        <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-vscode-border max-w-4xl">
          {sortedEvents.map((evt) => {
            const chapLabel = getChapterLabel(evt.chapter_id);
            return (
              <div key={evt.id} className="relative group">
                {/* Timeline Node Icon */}
                <div className="absolute -left-[31px] top-1.5 w-6 h-6 rounded-full bg-vscode-sidebar border-2 border-vscode-accent flex items-center justify-center text-vscode-accent text-xs font-bold shadow-md group-hover:scale-110 group-hover:bg-vscode-accent group-hover:text-white transition-all">
                  {evt.event_order}
                </div>

                {/* Event Card */}
                <div className="glass-card rounded-[18px] p-5 transition-all hover:-translate-y-0.5 hover:border-vscode-accent/30">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono font-bold text-vscode-accent bg-vscode-accent/10 border border-vscode-accent/30 px-2 py-0.5 rounded">
                          Event #{evt.event_order}
                        </span>
                        <h4 className="text-base font-bold text-vscode-text">{evt.title}</h4>
                      </div>
                      {chapLabel && (
                        <div className="flex items-center gap-1 text-[11px] text-vscode-muted mt-1">
                          <FileText className="w-3 h-3 text-vscode-accent" />
                          <span>{chapLabel}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setSelectedEvent(evt);
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 text-vscode-muted hover:text-vscode-text rounded hover:bg-vscode-hover transition-colors"
                        title="Edit Event"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(evt.id)}
                        disabled={deletingId === evt.id}
                        className="p-1.5 text-vscode-muted hover:text-red-400 rounded hover:bg-vscode-hover transition-colors"
                        title="Delete Event"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-vscode-muted leading-relaxed mb-3">
                    {evt.description}
                  </p>

                  {/* Narrative Impact Snippet */}
                  {evt.impact && (
                    <div className="bg-vscode-bg border border-vscode-border/60 rounded-lg p-2.5 text-[11px] text-amber-300/90 font-mono flex items-start gap-2">
                      <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-vscode-text block text-[10px] uppercase mb-0.5">
                          Narrative Impact:
                        </strong>
                        {evt.impact}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <TimelineModal
        novelId={novelId}
        chapters={chapters}
        nextOrder={nextOrder}
        event={selectedEvent}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleRefresh}
      />
    </div>
  );
};
