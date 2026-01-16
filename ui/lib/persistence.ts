export interface StepResult {
    status: "success" | "failure" | "skipped";
    output_summary: string;
    raw_output: string;
    error_type?: string;
    timestamp: string;
}

export interface PlanStep {
    tool: string;
    description: string;
    params: Record<string, any>;
    result?: StepResult; // Persisted execution result
    permission?: "read" | "write" | "destructive" | "network" | "observe_only"; // Permission level
    condition?: {
        type: "if_file_exists" | "if_previous_step_failed";
        path?: string;
    };
}

export interface VerificationResult {
    status: "PASSED" | "FAILED" | "PARTIAL";
    evidence_checked: string[];
    findings: string[];
    discrepancies: string[];
    confidence_level: "low" | "medium" | "high";
    timestamp: string;
}

export interface Session {
    id: string;
    title: string; // Brief human-readable title
    timestamp: string;
    objective: string;
    status: "PLANNED" | "AWAITING_AUTHORIZATION" | "EXECUTING" | "COMPLETED" | "FAILED";
    steps: PlanStep[];
    verification?: VerificationResult; // New field for verification status
    meta?: {
        usage?: {
            prompt_tokens: number;
            completion_tokens: number;
            total_tokens: number;
        };
        cost?: {
            total: number;
            currency: string;
        };
    };
    evaluation?: any; // MissionEvaluation from evaluator.ts
}

const STORAGE_KEY = 'optimus_sessions';

export const saveSession = (session: Session) => {
    if (typeof window === 'undefined') return;

    const sessions = getSessions();
    // Update or Add
    const index = sessions.findIndex(s => s.id === session.id);
    if (index >= 0) {
        sessions[index] = session;
    } else {
        sessions.unshift(session);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
};

export const getSessions = (): Session[] => {
    if (typeof window === 'undefined') return [];

    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error("Failed to load sessions", e);
        return [];
    }
};

export const getSession = (id: string): Session | undefined => {
    const sessions = getSessions();
    return sessions.find(s => s.id === id);
};
