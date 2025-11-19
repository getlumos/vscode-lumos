# CLAUDE.md - LUMOS VSCode Extension

**Repository:** https://github.com/getlumos/vscode-lumos
**Website:** https://lumos-lang.org
**Purpose:** VSCode extension providing syntax highlighting, snippets, and commands for `.lumos` files

---

## What This Extension Does

Provides first-class VSCode support for LUMOS schema language:
- **Syntax Highlighting** - 26 TextMate grammar rules
- **Code Snippets** - 13 productivity snippets
- **Commands** - Generate code, validate schemas
- **Auto-generation** - Optional on-save code generation

---

## File Structure

```
vscode-lumos/
├── src/extension.ts              # Extension activation & commands
├── syntaxes/lumos.tmLanguage.json # TextMate grammar (26 rules)
├── snippets/lumos.json            # 13 code snippets
├── language-configuration.json    # Brackets, comments, auto-closing
├── package.json                   # Extension manifest
├── icon.png                       # Extension icon (128×128)
└── out/extension.js               # Compiled output
```

---

## Key Features

| Feature | Details |
|---------|---------|
| **Syntax Highlighting** | Keywords, attributes, types, comments, Solana types |
| **Snippets** | `solstruct`, `account`, `enumu/t/s`, field shortcuts |
| **Commands** | `LUMOS: Generate Code`, `LUMOS: Validate Schema` |
| **Auto-generation** | Setting: `lumos.codeGeneration.autoGenerate` |
| **File Association** | `.lumos` files automatically recognized |

---

## Snippets Reference

| Prefix | Expands To |
|--------|------------|
| `solstruct` | Basic Solana struct |
| `account` | #[account] struct |
| `enumu` | Unit variant enum |
| `enumt` | Tuple variant enum |
| `enums` | Struct variant enum |
| `fpubkey` | PublicKey field |
| `fu64` | u64 field |
| `fstring` | String field |
| `farray` | Vec field |
| `foption` | Option field |

---

## Commands

### 1. Generate Code
**ID:** `lumos.generate`
**Action:** Runs `lumos generate` on current file
**Requires:** LUMOS CLI installed (`cargo install lumos-cli`)

### 2. Validate Schema
**ID:** `lumos.validate`
**Action:** Runs `lumos validate` on current file
**Requires:** LUMOS CLI installed

---

## Development Commands

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch mode (auto-recompile)
npm run watch

# Package extension
npm run package
# → Creates: lumos-0.1.0.vsix

# Install locally
code --install-extension lumos-0.1.0.vsix
```

---

## TextMate Grammar

**Scopes defined:**
- `keyword.control.lumos` - #[solana], #[account], struct, enum
- `storage.type.lumos` - u8-u128, i8-i128, bool, String, PublicKey
- `entity.name.type.lumos` - Type names
- `comment.line.lumos` - // comments
- `constant.numeric.lumos` - Numbers

**File:** `syntaxes/lumos.tmLanguage.json` (26 rules)

---

## Extension Configuration

### Settings (package.json)

```json
{
  "lumos.validation.enabled": {
    "type": "boolean",
    "default": true
  },
  "lumos.codeGeneration.autoGenerate": {
    "type": "boolean",
    "default": false
  }
}
```

---

## Publishing Checklist

- [x] Extension compiled and packaged
- [x] Icon created (Radiant Precision design)
- [x] Syntax highlighting tested
- [x] All 13 snippets working
- [x] Commands functional
- [x] README documentation complete
- [x] CHANGELOG added
- [x] Dual MIT/Apache-2.0 licensed
- [x] Homepage updated (lumos-lang.org)
- [ ] Published to VS Marketplace

---

## AI Assistant Guidelines

### ✅ DO:
- Test syntax highlighting after grammar changes
- Verify snippets expand correctly in VSCode
- Compile before packaging (`npm run compile`)
- Update version in package.json for releases

### ❌ DON'T:
- Modify grammar without testing in VSCode
- Change snippet prefixes (users expect consistency)
- Skip compilation before packaging
- Forget to update CHANGELOG for new features

---

## Related Repositories

- **lumos** - Core library and CLI (required for commands)
- **awesome-lumos** - Community examples using this extension

---

**Last Updated:** 2025-11-18
**Status:** Ready for VS Marketplace publishing
