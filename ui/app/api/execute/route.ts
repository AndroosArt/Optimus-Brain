import { NextResponse } from 'next/server';
import { TOOLS_LIST } from '@/lib/planner';
import {
    terminalInspect,
    fsList,
    fsReadSafe,
    fsMetadata,
    gdriveList,
    gdriveReadMetadata
} from '@/lib/server_tools';
import { webSearch, webScrape } from '@/lib/web_tools';
import { updateMemory } from '@/lib/memory';

// Force dynamic execution
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const { tool, params } = await request.json();

        // 1. Tool Validation
        if (!TOOLS_LIST.includes(tool)) {
            return NextResponse.json({
                status: 'failure',
                output_summary: 'Tool not found',
                raw_output: `Tool '${tool}' is not authorized or does not exist.`,
                timestamp: new Date().toISOString()
            });
        }

        let output = "";
        let success = true;

        // 2. Execution Logic
        switch (tool) {
            // --- OBSERVATION TOOLS (REAL) ---
            case 'terminal_inspect':
                output = await terminalInspect(params.command, params.cwd);
                break;

            case 'fs_list':
                const files = await fsList(params.path || process.cwd());
                output = files.join('\n');
                break;

            case 'fs_read_safe':
                output = await fsReadSafe(params.file, 8000);
                break;

            case 'fs_metadata':
                const meta = await fsMetadata(params.file);
                output = JSON.stringify(meta, null, 2);
                break;

            case 'gdrive_list':
                output = await gdriveList(params.folderId, params.query);
                break;

            case 'gdrive_metadata':
                const gmeta = await gdriveReadMetadata(params.fileId);
                output = JSON.stringify(gmeta, null, 2);
                break;

            // --- WEB TOOLS ---
            case 'web_search':
                output = await webSearch(params.query);
                break;
            case 'web_scrape':
                output = await webScrape(params.url);
                break;

            case 'remember':
                // params: { category: 'preferences' | 'technical', key: string, value: any }
                await updateMemory((current) => {
                    const cat = params.category === 'technical' ? 'technical_context' : 'preferences';
                    // @ts-ignore
                    const section = current[cat] || {};
                    // If section is array (unlikely with this schema)
                    return {
                        ...current,
                        [cat]: {
                            ...section,
                            [params.key]: params.value
                        },
                        interaction_history: [
                            ...current.interaction_history,
                            { date: new Date().toISOString(), action: 'memory_update', detail: `Updated ${cat}.${params.key}` }
                        ]
                    };
                });
                output = `Memory updated: ${params.key} = ${JSON.stringify(params.value)}`;
                break;

            // --- STANDARD TOOLS (MOCK / DANGEROUS) ---
            case 'write_file':
                output = `[MOCK] Successfully wrote to ${params.file || 'file'}`;
                // Consider implementing real write if local, but user stressed Observe Only for now.
                break;
            case 'read_file':
                // Legacy tool, mapped to safe read for now or mock?
                // User said "Explicitly disallow Writes... allowed: Read text files".
                // I'll map read_file to safe read for convenience.
                try {
                    output = await fsReadSafe(params.file, 8000);
                } catch {
                    output = `[MOCK] Read content from ${params.file}`;
                }
                break;
            case 'api_request':
                output = `[MOCK] API ${params.method || 'GET'} to ${params.url} returned 200 OK.`;
                break;
            case 'git_commit':
                output = `[MOCK] Git commit successful: "${params.message}"`;
                break;
            default:
                output = `Tool ${tool} simulation successful with params: ${JSON.stringify(params)}`;
        }

        return NextResponse.json({
            status: 'success',
            output_summary: output.length > 100 ? output.substring(0, 100) + '...' : output,
            raw_output: output,
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error("Execution Error:", error);
        return NextResponse.json({
            status: 'failure',
            output_summary: 'Execution Error',
            raw_output: `Error: ${error.message}`,
            error_type: 'RuntimeError',
            timestamp: new Date().toISOString()
        });
    }
}
