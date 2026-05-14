# External Integrations

**Last Updated:** 2026-05-14

## Core Platform Integrations
- **OpenCode** - Primary integration point
  - The ECC plugin extends OpenCode functionality
  - Integrates via OpenCode's plugin API (`@opencode-ai/plugin`)
  - Provides agents, commands, skills, and hooks to the OpenCode ecosystem

## Development & Tooling Integrations
- **Node.js/npm Ecosystem**
  - Published as an npm package (`ecc-universal`)
  - Uses standard npm workflows for dependency management and publishing
  - Compatible with Node.js >=18.0.0

- **TypeScript Toolchain**
  - Full TypeScript support with type checking
  - Integrates with IDEs for IntelliSense and refactoring
  - Uses tsc for compilation

## Agent & Skill Framework Integrations
- **Specialized Skills** - The plugin includes various skills that may integrate with external services:
  - **API Design Skills** - For designing REST APIs that might integrate with external services
  - **MCP Server Patterns** - For building Model Context Protocol servers
  - **Exa Search** - Neural search via Exa MCP for web, code, and company research
  - **Firecrawl** - Web scraping capabilities (mentioned in deep-research skill)
  - **Fal.ai Media** - Unified media generation via fal.ai MCP (image, video, audio)
  - **X/Twitter API** - Integration for posting tweets, threads, reading timelines

## Communication & Collaboration Tools
- **GitHub** - Version control and collaboration
  - Repository hosted on GitHub
  - Issues and PRs for project management
  - Potential integration points for CI/CD

## Potential Integration Points (Based on Skills)
While the current codebase focuses on the OpenCode plugin framework itself, the included skills suggest potential integration capabilities:

1. **Web Search & Research**
   - Exa Search API for neural web search
   - Firecrawl for web scraping
   - Could integrate with search engines or research APIs

2. **Media Generation**
   - Fal.ai MCP for AI-generated images, video, and audio
   - Could integrate with media generation services

3. **Social Media**
   - X/Twitter API integration skills
   - Could integrate with Twitter/X for social media automation

4. **Machine Learning**
   - MLE workflow skills suggest potential ML integrations
   - Could integrate with ML platforms or APIs

5. **Communication Platforms**
   - Crosspost skill for distributing content across X, LinkedIn, Threads, and Bluesky
   - Suggests potential integration with these platforms

## Database & Storage
- No direct database integrations visible in the core plugin
- Skills may suggest patterns for database integration
- Likely relies on host OpenCode environment for persistence

## Authentication & Authorization
- No explicit auth integrations in core plugin
- Skills include security-review patterns that could be applied to integrations
- Would likely use OpenCode's authentication mechanisms

## Notes on Integration Approach
1. **Plugin-First Design** - The primary integration is with OpenCode itself
2. **Skill-Based Extensions** - Individual skills may contain patterns for external integrations
3. **Modular Design** - Each skill can be developed independently with its own integration patterns
4. **Standard Protocols** - Uses standard web protocols (REST, MCP) where applicable
5. **Configuration-Driven** - Integrations likely configured through OpenCode's configuration system

## Future Integration Considerations
- Evaluate specific customer support agent needs for Shopify integration
- Consider e-commerce platform APIs (Shopify, WooCommerce, etc.)
- Assess need for CRM integrations (Salesforce, HubSpot, etc.)
- Review communication channel integrations (email, SMS, chat platforms)