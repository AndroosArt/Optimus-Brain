/**
 * Antigravity Hands - Frontend JavaScript
 * Handles WebSocket communication and UI interactions
 */

class AntigravityApp {
    constructor() {
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;

        // DOM Elements
        this.elements = {
            connectionStatus: document.getElementById('connection-status'),
            planInput: document.getElementById('plan-input'),
            executeBtn: document.getElementById('execute-btn'),
            loadExample: document.getElementById('load-example'),
            stepsContainer: document.getElementById('steps-container'),
            executionStats: document.getElementById('execution-stats'),
            approvalModal: document.getElementById('approval-modal'),
            modalStepBadge: document.getElementById('modal-step-badge'),
            approvalDescription: document.getElementById('approval-description'),
            approvalTool: document.getElementById('approval-tool'),
            approvalParams: document.getElementById('approval-params'),
            btnApprove: document.getElementById('btn-approve'),
            btnSkip: document.getElementById('btn-skip'),
            btnAbort: document.getElementById('btn-abort'),
            btnApproveAll: document.getElementById('btn-approve-all')
        };

        this.init();
    }

    init() {
        this.connectWebSocket();
        this.bindEvents();
        this.validatePlanInput();
    }

    // ==========================================
    // WebSocket Connection
    // ==========================================

    connectWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
            this.updateConnectionStatus('connected');
            this.reconnectAttempts = 0;
            console.log('WebSocket connected');
        };

        this.ws.onclose = () => {
            this.updateConnectionStatus('disconnected');
            this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
        };
    }

    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
            console.log(`Reconnecting in ${delay}ms...`);
            setTimeout(() => this.connectWebSocket(), delay);
        }
    }

    updateConnectionStatus(status) {
        const el = this.elements.connectionStatus;
        el.className = `connection-status ${status}`;
        el.querySelector('.status-text').textContent =
            status === 'connected' ? 'Connected' :
                status === 'disconnected' ? 'Disconnected' : 'Connecting...';
    }

    // ==========================================
    // Event Binding
    // ==========================================

    bindEvents() {
        // Plan input validation
        this.elements.planInput.addEventListener('input', () => {
            this.validatePlanInput();
        });

        // Execute button
        this.elements.executeBtn.addEventListener('click', () => {
            this.executePlan();
        });

        // Load example
        this.elements.loadExample.addEventListener('click', () => {
            this.loadExamplePlan();
        });

        // Approval buttons
        this.elements.btnApprove.addEventListener('click', () => {
            this.sendApproval('approve');
        });

        this.elements.btnSkip.addEventListener('click', () => {
            this.sendApproval('skip');
        });

        this.elements.btnAbort.addEventListener('click', () => {
            this.sendApproval('abort');
        });

        this.elements.btnApproveAll.addEventListener('click', () => {
            this.sendApproval('approve_all');
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (!this.elements.approvalModal.classList.contains('visible')) return;

            if (e.key === 'y' || e.key === 'Y') {
                this.sendApproval('approve');
            } else if (e.key === 's' || e.key === 'S') {
                this.sendApproval('skip');
            } else if (e.key === 'a' || e.key === 'A') {
                this.sendApproval('approve_all');
            } else if (e.key === 'Escape' || e.key === 'n' || e.key === 'N') {
                this.sendApproval('abort');
            }
        });
    }

    // ==========================================
    // Plan Handling
    // ==========================================

    validatePlanInput() {
        const value = this.elements.planInput.value.trim();
        let isValid = false;

        if (value) {
            try {
                const plan = JSON.parse(value);
                isValid = plan.steps && Array.isArray(plan.steps);
            } catch (e) {
                isValid = false;
            }
        }

        this.elements.executeBtn.disabled = !isValid || !this.ws || this.ws.readyState !== WebSocket.OPEN;
    }

    loadExamplePlan() {
        const example = {
            name: "Example: Create a test file",
            steps: [
                {
                    tool: "write_file",
                    description: "Create a greeting file",
                    params: {
                        path: "./greeting.txt",
                        content: "Hello from Antigravity Hands GUI!"
                    }
                },
                {
                    tool: "read_file",
                    description: "Verify the file was created",
                    params: {
                        path: "./greeting.txt"
                    }
                }
            ]
        };

        this.elements.planInput.value = JSON.stringify(example, null, 2);
        this.validatePlanInput();
    }

    executePlan() {
        try {
            const plan = JSON.parse(this.elements.planInput.value);

            // Clear previous execution
            this.clearSteps();
            this.updateStats({ succeeded: 0, failed: 0, skipped: 0 });

            // Disable execute button during execution
            this.elements.executeBtn.disabled = true;

            // Send plan to server
            this.ws.send(JSON.stringify({
                action: 'execute_plan',
                plan: plan
            }));

        } catch (e) {
            console.error('Invalid plan:', e);
        }
    }

    // ==========================================
    // Message Handling
    // ==========================================

    handleMessage(data) {
        console.log('Received:', data);

        switch (data.type) {
            case 'plan_start':
                this.onPlanStart(data);
                break;
            case 'step_pending':
                this.onStepPending(data);
                break;
            case 'step_executing':
                this.onStepExecuting(data);
                break;
            case 'step_success':
                this.onStepSuccess(data);
                break;
            case 'step_error':
                this.onStepError(data);
                break;
            case 'step_skipped':
                this.onStepSkipped(data);
                break;
            case 'plan_complete':
                this.onPlanComplete(data);
                break;
            case 'plan_aborted':
                this.onPlanAborted(data);
                break;
            case 'error':
                this.onError(data);
                break;
        }
    }

    onPlanStart(data) {
        this.clearSteps();
        // Optionally show plan name
    }

    onStepPending(data) {
        // Add step card
        const card = this.createStepCard(data.step, data.tool, data.description, 'pending');
        this.elements.stepsContainer.appendChild(card);

        // Show approval modal if needed
        if (data.needs_approval) {
            this.showApprovalModal(data);
        } else {
            // Auto-approved, update card
            card.classList.remove('pending');
            card.classList.add('executing');
            this.updateStepStatus(data.step, '⏳');
        }
    }

    onStepExecuting(data) {
        const card = document.getElementById(`step-${data.step}`);
        if (card) {
            card.classList.remove('pending');
            card.classList.add('executing');
            this.updateStepStatus(data.step, '⏳');
        }
        this.hideApprovalModal();
    }

    onStepSuccess(data) {
        const card = document.getElementById(`step-${data.step}`);
        if (card) {
            card.classList.remove('executing');
            card.classList.add('success');
            this.updateStepStatus(data.step, '✓');

            // Show result
            if (data.result) {
                const resultEl = document.createElement('div');
                resultEl.className = 'step-result';
                resultEl.textContent = data.result.message || JSON.stringify(data.result, null, 2);
                card.appendChild(resultEl);
            }
        }
    }

    onStepError(data) {
        const card = document.getElementById(`step-${data.step}`);
        if (card) {
            card.classList.remove('executing');
            card.classList.add('error');
            this.updateStepStatus(data.step, '✗');

            // Show error
            const resultEl = document.createElement('div');
            resultEl.className = 'step-result';
            resultEl.textContent = `Error: ${data.error}`;
            card.appendChild(resultEl);
        }
    }

    onStepSkipped(data) {
        const card = document.getElementById(`step-${data.step}`);
        if (card) {
            card.classList.remove('pending');
            card.classList.add('skipped');
            this.updateStepStatus(data.step, '↷');
        }
        this.hideApprovalModal();
    }

    onPlanComplete(data) {
        this.updateStats(data.results);
        this.elements.executeBtn.disabled = false;
        this.validatePlanInput();
    }

    onPlanAborted(data) {
        this.hideApprovalModal();
        this.elements.executeBtn.disabled = false;
        this.validatePlanInput();

        // Mark current step as aborted
        const card = document.getElementById(`step-${data.step}`);
        if (card) {
            card.classList.remove('pending', 'executing');
            card.classList.add('error');
            this.updateStepStatus(data.step, '✗');
        }
    }

    onError(data) {
        console.error('Error:', data.message);
        alert(`Error: ${data.message}`);
        this.elements.executeBtn.disabled = false;
        this.validatePlanInput();
    }

    // ==========================================
    // UI Helpers
    // ==========================================

    clearSteps() {
        this.elements.stepsContainer.innerHTML = '';
    }

    createStepCard(stepNum, tool, description, status) {
        const card = document.createElement('div');
        card.id = `step-${stepNum}`;
        card.className = `step-card ${status}`;

        card.innerHTML = `
            <div class="step-header">
                <div class="step-number">${stepNum}</div>
                <div class="step-tool">${tool}</div>
                <div class="step-status" id="step-status-${stepNum}">⏸</div>
            </div>
            <div class="step-description">${description}</div>
        `;

        return card;
    }

    updateStepStatus(stepNum, icon) {
        const statusEl = document.getElementById(`step-status-${stepNum}`);
        if (statusEl) {
            statusEl.textContent = icon;
        }
    }

    updateStats(results) {
        this.elements.executionStats.innerHTML = `
            <span class="stat stat-success">✓ ${results.succeeded}</span>
            <span class="stat stat-error">✗ ${results.failed}</span>
            <span class="stat stat-skipped">↷ ${results.skipped}</span>
        `;
    }

    showApprovalModal(data) {
        this.elements.modalStepBadge.textContent = `Step ${data.step}/${data.total}`;
        this.elements.approvalDescription.textContent = data.description;
        this.elements.approvalTool.textContent = data.tool;
        this.elements.approvalParams.textContent = JSON.stringify(data.params, null, 2);
        this.elements.approvalModal.classList.add('visible');
    }

    hideApprovalModal() {
        this.elements.approvalModal.classList.remove('visible');
    }

    sendApproval(choice) {
        this.ws.send(JSON.stringify({
            action: 'approve',
            choice: choice
        }));

        if (choice === 'abort') {
            this.hideApprovalModal();
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new AntigravityApp();
});
