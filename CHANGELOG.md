# Changelog

All notable changes to the LUMOS VSCode extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.6.0] - 2025-11-24

### Added

#### Language Server Protocol Integration
- **Full LSP Support** - Integrated `lumos-lsp` Language Server for production-ready IDE experience
- **Real-time Diagnostics** - Instant feedback on syntax errors, undefined types, and schema validation
- **Intelligent Auto-completion** - Context-aware suggestions for:
  - Solana types (`PublicKey`, `Signature`, `Keypair`)
  - Primitives (`u8`-`u128`, `i8`-`i128`, `bool`, `String`)
  - Complex types (`Vec<T>`, `Option<T>`)
  - Attributes (`#[solana]`, `#[account]`, `#[key]`, `#[max]`, `#[deprecated]`)
  - Keywords (`struct`, `enum`)
- **Hover Documentation** - Rich type information and inline documentation on hover
- **Auto-install** - Automatic one-click installation of `lumos-lsp` server when extension activates
- **LSP Configuration Settings**:
  - `lumos.lsp.enable` - Enable/disable LSP integration (default: `true`)
  - `lumos.lsp.path` - Custom path to lumos-lsp binary (default: `"lumos-lsp"`)
  - `lumos.lsp.autoInstall` - Auto-install lumos-lsp if not found (default: `true`)
  - `lumos.lsp.trace.server` - Debug LSP communication (default: `"off"`)

#### Documentation Improvements
- **Smart Editing Features Documentation** - Comprehensive docs for:
  - Bracket matching and navigation
  - Auto-closing pairs behavior
  - Smart indentation rules
  - Code folding with region markers
  - Keyboard shortcuts and usage examples
- **Type System Reference** - Complete type mapping table showing:
  - LUMOS → Rust → TypeScript mappings
  - Borsh serialization compatibility notes
  - Precision warnings for u64/i64 types
  - Links to official type system documentation

### Changed

- **Updated Dependencies**:
  - `vscode-languageclient` from `^8.1.0` to `^9.0.0` for better LSP support
  - Removed `vscode-languageserver` dependency (not needed for client-only extension)
- **Enhanced Extension Activation** - LSP client now starts automatically on extension load
- **Improved Diagnostics** - CLI-based validation now serves as fallback to LSP diagnostics
- **README Restructure** - Better organization with dedicated sections for LSP, type system, and smart editing

### Fixed

- Bracket matching documentation (previously undocumented despite being implemented)
- Type mapping documentation (moved from internal CLAUDE.md to user-facing README)
- LSP client initialization (was imported but never activated)

## [0.5.0] - 2024-11-19

### Added
- Quick fixes for common errors
- Code action provider for LUMOS diagnostics
- Document formatting provider with configurable options
- Auto-completion provider with 30+ completion items

### Changed
- Improved syntax highlighting with 26 TextMate grammar rules
- Enhanced validation with better error messages

## [0.1.0] - Initial Release

### Added
- Syntax highlighting for `.lumos` files
- Code snippets for common patterns
- Bracket matching and auto-closing
- Comment toggling support
- Code generation commands (`LUMOS: Generate Code`, `LUMOS: Validate Schema`)
- Auto-generate on save option
- Basic IntelliSense

---

**Legend:**
- `Added` - New features
- `Changed` - Changes in existing functionality
- `Deprecated` - Soon-to-be removed features
- `Removed` - Removed features
- `Fixed` - Bug fixes
- `Security` - Security improvements

[0.6.0]: https://github.com/getlumos/vscode-lumos/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/getlumos/vscode-lumos/releases/tag/v0.5.0
[0.1.0]: https://github.com/getlumos/vscode-lumos/releases/tag/v0.1.0
