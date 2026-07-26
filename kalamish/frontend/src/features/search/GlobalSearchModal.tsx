import React, { useState, useEffect } from 'react';
import { Search, Sparkles, X, ArrowRight, BookOpen, Users, MapPin, ShieldAlert } from 'lucide-react';
import { apiClient } from '../../app/apiClient';
import { SearchResult } from '../../types';
import { useUIStore, SidebarTab } from '../../store/useUIStore';
import { Badge } from '../../components/Badge';

interface GlobalSearchModalProps {
  novelId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  novelId,
  isOpen,
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { setActiveSidebarTab } = useUIStore();

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setError(null);
    }
  }, [isOpen]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novelId || !query.trim()) return;

    setIsSearching(true);
    setError(null);
    try {
      const res = await apiClient.post('/search', {
        novel_id: novelId,
        query: query.trim(),
        limit: 8,
      });
      setResults(res.data.results || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Vector search failed.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleNavigateToEntity = (type: string) => {
    const tabMapping: Record<string, SidebarTab> = {
      chapter: 'chapters',
      character: 'characters',
      location: 'locations',
      'world-rule': 'world-rules',
    };
    const targetTab = tabMapping[type.toLowerCase()] || 'chapters';
    setActiveSidebarTab(targetTab);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/60 backdrop-blur-sm p-4 animate-fade-in select-none">
      <div className="bg-vscode-sidebar border border-vscode-border rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar Header */}
        <form onSubmit={handleSearch} className="flex items-center px-4 border-b border-vscode-border bg-vscode-sidebar">
          <Search className="w-4 h-4 text-vscode-accent shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search story vector embeddings (e.g. gravity thrusters, Captain Leo)..."
            className="w-full bg-transparent text-vscode-text text-sm py-3.5 px-3 focus:outline-none placeholder:text-vscode-muted"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 text-vscode-muted hover:text-vscode-text rounded mr-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="text-[10px] font-mono text-vscode-muted bg-vscode-bg border border-vscode-border px-1.5 py-0.5 rounded">
            ESC
          </span>
        </form>

        {/* Results Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {isSearching && (
            <div className="flex items-center justify-center py-8 text-xs text-vscode-muted gap-2">
              <Sparkles className="w-4 h-4 animate-spin text-vscode-accent" />
              <span>Querying pgvector similarity embeddings...</span>
            </div>
          )}

          {error && (
            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-center">
              {error}
            </div>
          )}

          {!isSearching && !error && results.length === 0 && query && (
            <div className="text-center py-8 text-xs text-vscode-muted">
              No vector similarity matches found for "{query}".
            </div>
          )}

          {!isSearching && !query && (
            <div className="text-center py-8 text-xs text-vscode-muted">
              Type a prompt to search across all chapters, characters, locations, and world rules.
            </div>
          )}

          {!isSearching &&
            results.map((item, idx) => (
              <div
                key={idx}
                onClick={() => handleNavigateToEntity(item.entity_type)}
                className="group flex items-start justify-between p-3 bg-vscode-bg/60 border border-vscode-border rounded-lg hover:border-vscode-accent/60 cursor-pointer transition-all"
              >
                <div className="space-y-1 pr-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="purple">{item.entity_type}</Badge>
                    <span className="text-[10px] font-mono text-emerald-400">
                      {Math.round((item.similarity || 0.85) * 100)}% match
                    </span>
                  </div>
                  <p className="text-xs text-vscode-text font-mono line-clamp-2 leading-relaxed">
                    {item.content_snippet}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-vscode-muted group-hover:text-vscode-accent group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
