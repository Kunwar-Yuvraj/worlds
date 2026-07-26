import React, { useState } from 'react';
import { Search, Sparkles } from 'lucide-react';
import { apiClient } from '../../app/apiClient';
import { SearchResult } from '../../types';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';

interface AISearchTabProps {
  novelId: string;
}

export const AISearchTab: React.FC<AISearchTabProps> = ({ novelId }) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setError(null);
    try {
      const res = await apiClient.post('/search', {
        novel_id: novelId,
        query: query,
        limit: 5,
      });
      setResults(res.data.results || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Semantic vector search failed.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 text-xs select-none">
      <form onSubmit={handleSearch} className="flex flex-col gap-2.5">
        <label className="font-semibold text-vscode-text flex items-center gap-1.5">
          <Search className="w-3.5 h-3.5 text-vscode-accent" />
          Semantic Vector Search Query
        </label>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. gravity thrusters asteroid navigation"
            className="w-full bg-vscode-input border border-vscode-border text-vscode-text rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:border-vscode-accent transition-colors"
          />
        </div>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          isLoading={isSearching}
          disabled={!query.trim()}
          className="w-full gap-2 shadow"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Search Story Embeddings
        </Button>
      </form>

      {error && (
        <div className="text-red-400 bg-red-500/10 border border-red-500/20 p-2.5 rounded-lg">
          {error}
        </div>
      )}

      {results && (
        <div className="space-y-2.5 pt-2 border-t border-vscode-border animate-fade-in">
          <span className="font-semibold text-vscode-muted block">
            Results ({results.length})
          </span>
          {results.length === 0 ? (
            <p className="text-vscode-muted text-center py-4 bg-vscode-bg/40 border border-dashed border-vscode-border rounded-lg p-3">
              No matching vector embeddings found.
            </p>
          ) : (
            results.map((res, i) => (
              <div
                key={i}
                className="bg-vscode-bg border border-vscode-border rounded-lg p-2.5 space-y-1 hover:border-vscode-accent/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <Badge variant="purple">{res.entity_type || 'embedding'}</Badge>
                  <span className="text-[10px] font-mono text-emerald-400">
                    {Math.round((res.similarity || 0.85) * 100)}% match
                  </span>
                </div>
                <p className="text-vscode-text font-mono text-[11px] leading-relaxed line-clamp-3">
                  {res.content_snippet}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
