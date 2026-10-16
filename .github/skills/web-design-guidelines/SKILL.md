---
name: web-design-guidelines
description: Review UI code for Web Interface Guidelines compliance. Use when asked to "review my UI", "check accessibility", "audit design", "review UX", or "check my site against best practices".
metadata:
  author: vercel
  version: "1.0.0"
  argument-hint: <file-or-pattern>
---

# Web Interface Guidelines

Review files for compliance with Web Interface Guidelines.

## How It Works

1. Read the locally pinned rules in `references/command.md`
2. Read the specified files (or ask which files/pattern to review)
3. Check the target code against the rules, prioritizing concrete accessibility, mobile, and usability defects
4. Output actionable findings with file and line references

## Guidelines Source

The vendored snapshot is from:

```
https://github.com/vercel-labs/web-interface-guidelines
```

Use the pinned local copy for routine reviews. If a task specifically requires the latest upstream rules, refresh the snapshot from the source repository and note that the rules changed; do not assume a network-fetch tool is available.

## Usage

When a user provides a file or pattern argument:
1. Read `references/command.md`
2. Read the specified files
3. Apply relevant rules from the local snapshot
4. Output findings with file and line references

If no files specified, ask the user which files to review.
