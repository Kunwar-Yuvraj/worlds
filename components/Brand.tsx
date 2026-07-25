import Link from 'next/link';

export function Brand({ compact = false }: { compact?: boolean }) {
  return <Link href="/" className="brand" aria-label="Worlds home">
    <span className="brand-mark" aria-hidden="true"><span /></span>
    {!compact && <span className="brand-name">worlds</span>}
  </Link>;
}

export function ArrowIcon({ direction = 'up' }: { direction?: 'up' | 'right' }) {
  return <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" className="h-4 w-4">
    {direction === 'up'
      ? <path d="M4 12 12 4m0 0H5m7 0v7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      : <path d="M3 8h10m0 0L9 4m4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />}
  </svg>;
}

export function SparkIcon() {
  return <svg aria-hidden="true" viewBox="0 0 18 18" fill="none" className="h-[18px] w-[18px]">
    <path d="M9 1.75c.36 4.5 2.75 6.89 7.25 7.25C11.75 9.36 9.36 11.75 9 16.25 8.64 11.75 6.25 9.36 1.75 9 6.25 8.64 8.64 6.25 9 1.75Z" fill="currentColor" />
  </svg>;
}
