"""Static site build and deploy tools."""

import subprocess
import shutil
from pathlib import Path


def build_site(command: str, cwd: str = ".") -> dict:
    """
    Run a build command for a static site.
    
    Args:
        command: Build command to run (e.g., "npm run build")
        cwd: Working directory
    
    Returns:
        Result dict with build output
    """
    result = subprocess.run(
        command,
        shell=True,
        cwd=cwd,
        capture_output=True,
        text=True,
    )
    
    if result.returncode != 0:
        raise RuntimeError(f"Build failed: {result.stderr.strip()}")
    
    return {
        "message": "Build completed successfully",
        "output": result.stdout[:1000],  # Truncate long output
        "returncode": result.returncode,
    }


def deploy(
    provider: str,
    source_dir: str = "dist",
    project_name: str = None,
    **config
) -> dict:
    """
    Deploy a static site to a hosting provider.
    
    Args:
        provider: Hosting provider (vercel, netlify, github-pages, surge)
        source_dir: Directory containing built files
        project_name: Project name (optional)
        **config: Provider-specific configuration
    
    Returns:
        Result dict with deploy URL
    """
    source = Path(source_dir)
    if not source.exists():
        raise FileNotFoundError(f"Source directory not found: {source_dir}")
    
    provider = provider.lower()
    
    if provider == "vercel":
        return _deploy_vercel(source, project_name)
    elif provider == "netlify":
        return _deploy_netlify(source, project_name)
    elif provider == "surge":
        return _deploy_surge(source, config.get("domain"))
    elif provider == "github-pages":
        return _deploy_github_pages(source)
    else:
        raise ValueError(f"Unknown provider: {provider}. Supported: vercel, netlify, surge, github-pages")


def _deploy_vercel(source: Path, project_name: str = None) -> dict:
    """Deploy to Vercel."""
    args = ["npx", "vercel", str(source), "--yes"]
    if project_name:
        args.extend(["--name", project_name])
    
    result = subprocess.run(args, capture_output=True, text=True)
    
    if result.returncode != 0:
        raise RuntimeError(f"Vercel deploy failed: {result.stderr}")
    
    # Extract URL from output
    url = result.stdout.strip().split("\n")[-1]
    
    return {
        "message": f"Deployed to Vercel",
        "url": url,
        "provider": "vercel",
    }


def _deploy_netlify(source: Path, project_name: str = None) -> dict:
    """Deploy to Netlify."""
    args = ["npx", "netlify-cli", "deploy", "--dir", str(source), "--prod"]
    
    result = subprocess.run(args, capture_output=True, text=True)
    
    if result.returncode != 0:
        raise RuntimeError(f"Netlify deploy failed: {result.stderr}")
    
    return {
        "message": "Deployed to Netlify",
        "output": result.stdout[:500],
        "provider": "netlify",
    }


def _deploy_surge(source: Path, domain: str = None) -> dict:
    """Deploy to Surge.sh."""
    args = ["npx", "surge", str(source)]
    if domain:
        args.append(domain)
    
    result = subprocess.run(args, capture_output=True, text=True)
    
    if result.returncode != 0:
        raise RuntimeError(f"Surge deploy failed: {result.stderr}")
    
    return {
        "message": "Deployed to Surge",
        "output": result.stdout[:500],
        "provider": "surge",
    }


def _deploy_github_pages(source: Path) -> dict:
    """Deploy to GitHub Pages using gh-pages."""
    result = subprocess.run(
        ["npx", "gh-pages", "-d", str(source)],
        capture_output=True,
        text=True,
    )
    
    if result.returncode != 0:
        raise RuntimeError(f"GitHub Pages deploy failed: {result.stderr}")
    
    return {
        "message": "Deployed to GitHub Pages",
        "provider": "github-pages",
    }
