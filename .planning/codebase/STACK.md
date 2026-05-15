# Technology Stack

**Last Updated:** 2026-05-14

## Languages & Runtimes
- **TypeScript** - Primary language for ECC plugin and skills
  - Version: >=5.3.0 (from devDependencies)
  - Used in: `.opencode/` directory for agent/skill implementations
- **JavaScript/Node.js** - Runtime environment
  - Version: >=18.0.0 (from package.json engines)
  - Powers the OpenCode agent system

## Frameworks & Libraries
- **OpenCode Plugin System** - Core framework for extending OpenCode functionality
  - Dependency: `@opencode-ai/plugin: 1.14.50`
  - Provides agent, command, skill, and hook APIs
- **Everything Claude Code (ECC)** - The plugin being developed
  - Provides agents, commands, hooks, and skills for OpenCode
  - Modular structure with separate directories for each concern

## Build Tools & Configuration
- **TypeScript Compiler (tsc)** - Used for building the plugin
  - Configured via `tsconfig.json`
  - Scripts: `build` (tsc), `clean` (rm -rf dist), `prepublishOnly` (npm run build)
- **Node Package Manager (npm)** - Dependency management
  - Standard npm workflows for publishing and installation

## Configuration Files
- **opencode.json** - Main OpenCode plugin configuration
- **tsconfig.json** - TypeScript compiler configuration
- **package.json** - Project metadata and dependencies
- **.gitignore** - Git exclusion rules
- **.npmignore** - npm publication exclusion rules

## Key Directories
- `.opencode/` - Contains the ECC plugin source code
  - `agents/` - AI agent implementations
  - `commands/` - CLI command definitions
  - `prompts/` - Agent prompt templates
  - `instructions/` - Skill instructions
  - `tools/` - Utility scripts
  - `plugins/` - Plugin interfaces
  - `skills/` - Specialized skill implementations

## External Dependencies
- **@opencode-ai/plugin** - Core OpenCode plugin API (v1.14.50)
- **TypeScript** - Language and compiler (^5.3.0)
- **@types/node** - Node.js type definitions (^20.0.0)
- **typescript** - TypeScript compiler (^5.3.0)

## Development Practices
- **Modular Architecture** - Separation of concerns across directories
- **Typed Codebase** - TypeScript for type safety and IDE support
- **npm Package** - Published as an installable OpenCode plugin
- **MIT License** - Permissive open-source licensing