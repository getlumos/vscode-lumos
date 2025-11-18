# LUMOS Language Support for VSCode

Official VSCode extension for the LUMOS schema language - a type-safe, cross-language schema definition language for Solana development.

## Features

### 🎨 Syntax Highlighting
Beautiful syntax highlighting for `.lumos` files with support for:
- Keywords (`struct`, `enum`, `pub`, etc.)
- Primitive types (`u8`, `u64`, `String`, etc.)
- Solana types (`PublicKey`, `Signature`, `Keypair`)
- Attributes (`#[solana]`, `#[account]`, `#[key]`, `#[max(n)]`)
- Comments (line and block)
- Numbers (decimal, hex, binary, octal)

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

To use code generation features, you need to have the LUMOS CLI installed:

```bash
cargo install lumos-cli
```

Or build from source:
```bash
git clone https://github.com/RECTOR-LABS/lumos
cd lumos/packages/cli
cargo install --path .
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

* `lumos.validation.enabled`: Enable/disable LUMOS schema validation
* `lumos.codeGeneration.autoGenerate`: Automatically generate Rust/TypeScript on save

## Known Issues

- Language server features (advanced IntelliSense, real-time validation) are planned for future releases

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

Found a bug or have a feature request? Please open an issue on [GitHub](https://github.com/RECTOR-LABS/lumos/issues).

## License

MIT OR Apache-2.0

---

**Enjoy!** 🚀
