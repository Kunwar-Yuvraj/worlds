import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  MapPin,
  Clock,
  LayoutList,
  ShieldAlert,
  Search as SearchIcon,
  Plus,
} from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { ChaptersExplorer } from '../chapters/ChaptersExplorer';
import { apiClient } from '../../app/apiClient';
import { Chapter, Character, Location, TimelineEvent, Outline, WorldRule } from '../../types';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Badge } from '../../components/Badge';

interface SidebarExplorerProps {
  novelId: string;
}

export const SidebarExplorer: React.FC<SidebarExplorerProps> = ({ novelId }) => {
  const { activeSidebarTab, setActiveAITab } = useUIStore();
  const queryClient = useQueryClient();

  // Queries for all entity previews
  const { data: chapters = [], isLoading: isChapLoading } = useQuery<Chapter[]>({
    queryKey: ['chapters', novelId],
    queryFn: async () => (await apiClient.get(`/novels/${novelId}/chapters`)).data,
    enabled: !!novelId && activeSidebarTab === 'chapters',
  });

  const { data: characters = [], isLoading: isCharLoading } = useQuery<Character[]>({
    queryKey: ['characters', novelId],
    queryFn: async () => (await apiClient.get(`/novels/${novelId}/characters`)).data,
    enabled: !!novelId && activeSidebarTab === 'characters',
  });

  const { data: locations = [], isLoading: isLocLoading } = useQuery<Location[]>({
    queryKey: ['locations', novelId],
    queryFn: async () => (await apiClient.get(`/novels/${novelId}/locations`)).data,
    enabled: !!novelId && activeSidebarTab === 'locations',
  });

  const { data: timeline = [], isLoading: isTimeLoading } = useQuery<TimelineEvent[]>({
    queryKey: ['timeline', novelId],
    queryFn: async () => (await apiClient.get(`/novels/${novelId}/timeline`)).data,
    enabled: !!novelId && activeSidebarTab === 'timeline',
  });

  const { data: outlines = [], isLoading: isOutLoading } = useQuery<Outline[]>({
    queryKey: ['outlines', novelId],
    queryFn: async () => (await apiClient.get(`/novels/${novelId}/outlines`)).data,
    enabled: !!novelId && activeSidebarTab === 'outline',
  });

  const { data: worldRules = [], isLoading: isRuleLoading } = useQuery<WorldRule[]>({
    queryKey: ['world-rules', novelId],
    queryFn: async () => (await apiClient.get(`/novels/${novelId}/world-rules`)).data,
    enabled: !!novelId && activeSidebarTab === 'world-rules',
  });

  const refreshTab = (tab: string) => {
    queryClient.invalidateQueries({ queryKey: [tab, novelId] });
  };

  // 1. Chapters Tab View
  if (activeSidebarTab === 'chapters') {
    if (isChapLoading) return <LoadingSpinner size={20} />;
    return (
      <ChaptersExplorer
        novelId={novelId}
        chapters={chapters}
        onRefresh={() => refreshTab('chapters')}
      />
    );
  }

  // 2. Characters Tab View
  if (activeSidebarTab === 'characters') {
    if (isCharLoading) return <LoadingSpinner size={20} />;
    return (
      <div className="space-y-2 select-none">
        <div className="flex items-center justify-between px-1 mb-2">
          <span className="text-xs font-semibold text-vscode-muted uppercase tracking-wider flex items-center gap-1">
            <Users className="w-3.5 h-3.5" /> Characters ({characters.length})
          </span>
        </div>
        {characters.length === 0 ? (
          <p className="text-xs text-vscode-muted text-center py-4 bg-vscode-bg/40 border border-dashed border-vscode-border rounded-lg p-3">
            No characters defined yet.
          </p>
        ) : (
          characters.map((c) => (
            <div key={c.id} className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-3 text-xs transition-all hover:border-vscode-accent/30 hover:bg-vscode-accent/[0.04]">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-vscode-text">{c.name}</span>
                <Badge variant={c.role === 'protagonist' ? 'green' : 'blue'}>{c.role}</Badge>
              </div>
              {c.description && <p className="text-vscode-muted line-clamp-2">{c.description}</p>}
            </div>
          ))
        )}
      </div>
    );
  }

  // 3. Locations Tab View
  if (activeSidebarTab === 'locations') {
    if (isLocLoading) return <LoadingSpinner size={20} />;
    return (
      <div className="space-y-2 select-none">
        <div className="flex items-center justify-between px-1 mb-2">
          <span className="text-xs font-semibold text-vscode-muted uppercase tracking-wider flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" /> Locations ({locations.length})
          </span>
        </div>
        {locations.length === 0 ? (
          <p className="text-xs text-vscode-muted text-center py-4 bg-vscode-bg/40 border border-dashed border-vscode-border rounded-lg p-3">
            No locations defined yet.
          </p>
        ) : (
          locations.map((loc) => (
            <div key={loc.id} className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-3 text-xs transition-all hover:border-vscode-accent/30 hover:bg-vscode-accent/[0.04]">
              <span className="font-bold text-vscode-text block mb-1">{loc.name}</span>
              {loc.description && <p className="text-vscode-muted line-clamp-2">{loc.description}</p>}
            </div>
          ))
        )}
      </div>
    );
  }

  // 4. Timeline Tab View
  if (activeSidebarTab === 'timeline') {
    if (isTimeLoading) return <LoadingSpinner size={20} />;
    return (
      <div className="space-y-2 select-none">
        <div className="flex items-center justify-between px-1 mb-2">
          <span className="text-xs font-semibold text-vscode-muted uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Timeline ({timeline.length})
          </span>
        </div>
        {timeline.length === 0 ? (
          <p className="text-xs text-vscode-muted text-center py-4 bg-vscode-bg/40 border border-dashed border-vscode-border rounded-lg p-3">
            No timeline events added.
          </p>
        ) : (
          timeline.map((t) => (
            <div key={t.id} className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-3 text-xs transition-all hover:border-vscode-accent/30 hover:bg-vscode-accent/[0.04]">
              <span className="font-bold text-vscode-text block mb-0.5">
                #{t.event_order}: {t.title}
              </span>
              <p className="text-vscode-muted line-clamp-2">{t.description}</p>
            </div>
          ))
        )}
      </div>
    );
  }

  // 5. Outline Tab View
  if (activeSidebarTab === 'outline') {
    if (isOutLoading) return <LoadingSpinner size={20} />;
    return (
      <div className="space-y-2 select-none">
        <div className="flex items-center justify-between px-1 mb-2">
          <span className="text-xs font-semibold text-vscode-muted uppercase tracking-wider flex items-center gap-1">
            <LayoutList className="w-3.5 h-3.5" /> Outlines ({outlines.length})
          </span>
        </div>
        {outlines.length === 0 ? (
          <p className="text-xs text-vscode-muted text-center py-4 bg-vscode-bg/40 border border-dashed border-vscode-border rounded-lg p-3">
            No outlines generated.
          </p>
        ) : (
          outlines.map((o) => (
            <div key={o.id} className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-3 text-xs transition-all hover:border-vscode-accent/30 hover:bg-vscode-accent/[0.04]">
              <span className="font-bold text-vscode-text block mb-1">
                Ch. {o.chapter_number}: {o.title}
              </span>
              <p className="text-vscode-muted line-clamp-2">{o.synopsis}</p>
            </div>
          ))
        )}
      </div>
    );
  }

  // 6. World Rules Tab View
  if (activeSidebarTab === 'world-rules') {
    if (isRuleLoading) return <LoadingSpinner size={20} />;
    return (
      <div className="space-y-2 select-none">
        <div className="flex items-center justify-between px-1 mb-2">
          <span className="text-xs font-semibold text-vscode-muted uppercase tracking-wider flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" /> World Rules ({worldRules.length})
          </span>
        </div>
        {worldRules.length === 0 ? (
          <p className="text-xs text-vscode-muted text-center py-4 bg-vscode-bg/40 border border-dashed border-vscode-border rounded-lg p-3">
            No world rules defined.
          </p>
        ) : (
          worldRules.map((r) => (
            <div key={r.id} className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-3 text-xs transition-all hover:border-vscode-accent/30 hover:bg-vscode-accent/[0.04]">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-vscode-text">{r.rule_name}</span>
                <Badge variant="purple">{r.category}</Badge>
              </div>
              <p className="text-vscode-muted line-clamp-2">{r.description}</p>
            </div>
          ))
        )}
      </div>
    );
  }

  // 7. Search Tab View
  return (
    <div className="text-xs text-vscode-muted text-center py-6 space-y-3">
      <SearchIcon className="w-8 h-8 mx-auto text-vscode-accent" />
      <p>Semantic vector search is available in the AI Side Panel.</p>
      <button
        onClick={() => setActiveAITab('search')}
        className="px-3 py-1.5 bg-vscode-accent text-white rounded font-medium shadow hover:bg-vscode-accentHover transition-colors"
      >
        Open AI Vector Search
      </button>
    </div>
  );
};
