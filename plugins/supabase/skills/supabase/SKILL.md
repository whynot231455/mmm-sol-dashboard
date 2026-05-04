---
name: supabase
description: Use Supabase MCP for repo-local database inspection, docs lookup, schema typing, and project-scoped workflows.
---

# Supabase

Use this plugin when work in this repository needs Supabase context, especially:

- inspecting database tables and extensions
- generating TypeScript types from the schema
- searching Supabase docs
- checking advisors or logs in development

## Repo setup

- Prefer the hosted MCP server at `https://mcp.supabase.com/mcp?project_ref=qicjqefgbxsqsyeyidci`.
- Prefer a development or staging Supabase project, not production.
- This repo already pins the project ref in `.mcp.json`.
- Only suggest write-capable changes after the user asks for them explicitly.

## Environment

`SUPABASE_PROJECT_REF` exists in this repo's `.env`, but the MCP URL is already pinned to this repo's project ref.

## Suggested usage

- Start with discovery tools like `list_tables`, `list_extensions`, or `search_docs`.
- Use `generate_typescript_types` when schema changes affect frontend or backend types.
- Use `get_advisors` and `get_logs` for debugging before proposing code changes.

## Escalation

If the task requires mutations such as `apply_migration`, `execute_sql`, or function deployment, pause and confirm before running them.
