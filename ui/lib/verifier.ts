import { Session, PlanStep, VerificationResult } from './persistence';
import OpenAI from 'openai';

// Lazy load OpenAI client
let openaiClient: OpenAI | null = null;
function getOpenAIClient() {
    if (!openaiClient) {
        openaiClient = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    return openaiClient;
}

/**
 * Identify artifacts (files) modified or created in the session.
 */
export function identifyArtifacts(session: Session): string[] {
    const artifacts = new Set<string>();
    session.steps.forEach(step => {
        if ((step.tool === 'write_file' || step.tool === 'edit_file') && step.params.file) {
            artifacts.add(step.params.file);
        }
    });
    return Array.from(artifacts);
}

/**
 * Verify a session by checking artifacts and comparing output to intent.
 */
export async function verifySession(session: Session, artifactContents: Record<string, string | null>): Promise<VerificationResult> {
    const artifacts = identifyArtifacts(session);
    const evidence: string[] = [];
    const missingArtifacts: string[] = [];

    // 1. Evidence Collection
    for (const path of artifacts) {
        const content = artifactContents[path];
        if (content === null) {
            missingArtifacts.push(path);
            evidence.push(`Missing Artifact: ${path}`);
        } else {
            evidence.push(`Artifact (${path}):\n${content.substring(0, 1000)}... (truncated)`);
        }
    }

    // 2. Immediate Failure Check (Missing Artifacts)
    if (missingArtifacts.length > 0) {
        return {
            status: 'FAILED',
            evidence_checked: artifacts,
            findings: [`Mission failed to produce expected artifacts: ${missingArtifacts.join(', ')}`],
            discrepancies: ['Artifacts missing from filesystem.'],
            confidence_level: 'high',
            timestamp: new Date().toISOString()
        };
    }

    // If no artifacts were produced but the mission succeeded (e.g. analysis only), verify logs?
    // For now, assume if objective implies action, artifacts should exist.
    // If no artifacts found to verify:
    if (artifacts.length === 0) {
        // Fallback: Verify based on execution logs if no files were touched.
        evidence.push("No file artifacts modified. Verifying based on step outputs.");
        session.steps.forEach((step, i) => {
            evidence.push(`Step ${i + 1} (${step.tool}): ${step.result?.output_summary || 'No output'}`);
        });
    }

    // 3. Intent Alignment Check (LLM)
    const systemPrompt = `You are a Post-Mission Verification Auditor.
Your job is to objectively verify if a completed mission Satisfied its Objective based on the provided Evidence.

Input:
- Objective: ${session.objective}
- Execution Status: ${session.status}
- Evidence Checked:
${evidence.join('\n\n')}

Task:
1. Compare the Objective vs Evidence.
2. Determine VERIFICATION STATUS:
   - PASSED: Evidence confirms objective is met.
   - FAILED: Evidence contradicts objective or shows failure (e.g. empty files, error messages).
   - PARTIAL: Objective partially met but gaps exist.
3. List FINDINGS (factual observations).
4. List DISCREPANCIES (mismatch between intent and result).
5. Assign CONFIDENCE (low/medium/high).

Output JSON:
{
  "status": "PASSED | FAILED | PARTIAL",
  "findings": ["finding 1", "finding 2"],
  "discrepancies": ["gap 1", "gap 2"],
  "confidence_level": "low | medium | high"
}`;

    try {
        const openai = getOpenAIClient();
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "system", content: systemPrompt }],
            temperature: 0.1,
            response_format: { type: "json_object" }
        });

        const resultRaw = JSON.parse(response.choices[0].message.content || "{}");

        return {
            status: resultRaw.status || "PARTIAL",
            evidence_checked: artifacts.length > 0 ? artifacts : ["Execution Logs"],
            findings: resultRaw.findings || [],
            discrepancies: resultRaw.discrepancies || [],
            confidence_level: resultRaw.confidence_level || "medium",
            timestamp: new Date().toISOString()
        };

    } catch (e) {
        console.error("Verification failed", e);
        return {
            status: "FAILED",
            evidence_checked: [],
            findings: ["Verification process error"],
            discrepancies: [String(e)],
            confidence_level: "low",
            timestamp: new Date().toISOString()
        };
    }
}
