import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ShieldAlert, Plus, Edit2, Trash2, Search, Filter } from 'lucide-react';
import { apiClient } from '../../app/apiClient';
import { WorldRule } from '../../types';
import { WorldRuleModal } from './WorldRuleModal';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { LoadingSpinner } from '../../components/LoadingSpinner';

interface WorldRulesManagerProps {
  novelId: string;
}

export const WorldRulesManager: React.FC<WorldRulesManagerProps> = ({ novelId }) => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<WorldRule | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: worldRules = [], isLoading } = useQuery<WorldRule[]>({
    queryKey: ['world-rules', novelId],
    queryFn: async () => (await apiClient.get(`/novels/${novelId}/world-rules`)).data,
    enabled: !!novelId,
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['world-rules', novelId] });
  };

  const handleDelete = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this world rule?')) return;
    setDeletingId(ruleId);
    try {
      await apiClient.delete(`/world-rules/${ruleId}`);
      handleRefresh();
    } catch (err) {
      alert('Failed to delete rule.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredRules = worldRules.filter((r) => {
    const matchesSearch =
      r.rule_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || r.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex h-full flex-col overflow-y-auto p-5 text-vscode-text sm:p-7">
      {/* Header Bar */}
      <div className="mb-7 flex flex-col gap-4 border-b border-white/[0.08] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-vscode-accent" />
            Worldbuilding Rules Matrix ({worldRules.length})
          </h2>
          <p className="text-xs text-vscode-muted mt-0.5">
            Laws of physics, magic systems, technology limitations, and faction constraints
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-48">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-vscode-muted" />
            <input
              type="text"
              placeholder="Search rules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-vscode-input border border-vscode-border text-xs rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-vscode-accent"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-vscode-input border border-vscode-border text-xs text-vscode-text rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-vscode-accent"
          >
            <option value="all">All Categories</option>
            <option value="technology">Technology</option>
            <option value="magic">Magic</option>
            <option value="society">Society</option>
            <option value="physics">Physics</option>
            <option value="general">General</option>
          </select>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setSelectedRule(null);
              setIsModalOpen(true);
            }}
            className="gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add World Rule
          </Button>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner size={32} />
      ) : filteredRules.length === 0 ? (
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-vscode-border rounded-xl p-12 text-center bg-vscode-sidebar/20">
          <ShieldAlert className="w-10 h-10 text-vscode-muted mb-3" />
          <h3 className="text-sm font-bold mb-1">No World Rules Found</h3>
          <p className="text-xs text-vscode-muted mb-4">
            {searchQuery ? `No rules match "${searchQuery}"` : 'Set rules to keep AI generations consistent.'}
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setSelectedRule(null);
              setIsModalOpen(true);
            }}
          >
            <Plus className="w-4 h-4" /> Add First World Rule
          </Button>
        </div>
      ) : (
        /* World Rules Matrix Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRules.map((r) => (
            <div
              key={r.id}
              className="glass-card flex flex-col justify-between rounded-[18px] p-5 transition-all hover:-translate-y-0.5 hover:border-vscode-accent/30"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="text-sm font-bold text-vscode-text">{r.rule_name}</h4>
                  <Badge
                    variant={
                      r.category === 'magic'
                        ? 'purple'
                        : r.category === 'technology'
                        ? 'blue'
                        : r.category === 'physics'
                        ? 'yellow'
                        : 'gray'
                    }
                  >
                    {r.category}
                  </Badge>
                </div>

                <div className="bg-vscode-bg border border-vscode-border/50 rounded-lg p-3 text-xs text-vscode-text font-mono leading-relaxed mb-3">
                  {r.description}
                </div>
              </div>

              {/* Action Controls */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-vscode-border/50">
                <button
                  onClick={() => {
                    setSelectedRule(r);
                    setIsModalOpen(true);
                  }}
                  className="p-1.5 text-vscode-muted hover:text-vscode-text rounded hover:bg-vscode-hover transition-colors text-xs flex items-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={() => handleDelete(r.id)}
                  disabled={deletingId === r.id}
                  className="p-1.5 text-vscode-muted hover:text-red-400 rounded hover:bg-vscode-hover transition-colors text-xs flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <WorldRuleModal
        novelId={novelId}
        rule={selectedRule}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleRefresh}
      />
    </div>
  );
};
