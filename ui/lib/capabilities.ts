export interface Capability {
    name: string;
    description: string;
    permission: 'read' | 'write' | 'destructive' | 'network' | 'observe_only' | 'execute';
    enabled: boolean;
}

export const CAPABILITIES: Capability[] = [
    // File Manipulation
    { name: 'write_file', description: 'Create new files', permission: 'write', enabled: true },
    { name: 'read_file', description: 'Read file contents (Standard)', permission: 'read', enabled: true },
    { name: 'edit_file', description: 'Modify existing files', permission: 'write', enabled: true },

    // Version Control
    { name: 'git_commit', description: 'Commit changes to git', permission: 'write', enabled: true },
    { name: 'git_push', description: 'Push changes to remote', permission: 'network', enabled: true },

    // Deployment & Build
    { name: 'build_site', description: 'Run build command', permission: 'execute', enabled: true },
    { name: 'deploy', description: 'Deploy to Vercel/Production', permission: 'destructive', enabled: true },

    // Connectivity
    { name: 'api_request', description: 'Make external HTTP requests', permission: 'network', enabled: true },
    { name: 'connect_module', description: 'Connect to internal modules', permission: 'network', enabled: true },
    { name: 'web_search', description: 'Search the public internet', permission: 'network', enabled: true },
    { name: 'web_scrape', description: 'Read website content (Text)', permission: 'network', enabled: true },

    // Observation (New Phase 8)
    { name: 'terminal_inspect', description: 'Run safe terminal commands (ls, whoami)', permission: 'observe_only', enabled: true },
    { name: 'fs_list', description: 'List local directory contents', permission: 'observe_only', enabled: true },
    { name: 'fs_read_safe', description: 'Read file with size limits', permission: 'observe_only', enabled: true },
    { name: 'fs_metadata', description: 'Get file metadata', permission: 'observe_only', enabled: true },
    { name: 'gdrive_list', description: 'List Google Drive files', permission: 'observe_only', enabled: true },
    { name: 'gdrive_metadata', description: 'Get GDrive file metadata', permission: 'observe_only', enabled: true },

    // Cognitive (Phase 14)
    { name: 'remember', description: 'Save user preference or fact to long-term memory', permission: 'write', enabled: true },
];

export const TOOL_NAMES = CAPABILITIES.map(c => c.name);
