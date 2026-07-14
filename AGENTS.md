<!-- Satellite context file — extends the global hub (~/.claude/CLAUDE.md | ~/.pi/agent/AGENTS.md). Host-neutral; project-specific only. Do not duplicate hub standards here. -->

# VSCode LUMOS Extension

> VSCode extension for `.lumos` files — syntax highlighting, IntelliSense, diagnostics, and commands.

**Ecosystem context:** See [getlumos/lumos/AGENTS.md](https://github.com/getlumos/lumos/blob/main/AGENTS.md) for the LUMOS ecosystem overview, cross-repo standards, and shared guidelines.

## Architecture

- `src/extension.ts` - Extension activation & commands
- `syntaxes/lumos.tmLanguage.json` - TextMate grammar (26 rules)
- `snippets/lumos.json` - 13 code snippets
- `package.json` - Extension manifest

## Common Commands

```bash
npm install
npm run compile    # Build extension
npm run watch     # Watch mode
```

## Packaging & Publishing

```bash
vsce package      # Create .vsix
vsce publish      # Publish to marketplace (requires PAT)
```

## Gotchas

- Grammar changes require VS Code reload (Cmd+R in Extension Development Host)
- Use `vscode` namespace, not `vscode-languageserver` (that's for LSP)
- Test with both light and dark themes
- Validation uses 500ms debounce to avoid excessive CLI calls

**Status:** v0.5.0 published to VS Marketplace