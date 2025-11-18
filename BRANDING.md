# LUMOS Branding Assets

This document describes the visual identity and branding assets for the LUMOS VSCode extension.

## Design Philosophy: Radiant Precision

The LUMOS icon embodies the **Radiant Precision** design philosophy—where light becomes structure, and clarity transforms into form. The visual language treats luminosity as an architectural principle, building systems from the geometry of radiance itself.

### Visual Elements

**1. Geometric Foundation**
- **Hexagon**: Represents the structured nature of schema definitions
- **Mathematical precision**: All angles and proportions follow exact geometric principles
- **Technical accuracy**: Symbolizes type-safety and correctness

**2. Radiant Beams**
- **Six radiating beams**: Emanate from the hexagon vertices
- **LUMOS = Light**: Direct visual reference to illumination
- **Direction and focus**: Represents code generation flowing outward to Rust and TypeScript

**3. Luminous Core**
- **Bright central point**: The source of illumination
- **Gradient diffusion**: Soft glow radiating outward
- **Energy and activity**: Symbolizes the active transformation of schemas

**4. Color Palette (Solana-Inspired)**
- **Deep Purple** (`#140F23`): Background, representing the depth of blockchain
- **Violet/Blue Gradients** (`#8C64FF` → `#6496FF`): Primary glow, technical precision
- **Orange/Magenta Accents** (`#FF8C50`, `#FF78B4`): Energy, warmth, Solana branding
- **White Core** (`#FFF0FF`): Pure light, clarity

### Icon Variants

**icon.png** (128×128px)
- Primary extension icon
- Used in VSCode extension marketplace
- Optimized for UI display

**icon-512.png** (512×512px)
- High-resolution branding asset
- For documentation, presentations, marketing
- Detailed version with enhanced effects

**icon-64.png** (64×64px)
- Medium size for web/UI uses

**icon-32.png** (32×32px)
- Small size for toolbar/status bar uses

## Design Principles

### 1. Technical Precision
Every element is mathematically calculated:
- Hexagon vertices at exact 60° intervals
- Beams aligned with geometric structure
- Gradients follow light physics principles
- No arbitrary placement—everything purposeful

### 2. Luminous Quality
Achieved through layered effects:
- Multiple gradient layers for depth
- Gaussian blur for soft glow
- Alpha compositing for transparency
- Careful color interpolation

### 3. Minimal Yet Rich
- Simple geometric forms
- Rich through light and gradient
- No unnecessary decoration
- Every element serves meaning

### 4. Blockchain Aesthetic
- Solana color palette integration
- Modern, technical appearance
- Network/node visual metaphor (hexagon with radiating connections)
- Professional and trustworthy

## Symbolism

| Element | Meaning |
|---------|---------|
| Hexagon | Schema structure, type definitions, geometric precision |
| Six beams | Code generation paths, illumination spreading outward |
| Central core | LUMOS compiler/transformer, source of truth |
| Purple → Blue | Technical depth, Solana blockchain |
| Orange accents | Energy, transformation, warmth |
| Radial symmetry | Balance, completeness, systematic approach |
| Luminous glow | Clarity, illumination, insight |

## Usage Guidelines

### Do ✅
- Use on dark or neutral backgrounds
- Maintain aspect ratio
- Ensure sufficient padding around icon
- Use appropriate size variant for context
- Preserve color fidelity

### Don't ❌
- Stretch or distort the icon
- Change colors arbitrarily
- Add effects or filters
- Use on busy backgrounds
- Place too small to see details (<32px)

## Technical Specifications

**Format**: PNG with alpha transparency
**Color Space**: sRGB
**Bit Depth**: 32-bit (8-bit per channel + alpha)
**Compression**: PNG optimized

**Sizes Available**:
- 512×512px (branding/marketing)
- 128×128px (extension icon)
- 64×64px (medium UI)
- 32×32px (small UI)

## Generation

The icon is generated programmatically using Python and PIL (Pillow):
- Mathematical precision in all calculations
- Layered composition for depth
- Gradient generation algorithms
- Professional anti-aliasing

To regenerate icons:
```bash
python3 create_icon.py
```

## Files

```
vscode-lumos/
├── icon.png              # 128×128 extension icon
├── icon-512.png          # 512×512 high-res branding
├── icon-64.png           # 64×64 medium size
├── icon-32.png           # 32×32 small size
├── create_icon.py        # Icon generation script
├── design-philosophy.md  # Complete design philosophy
└── BRANDING.md          # This file
```

## Philosophy Document

For the complete **Radiant Precision** design philosophy, see `design-philosophy.md`. This document articulates the full aesthetic vision that guides the visual identity.

---

**Created**: 2025-11-18
**Design Philosophy**: Radiant Precision
**Designer**: RECTOR / CIPHER
**License**: MIT OR Apache-2.0
