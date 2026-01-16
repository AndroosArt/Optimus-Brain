import fs from 'fs/promises';
import path from 'path';

const MEMORY_FILE = path.join(process.cwd(), 'governance', 'memory', 'user_profile.json');

export interface UserMemory {
    preferences: Record<string, any>;
    technical_context: {
        preferred_languages: string[];
        environment_constraints: string[];
        banned_patterns: string[];
    };
    interaction_history: Array<{
        date: string;
        action: string; // e.g., "correction", "preference_update"
        detail: string;
    }>;
}

const DEFAULT_MEMORY: UserMemory = {
    preferences: {
        verbosity: "concise",
        tone: "professional",
        auto_approve_safe: false
    },
    technical_context: {
        preferred_languages: ["typescript", "python"],
        environment_constraints: ["windows"],
        banned_patterns: []
    },
    interaction_history: []
};

async function ensureMemory() {
    try {
        await fs.access(MEMORY_FILE);
    } catch {
        // Ensure directory exists (recursive) handled by New-Item but let's be safe
        await fs.mkdir(path.dirname(MEMORY_FILE), { recursive: true });
        await fs.writeFile(MEMORY_FILE, JSON.stringify(DEFAULT_MEMORY, null, 2), 'utf-8');
    }
}

export async function getMemory(): Promise<UserMemory> {
    await ensureMemory();
    try {
        const content = await fs.readFile(MEMORY_FILE, 'utf-8');
        return { ...DEFAULT_MEMORY, ...JSON.parse(content) };
    } catch (e) {
        console.error("Failed to read memory:", e);
        return DEFAULT_MEMORY;
    }
}

export async function updateMemory(update: Partial<UserMemory> | ((current: UserMemory) => UserMemory)) {
    await ensureMemory();
    const current = await getMemory();

    let next: UserMemory;
    if (typeof update === 'function') {
        next = update(current);
    } else {
        next = {
            ...current,
            ...update,
            preferences: { ...current.preferences, ...update.preferences },
            technical_context: { ...current.technical_context, ...update.technical_context }
        };
    }

    await fs.writeFile(MEMORY_FILE, JSON.stringify(next, null, 2), 'utf-8');
    return next;
}
