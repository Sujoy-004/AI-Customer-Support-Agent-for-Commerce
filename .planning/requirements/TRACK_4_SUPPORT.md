# 📜 High-Fidelity Requirements: Track 4 Support Agent

## 🎯 Core Directive
Build a "Store-Native" agent. Most bots are FAQ search wrappers; this must be a deep integration that understands the store's data, policies, and edge cases.

## 🛠️ Mandatory Workflows
1.  **Product Intelligence**: 
    - Must answer queries based on live store data (Catalog, Sizing, Stock).
    - **No Hallucinations**: Ground responses in the Shopify context.
2.  **Policy Execution**:
    - Accurately explain and apply store policies (Returns, Shipping, Warranty).
3.  **Active Workflows**:
    - **Order Status/Tracking**: Not just "Your order is shipped," but a real workflow integration.
    - **Return Initiation**: Trigger a real return process within the conversation.
4.  **Graceful Handoff**:
    - Detect complex cases and escalate to human support without friction.

## ⚖️ Quality Constraints (Judging)
- **Technical Execution (25%)**: Evidence of failure handling (e.g., Shopify API downtime or LLM garbage).
- **Product Thinking (25%)**: Evidence of scoping (what you chose *not* to build).
- **Product Experience (20%)**: High-fidelity interaction and UI.

## 📦 Required Artifacts
- [ ] **DECISION_LOG.md**: (Running list of choices).
- [ ] **PRODUCT_DOC.md**: (Problem, Journey, Tradeoffs).
- [ ] **TECHNICAL_DOC.md**: (Architecture, Failure Handling).
