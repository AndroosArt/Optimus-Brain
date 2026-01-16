import SessionViewer from '@/components/SessionViewer';

// CRITICAL: Allow runtime rendering for any session ID (fixes 404)
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export default async function SessionDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <SessionViewer id={id} />;
}
