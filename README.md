# Optimus

An autonomous AI agent runtime for high-trust execution.

## Web-First Workflow

We have upgraded to a **Web Interface** for submitting objectives and managing sessions.

### 🚀 Getting Started

1.  **Start the UI**:
    ```bash
    cd ui
    npm run dev
    ```
2.  **Open Dashboard**: Visit `http://localhost:3000`.
3.  **Start Mission**: Enter your objective (e.g., "Analyze the src directory and create a summary.md").
4.  **Review & Approve**: The agent will generate a plan. Review it in the UI and click **Approve** to execute.

---

## Deployment (Vercel)

To deploy the UI to Vercel:

1.  **Configure Environment**:
    Ensure your Vercel project has the `OPENAI_API_KEY` environment variable set.

2.  **Deploy**:
    ```bash
    cd ui
    npm run deploy
    ```

*Note: Session logs on Vercel are ephemeral. For persistent logging, run locally.*

---

## 🛠️ CLI Usage (Legacy/Advanced)

You can still use the CLI directly:

```bash
# Run from natural language objective
python -m src.main --objective "Create a hello world file"

# Run a specific plan file
python -m src.main plans/example.json

# Interactive mode
python -m src.main -i
```

## Architecture

- **Web UI** (`ui/`): Next.js app for interaction.
- **Planner** (`src/planner.py`): Converts objectives to JSON plans using OpenAI.
- **Agent** (`src/agent.py`): Executes JSON plans step-by-step.
- **Logs** (`logs/sessions/`): JSON storage for session history.

## Governance

We follow the "Rule of 3":
1.  **Probation**: New workflows start here.
2.  **Validated**: After 3 successful runs.
3.  **Graduated**: Fully trusted.
