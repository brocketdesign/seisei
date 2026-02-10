import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiRequest } from '@/utils/api-auth';
import { getAdminClient } from '@/utils/storage';

/**
 * GET /api/v1/tasks/:taskId
 *
 * Retrieve the status and result of an editorial generation task.
 *
 * Response statuses:
 *  - processing : Task is still running
 *  - completed  : Task finished successfully — result fields are populated
 *  - failed     : Task encountered an error — error field is populated
 *  - cancelled  : Task was cancelled
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ taskId: string }> },
) {
    const auth = await authenticateApiRequest(request);
    if ('error' in auth) return auth.error;

    const { userId } = auth.user;

    try {
        const { taskId } = await params;
        const adminClient = getAdminClient();

        const { data: task, error } = await adminClient
            .from('editorial_tasks')
            .select('*')
            .eq('id', taskId)
            .eq('user_id', userId)
            .single();

        if (error || !task) {
            return NextResponse.json(
                { error: 'Task not found.' },
                { status: 404 },
            );
        }

        const response: Record<string, unknown> = {
            task_id: task.id,
            status: task.status,
            created_at: task.created_at,
            updated_at: task.updated_at,
        };

        if (task.status === 'completed') {
            response.result = task.result;
        }

        if (task.status === 'failed') {
            response.error = task.error;
        }

        return NextResponse.json(response);
    } catch (error) {
        console.error('[api/v1/tasks] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch task status' },
            { status: 500 },
        );
    }
}
