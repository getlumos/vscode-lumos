# CLAUDE.md - LUMOS VSCode Extension

**Repository:** https://github.com/getlumos/vscode-lumos
**Website:** https://lumos-lang.org
**Version:** 0.5.0
**Purpose:** VSCode extension providing complete development support for `.lumos` schema files

---

## What This Extension Does

Provides first-class VSCode support for LUMOS schema language:
- **Syntax Highlighting** - 26 TextMate grammar rules
- **Code Snippets** - 13 productivity snippets
- **Intelligent Auto-Completion** - Context-aware IntelliSense
- **Error Diagnostics** - Real-time syntax validation
- **Quick Fix Suggestions** - One-click error corrections
- **Format-on-Save** - Automatic code formatting
- **Commands** - Generate code, validate schemas

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
| **IntelliSense** | Context-aware completions for types, attributes, keywords |
| **Error Diagnostics** | Real-time validation with red squiggles (500ms debounced) |
| **Quick Fixes** | One-click fixes for missing colons, semicolons, type casing |
| **Code Formatting** | Format-on-save with configurable indentation and alignment |
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
    "default": true,
    "description": "Enable/disable LUMOS schema validation"
  },
  "lumos.codeGeneration.autoGenerate": {
    "type": "boolean",
    "default": false,
    "description": "Automatically generate Rust/TypeScript on save"
  },
  "lumos.format.indentSize": {
    "type": "number",
    "default": 4,
    "enum": [2, 4],
    "description": "Number of spaces for indentation (2 or 4)"
  },
  "lumos.format.sortAttributes": {
    "type": "boolean",
    "default": true,
    "description": "Sort attributes alphabetically"
  },
  "lumos.format.alignFields": {
    "type": "boolean",
    "default": true,
    "description": "Align colons in struct fields"
  }
}
```

---

## Feature Evolution

### v0.5.0 - Quick Fix Suggestions (2025-11-19)
- One-click fixes for common syntax errors
- Lightbulb icon with code actions
- Fixes: missing colons, semicolons, type casing, missing attributes
- Context-aware suggestions based on error messages

### v0.4.0 - Format-on-Save (2025-11-19)
- Automatic code formatting with `DocumentFormattingEditProvider`
- Configurable indentation (2 or 4 spaces)
- Attribute sorting (alphabetical)
- Field alignment (colon alignment in structs)
- Works with VSCode's `editor.formatOnSave`

### v0.3.0 - Intelligent Auto-Completion (2025-11-19)
- Context-aware IntelliSense via `CompletionItemProvider`
- 20+ completion items (types, attributes, keywords)
- Smart snippet insertion with tab stops
- Trigger characters: `.`, `<`, `#`, `[`, `:`

### v0.2.0 - Error Diagnostics (2025-11-19)
- Real-time validation using `lumos validate` CLI
- Red squiggles for syntax errors
- Intelligent error location detection
- 500ms debounced validation

### v0.1.0 - Initial Release (2025-11-17)
- Syntax highlighting with TextMate grammar
- 13 code snippets
- Language configuration (brackets, comments)
- Basic commands (generate, validate)

---

## Publishing Checklist

- [x] Extension compiled and packaged
- [x] Icon created (Radiant Precision design)
- [x] Syntax highlighting tested
- [x] All 13 snippets working
- [x] Commands functional
- [x] Error diagnostics implemented (v0.2.0)
- [x] Auto-completion implemented (v0.3.0)
- [x] Format-on-save implemented (v0.4.0)
- [x] Quick fixes implemented (v0.5.0)
- [x] README documentation complete
- [x] CHANGELOG comprehensive (0.1.0 - 0.5.0)
- [x] Dual MIT/Apache-2.0 licensed
- [x] Homepage updated (lumos-lang.org)
- [x] **Published to VS Marketplace** ✅ (2025-11-20)

---

## Quick Reference

### Development Workflow
1. Make changes to `src/extension.ts` or grammar/snippets
2. Run `npm run compile` to build TypeScript
3. Press F5 in VSCode to launch Extension Development Host
4. Test changes in the debug window
5. Update CHANGELOG.md with feature details
6. Bump version in package.json
7. Commit with descriptive message (e.g., "feat: Add feature (vX.X.X)")

### Release Workflow
1. Ensure all changes committed and pushed
2. Run `npm run package` to create .vsix
3. Test .vsix installation: `code --install-extension lumos-X.X.X.vsix`
4. Create git tag: `git tag vX.X.X && git push --tags`
5. Publish: `vsce publish` (requires publisher token)

### Testing Checklist
- [ ] Syntax highlighting works for all LUMOS keywords/types
- [ ] All snippets expand correctly (test each prefix)
- [ ] IntelliSense suggestions appear in correct contexts
- [ ] Error diagnostics show up for invalid syntax
- [ ] Quick fixes appear and work correctly
- [ ] Format-on-save produces expected output
- [ ] Commands execute without errors

---

## AI Assistant Guidelines

### ✅ DO:
- Test syntax highlighting after grammar changes
- Verify snippets expand correctly in VSCode
- Compile before packaging (`npm run compile`)
- Update version in package.json for releases
- Update CHANGELOG.md for all user-facing changes
- Test all features in Extension Development Host (F5)
- Document new configuration settings in both CLAUDE.md and README.md

### ❌ DON'T:
- Modify grammar without testing in VSCode
- Change snippet prefixes (users expect consistency)
- Skip compilation before packaging
- Forget to update CHANGELOG for new features
- Add features without updating documentation
- Break existing functionality when adding new features

---

## Related Repositories

- **lumos** - Core library and CLI (required for commands)
- **awesome-lumos** - Community examples using this extension

---

## Current Status

**Version:** 0.5.0
**Last Updated:** 2025-11-21
**Status:** ✅ **PUBLISHED TO VS MARKETPLACE**

### Marketplace Info
- **Publisher:** getlumos
- **Extension ID:** getlumos.lumos
- **Published:** 2025-11-20
- **Size:** 1.43MB
- **Categories:** Programming Languages, Snippets, Linters
- **Marketplace URL:** https://marketplace.visualstudio.com/items?itemName=getlumos.lumos

### Uncommitted Changes (git status)
- `README.md` - Updated documentation
- `package.json` - Updated description with tagline
- Icon assets (`icon-32.png`, `icon-64.png`, `icon-512.png`, `icon.png`, `logo.png`)

### Next Steps
1. ✅ ~~Publish to VS Marketplace~~ **DONE!**
2. Commit current CLAUDE.md updates
3. Announce release on lumos-lang.org
4. Monitor user feedback and ratings
5. Plan v0.6.0 features based on community needs

---

## Technical Debt

Currently none tracked. Extension is production-ready.
