# Change Log

All notable changes to the "lumos" extension will be documented in this file.

## [0.2.0] - 2025-11-19

### Added
- **Error Diagnostics**: Real-time syntax error detection in `.lumos` files
  - Red squiggles appear for syntax errors
  - Errors detected by running `lumos validate` CLI
  - Intelligent error location detection based on error context
  - Debounced validation (500ms delay after typing)
  - Validation on file open, change, and save
  - Respects `lumos.validation.enabled` setting
- Smart error positioning:
  - Missing colon detection (e.g., `wallet PublicKey` → suggests colon after `wallet`)
  - Missing semicolon detection
  - Missing brace detection
- Error messages prefixed with "LUMOS:" for clarity

### Changed
- Improved error feedback workflow
- Validation now runs automatically in background

### Technical
- Integrated `lumos validate` CLI for accurate error detection
- Added diagnostic collection with 500ms debouncing
- Context-aware error location finder

## [0.1.0] - 2025-11-17

### Added
- Initial release of LUMOS VSCode extension
- Syntax highlighting for `.lumos` schema files
- TextMate grammar with support for:
  - Keywords (struct, enum, pub, etc.)
  - Primitive types (u8-u128, i8-i128, f32, f64, bool, String)
  - Solana types (PublicKey, Pubkey, Signature, Keypair)
  - Attributes (#[solana], #[account], #[key], #[max(n)])
  - Comments (line and block)
  - Numbers (decimal, hex, binary, octal)
- Language configuration:
  - Auto-closing brackets and quotes
  - Comment toggling (Ctrl+/)
  - Smart indentation
  - Bracket matching
- Code snippets for common patterns:
  - Solana structs and accounts
  - Unit, tuple, and struct enums
  - Field shortcuts
  - Attribute shortcuts
- Commands:
  - "LUMOS: Generate Code" - Generate Rust and TypeScript
  - "LUMOS: Validate Schema" - Validate schema syntax
- Settings:
  - `lumos.validation.enabled` - Enable/disable validation
  - `lumos.codeGeneration.autoGenerate` - Auto-generate on save
- Auto-generation on save (optional)

### Planned for Future Releases
- Language server for real-time validation
- IntelliSense and autocomplete
- Go-to-definition support
- Hover documentation
- Diagnostic messages in editor
