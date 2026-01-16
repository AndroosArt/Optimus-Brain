import os
import sys

REQUIRED_KEYS = ["OPENAI_API_KEY", "VERCEL_TOKEN"]
ENV_FILE = ".env"
GITIGNORE_FILE = ".gitignore"

def check_gitignore():
    print(f"Checking {GITIGNORE_FILE}...")
    if not os.path.exists(GITIGNORE_FILE):
        # Create if missing (though strictly we should probably query, but requirement says 'append it immediately')
        # We'll just append to a new file effectively.
        pass
    
    ignored = False
    if os.path.exists(GITIGNORE_FILE):
        with open(GITIGNORE_FILE, 'r') as f:
            content = f.read()
            if ENV_FILE in content:
                ignored = True
    
    if not ignored:
        print(f"⚠️  SECURITY WARNING: {ENV_FILE} is not in {GITIGNORE_FILE}. Appending now.")
        with open(GITIGNORE_FILE, 'a') as f:
            f.write(f"\n{ENV_FILE}\n")
        print(f"   Secured {ENV_FILE} in {GITIGNORE_FILE}.")
    else:
        print(f"   {ENV_FILE} is already ignored.")

def setup_secrets():
    print(f"Checking {ENV_FILE}...")
    
    # Load existing secrets
    current_secrets = {}
    if os.path.exists(ENV_FILE):
        with open(ENV_FILE, 'r') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#'):
                    continue
                if '=' in line:
                    key, value = line.split('=', 1)
                    current_secrets[key.strip()] = value.strip()
    else:
        print(f"   {ENV_FILE} not found. Creating it.")
        # Just create empty file to ensure it exists for appending later if needed, 
        # or we just write at the end.
        with open(ENV_FILE, 'w') as f:
            pass

    # Process keys
    new_secrets = current_secrets.copy()
    updated = False
    
    for key in REQUIRED_KEYS:
        value = new_secrets.get(key)
        if not value:
            try:
                user_value = input(f"Enter value for {key}: ").strip()
                if user_value:
                    new_secrets[key] = user_value
                    updated = True
            except KeyboardInterrupt:
                print("\nOperation cancelled.")
                sys.exit(1)
        else:
            print(f"   {key} is already set.")

    # Write back if updated
    if updated:
        with open(ENV_FILE, 'w') as f:
            for key, value in new_secrets.items():
                f.write(f"{key}={value}\n")
        print("   Updated .env with new secrets.")
    
    print("✅ Secrets configured and secured.")

if __name__ == "__main__":
    print("--- Antigravity Security Setup ---")
    check_gitignore()
    setup_secrets()
