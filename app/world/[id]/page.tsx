import WorldRoom from '@/components/WorldRoom';
export default async function WorldPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <WorldRoom id={id} />; }
