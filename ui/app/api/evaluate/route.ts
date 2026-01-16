import { NextResponse } from 'next/server';
import { evaluateMission } from '@/lib/evaluator';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const { objective, includeAdvisory, externalClient } = await request.json();

        if (!objective) {
            return NextResponse.json(
                { error: 'Objective is required' },
                { status: 400 }
            );
        }

        const evaluation = await evaluateMission(
            objective,
            includeAdvisory || false,
            externalClient || false
        );

        return NextResponse.json({
            status: 'success',
            evaluation
        });

    } catch (error) {
        console.error("Evaluation API Error:", error);
        return NextResponse.json(
            { error: 'Internal Server Error', details: String(error) },
            { status: 500 }
        );
    }
}
