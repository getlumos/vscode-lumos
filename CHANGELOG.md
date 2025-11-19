# Change Log

All notable changes to the "lumos" extension will be documented in this file.

## [0.5.0] - 2025-11-19

### Added
- **Quick Fix Suggestions**: One-click fixes for common LUMOS syntax errors
  - **Add Missing Colon**: Automatically insert `:` after field name
    - Error: `wallet PublicKey` → Fix: `wallet: PublicKey`
  - **Add Missing Semicolon**: Insert `;` at end of line
    - Error: `level: u16` → Fix: `level: u16;`
  - **Fix Type Casing**: Correct common type name errors
    - `pubkey` → `PublicKey`
    - `signature` → `Signature`
    - `vec` → `Vec`
    - `option` → `Option`
    - `string` → `String`
  - **Add Missing Attributes**: Insert `#[solana]` above struct
- **Lightbulb Icon**: Appears next to fixable errors
- **Preferred Fixes**: Most relevant fix pre-selected
- **One-Click Application**: Apply fixes instantly with Enter key

### Changed
- Enhanced developer experience with intelligent error recovery
- Integrated with existing error diagnostics (v0.2.0)

### Technical
- Implemented `CodeActionProvider` for quick fixes
- 5+ quick fix patterns
- Context-aware fix suggestions based on error messages
- Integrated with diagnostics API

### User Experience
```
// User types:
struct Player {
    wallet PublicKey    // Error detected
}

// VSCode shows:
💡 Quick Fix available
   1. Add colon after field name
   2. Add semicolon at end of line

// User presses Ctrl+. or clicks lightbulb
// User selects "Add colon after field name"
// Result:
struct Player {
    wallet: PublicKey;  // Fixed!
}
```

## [0.4.0] - 2025-11-19

### Added
- **Format-on-Save Support**: Automatic code formatting for .lumos files
  - **Consistent Indentation**: Configurable indent size (2 or 4 spaces, default 4)
  - **Attribute Sorting**: Alphabetically sorts attributes (#[account], #[derive], #[solana])
  - **Field Alignment**: Aligns colons in struct fields for better readability
  - **Smart Formatting**: Preserves comments and handles nested structures
- **Manual Format Command**: Use Shift+Alt+F (or Cmd+Shift+I on Mac) to format
- **Configurable Settings**:
  - `lumos.format.indentSize` - Choose between 2 or 4 spaces (default: 4)
  - `lumos.format.sortAttributes` - Enable/disable attribute sorting (default: true)
  - `lumos.format.alignFields` - Enable/disable field alignment (default: true)
- Format-on-save works with VSCode's `editor.formatOnSave` setting

### Changed
- Enhanced code quality with automatic formatting
- Improved readability with aligned struct fields

### Technical
- Implemented `DocumentFormattingEditProvider` for LUMOS language
- Smart indentation tracking for nested structures
- Field alignment algorithm for struct fields

### Example
**Before formatting**:
```lumos
#[derive(Debug)]
#[solana]
#[account]
struct PlayerAccount {
wallet: PublicKey,
   level:u16,
experience:      u64,
}
```

**After formatting**:
```lumos
#[account]
#[derive(Debug)]
#[solana]
struct PlayerAccount {
    wallet:     PublicKey,
    level:      u16,
    experience: u64,
}
```

## [0.3.0] - 2025-11-19

### Added
- **Intelligent Auto-Completion**: Context-aware code completion for LUMOS syntax
  - **Primitive Types**: All unsigned (u8-u128) and signed (i8-i128) integers, bool, String
  - **Solana Types**: PublicKey, Signature with descriptions
  - **Complex Types**: Vec<T> and Option<T> with snippet placeholders
  - **Attributes**: #[solana], #[account], #[derive(...)] with documentation
  - **Keywords**: struct, enum, pub with full template snippets
- Context-aware suggestions:
  - Type completions appear after colon (`:`)
  - Attribute completions inside `#[...]`
  - Keyword completions at line start
- Inline documentation for each completion item
- Smart snippet insertion:
  - `Vec<$1>` - cursor inside angle brackets
  - `Option<$1>` - cursor inside angle brackets
  - `struct ${1:Name} { ... }` - multi-tab-stop template
  - `enum ${1:Name} { ... }` - multi-tab-stop template
  - `#[derive(${1:Debug})]` - cursor in parentheses

### Changed
- Enhanced developer experience with IntelliSense support
- Trigger characters: `.`, `<`, `#`, `[`, `:`

### Technical
- Implemented `CompletionItemProvider` for LUMOS language
- Added 20+ completion items with rich documentation
- Context detection for smart filtering

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
