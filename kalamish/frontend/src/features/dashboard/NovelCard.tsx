import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Edit2, Trash2, Globe2, Layers3 } from 'lucide-react';
import { Novel } from '../../types';
import { Badge } from '../../components/Badge';

interface NovelCardProps {
  novel: Novel;
  onEdit: (novel: Novel) => void;
  onDelete: (novel: Novel) => void;
}

const atmospheres = [
  'radial-gradient(circle at 76% 10%, rgba(110,231,242,.16), transparent 35%), linear-gradient(145deg, rgba(65,49,151,.45), rgba(12,16,25,.86) 72%)',
  'radial-gradient(circle at 18% 8%, rgba(255,122,144,.12), transparent 34%), linear-gradient(145deg, rgba(81,44,95,.4), rgba(12,16,25,.88) 72%)',
  'radial-gradient(circle at 82% 12%, rgba(169,157,255,.2), transparent 36%), linear-gradient(145deg, rgba(31,64,110,.35), rgba(12,16,25,.88) 72%)',
];

export const NovelCard: React.FC<NovelCardProps> = ({ novel, onEdit, onDelete }) => {
  const navigate = useNavigate();
  const atmosphere = atmospheres[novel.title.length % atmospheres.length];

  return (
    <article
      className="group relative flex min-h-[310px] cursor-pointer flex-col justify-between overflow-hidden rounded-[22px] border border-white/[.09] p-6 shadow-[0_24px_70px_rgba(0,0,0,.25)] transition duration-200 hover:-translate-y-0.5 hover:border-[#a99dff]/35 hover:shadow-[0_30px_90px_rgba(0,0,0,.38),0_0_55px_rgba(139,124,255,.07)]"
      style={{ background: atmosphere }}
      onClick={() => navigate(`/workspace/${novel.id}`)}
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,.025),transparent_35%,rgba(5,7,12,.3))]" />
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <p className="text-[9px] font-bold uppercase tracking-[.18em] text-[#a99dff]">
            {novel.genre || 'Unclassified story'}
          </p>
          <Badge variant={novel.status === 'completed' ? 'green' : 'purple'}>{novel.status}</Badge>
        </div>
        <h3 className="mt-7 max-w-[90%] text-3xl font-semibold leading-[1.02] tracking-[-.045em] text-white">
          {novel.title}
        </h3>
        <p className="mt-4 line-clamp-2 text-xs leading-6 text-[#929aac]">
          {novel.tone ? `${novel.tone} · ` : ''}{novel.style || 'An evolving narrative world ready for its next chapter.'}
        </p>
      </div>

      <div className="relative">
        <div className="mb-5 grid grid-cols-2 gap-3 border-t border-white/[.08] pt-5 text-[10px] text-[#7d8597]">
          <span className="flex items-center gap-2"><Globe2 className="h-3.5 w-3.5 text-[#8eeaf2]" />{novel.language}</span>
          <span className="flex items-center gap-2"><Layers3 className="h-3.5 w-3.5 text-[#a99dff]" />{novel.estimated_chapters} chapters</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-white">
            Open writing room <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
          <div className="flex gap-1">
            <button
              onClick={(event) => { event.stopPropagation(); onEdit(novel); }}
              className="grid h-9 w-9 place-items-center rounded-xl text-[#80889a] transition hover:bg-white/[.07] hover:text-white"
              aria-label={`Edit ${novel.title}`}
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={(event) => { event.stopPropagation(); onDelete(novel); }}
              className="grid h-9 w-9 place-items-center rounded-xl text-[#80889a] transition hover:bg-[#ff7a90]/10 hover:text-[#ff9cad]"
              aria-label={`Delete ${novel.title}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
