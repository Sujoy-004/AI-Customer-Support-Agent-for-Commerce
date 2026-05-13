# Backend Schema — Kasparro Track 4: AI Customer Support Agent

---

## Core Entities

### `stores`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `shopify_domain` | VARCHAR UNIQUE | e.g. `mystore.myshopify.com` |
| `access_token` | VARCHAR | Encrypted at rest |
| `plan_tier` | ENUM(`basic`, `pro`) | |
| `created_at` | TIMESTAMPTZ | |

---

### `conversations`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `store_id` | UUID FK → `stores` | |
| `session_token` | VARCHAR | Anonymous or customer-linked |
| `customer_id` | VARCHAR | Shopify customer GID, nullable |
| `status` | ENUM(`active`, `escalated`, `resolved`, `abandoned`) | |
| `escalation_reason` | TEXT | Nullable |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

---

### `messages`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `conversation_id` | UUID FK → `conversations` | |
| `role` | ENUM(`user`, `assistant`, `system`, `tool`) | |
| `content` | TEXT | |
| `tool_name` | VARCHAR | Nullable — e.g. `get_order_status` |
| `tool_input` | JSONB | Nullable |
| `tool_output` | JSONB | Nullable |
| `latency_ms` | INTEGER | |
| `created_at` | TIMESTAMPTZ | |

---

### `orders` *(cache layer — synced from Shopify, TTL-based)*
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `store_id` | UUID FK → `stores` | |
| `shopify_order_id` | VARCHAR UNIQUE | |
| `order_number` | VARCHAR | Human-readable e.g. `#1042` |
| `customer_email` | VARCHAR | |
| `customer_id` | VARCHAR | Shopify GID |
| `financial_status` | VARCHAR | e.g. `paid`, `refunded` |
| `fulfillment_status` | VARCHAR | e.g. `fulfilled`, `partial` |
| `line_items` | JSONB | Array of `{variant_id, title, qty, price}` |
| `shipping_address` | JSONB | |
| `tracking_numbers` | JSONB | Array of tracking numbers |
| `tracking_urls` | JSONB | Array of carrier URLs |
| `total_price` | DECIMAL | |
| `currency` | VARCHAR | ISO 4217 |
| `tags` | VARCHAR[] | |
| `synced_at` | TIMESTAMPTZ | Cache freshness check |

---

### `return_requests`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `store_id` | UUID FK → `stores` | |
| `conversation_id` | UUID FK → `conversations` | |
| `shopify_order_id` | VARCHAR | |
| `line_items` | JSONB | `[{variant_id, qty, reason}]` |
| `reason_code` | ENUM(`damaged`, `wrong_item`, `changed_mind`, `other`) | |
| `customer_notes` | TEXT | |
| `status` | ENUM(`initiated`, `submitted`, `approved`, `rejected`, `completed`) | |
| `shopify_return_id` | VARCHAR | Nullable — set after Shopify API call |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

> **Idempotency constraint:** UNIQUE on `(shopify_order_id, line_items)` to prevent duplicate return submissions.

---

### `products_cache` *(Shopify catalog snapshot, refreshed via webhook)*
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `store_id` | UUID FK → `stores` | |
| `shopify_product_id` | VARCHAR | |
| `title` | VARCHAR | |
| `handle` | VARCHAR | URL slug |
| `description` | TEXT | Stripped HTML |
| `variants` | JSONB | `[{id, sku, price, inventory_qty, options}]` |
| `tags` | VARCHAR[] | |
| `vendor` | VARCHAR | |
| `product_type` | VARCHAR | |
| `embedding` | VECTOR(1536) | For semantic search via pgvector |
| `synced_at` | TIMESTAMPTZ | |

---

### `store_policies`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `store_id` | UUID FK → `stores` | |
| `policy_type` | ENUM(`returns`, `shipping`, `warranty`, `privacy`, `custom`) | |
| `title` | VARCHAR | |
| `content` | TEXT | Plain text policy body |
| `embedding` | VECTOR(1536) | For semantic lookup |
| `version` | INTEGER | Incremented on update |
| `active` | BOOLEAN | |
| `updated_at` | TIMESTAMPTZ | |

---

### `escalations`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `conversation_id` | UUID FK → `conversations` | |
| `trigger_reason` | ENUM(`user_requested`, `low_confidence`, `sensitive_issue`, `repeated_failure`, `policy_edge_case`) | |
| `agent_notes` | TEXT | Summary for human agent |
| `assigned_to` | VARCHAR | Email or Slack handle |
| `resolved_at` | TIMESTAMPTZ | Nullable |
| `created_at` | TIMESTAMPTZ | |

---

### `tool_call_logs` *(audit trail + failure analysis)*
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `conversation_id` | UUID FK → `conversations` | |
| `tool_name` | VARCHAR | e.g. `get_order_status` |
| `input_payload` | JSONB | |
| `output_payload` | JSONB | |
| `status` | ENUM(`success`, `api_error`, `timeout`, `validation_error`, `llm_garbage`) | |
| `error_message` | TEXT | Nullable |
| `duration_ms` | INTEGER | |
| `retried` | BOOLEAN | |
| `created_at` | TIMESTAMPTZ | |

---

## Indexes

```sql
-- Conversation message retrieval
CREATE INDEX ON messages(conversation_id, created_at);

-- Order lookup by customer
CREATE INDEX ON orders(store_id, customer_email);
CREATE INDEX ON orders(shopify_order_id);

-- Return lookup by conversation
CREATE INDEX ON return_requests(conversation_id);

-- Tool failure analysis
CREATE INDEX ON tool_call_logs(conversation_id, status);

-- Semantic search (pgvector)
CREATE INDEX ON products_cache USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX ON store_policies USING ivfflat (embedding vector_cosine_ops);
```

---

## Entity Relationship Summary

```
stores
  ├── conversations
  │     ├── messages
  │     ├── return_requests
  │     ├── escalations
  │     └── tool_call_logs
  ├── orders
  ├── products_cache
  └── store_policies
```

---

## Out of Scope (Deliberate Cuts)
- Exchange/reorder workflows (no `exchanges` table)
- Merchant analytics dashboard tables
- Multi-language content variants
- Loyalty / reward points tables
- Push notification queues
