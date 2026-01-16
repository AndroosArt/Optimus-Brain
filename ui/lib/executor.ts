import { Session, PlanStep, saveSession } from './persistence';

export class Executor {
    private shouldHalt: boolean = false;

    constructor(
        private session: Session,
        private onUpdate: (session: Session) => void,
        private onNeedApproval?: (step: PlanStep) => Promise<boolean>
    ) { }

    public async executePlan() {
        if (this.session.status !== 'PLANNED' && this.session.status !== 'FAILED') {
            console.warn("Cannot execute session in state:", this.session.status);
            return;
        }

        // Update status to EXECUTING
        this.updateStatus('EXECUTING');

        for (let i = 0; i < this.session.steps.length; i++) {
            if (this.shouldHalt) break;

            const step = this.session.steps[i];

            // Skip already completed steps
            if (step.result && step.result.status === 'success') continue;

            // --- GOVERNANCE GATE ---
            // Check for Elevated Privileges
            const isElevated =
                step.permission === 'destructive' ||
                step.permission === 'write' || // Optional: Gate writes too? User said "Admin/Root". Destructive/Sudo mostly.
                // User said "Write scopes to core infrastructure". 
                // I'll stick to 'destructive' and explicitly 'sudo'.
                (step.tool && step.tool.toLowerCase().includes('sudo')) ||
                step.tool === 'deploy';

            if (isElevated && this.onNeedApproval) {
                console.log(`Step ${i} requires elevation. Pausing for human authorization.`);
                this.updateStatus('AWAITING_AUTHORIZATION');

                try {
                    const authorized = await this.onNeedApproval(step);
                    if (!authorized) {
                        this.session.steps[i].result = {
                            status: 'failure',
                            output_summary: 'Authorization Denied',
                            raw_output: 'User denied elevation request.',
                            timestamp: new Date().toISOString()
                        };
                        this.halt('FAILED');
                        return;
                    }
                } catch (e) {
                    this.halt('FAILED');
                    return;
                }

                // Resume
                this.updateStatus('EXECUTING');
            }
            // -----------------------

            // Check Conditions
            if (step.condition) {
                const conditionMet = await this.evaluateCondition(step.condition);
                if (!conditionMet) {
                    console.log(`Condition not met for step ${i}, skipping.`);
                    this.session.steps[i].result = {
                        status: 'skipped',
                        output_summary: 'Condition not met',
                        raw_output: `Condition ${JSON.stringify(step.condition)} evaluated to false.`,
                        timestamp: new Date().toISOString()
                    };
                    this.onUpdate({ ...this.session });
                    saveSession(this.session);
                    continue;
                }
            }

            try {
                // Execute Step
                const result = await this.executeStep(step);

                // Update Step Result
                this.session.steps[i].result = result;
                this.onUpdate({ ...this.session });
                saveSession(this.session);

                // Check for Failure
                if (result.status === 'failure') {
                    console.error("Step failed, halting execution:", result.error_type);
                    this.halt('FAILED');
                    return;
                }

            } catch (error) {
                console.error("Executor Critical Error:", error);
                this.halt('FAILED');
                return;
            }
        }

        // If we got here, all steps completed successfully
        this.halt('COMPLETED');
    }

    private async evaluateCondition(condition: { type: string, path?: string }): Promise<boolean> {
        // Logic to check conditions
        // In a real app, this might make an API call to check file existence
        if (condition.type === 'if_file_exists' && condition.path) {
            // MOCK: Assume logic based on path or check via API
            // For now, let's assume checking file existence via an API call would happen here.
            // Returning true to allow flow for now, or false if we want to test skipping.
            // Let's implement a 'check_file' API call via /api/execute for validity
            try {
                const response = await fetch('/api/execute', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        tool: 'read_file', // Try to read it to check existence
                        params: { file: condition.path }
                    })
                });
                const result = await response.json();
                return result.status === 'success';
            } catch (e) {
                return false;
            }
        }
        return true;
    }

    private async executeStep(step: PlanStep): Promise<any> {
        const response = await fetch('/api/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tool: step.tool,
                params: step.params
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        return await response.json();
    }

    public halt(finalStatus: 'COMPLETED' | 'FAILED' | 'PLANNED') {
        this.shouldHalt = true;
        this.updateStatus(finalStatus);
    }

    private updateStatus(status: "PLANNED" | "AWAITING_AUTHORIZATION" | "EXECUTING" | "COMPLETED" | "FAILED") {
        this.session.status = status;
        this.onUpdate({ ...this.session });
        saveSession(this.session);
    }
}
