import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, BookOpen, Search, Sparkles, ArrowRight } from 'lucide-react';
import { apiClient } from '../../app/apiClient';
import { Novel } from '../../types';
import { NovelCard } from './NovelCard';
import { CreateNovelModal } from './CreateNovelModal';
import { EditNovelModal } from './EditNovelModal';
import { DeleteNovelModal } from './DeleteNovelModal';
import { Button } from '../../components/Button';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Brand } from '../../components/Brand';

export const DashboardPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingNovel, setEditingNovel] = useState<Novel | null>(null);
  const [deletingNovel, setDeletingNovel] = useState<Novel | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: novels = [], isLoading, isError } = useQuery<Novel[]>({
    queryKey: ['novels'],
    queryFn: async () => (await apiClient.get('/novels')).data,
  });

  const handleRefresh = () => queryClient.invalidateQueries({ queryKey: ['novels'] });
  const filteredNovels = novels.filter((novel) =>
    novel.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    novel.genre?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen overflow-y-auto">
      <header className="sticky top-0 z-30 border-b border-white/[.07] bg-[#07090f]/80 backdrop-blur-2xl">
        <div className="mx-auto flex min-h-[72px] w-[min(1240px,calc(100%-32px))] items-center justify-between gap-4">
          <Brand subtitle="Story library" />
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative hidden w-64 md:block">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-vscode-muted" />
              <input
                type="text"
                placeholder="Search your worlds"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="min-h-10 w-full rounded-xl border border-white/[.09] bg-white/[.035] pl-10 pr-3 text-xs text-vscode-text outline-none placeholder:text-[#535b6d] hover:border-white/15 focus:border-vscode-accent"
              />
            </div>
            <Button variant="primary" size="sm" onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4" /><span className="hidden sm:inline">New novel</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-[min(1240px,calc(100%-32px))] pb-20 pt-12">
        <section className="relative overflow-hidden rounded-[28px] border border-[#8b7cff]/15 bg-[#0a0e17]/80 px-6 py-10 shadow-spectral sm:px-10 lg:px-12">
          <div className="pointer-events-none absolute -right-20 -top-44 h-96 w-96 rounded-full border border-[#8b7cff]/15 shadow-[0_0_120px_rgba(139,124,255,.08)]" />
          <div className="pointer-events-none absolute right-10 top-0 h-52 w-96 bg-[radial-gradient(ellipse_at_top,rgba(110,231,242,.09),transparent_70%)]" />
          <div className="relative grid items-end gap-8 lg:grid-cols-[1fr_auto]">
            <div>
              <p className="eyebrow">Your story worlds</p>
              <h1 className="mt-4 text-4xl font-semibold leading-[.98] tracking-[-.055em] sm:text-5xl">
                Every manuscript,<br /><span className="brand-gradient">still alive.</span>
              </h1>
              <p className="mt-5 max-w-xl text-sm leading-7 text-[#8e96a8]">
                Draft chapters, shape the canon, and keep every character and timeline synchronized as the story evolves.
              </p>
            </div>
            <div className="flex items-center gap-7 border-t border-white/[.08] pt-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
              <div>
                <p className="text-3xl font-semibold tracking-[-.04em]">{novels.length}</p>
                <p className="mt-1 text-[9px] uppercase tracking-[.16em] text-vscode-muted">Worlds</p>
              </div>
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold text-[#8eeaf2]"><span className="live-dot" /> Synced</p>
                <p className="mt-1 text-[9px] uppercase tracking-[.16em] text-vscode-muted">Story memory</p>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow text-[#687084]">Manuscript library</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-.035em]">Continue a story</h2>
          </div>
          <div className="relative md:hidden">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-vscode-muted" />
            <input
              type="text"
              placeholder="Search your worlds"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="min-h-11 w-full rounded-xl border border-white/[.09] bg-white/[.035] pl-10 pr-3 text-xs outline-none focus:border-vscode-accent"
            />
          </div>
        </div>

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24">
            <LoadingSpinner size={32} />
            <span className="mt-4 text-xs text-vscode-muted">Opening your story library…</span>
          </div>
        )}

        {isError && (
          <div className="mt-8 rounded-2xl border border-[#ff7a90]/25 bg-[#ff7a90]/10 p-5 text-sm text-[#ff9cad]">
            The story library could not be reached. Check the backend connection and try again.
          </div>
        )}

        {!isLoading && !isError && filteredNovels.length === 0 && (
          <section className="mt-8 flex min-h-80 flex-col items-center justify-center rounded-[24px] border border-dashed border-white/[.12] bg-[#0c1019]/55 p-10 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl border border-[#8b7cff]/20 bg-[#8b7cff]/10 text-[#a99dff]">
              <BookOpen className="h-6 w-6" />
            </div>
            <h3 className="mt-5 text-xl font-semibold tracking-[-.03em]">
              {searchQuery ? 'No matching worlds' : 'The first page is waiting.'}
            </h3>
            <p className="mt-2 max-w-sm text-sm leading-6 text-vscode-muted">
              {searchQuery ? `Nothing matches “${searchQuery}”.` : 'Create a novel and give the studio its first characters, rules, and chapter.'}
            </p>
            {!searchQuery && (
              <Button variant="primary" onClick={() => setIsCreateOpen(true)} className="mt-6">
                Begin a new novel <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </section>
        )}

        {!isLoading && !isError && filteredNovels.length > 0 && (
          <div className="mt-7 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredNovels.map((novel) => (
              <NovelCard key={novel.id} novel={novel} onEdit={setEditingNovel} onDelete={setDeletingNovel} />
            ))}
          </div>
        )}

        <div className="mt-10 flex items-center gap-3 border-t border-white/[.07] pt-6 text-[10px] uppercase tracking-[.14em] text-[#596174]">
          <Sparkles className="h-3.5 w-3.5 text-[#8b7cff]" /> Every edit can update the story canon
        </div>
      </main>

      <CreateNovelModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onSuccess={handleRefresh} />
      <EditNovelModal novel={editingNovel} isOpen={!!editingNovel} onClose={() => setEditingNovel(null)} onSuccess={handleRefresh} />
      <DeleteNovelModal novel={deletingNovel} isOpen={!!deletingNovel} onClose={() => setDeletingNovel(null)} onSuccess={handleRefresh} />
    </div>
  );
};

export default DashboardPage;
