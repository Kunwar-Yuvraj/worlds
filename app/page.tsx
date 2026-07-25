import Link from 'next/link';
import { ArrowIcon, Brand, SparkIcon } from '@/components/Brand';

export default function Home() {
  return <main className="app-shell">
    <nav className="page-wrap flex items-center justify-between py-6">
      <Brand />
      <div className="flex items-center gap-2 sm:gap-5">
        <Link href="/join" className="text-link hidden text-xs sm:inline">Browse stories</Link>
        <Link href="/create" className="btn btn-quiet">Build a world <ArrowIcon /></Link>
      </div>
    </nav>

    <section className="page-wrap grid min-h-[calc(100vh-82px)] items-center gap-14 pb-16 pt-12 lg:grid-cols-[1.04fr_.96fr] lg:py-20">
      <div className="animate-rise max-w-[690px]">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#8b7cff]/20 bg-[#8b7cff]/[.07] px-3 py-2 text-[10px] font-bold uppercase tracking-[.16em] text-[#b1a7ff]">
          <SparkIcon /> AI-native interactive fiction
        </div>
        <h1 className="mt-7 text-[clamp(3.9rem,7.8vw,7.4rem)] font-[680] leading-[.88] tracking-[-.075em] text-[#f7f8fc]">
          Your next story<br /><span className="bg-gradient-to-r from-[#a99dff] via-[#c9c4ff] to-[#82e5ef] bg-clip-text text-transparent">is already alive.</span>
        </h1>
        <p className="mt-8 max-w-[590px] text-base leading-7 text-[#929aac] sm:text-lg sm:leading-8">
          Enter persistent worlds where every player shapes the same canon. Choose an action—or invent one—and watch the story adapt around you.
        </p>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Link href="/join" className="btn btn-primary px-6">Explore live worlds <ArrowIcon direction="right" /></Link>
          <Link href="/create" className="btn btn-quiet px-6"><SparkIcon /> Create with AI</Link>
        </div>
        <div className="mt-11 grid max-w-xl grid-cols-3 gap-5 border-t border-white/[.08] pt-6">
          {[['∞', 'Open choices'], ['1', 'Shared canon'], ['24/7', 'Always evolving']].map(([value, label]) => <div key={label}>
            <p className="text-lg font-semibold tracking-[-.03em] text-[#e7e9f1]">{value}</p>
            <p className="mt-1 text-[10px] uppercase tracking-[.14em] text-[#60687b]">{label}</p>
          </div>)}
        </div>
      </div>

      <div className="animate-rise delay-1 relative mx-auto w-full max-w-[530px] lg:mr-0">
        <div className="animate-pulse-soft absolute inset-[8%] rounded-full bg-[#7d6cf4]/15 blur-[90px]" />
        <div className="glass-card relative rounded-[28px] p-2.5">
          <div className="relative min-h-[600px] overflow-hidden rounded-[21px] border border-white/[.07] bg-[#0b0f18]">
            <div className="absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_top,rgba(116,98,239,.3),transparent_68%)]" />
            <div className="relative flex items-center justify-between border-b border-white/[.07] px-6 py-5">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-[#7f8798]"><span className="live-dot" /> World live</div>
              <p className="text-[10px] tracking-[.12em] text-[#5e6577]">CHAPTER 12</p>
            </div>
            <div className="relative px-7 pb-7 pt-20 sm:px-10">
              <div className="mb-8 flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl border border-[#8b7cff]/25 bg-[#8b7cff]/10 text-[#a99dff]"><SparkIcon /></span>
                <div><p className="text-[9px] font-bold uppercase tracking-[.18em] text-[#636b7d]">Mystery · Harrow House</p><p className="mt-1 text-xs text-[#aeb4c2]">The Locked Pavilion</p></div>
              </div>
              <p className="serif text-[1.42rem] leading-[1.7] text-[#dfe2ea]">
                Rain worries the glass roof. Beyond the locked door, the gramophone turns in silence—and someone in the ballroom has just noticed the mud on your sleeve.
              </p>
              <div className="my-8 flex items-center gap-3"><span className="h-px flex-1 bg-white/[.07]" /><span className="text-[9px] uppercase tracking-[.18em] text-[#4f5667]">What do you do?</span><span className="h-px flex-1 bg-white/[.07]" /></div>
              <div className="space-y-2">
                {['Confront the host about the missing key', 'Follow the footprints into the winter garden', 'Say nothing—and watch who leaves'].map((choice, index) => <div key={choice} className="flex items-center gap-3 rounded-xl border border-white/[.075] bg-white/[.025] px-4 py-3.5 text-xs text-[#aeb4c2]">
                  <span className="text-[10px] text-[#7568df]">0{index + 1}</span><span className="flex-1">{choice}</span><ArrowIcon direction="right" />
                </div>)}
              </div>
            </div>
            <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between rounded-xl border border-white/[.08] bg-[#111725]/90 px-4 py-3 backdrop-blur-xl">
              <p className="text-[10px] text-[#747c8e]"><span className="text-[#6ee7f2]">●</span> Canon synced across 4 players</p>
              <span className="text-[10px] text-[#555d6f]">just now</span>
            </div>
          </div>
        </div>
        <div className="absolute -right-5 top-24 hidden rounded-2xl border border-white/10 bg-[#101522]/90 p-3 shadow-2xl backdrop-blur-xl sm:block">
          <p className="text-[9px] uppercase tracking-[.15em] text-[#697184]">Narrator</p>
          <p className="mt-1 text-xs text-[#c6cad4]">Adapting the world</p>
        </div>
      </div>
    </section>

    <section className="border-t border-white/[.07] bg-[#090c13]/80">
      <div className="page-wrap grid gap-px overflow-hidden py-12 md:grid-cols-3">
        {[
          ['01', 'Enter anywhere', 'Begin with a preset or join a community story already in motion.'],
          ['02', 'Become someone', 'Your character is shaped by the world’s rules, history, and stakes.'],
          ['03', 'Rewrite what’s true', 'Your choices persist as shared canon for every player who follows.'],
        ].map(([number, title, copy]) => <article key={number} className="border-white/[.07] px-0 py-4 md:border-l md:px-8 md:first:border-l-0 md:first:pl-0">
          <p className="text-[10px] font-bold tracking-[.16em] text-[#7468dd]">{number}</p>
          <h2 className="mt-3 text-base font-semibold tracking-[-.02em]">{title}</h2>
          <p className="mt-2 text-xs leading-6 text-[#71798b]">{copy}</p>
        </article>)}
      </div>
    </section>
  </main>;
}
