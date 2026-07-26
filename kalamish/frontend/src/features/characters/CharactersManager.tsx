import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Users, Plus, Edit2, Trash2, User, Search } from 'lucide-react';
import { apiClient } from '../../app/apiClient';
import { Character } from '../../types';
import { CharacterModal } from './CharacterModal';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { LoadingSpinner } from '../../components/LoadingSpinner';

interface CharactersManagerProps {
  novelId: string;
}

export const CharactersManager: React.FC<CharactersManagerProps> = ({ novelId }) => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: characters = [], isLoading } = useQuery<Character[]>({
    queryKey: ['characters', novelId],
    queryFn: async () => (await apiClient.get(`/novels/${novelId}/characters`)).data,
    enabled: !!novelId,
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['characters', novelId] });
  };

  const handleDelete = async (characterId: string) => {
    if (!confirm('Are you sure you want to delete this character?')) return;
    setDeletingId(characterId);
    try {
      await apiClient.delete(`/characters/${characterId}`);
      handleRefresh();
    } catch (err) {
      alert('Failed to delete character.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredCharacters = characters.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full flex-col overflow-y-auto p-5 text-vscode-text sm:p-7">
      {/* Header Bar */}
      <div className="mb-7 flex flex-col gap-4 border-b border-white/[0.08] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-vscode-accent" />
            Character Cast ({characters.length})
          </h2>
          <p className="text-xs text-vscode-muted mt-0.5">
            Manage your novel's protagonists, antagonists, and supporting cast
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-48">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-vscode-muted" />
            <input
              type="text"
              placeholder="Search cast..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-vscode-input border border-vscode-border text-xs rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-vscode-accent"
            />
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setSelectedCharacter(null);
              setIsModalOpen(true);
            }}
            className="gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Character
          </Button>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner size={32} />
      ) : filteredCharacters.length === 0 ? (
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-vscode-border rounded-xl p-12 text-center bg-vscode-sidebar/20">
          <User className="w-10 h-10 text-vscode-muted mb-3" />
          <h3 className="text-sm font-bold mb-1">No Characters Found</h3>
          <p className="text-xs text-vscode-muted mb-4">
            {searchQuery ? `No characters match "${searchQuery}"` : 'Start building your cast by adding characters.'}
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setSelectedCharacter(null);
              setIsModalOpen(true);
            }}
          >
            <Plus className="w-4 h-4" /> Add First Character
          </Button>
        </div>
      ) : (
        /* Characters Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCharacters.map((c) => (
            <div
              key={c.id}
              className="glass-card flex flex-col justify-between rounded-[18px] p-5 transition-all hover:-translate-y-0.5 hover:border-vscode-accent/30"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-vscode-accent/20 border border-vscode-accent/40 flex items-center justify-center text-vscode-accent font-bold text-sm">
                      {c.name[0].toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-vscode-text">{c.name}</h4>
                      <Badge
                        variant={
                          c.role === 'protagonist'
                            ? 'green'
                            : c.role === 'antagonist'
                            ? 'yellow'
                            : 'blue'
                        }
                      >
                        {c.role}
                      </Badge>
                    </div>
                  </div>
                </div>

                {c.description && (
                  <p className="text-xs text-vscode-muted mb-3 line-clamp-2 leading-relaxed">
                    {c.description}
                  </p>
                )}

                {c.backstory && (
                  <div className="bg-vscode-bg border border-vscode-border/50 rounded-lg p-2.5 text-[11px] text-vscode-muted mb-3 line-clamp-3 font-mono">
                    <strong className="text-vscode-text block text-[10px] uppercase mb-0.5">
                      Backstory Snippet:
                    </strong>
                    {c.backstory}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-vscode-border/50">
                <button
                  onClick={() => {
                    setSelectedCharacter(c);
                    setIsModalOpen(true);
                  }}
                  className="p-1.5 text-vscode-muted hover:text-vscode-text rounded hover:bg-vscode-hover transition-colors text-xs flex items-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  disabled={deletingId === c.id}
                  className="p-1.5 text-vscode-muted hover:text-red-400 rounded hover:bg-vscode-hover transition-colors text-xs flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <CharacterModal
        novelId={novelId}
        character={selectedCharacter}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleRefresh}
      />
    </div>
  );
};
