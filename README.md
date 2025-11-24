# LUMOS Language Support for VSCode

> **Write once. Deploy Everywhere.**

Official VSCode extension for the LUMOS schema language - a type-safe, cross-language schema definition language for Solana development.

## Features

### 🚀 Language Server Protocol

**Full IDE support powered by `lumos-lsp`** - Production-ready language server integration:

- ✅ **Real-time Diagnostics** - Instant feedback on syntax errors, undefined types, and schema validation
- ✅ **Intelligent Auto-completion** - Context-aware suggestions for:
  - Solana types (`PublicKey`, `Signature`, `Keypair`)
  - Primitives (`u8`-`u128`, `i8`-`i128`, `bool`, `String`)
  - Complex types (`Vec<T>`, `Option<T>`)
  - Attributes (`#[solana]`, `#[account]`, `#[key]`, `#[max]`, `#[deprecated]`)
  - Keywords (`struct`, `enum`)
- ✅ **Hover Documentation** - Rich type information and inline documentation
- ✅ **Auto-install** - One-click setup, no manual configuration needed
- 🔄 **Future Features**: Go to definition, find references, rename symbol

The LUMOS Language Server is battle-tested with 142 passing tests and provides a seamless, production-ready IDE experience.

### 🎨 Syntax Highlighting
Beautiful syntax highlighting for `.lumos` files with support for:
- Keywords (`struct`, `enum`, `pub`, etc.)
- Primitive types (`u8`, `u64`, `String`, etc.)
- Solana types (`PublicKey`, `Signature`, `Keypair`)
- Attributes (`#[solana]`, `#[account]`, `#[key]`, `#[max(n)]`)
- Comments (line and block)
- Numbers (decimal, hex, binary, octal)

### ✨ Smart Editing Features

**Bracket Matching:**
- Highlights matching `{}`, `[]`, `()`, `<>` pairs when cursor is adjacent
- Jump to matching bracket with `Ctrl+Shift+\` (Windows/Linux) or `Cmd+Shift+\` (Mac)
- Visual indicator for nested structures

**Auto-Closing Pairs:**
- Automatically closes `{`, `[`, `(`, `<`, `"` when typed
- Works intelligently - skips auto-closing inside strings
- Surrounds selected text when typing opening bracket

**Smart Indentation:**
- Auto-indents nested struct/enum definitions
- Decreases indent when typing closing bracket
- Handles multi-line field lists automatically

**Code Folding:**
- Fold/unfold code blocks with `Ctrl+Shift+[` and `Ctrl+Shift+]`
- Support for `// #region` and `// #endregion` markers
- Visual fold indicators in gutter

**Example Usage:**

```lumos
// Type '{' and it auto-closes to '{}' with cursor inside
struct Player {|}  // Cursor positioned here automatically

// Smart indentation for nested structures
enum GameState {
    Active {
        players: Vec<PublicKey>,  // Automatic indentation
        round: u32,               // Bracket matching highlights pairs
    },
    Paused,
}

// #region Core Types
struct Position { x: i32, y: i32 }
// #endregion
```

### 📝 Code Snippets
Quick snippets for common patterns:
- `solstruct` - Solana struct
- `solaccount` - Solana account struct
- `enumu` - Unit enum (state machines)
- `enumt` - Tuple enum (data-carrying variants)
- `enums` - Struct enum (Solana instruction pattern)
- Field shortcuts: `fpubkey`, `fu64`, `fstring`, `farray`, `foption`
- Attributes: `max`, `key`

### ⚡ Commands
- **LUMOS: Generate Code** - Generate Rust and TypeScript from current schema
- **LUMOS: Validate Schema** - Validate the current `.lumos` file

### ⚙️ Settings
- `lumos.validation.enabled` - Enable/disable schema validation (default: `true`)
- `lumos.codeGeneration.autoGenerate` - Auto-generate code on save (default: `false`)

## Requirements

### Language Server (Auto-installed)

The LUMOS Language Server (`lumos-lsp`) provides real-time diagnostics, auto-completion, and hover documentation. **It will be automatically installed** when you first open a `.lumos` file - just click "Install Now" when prompted!

**Manual Installation (Optional):**
```bash
cargo install lumos-lsp
```

### Code Generation CLI (Optional)

For code generation features (LUMOS: Generate Code command), install the CLI:

```bash
cargo install lumos-cli
```

Or build from source:
```bash
git clone https://github.com/getlumos/lumos
cd lumos
cargo install --path packages/cli
```

## Usage

### Creating a LUMOS Schema

1. Create a new file with `.lumos` extension
2. Start typing and enjoy syntax highlighting!
3. Use snippets for quick scaffolding (e.g., type `solstruct` and press Tab)

Example:
```lumos
#[solana]
#[account]
struct UserAccount {
    wallet: PublicKey,
    balance: u64,
    items: [PublicKey],
}

#[solana]
enum GameState {
    Active,
    Paused,
    Finished,
}
```

### Type System

LUMOS provides **guaranteed type-safe mapping** between Rust and TypeScript with full Borsh serialization compatibility:

| LUMOS Type | Rust Output | TypeScript Output | Notes |
|------------|-------------|-------------------|-------|
| `u8`, `u16`, `u32` | `u8`, `u16`, `u32` | `number` | Safe for all values |
| `u64`, `i64` | `u64`, `i64` | `number` | ⚠️ **Precision limit: 2^53-1** |
| `u128`, `i128` | `u128`, `i128` | `bigint` | Full precision |
| `bool` | `bool` | `boolean` | |
| `String` | `String` | `string` | UTF-8 encoded |
| `PublicKey` | `Pubkey` | `PublicKey` | Solana 32-byte address |
| `Signature` | `Signature` | `Signature` | 64-byte Ed25519 signature |
| `[T]` | `Vec<T>` | `T[]` | Dynamic-length array |
| `Option<T>` | `Option<T>` | `T \| undefined` | Nullable type |

**Key Benefits:**
- **Borsh Compatibility:** Data serialized in Rust deserializes perfectly in TypeScript (and vice versa)
- **Precision Warnings:** Auto-generated JSDoc comments warn about JavaScript `number` precision limits for `u64`/`i64` fields
- **Type Safety:** Compile-time guarantees that your schemas match across languages

**Example with Precision Warning:**
```typescript
// Generated TypeScript (automatic JSDoc warning)
export interface UserAccount {
  wallet: PublicKey;
  /** WARNING: number in JS has precision limit of 2^53-1 (9007199254740991).
   *  Values exceeding this will lose precision. For Solana lamports or large
   *  values, consider validation. Original Rust type: u64 */
  balance: number;
  items: PublicKey[];
}
```

**Learn More:**
- [LUMOS Type System Documentation](https://github.com/getlumos/lumos#type-mapping)
- [Borsh Specification](https://borsh.io/)

### Generating Code

**Option 1: Command Palette**
1. Open a `.lumos` file
2. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
3. Type "LUMOS: Generate Code" and press Enter

**Option 2: Auto-generate on Save**
1. Enable in settings: `"lumos.codeGeneration.autoGenerate": true`
2. Save your `.lumos` file
3. Code is automatically generated!

## Extension Settings

This extension contributes the following settings:

**Language Server:**
* `lumos.lsp.enable`: Enable/disable Language Server Protocol integration (default: `true`)
* `lumos.lsp.path`: Custom path to lumos-lsp binary (default: `"lumos-lsp"`)
* `lumos.lsp.autoInstall`: Automatically install lumos-lsp if not found (default: `true`)
* `lumos.lsp.trace.server`: Debug LSP communication - `"off"`, `"messages"`, or `"verbose"` (default: `"off"`)

**Code Generation:**
* `lumos.validation.enabled`: Enable/disable LUMOS schema validation (default: `true`)
* `lumos.codeGeneration.autoGenerate`: Automatically generate Rust/TypeScript on save (default: `false`)

**Formatting:**
* `lumos.format.indentSize`: Number of spaces for indentation - `2` or `4` (default: `4`)
* `lumos.format.sortAttributes`: Sort attributes alphabetically (default: `true`)
* `lumos.format.alignFields`: Align colons in struct fields (default: `true`)

## Roadmap

- [x] Syntax highlighting and code snippets
- [x] Code generation commands
- [x] Language Server Protocol server implementation ([getlumos/lumos#45](https://github.com/getlumos/lumos/issues/45))
- [x] LSP integration into VSCode extension ([#1](https://github.com/getlumos/vscode-lumos/issues/1))
- [x] Real-time diagnostics and auto-completion
- [x] Hover documentation
- [x] Bracket matching and smart editing features
- [x] Type mapping reference documentation
- [ ] Go to definition
- [ ] Find references
- [ ] Rename symbol

**Track progress:** See [ROADMAP.md](ROADMAP.md) for detailed timeline

## Release Notes

### 0.1.0

Initial release of LUMOS VSCode extension:
- ✅ Syntax highlighting for `.lumos` files
- ✅ Code snippets for common patterns
- ✅ Bracket matching and auto-closing
- ✅ Comment toggling
- ✅ Code generation commands
- ✅ Auto-generate on save option

## Contributing

Found a bug or have a feature request? Please open an issue on [GitHub](https://github.com/getlumos/vscode-lumos/issues).

## Related Repositories

- **LUMOS Core:** https://github.com/getlumos/lumos
- **Language Server:** Published as `lumos-lsp` on crates.io (coming soon)
- **Documentation:** https://lumos-lang.org

## License

MIT OR Apache-2.0

---

**Enjoy!** 🚀
