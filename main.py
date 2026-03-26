#!/usr/bin/env python3
"""
R-Place QuickStart - Single Process Server Orchestrator

This script starts all required R-Place services as subprocesses
and manages them from a single process.

Usage:
    python main.py

Press Ctrl+C to stop all services.
"""

import os
import sys
import signal
import subprocess
import shutil
from pathlib import Path
from typing import Optional
import threading
import time


class Colors:
    """ANSI color codes for terminal output."""
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'


class Service:
    """Represents a service to be started."""
    
    def __init__(self, name: str, directory: str, command: list[str], 
                 required: bool = True, env: Optional[dict] = None):
        self.name = name
        self.directory = directory
        self.command = command
        self.required = required
        self.env = env or os.environ.copy()
        self.process: Optional[subprocess.Popen] = None
        self.failed = False
    
    def start(self) -> bool:
        """Start the service."""
        try:
            print(f"{Colors.CYAN}Starting {Colors.BOLD}{self.name}{Colors.ENDC}{Colors.CYAN}...{Colors.ENDC}")
            
            self.process = subprocess.Popen(
                self.command,
                cwd=self.directory,
                env=self.env,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1
            )
            
            # Start output reader thread
            threading.Thread(target=self._read_output, daemon=True).start()
            
            # Give it a moment to start
            time.sleep(0.5)
            
            # Check if it crashed immediately
            if self.process.poll() is not None:
                print(f"{Colors.RED}✗ {self.name} failed to start{Colors.ENDC}")
                self.failed = True
                return False
            
            print(f"{Colors.GREEN}✓ {self.name} started{Colors.ENDC}")
            return True
            
        except Exception as e:
            print(f"{Colors.RED}✗ Error starting {self.name}: {e}{Colors.ENDC}")
            self.failed = True
            return False
    
    def _read_output(self):
        """Read and print service output."""
        if self.process and self.process.stdout:
            for line in self.process.stdout:
                print(f"{Colors.BLUE}[{self.name}]{Colors.ENDC} {line.rstrip()}")
    
    def stop(self):
        """Stop the service."""
        if self.process:
            try:
                self.process.terminate()
                try:
                    self.process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    self.process.kill()
                print(f"{Colors.YELLOW}Stopped {self.name}{Colors.ENDC}")
            except Exception as e:
                print(f"{Colors.RED}Error stopping {self.name}: {e}{Colors.ENDC}")


class ServerOrchestrator:
    """Manages all R-Place services."""
    
    def __init__(self):
        self.base_dir = Path(__file__).parent.absolute()
        self.services: list[Service] = []
        self.running = True
        self.setup_signal_handlers()
    
    def setup_signal_handlers(self):
        """Setup handlers for graceful shutdown."""
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
    
    def _signal_handler(self, signum, frame):
        """Handle shutdown signals."""
        print(f"\n{Colors.YELLOW}Shutting down all services...{Colors.ENDC}")
        self.running = False
        self.stop_all()
        sys.exit(0)
    
    def check_dependencies(self) -> bool:
        """Check if required dependencies are installed."""
        print(f"{Colors.BOLD}Checking dependencies...{Colors.ENDC}")
        
        # Check for bun
        if not shutil.which("bun"):
            print(f"{Colors.RED}✗ bun not found. Please install bun: https://bun.sh{Colors.ENDC}")
            return False
        print(f"{Colors.GREEN}✓ bun found{Colors.ENDC}")
        
        # Check for node (for astro)
        if not shutil.which("node"):
            print(f"{Colors.RED}✗ node not found. Please install Node.js: https://nodejs.org{Colors.ENDC}")
            return False
        print(f"{Colors.GREEN}✓ node found{Colors.ENDC}")
        
        return True
    
    def setup_services(self):
        """Configure all services to start."""
        # Main server (Colyseus-based game server)
        self.services.append(Service(
            name="Game Server",
            directory=str(self.base_dir / "repo_server"),
            command=["bun", "run", "src/index.ts"],
            required=True
        ))
        
        # Bundle tracker
        self.services.append(Service(
            name="Bundle Tracker",
            directory=str(self.base_dir / "repo_bundle_tracker"),
            command=["bun", "run", "src/server.ts"],
            required=False
        ))
        
        # LibreKit frontend
        self.services.append(Service(
            name="LibreKit Frontend",
            directory=str(self.base_dir / "repo_librekit/frontend"),
            command=["bun", "run", "dev"],
            required=False,
            env={**os.environ.copy(), "HOST": "0.0.0.0"}
        ))
    
    def start_all(self) -> bool:
        """Start all services."""
        print(f"\n{Colors.BOLD}{Colors.HEADER}{'='*50}{Colors.ENDC}")
        print(f"{Colors.BOLD}{Colors.HEADER}R-Place Server QuickStart{Colors.ENDC}")
        print(f"{Colors.BOLD}{Colors.HEADER}{'='*50}{Colors.ENDC}\n")
        
        if not self.check_dependencies():
            return False
        
        self.setup_services()
        
        print(f"\n{Colors.BOLD}Starting services...{Colors.ENDC}\n")
        
        failed_required = False
        
        for service in self.services:
            if not service.start():
                if service.required:
                    failed_required = True
                    print(f"{Colors.RED}Required service {service.name} failed. Aborting.{Colors.ENDC}")
                    self.stop_all()
                    return False
                else:
                    print(f"{Colors.YELLOW}Optional service {service.name} failed. Continuing...{Colors.ENDC}")
        
        if failed_required:
            return False
        
        print(f"\n{Colors.GREEN}{Colors.BOLD}All services started successfully!{Colors.ENDC}")
        print(f"{Colors.CYAN}Press Ctrl+C to stop all services{Colors.ENDC}\n")
        
        return True
    
    def stop_all(self):
        """Stop all services."""
        for service in reversed(self.services):
            service.stop()
    
    def wait(self):
        """Wait for all services to complete."""
        try:
            while self.running:
                # Check if any required service has died
                for service in self.services:
                    if service.process and service.process.poll() is not None:
                        if service.required:
                            print(f"{Colors.RED}Required service {service.name} died. Shutting down.{Colors.ENDC}")
                            self.running = False
                            self.stop_all()
                            sys.exit(1)
                        else:
                            print(f"{Colors.YELLOW}Optional service {service.name} died.{Colors.ENDC}")
                
                time.sleep(1)
        except KeyboardInterrupt:
            self.running = False
            self.stop_all()
    
    def run(self):
        """Main entry point."""
        if self.start_all():
            self.wait()


def main():
    """Main function."""
    orchestrator = ServerOrchestrator()
    orchestrator.run()


if __name__ == "__main__":
    main()
