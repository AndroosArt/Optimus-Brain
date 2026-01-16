import fs from 'fs/promises';
import { exec } from 'child_process';
import util from 'util';
import { google } from 'googleapis';

const execAsync = util.promisify(exec);

// ------------------------------------------------------------------
// TERMINAL INSPECT
// ------------------------------------------------------------------
const ALLOWED_TERMINAL_COMMANDS = [
    'ls', 'dir', 'pwd', 'echo', 'whoami',
    'git status', 'git log', 'tree', 'date', 'type', 'cat'
];

export async function terminalInspect(command: string, cwd: string = process.cwd()): Promise<string> {
    const cmdBase = command.trim().split(/\s+/)[0];

    // Safety Check
    if (!ALLOWED_TERMINAL_COMMANDS.includes(cmdBase)) {
        throw new Error(`SECURITY ALERT: Command '${cmdBase}' is not authorized in observe_only mode.`);
    }

    try {
        const { stdout, stderr } = await execAsync(command, { cwd });
        return stdout || stderr;
    } catch (e: any) {
        return `Error: ${e.message}\n${e.stderr || ''}`;
    }
}

// ------------------------------------------------------------------
// FILESYSTEM OBSERVE
// ------------------------------------------------------------------
export async function fsList(dirPath: string): Promise<string[]> {
    try {
        const files = await fs.readdir(dirPath);
        return files;
    } catch (e: any) {
        throw new Error(`Failed to list directory: ${e.message}`);
    }
}

export async function fsReadSafe(filePath: string, maxLength: number = 8000): Promise<string> {
    try {
        const stat = await fs.stat(filePath);
        if (stat.isDirectory()) {
            throw new Error("Target is a directory, use fs_list instead.");
        }

        if (stat.size > maxLength) {
            const handle = await fs.open(filePath, 'r');
            const buffer = Buffer.alloc(maxLength);
            const { bytesRead } = await handle.read(buffer, 0, maxLength, 0);
            await handle.close();
            return buffer.toString('utf-8', 0, bytesRead) + `\n\n...[TRUNCATED: File size ${stat.size} exceeds preview limit]...`;
        }
        return await fs.readFile(filePath, 'utf-8');
    } catch (e: any) {
        throw new Error(`Read failed: ${e.message}`);
    }
}

export async function fsMetadata(filePath: string): Promise<any> {
    try {
        const stat = await fs.stat(filePath);
        return {
            size: stat.size,
            created: stat.birthtime,
            modified: stat.mtime,
            isDirectory: stat.isDirectory(),
            isFile: stat.isFile()
        };
    } catch (e: any) {
        throw new Error(`Metadata failed: ${e.message}`);
    }
}

// ------------------------------------------------------------------
// GOOGLE DRIVE OBSERVE
// ------------------------------------------------------------------
// Requires GOOGLE_APPLICATION_CREDENTIALS in env or ADC
export async function getDriveClient() {
    try {
        const auth = new google.auth.GoogleAuth({
            scopes: [
                'https://www.googleapis.com/auth/drive.metadata.readonly',
                'https://www.googleapis.com/auth/drive.readonly'
            ]
        });
        const client = await auth.getClient();
        return google.drive({ version: 'v3', auth: client as any });
    } catch (e) {
        console.warn("Google Auth Warning: Credentials not found. GDrive tools will fail.");
        return null;
    }
}

export async function gdriveList(folderId?: string, query?: string): Promise<string> {
    const drive = await getDriveClient();
    if (!drive) return "Error: Google Credentials not configured.";

    try {
        const q = [
            folderId ? `'${folderId}' in parents` : null,
            query,
            "trashed = false"
        ].filter(Boolean).join(" and ");

        const res = await drive.files.list({
            q,
            fields: 'files(id, name, mimeType, size, modifiedTime)',
            pageSize: 20
        });

        const files = res.data.files || [];
        if (files.length === 0) return "No files found.";

        return files.map(f => `[${f.mimeType === 'application/vnd.google-apps.folder' ? 'DIR' : 'FILE'}] ${f.name} (ID: ${f.id})`).join('\n');
    } catch (e: any) {
        return `GDrive List Failed: ${e.message}`;
    }
}

export async function gdriveReadMetadata(fileId: string): Promise<any> {
    const drive = await getDriveClient();
    if (!drive) return { error: "Credentials missing" };

    try {
        const res = await drive.files.get({
            fileId,
            fields: 'id, name, mimeType, size, modifiedTime, description, owners'
        });
        return res.data;
    } catch (e: any) {
        return { error: e.message };
    }
}
