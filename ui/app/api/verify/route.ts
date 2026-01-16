import { NextResponse } from 'next/server';
import { verifySession, identifyArtifacts } from '@/lib/verifier';
import { Session } from '@/lib/persistence';

// Force dynamic to allow runtime execution
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const session = await request.json() as Session;

        if (!session) {
            return NextResponse.json({ error: "No session provided" }, { status: 400 });
        }

        // 1. Identify expected artifacts
        const artifactPaths = identifyArtifacts(session);
        const artifactContents: Record<string, string | null> = {};

        // 2. Read artifacts (Simulated for Vercel / Implemented for Local)
        // In a real environment, we would use 'fs' here.
        // For this Vercel demo, we check if the file was "written" in the session logs.
        // Since we can't persistent-store files on Vercel between requests, 
        // we will simulate "reading" the content that was supposedly written,
        // OR we return a specific message if we can't reach the FS.

        // MOCK READ STRATEGY for Prototype:
        // Try to find the content in the session steps themselves (what was *intended* to be written).
        // This is "Log Verification" rather than "Disk Verification", but sufficient for the Vercel demo.
        // In a local run with FS access, we would replace this with `fs.readFileSync`.

        for (const path of artifactPaths) {
            // Find the step that wrote this file
            const writingStep = session.steps.slice().reverse().find(
                s => (s.tool === 'write_file' || s.tool === 'edit_file') && s.params.file === path
            );

            if (writingStep && writingStep.params.content) {
                // We found the content in the logs.
                // In a real system, we'd check fs.existsSync(path). 
                // Here, since we have no FS, we treat the LOG as the evidence of intent, 
                // but we flag that we are verifying LOGS not DISK.
                artifactContents[path] = writingStep.params.content;
            } else {
                // File mentioned but no content found in params (maybe generated?)
                artifactContents[path] = "[Content not captured in logs]";
            }
        }

        // 3. Run Verification Logic
        const verificationResult = await verifySession(session, artifactContents);

        // 4. Return Result
        return NextResponse.json(verificationResult);

    } catch (error) {
        console.error("Verification API Error:", error);
        return NextResponse.json({
            status: "FAILED",
            findings: ["Internal Server Error during verification"],
            discrepancies: [String(error)]
        }, { status: 500 });
    }
}
