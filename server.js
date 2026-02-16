console.error("❌ [Error] You are trying to run 'server.js' from the root directory.");
console.error("👉 Please use './run-all.sh' to start all systems (recommended).");
console.error("👉 Or run 'cd system/backend && node server.js' to start only the main backend.");
process.exit(1);
