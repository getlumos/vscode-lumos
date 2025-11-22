# CLAUDE.md - VSCode Extension

> **Ecosystem Context:** See [getlumos/lumos/CLAUDE.md](https://github.com/getlumos/lumos/blob/main/CLAUDE.md) for LUMOS ecosystem overview, cross-repo standards, and shared guidelines.

---

## Architecture

- `src/extension.ts` - Extension activation & commands
- `syntaxes/lumos.tmLanguage.json` - TextMate grammar (26 rules)
- `snippets/lumos.json` - 13 code snippets
- `package.json` - Extension manifest

---

## Development

```bash
npm install
npm run compile       # Build extension
npm run watch        # Watch mode
```

---

## Packaging & Publishing

```bash
vsce package        # Create .vsix
vsce publish        # Publish to marketplace (requires PAT)
```

---

## Gotchas

- Grammar changes require VS Code reload (Cmd+R in Extension Development Host)
- Use `vscode` namespace, not `vscode-languageserver` (that's for LSP)
- Test with both light and dark themes
- Validation uses 500ms debounce to avoid excessive CLI calls

---

**Status:** v0.5.0 published to VS Marketplace
**Last Updated:** 2025-11-22
