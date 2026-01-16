export type OptimusMode = 'OPERATOR' | 'ARCHITECT';

export interface OptimusSettings {
    systemInstructions: string;
    mode: OptimusMode;
    analysis: {
        verbosity: 'low' | 'medium' | 'high';
        riskTolerance: 'conservative' | 'normal' | 'aggressive';
        strictness: 'relaxed' | 'strict';
    };
    // Capabilities are read-only state, not settings, but we track overrides if needed
}

export const DEFAULT_SETTINGS: OptimusSettings = {
    systemInstructions: `You are Optimus, an internal operator execution system.
Your goal is to execute the user's objective efficiently and safely.
You prefer ACTION over explanation.
You are CONCISE and PRECISE.`,
    mode: 'OPERATOR',
    analysis: {
        verbosity: 'low',
        riskTolerance: 'conservative',
        strictness: 'strict'
    }
};

export const ARCHITECT_PROMPT_ADDENDUM = `
MODE: ARCHITECT
You are in ARCHITECT mode.
- Explain your reasoning in detail.
- Describe system architecture and design decisions.
- Focus on "Why" and "How" before "What".
`;

export const OPERATOR_PROMPT_ADDENDUM = `
MODE: OPERATOR
You are in OPERATOR mode.
- Do NOT explain architecture unless asked.
- Focus on EXECUTION plans.
- Be extremely concise.
`;
