
import sys
import os
import json
sys.path.append(os.getcwd())

def test_api_tool():
    print("Testing api_request tool...")
    try:
        from src.tools.registry import TOOLS
        if 'api_request' not in TOOLS:
            print("❌ api_request not found in registry")
            return False
            
        api_tool = TOOLS['api_request']
        # Test against a known safe public API (or mock it, but we can just use jsonplaceholder)
        result = api_tool(method="GET", url="https://jsonplaceholder.typicode.com/todos/1")
        
        if result['status'] == 200 and 'content' in result:
            print("✅ api_request success")
            return True
        else:
            print(f"❌ api_request failed: {result}")
            return False
    except Exception as e:
        print(f"❌ api_request exception: {e}")
        return False

def test_governance():
    print("Testing governance file...")
    path = "governance/workflows.json"
    if not os.path.exists(path):
        print(f"❌ {path} not found")
        return False
    try:
        with open(path, 'r') as f:
            data = json.load(f)
            if "workflows" in data and len(data["workflows"]) > 0:
                print("✅ governance file valid")
                return True
            else:
                print("❌ governance file schema invalid")
                return False
    except Exception as e:
        print(f"❌ governance file error: {e}")
        return False

if __name__ == "__main__":
    t1 = test_api_tool()
    t2 = test_governance()
    
    if t1 and t2:
        print("ALL CHECKS PASSED")
        sys.exit(0)
    else:
        print("CHECKS FAILED")
        sys.exit(1)
