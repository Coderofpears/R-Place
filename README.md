# R-Place

A comprehensive R-Place server implementation with multiple services working together.

## Quick Start

```bash
python main.py
```

This will start all required services automatically as a single process. Press `Ctrl+C` to stop all services.

## Architecture

This repository contains multiple services that work together:

| Service | Description | Default Port |
|---------|-------------|--------------|
| **repo_server** | Main game server (Colyseus-based) | 3000 |
| **repo_bundle_tracker** | Asset bundle tracking service | 3001 |
| **repo_librekit/frontend** | LibreKit frontend and API layer | 4321 |
| **repo_gimloader** | Client-side loader/mod system | - |
| **repo_client_plugins** | Client plugins system | - |

## Requirements

- **Python 3.8+** - For the orchestrator script
- **Bun** - JavaScript runtime (required for all services)
- **Node.js 18+** - For Astro frontend

### Installing Dependencies

```bash
# Install bun (JavaScript runtime)
curl -fsSL https://bun.sh/install | bash

# Install Node.js (if not already installed)
# macOS: brew install node
# Windows: Download from https://nodejs.org
# Linux: apt install nodejs npm
```

## Usage

### Start All Services (Recommended)

```bash
python main.py
```

This single command starts:
- Game Server (Colyseus-based)
- Bundle Tracker
- LibreKit Frontend

All services run as subprocesses managed by a single Python process.

### Start Services Individually

```bash
# Main game server
cd repo_server && bun run src/index.ts

# Bundle tracker  
cd repo_bundle_tracker && bun run src/server.ts

# LibreKit frontend
cd repo_librekit/frontend && bun run dev
```

## Configuration

See individual service directories for configuration options:

- `repo_server/src/consts.ts` - Server constants
- `repo_server/server.config.ts` - Server configuration
- `repo_librekit/frontend/astro.config.mjs` - Frontend configuration

## Troubleshooting

### bun not found
Make sure bun is installed and in your PATH:
```bash
curl -fsSL https://bun.sh/install | bash
```

### Port already in use
If a port is already in use, stop the existing process or change the port in the service configuration.

### Service fails to start
Check the individual service directories for specific requirements and logs.

## License

MIT
