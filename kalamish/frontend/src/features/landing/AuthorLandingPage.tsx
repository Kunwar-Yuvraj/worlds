import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpenText,
  BrainCircuit,
  GitBranch,
  Network,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { Button } from '../../components/Button';
import { Brand } from '../../components/Brand';

const agents = [
  ['Draft', 'Turns intent into scene-ready prose', Sparkles],
  ['Canon', 'Protects facts across every chapter', ShieldCheck],
  ['Character', 'Tracks identity, motive, and change', Users],
  ['World', 'Maintains locations, rules, and lore', Network],
  ['Timeline', 'Resolves sequence and causality', GitBranch],
  ['Revision', 'Rewrites the manuscript as one system', BrainCircuit],
];

export const AuthorLandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <main className="author-landing min-h-screen overflow-hidden">
      <nav className="relative z-20 mx-auto flex min-h-[78px] w-[min(1240px,calc(100%-32px))] items-center justify-between">
        <Brand subtitle="Kalamish · Authoring studio" />
        <div className="flex items-center gap-4">
          <span className="hidden text-[10px] font-bold uppercase tracking-[.16em] text-vscode-muted sm:inline">
            Creator superpower
          </span>
          <Button size="sm" variant="secondary" onClick={() => navigate('/dashboard')}>
            Open studio <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </nav>

      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-78px)] w-[min(1240px,calc(100%-32px))] items-center gap-16 pb-20 pt-12 lg:grid-cols-[.95fr_1.05fr] lg:py-16">
        <div className="animate-rise">
          <div className="inline-flex items-center gap-2 rounded-full border border-vscode-accent/20 bg-vscode-accent/[.07] px-3 py-2 text-[10px] font-bold uppercase tracking-[.17em] text-[#b4abff]">
            <span className="live-dot" /> Six agents. One manuscript.
          </div>
          <p className="mt-8 text-[10px] font-extrabold uppercase tracking-[.22em] text-[#687084]">
            Kalamish / AI novel system
          </p>
          <h1 className="mt-4 text-[clamp(4.3rem,8.4vw,8.4rem)] font-semibold leading-[.84] tracking-[-.078em]">
            The IDE
            <span className="block text-[#a99dff]">for fiction.</span>
          </h1>
          <p className="mt-8 max-w-[610px] text-base leading-8 text-[#929aac] sm:text-lg">
            Write from scratch with an intelligent room of specialists. Draft a chapter, revise
            the arc, and Kalamish updates characters, timeline, world rules, and story memory
            together—without breaking canon.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button onClick={() => navigate('/dashboard')} className="px-6">
              Enter the writing room <ArrowRight className="h-4 w-4" />
            </Button>
            <a href="#agents" className="btn min-h-11 border border-white/10 bg-white/[.035] px-5 text-[#d9deea]">
              Meet the six agents
            </a>
          </div>
          <div className="mt-11 grid max-w-xl grid-cols-3 gap-5 border-t border-white/[.08] pt-6">
            {[['6', 'Specialist agents'], ['1', 'Living canon'], ['∞', 'Chapters']].map(([value, label]) => (
              <div key={label}>
                <p className="text-xl font-semibold tracking-[-.03em]">{value}</p>
                <p className="mt-1 text-[9px] uppercase tracking-[.15em] text-[#60687b]">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="author-ide-wrap animate-rise">
          <div className="author-ide">
            <div className="author-ide-top">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#ff7a90]/70" />
                <span className="h-2 w-2 rounded-full bg-[#a99dff]/70" />
                <span className="h-2 w-2 rounded-full bg-[#6ee7f2]/70" />
              </div>
              <span>KALAMISH / THE GLASS PAVILION</span>
              <span className="text-[#6ee7f2]">● CANON SYNCED</span>
            </div>
            <div className="author-ide-body">
              <aside>
                <p>MANUSCRIPT</p>
                {['01  The Invitation', '02  Mud on the Sleeve', '03  The Silent Record'].map((chapter, index) => (
                  <div className={index === 1 ? 'active' : ''} key={chapter}>
                    <BookOpenText /> {chapter}
                  </div>
                ))}
                <p className="mt-7">STORY SYSTEM</p>
                {['Characters', 'Timeline', 'World rules'].map((item) => <div key={item}>{item}</div>)}
              </aside>
              <article>
                <span>CHAPTER 02</span>
                <h2>Mud on the Sleeve</h2>
                <p>
                  Rain worries the glass roof. Beyond the locked door, the gramophone turns in
                  silence—and someone in the ballroom has just noticed the mud on your sleeve.
                </p>
                <p>The lie arrives before the explanation does.</p>
                <i />
              </article>
              <section>
                <div className="flex items-center gap-2 text-[#b7afff]"><Sparkles /> MUSE</div>
                <small>Revision agent</small>
                <p>Raise the suspicion without revealing who moved the key.</p>
                <div className="author-change">
                  <span>3 systems affected</span>
                  <strong>Timeline · Eleanor · Pavilion</strong>
                </div>
                <button type="button">Execute revision <ArrowRight /></button>
              </section>
            </div>
          </div>
        </div>
      </section>

      <section id="agents" className="relative z-10 border-t border-white/[.07] bg-[#080b12]/80 py-20">
        <div className="mx-auto w-[min(1240px,calc(100%-32px))]">
          <p className="eyebrow">An author’s room, running in parallel</p>
          <div className="mt-5 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <h2 className="max-w-2xl text-3xl font-semibold tracking-[-.05em] sm:text-5xl">
              Every agent knows its job.<br />Every agent knows your story.
            </h2>
            <p className="max-w-sm text-sm leading-7 text-vscode-muted">
              They share one structured memory, so a prose change can become a truthful change
              everywhere it matters.
            </p>
          </div>
          <div className="mt-10 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {agents.map(([name, copy, Icon], index) => (
              <article key={name as string} className="glass-card group rounded-[20px] p-5 transition hover:-translate-y-0.5 hover:border-vscode-accent/25">
                <div className="flex items-center justify-between">
                  <span className="grid h-10 w-10 place-items-center rounded-xl border border-vscode-accent/20 bg-vscode-accent/10 text-vscode-accent">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-[9px] font-bold tracking-[.18em] text-[#4f5769]">0{index + 1}</span>
                </div>
                <h3 className="mt-6 text-base font-semibold">{name as string} agent</h3>
                <p className="mt-2 text-xs leading-6 text-vscode-muted">{copy as string}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};

export default AuthorLandingPage;
