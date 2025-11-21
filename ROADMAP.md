# LUMOS VSCode Extension Roadmap

**Vision**: World-class language extension matching rust-analyzer's excellence with Solana-specific superpowers

**Current Version**: 0.5.0 (Published to Marketplace)
**Target v1.0**: Q2 2025

---

## Executive Summary

### Current State (v0.5.0)
- ✅ Syntax highlighting (26 grammar rules)
- ✅ Code snippets (13 patterns)
- ✅ Basic IntelliSense (20+ completion items)
- ✅ Error diagnostics (CLI-based, 500ms debounced)
- ✅ Quick fixes (5 patterns)
- ✅ Format-on-save

### Gap Analysis
Missing critical features that define world-class extensions:
- ❌ Language Server Protocol (LSP) architecture
- ❌ Real-time type-aware IntelliSense
- ❌ Go-to-definition / Find references
- ❌ Hover documentation
- ❌ Inlay hints (inline type information)
- ❌ Semantic highlighting
- ❌ Advanced code actions (30+ refactorings)
- ❌ Multi-file workspace analysis
- ❌ Solana-specific tooling (IDL import, account inspector, PDA calculator)

### Target: "3x Better"

**1. Match rust-analyzer** on LSP fundamentals
**2. Exceed Solidity extensions** on blockchain integration
**3. Innovate uniquely** with schema-first development flow

---

## Competitive Benchmark

| Feature | rust-analyzer | Solidity | **LUMOS v0.5** | **LUMOS v1.0** |
|---------|--------------|----------|---------------|---------------|
| LSP Architecture | ✅ | ✅ | ❌ | ✅ |
| Real-time Diagnostics | ✅ | ✅ | ⚠️ CLI | ✅ |
| Go-to-Definition | ✅ | ✅ | ❌ | ✅ |
| Hover Documentation | ✅ | ✅ | ❌ | ✅ |
| Inlay Hints | ✅ | ❌ | ❌ | ✅ |
| Semantic Highlighting | ✅ | ✅ | ❌ | ✅ |
| Code Actions | ✅ 150+ | ⚠️ Limited | ⚠️ 5 | ✅ 30+ |
| Multi-File Analysis | ✅ | ✅ | ❌ | ✅ |
| Framework Integration | ✅ Cargo | ✅ Hardhat | ❌ | ✅ Anchor |
| Blockchain Tools | N/A | ✅ Etherscan | ❌ | ✅ Solana |

---

## Phase 1: LSP Foundation (v0.6.0 - v0.8.0)

### v0.6.0: Language Server Protocol (Target: Week 4)

**Goal**: Replace CLI validation with LSP-based real-time diagnostics

#### Features
- ✅ **LSP Server** (`lumos-lsp` Rust crate)
  - Built with `tower-lsp` framework
  - Reuses `lumos-parser` from core library
  - Runs as separate process (stdio/IPC communication)
- ✅ **Real-Time Diagnostics**
  - Parse errors as you type (no debounce delay)
  - Accurate error locations from parser
  - Red squiggles in editor
- ✅ **VSCode Client**
  - Start/stop LSP server lifecycle
  - Remove CLI-based validation
  - Display diagnostics from server

#### Architecture
```
┌─────────────────────────┐
│   VSCode Extension      │
│   (TypeScript)          │
└───────────┬─────────────┘
            │ LSP over stdio
┌───────────▼─────────────┐
│   lumos-lsp             │
│   (Rust + tower-lsp)    │
└───────────┬─────────────┘
            │ Library calls
┌───────────▼─────────────┐
│   lumos-parser          │
│   (Core Rust library)   │
└─────────────────────────┘
```

#### Technical Details
- **Language**: Rust
- **LSP Framework**: `tower-lsp` (async LSP server)
- **Key Crates**: `lsp-types`, `tokio`, `dashmap`, `ropey`
- **Distribution**: Bundled binary per platform (x64/ARM, Win/macOS/Linux)
- **Size**: ~2-5MB per platform

#### Success Criteria
- [ ] Zero validation lag (instant feedback)
- [ ] 100% accurate error locations
- [ ] <50ms diagnostic response time
- [ ] Works on Windows, macOS, Linux

**Estimated Effort**: 2-3 weeks

---

### v0.7.0: Navigation & Hover (Target: Week 7)

**Goal**: Essential code navigation features

#### Features
- ✅ **Go to Definition**
  - Click type name → jump to struct/enum definition
  - Works across files in workspace
  - Handles imports and references

- ✅ **Hover Documentation**
  ```
  Hover over 'PublicKey':
  ┌────────────────────────────────────┐
  │ PublicKey                           │
  │ Solana account public key (32 bytes)│
  │                                     │
  │ Serialized as: [u8; 32]            │
  │ Borsh size: 32 bytes               │
  └────────────────────────────────────┘
  ```

- ✅ **Find All References**
  - Right-click field → see all usages
  - Workspace-wide search
  - Results in "References" panel

#### Implementation
- Build symbol table during parsing
- Track type definitions and usage locations
- LSP methods: `textDocument/definition`, `textDocument/hover`, `textDocument/references`

#### Success Criteria
- [ ] <100ms hover response time
- [ ] Accurate cross-file navigation
- [ ] Documentation for all Solana primitive types

**Estimated Effort**: 2 weeks

---

### v0.8.0: Intelligent Completion (Target: Week 10)

**Goal**: Context-aware IntelliSense matching rust-analyzer

#### Features
- ✅ **Type-Aware Completion**
  - After `:` → suggest types based on context
  - Solana types ranked higher in `#[solana]` context
  - Generic types with placeholders: `Vec<$1>`, `Option<$1>`

- ✅ **Attribute Completion**
  - `#[` → show all available attributes with docs
  - `#[account(` → show Anchor constraints
  - Smart suggestions based on context (struct vs enum)

- ✅ **Import Suggestions**
  - Use undefined type → suggest adding import
  - Auto-import on completion selection

- ✅ **Field Completion**
  - Inside struct → suggest field patterns
  - Enforce field ordering (match existing style)

#### Implementation
- Context analysis from cursor position
- LSP `textDocument/completion` with rich `CompletionItem`
- Snippet expansion with tab stops
- Import resolution from workspace

#### Success Criteria
- [ ] 50+ completion items
- [ ] <100ms completion response
- [ ] Context-aware ranking
- [ ] Auto-import works 100%

**Estimated Effort**: 2-3 weeks

---

## Phase 2: Advanced Features (v0.9.0 - v1.0.0)

### v0.9.0: Inlay Hints & Semantic Highlighting (Target: Week 14)

**Goal**: Visual excellence matching rust-analyzer

#### Features
- ✅ **Inlay Hints** (Inline Type Information)
  ```lumos
  #[solana]
  struct GameAccount {
      owner: PublicKey,  // ← 32 bytes
      score: u64,        // ← 8 bytes
      items: Vec<Item>,  // ← 4 + n*size(Item)
  }                      // Total: 44 + n*size(Item)
  ```
  - Show Borsh serialization sizes
  - Total account size calculation
  - Parameter hints in complex types

- ✅ **Semantic Highlighting**
  - Solana types: distinct color (e.g., blue)
  - Account structs: bold
  - Unused fields: grayed out
  - Required attributes missing: red underline
  - Mutable vs immutable (if applicable)

- ✅ **Borsh Size Calculator**
  - Real-time account size in status bar
  - Warning if account > 10KB (Solana limit)
  - Suggest optimizations (use smaller types, compress data)

#### Implementation
- LSP `textDocument/inlayHint`
- LSP `textDocument/semanticTokens` with custom token types
- Calculate Borsh sizes during semantic analysis
- Custom semantic token modifiers

#### Success Criteria
- [ ] Inlay hints configurable (enable/disable)
- [ ] Accurate Borsh size calculations
- [ ] Semantic highlighting for 10+ token types
- [ ] <100ms semantic token response

**Estimated Effort**: 2-3 weeks

---

### v0.10.0: Code Actions & Assists (Target: Week 18)

**Goal**: Refactoring magic like rust-analyzer (30+ assists)

#### Features

**Structural Assists**:
1. **Fill Missing Fields**
   - Incomplete struct → suggest filling remaining fields
   - Generate default values based on type

2. **Add Solana Attributes**
   - Detect Solana types → suggest `#[solana]`
   - Detect account patterns → suggest `#[account]`
   - Add required attributes automatically

3. **Extract to Schema**
   - Select fields → extract to separate struct
   - Update all references
   - Generate import statements

4. **Convert Enum Style**
   - Unit ↔ Tuple ↔ Struct variants
   - Preserve semantics

**Generation Assists**:
5. **Generate Test Data**
   - Right-click struct → generate JSON/YAML sample
   - For testing and documentation

6. **Generate Builder Pattern**
   - Convert struct to builder pattern
   - Useful for complex initialization

7. **Add Derive Attributes**
   - Suggest common derives: `Debug`, `Clone`, `PartialEq`

**Solana-Specific**:
8. **Add PDA Seeds**
   - Detect account → suggest `#[seeds(...)]`
   - Template common PDA patterns

9. **Add Constraints**
   - Suggest Anchor constraints: `#[account(mut)]`, `#[account(signer)]`

10. **Optimize Account Size**
    - Suggest field reordering for alignment
    - Replace large types with smaller alternatives

#### Implementation
- LSP `textDocument/codeAction`
- AST transformations
- `WorkspaceEdit` for multi-file refactoring
- Code action kinds: `refactor`, `quickfix`, `source`

#### Success Criteria
- [ ] 30+ code actions implemented
- [ ] Preferred actions pre-selected
- [ ] Multi-file refactoring works
- [ ] Undo/redo works correctly

**Estimated Effort**: 3-4 weeks

---

### v1.0.0: Solana Superpowers (Target: Week 24)

**Goal**: Features no other extension has - LUMOS differentiation

#### A. Solana Program Integration

**1. IDL Import**
- **Command**: "LUMOS: Import from Anchor IDL"
- **Flow**:
  1. Paste program address or select local IDL file
  2. Fetch IDL from Solana Explorer/Solscan
  3. Parse IDL JSON
  4. Generate `.lumos` schema
  5. Save to workspace
- **Use Case**: Reverse-engineer schemas from existing programs

**2. Account Inspector**
- **Command**: "LUMOS: Inspect Account"
- **Flow**:
  1. Enter account address
  2. Fetch account data from RPC
  3. Select schema to deserialize with
  4. Display formatted account data in webview
- **Features**:
  - Syntax-highlighted JSON output
  - Borsh deserialization
  - Export to JSON file

**3. PDA Calculator**
- **Inline Code Lens**:
  ```lumos
  #[account]
  #[seeds(b"vault", user_pubkey)]
  struct Vault { ... }
  // └─> [Calculate PDA] ← Click to compute address
  ```
- **Features**:
  - Compute PDA address from seeds
  - Copy address to clipboard
  - Show bump seed

#### B. Testing & Validation

**4. Schema Test Suite**
- **Auto-Generate Tests**:
  - Rust: Serialization round-trip tests
  - TypeScript: Client compatibility tests
  - Integration: Test against localnet

- **Test Explorer Integration**:
  - See all schema tests in sidebar
  - Run individual tests
  - View results inline

**5. Multi-File Validation**
- **Workspace Analysis**:
  - Validate all `.lumos` files
  - Check for circular dependencies
  - Ensure consistent versioning across schemas

- **Dependency Graph**:
  - Visualize import relationships
  - Detect unused schemas
  - Suggest cleanup

**6. Borsh Size Warnings**
- **Real-Time Feedback**:
  - Status bar shows total account size
  - Warning if > 10KB (Solana limit)
  - Error if invalid alignment

- **Optimization Suggestions**:
  - Reorder fields for better packing
  - Suggest smaller types (u8 instead of u64 if possible)
  - Compress arrays/vectors

#### C. Visual Tools

**7. Schema Diagram**
- **Webview Panel**:
  - Graph showing struct relationships
  - Nodes: Structs/Enums
  - Edges: Field references
  - Click node → jump to definition

- **Export Options**:
  - SVG (for documentation)
  - PNG (for presentations)
  - Mermaid (for markdown docs)

**8. Account Layout Visualizer**
- **Byte-Level Layout**:
  ```
  ┌─────────────────────────────────────┐
  │ Offset │ Field      │ Type     │ Size│
  ├─────────────────────────────────────┤
  │ 0      │ discriminator│ u64    │ 8  │
  │ 8      │ owner       │ Pubkey │ 32 │
  │ 40     │ balance     │ u64    │ 8  │
  │ 48     │ items_len   │ u32    │ 4  │
  │ 52     │ items[0]    │ Item   │ 16 │
  │ ...    │ ...         │ ...    │ ...│
  └─────────────────────────────────────┘
  Total: Variable (52 + n*16 bytes)
  ```

- **Identify Issues**:
  - Padding bytes (wasted space)
  - Alignment problems
  - Inefficient field ordering

#### Success Criteria
- [ ] IDL import works for 100% of Anchor programs
- [ ] Account inspector supports mainnet/devnet/localnet
- [ ] PDA calculator accuracy: 100%
- [ ] Schema diagram renders for workspaces with 50+ schemas
- [ ] Test suite generates valid Rust/TS tests
- [ ] Account layout shows byte-accurate information

**Estimated Effort**: 4-6 weeks

---

## Phase 3: Ecosystem & Polish (v1.1.0+)

### v1.1.0: Multi-Language Generation (Target: Week 28)

**Goal**: Visual code generation management

#### Features
- **Generation Dashboard** (Webview)
  - Shows all schemas in workspace
  - Checkboxes for target languages:
    - [x] Rust
    - [x] TypeScript
    - [ ] Python (Anchorpy)
    - [ ] Unity C#
    - [ ] Flutter/Dart
  - Click to generate, view output, open files

- **Custom Templates**
  - User-defined generation templates
  - Liquid/Handlebars syntax
  - Template marketplace (community sharing)

- **Generation Presets**
  - Save/load generation configurations
  - Per-project settings
  - Team-shareable configs

**Estimated Effort**: 3-4 weeks

---

### v1.2.0: Debugging & Simulation (Target: Week 32)

**Goal**: Test schemas without deploying to mainnet

#### Features
- **Local Validator Integration**
  - Start/stop Solana test validator from VSCode
  - Deploy generated programs
  - Create/inspect accounts
  - View logs in terminal

- **Transaction Builder**
  - GUI for building transactions using schema types
  - Send to localnet/devnet
  - View transaction results
  - Debug failures

- **Account Simulator**
  - Simulate account state changes
  - Preview serialized data
  - Test constraints

**Estimated Effort**: 4-5 weeks

---

### v1.3.0: Performance & Telemetry (Target: Week 36)

**Goal**: Optimize for large workspaces

#### Features
- **Performance Modes**
  - Full: Complete analysis (small projects)
  - Balanced: Smart caching (medium projects)
  - Light: On-demand analysis (large monorepos)

- **Incremental Parsing**
  - Only re-parse changed files
  - Cache AST between sessions
  - Background indexing

- **Telemetry** (Optional, Opt-in)
  - Track feature usage
  - Identify slow operations
  - Crash reporting
  - Anonymous usage stats

**Estimated Effort**: 2-3 weeks

---

## Quick Wins (Low Effort, High Impact)

These can be implemented anytime between major releases:

| Feature | Effort | Impact | Priority |
|---------|--------|--------|----------|
| Custom file icon for `.lumos` | 1 day | High | P0 |
| Breadcrumb navigation | 2 days | High | P0 |
| Outline view (structs/enums) | 2 days | High | P0 |
| Folding regions | 1 day | Medium | P1 |
| Better error messages | 3 days | High | P0 |
| Formatting improvements | 2 days | Medium | P1 |
| Snippet improvements | 1 day | Medium | P2 |
| Color theme integration | 1 day | Low | P2 |

**Total Quick Wins**: ~2 weeks effort

---

## Technical Architecture

### LSP Server Stack

```
┌─────────────────────────────────────────────┐
│           VSCode Extension (TS)             │
│  - Registers commands                       │
│  - Starts LSP client                        │
│  - Handles UI (webviews, notifications)     │
│  - Manages quick wins (icons, breadcrumbs)  │
└────────────────┬────────────────────────────┘
                 │ LSP Protocol (stdio/IPC)
┌────────────────▼────────────────────────────┐
│        lumos-lsp Server (Rust)              │
│  - tower-lsp framework (async)              │
│  - Document lifecycle management            │
│  - Workspace state tracking                 │
│  - Symbol table builder                     │
│  - Type inference engine                    │
│  - Code action provider                     │
└────────────────┬────────────────────────────┘
                 │ Library API calls
┌────────────────▼────────────────────────────┐
│          lumos Core Library (Rust)          │
│  - Parser (pest-based grammar)              │
│  - AST representation                       │
│  - Semantic analysis                        │
│  - Code generation (Rust/TS/Python)         │
│  - Validation rules                         │
│  - Borsh size calculation                   │
└─────────────────────────────────────────────┘
```

### Key Rust Crates

| Crate | Purpose |
|-------|---------|
| `tower-lsp` | LSP server framework (async) |
| `lsp-types` | LSP type definitions |
| `tokio` | Async runtime |
| `dashmap` | Concurrent HashMap for document state |
| `ropey` | Fast text rope for incremental edits |
| `salsa` | Incremental computation (optional, v1.3+) |

### Distribution Strategy

**Phase 1 (v0.6-1.0)**: Bundled Binary
- Ship `lumos-lsp` binary with extension
- Platform-specific builds:
  - x86_64-pc-windows-msvc
  - x86_64-apple-darwin
  - aarch64-apple-darwin
  - x86_64-unknown-linux-gnu
- Size: ~2-5MB per platform

**Phase 2 (v1.1+)**: npm Package
- Publish `@lumos/language-server` to npm
- Extension downloads on first activation
- Easier updates (auto-update LSP independently)

---

## Success Metrics

### Phase 1 (LSP Foundation)
- [ ] Zero validation lag (instant diagnostics)
- [ ] 100% error location accuracy
- [ ] <100ms hover response time
- [ ] <100ms completion response time
- [ ] 50+ GitHub stars on lumos-lsp repo

### v1.0 Launch
- [ ] 1,000+ VSCode Marketplace installs (first month)
- [ ] 4.5+ star rating (50+ reviews)
- [ ] Featured in "Blockchain Development" category
- [ ] 30+ code assists implemented
- [ ] Solana FM/Solscan integration working
- [ ] 90%+ feature parity with rust-analyzer (core features)
- [ ] Mentioned in 3+ Solana dev tutorials

### v1.3 Maturity
- [ ] 5,000+ installs
- [ ] 100+ GitHub stars
- [ ] 10+ community contributors
- [ ] Adopted by 10+ public Solana projects
- [ ] <50ms average LSP response time
- [ ] Handles workspaces with 100+ schemas

---

## Timeline Summary

| Phase | Version | Duration | Target Date | Key Deliverable |
|-------|---------|----------|-------------|-----------------|
| **Phase 1** | v0.6.0 | 3 weeks | Week 4 | LSP Server + Real-time Diagnostics |
| | v0.7.0 | 2 weeks | Week 7 | Go-to-Def + Hover |
| | v0.8.0 | 3 weeks | Week 10 | Intelligent Completion |
| **Phase 2** | v0.9.0 | 3 weeks | Week 14 | Inlay Hints + Semantic Highlighting |
| | v0.10.0 | 4 weeks | Week 18 | Code Actions (30+ assists) |
| | v1.0.0 | 6 weeks | Week 24 | Solana Superpowers |
| **Phase 3** | v1.1.0 | 4 weeks | Week 28 | Multi-Language Generation |
| | v1.2.0 | 4 weeks | Week 32 | Debugging & Simulation |
| | v1.3.0 | 3 weeks | Week 36 | Performance & Telemetry |

**Total to v1.0**: ~24 weeks (~6 months)
**Total to v1.3**: ~36 weeks (~9 months)

---

## Risk Analysis

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| LSP complexity underestimated | Medium | High | Start simple, iterate; reference tower-lsp examples |
| Cross-platform issues | Medium | Medium | CI/CD for all platforms; early testing |
| Performance regression | Low | High | Benchmark suite; incremental parsing |
| Breaking changes in lumos core | Medium | Medium | Semantic versioning; integration tests |

### Market Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| LUMOS language adoption | Medium | High | Focus on superior DX; community engagement |
| Competing extensions | Low | Medium | Differentiate with Solana-specific features |
| VSCode API changes | Low | Low | Follow VSCode release notes; use stable APIs |

### Resource Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Development bandwidth | Medium | High | Prioritize ruthlessly; MVP first |
| Maintenance burden | Medium | Medium | Automated testing; clear architecture |
| Community support needed | Low | Low | Good documentation; welcoming contributor guide |

---

## Open Questions

### For RECTOR to decide:

1. **LSP Implementation Priority**
   - Option A: Pause marketplace growth, build LSP first (v0.6-0.8 before promoting)
   - Option B: Continue promoting v0.5, build LSP in parallel
   - **Recommendation**: Option A - LSP is foundation for everything else

2. **Language Server Implementation Language**
   - Rust: Best performance, code reuse, harder to maintain
   - TypeScript: Easier for contributors, slower, larger binary
   - **Recommendation**: Rust - performance is critical, aligns with core library

3. **Solana Integration Scope**
   - Basic: IDL import only
   - Medium: + Account inspector + PDA calculator
   - Deep: + Localnet integration + Debugging
   - **Recommendation**: Medium for v1.0, Deep for v1.2

4. **Additional Target Languages**
   - Python (Anchorpy clients) - High demand
   - Unity C# (gaming) - Niche but growing
   - Flutter/Dart (mobile) - Future potential
   - **Recommendation**: Python first (v1.1), others based on requests

5. **Testing Strategy**
   - Unit tests only (fast, limited coverage)
   - + Integration tests (slower, better coverage)
   - + E2E tests with VSCode (slowest, full coverage)
   - **Recommendation**: All three - quality is non-negotiable

---

## Contributing

(Post-v1.0 - Open Source)

### How to Contribute
1. Check GitHub Issues for "good first issue" label
2. Read CONTRIBUTING.md
3. Fork repo, create feature branch
4. Write tests for new features
5. Submit PR with clear description

### Areas Needing Help
- LSP server optimizations
- Additional code actions
- Documentation improvements
- Platform-specific testing
- Community templates for code generation

---

## Conclusion

This roadmap transforms LUMOS VSCode extension from a functional v0.5 into a **world-class development tool** that:

1. **Matches rust-analyzer** on core LSP features (diagnostics, completion, refactoring)
2. **Exceeds Solidity extensions** on blockchain integration (Solana-specific tooling)
3. **Innovates uniquely** with schema-first multi-language generation

**Investment**: ~24 weeks to v1.0 (~280-320 development hours)

**ROI**: Position LUMOS as the definitive Solana schema language with tooling that rivals Rust itself. Drive adoption through superior developer experience.

**Next Step**: Approve architecture, create `lumos-lsp` crate, start Phase 1.

---

**Maintained by**: RECTOR
**Last Updated**: 2025-11-21
**Status**: Approved and ready for execution

InshaAllah, with focused execution on this roadmap, LUMOS will set a new standard for blockchain development tooling.
