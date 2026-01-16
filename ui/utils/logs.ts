import fs from 'fs';
import path from 'path';

export interface Session {
    id: string;
    timestamp: string;
    objective: string;
    status: string;
    steps: any[];
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
}

const LOGS_DIR = path.join(process.cwd(), '..', 'logs', 'sessions');

export function getSessions(): Session[] {
    if (!fs.existsSync(LOGS_DIR)) return [];
    const files = fs.readdirSync(LOGS_DIR).filter(f => f.endsWith('.json'));
    const sessions = files.map(file => {
        try {
            const content = fs.readFileSync(path.join(LOGS_DIR, file), 'utf-8');
            const data = JSON.parse(content);
            // Ensure basic fields exist
            return {
                id: data.id || file.replace('.json', ''),
                timestamp: data.timestamp || new Date().toISOString(),
                objective: data.objective || 'Unknown Objective',
                status: data.status || 'UNKNOWN',
                steps: data.steps || [],
                meta: data.meta
            } as Session;
        } catch (e) {
            console.error(`Error reading session ${file}`, e);
            return null;
        }
    }).filter(Boolean) as Session[];

    // Sort by timestamp descending
    return sessions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function getSession(id: string): Session | null {
    const filePath = path.join(LOGS_DIR, `${id}.json`);
    if (!fs.existsSync(filePath)) return null;
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
    } catch (e) {
        return null;
    }
}
