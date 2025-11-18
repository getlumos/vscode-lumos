#!/usr/bin/env python3
"""
LUMOS Icon Generator - Radiant Precision Design Philosophy
Creates a 128x128px icon embodying illumination, technical precision, and Solana aesthetics
"""

from PIL import Image, ImageDraw, ImageFilter
import math

def create_radial_gradient(size, center, inner_color, outer_color, radius):
    """Create a radial gradient from center point"""
    img = Image.new('RGBA', size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    for r in range(radius, 0, -1):
        # Calculate interpolation factor
        t = r / radius

        # Interpolate colors
        color = tuple(
            int(inner_color[i] * t + outer_color[i] * (1 - t))
            for i in range(4)
        )

        draw.ellipse(
            [center[0] - r, center[1] - r, center[0] + r, center[1] + r],
            fill=color
        )

    return img

def create_lumos_icon():
    """Create the LUMOS icon following Radiant Precision philosophy"""

    # Canvas setup - 128x128 for VSCode extension
    size = (128, 128)
    center = (64, 64)

    # Solana-inspired color palette
    # Deep purple to blue to orange/magenta gradients
    bg_purple = (20, 15, 35, 255)  # Deep purple background
    glow_inner = (140, 100, 255, 255)  # Bright purple center
    glow_mid = (100, 150, 255, 255)  # Blue mid
    glow_outer = (255, 120, 180, 180)  # Magenta outer (semi-transparent)
    accent_orange = (255, 140, 80, 255)  # Orange accent

    # Create base canvas
    canvas = Image.new('RGBA', size, bg_purple)

    # Layer 1: Outer radial glow
    outer_glow = create_radial_gradient(
        size, center,
        inner_color=(120, 100, 255, 200),
        outer_color=(0, 0, 0, 0),
        radius=70
    )
    canvas = Image.alpha_composite(canvas, outer_glow)

    # Layer 2: Create geometric hexagon (representing schema structure)
    hex_layer = Image.new('RGBA', size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(hex_layer)

    # Hexagon points (technical precision)
    hex_radius = 32
    hexagon_points = []
    for i in range(6):
        angle = math.pi / 3 * i - math.pi / 6  # Rotated 30 degrees
        x = center[0] + hex_radius * math.cos(angle)
        y = center[1] + hex_radius * math.sin(angle)
        hexagon_points.append((x, y))

    # Draw filled hexagon with gradient effect
    draw.polygon(hexagon_points, fill=(80, 70, 150, 255))

    # Add subtle inner glow to hexagon
    inner_glow = create_radial_gradient(
        size, center,
        inner_color=(160, 140, 255, 255),
        outer_color=(0, 0, 0, 0),
        radius=35
    )
    hex_layer = Image.alpha_composite(hex_layer, inner_glow)

    # Draw hexagon outline with precision
    draw.line(hexagon_points + [hexagon_points[0]], fill=(200, 180, 255, 255), width=2)

    canvas = Image.alpha_composite(canvas, hex_layer)

    # Layer 3: Radiating beams (LUMOS = light)
    beams_layer = Image.new('RGBA', size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(beams_layer)

    # Create 6 radiating beams aligned with hexagon vertices
    beam_length = 50
    beam_width = 2
    for i in range(6):
        angle = math.pi / 3 * i - math.pi / 6
        # Inner point (from hexagon edge)
        x1 = center[0] + (hex_radius + 2) * math.cos(angle)
        y1 = center[1] + (hex_radius + 2) * math.sin(angle)
        # Outer point
        x2 = center[0] + (hex_radius + beam_length) * math.cos(angle)
        y2 = center[1] + (hex_radius + beam_length) * math.sin(angle)

        # Gradient beam effect (orange accent)
        draw.line([(x1, y1), (x2, y2)], fill=(255, 160, 100, 180), width=beam_width)

    canvas = Image.alpha_composite(canvas, beams_layer)

    # Layer 4: Central luminous core
    core_layer = Image.new('RGBA', size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(core_layer)

    # Small central circle (bright core)
    core_radius = 8
    draw.ellipse(
        [center[0] - core_radius, center[1] - core_radius,
         center[0] + core_radius, center[1] + core_radius],
        fill=(255, 240, 255, 255)
    )

    # Add soft glow to core
    core_glow = create_radial_gradient(
        size, center,
        inner_color=(255, 220, 255, 255),
        outer_color=(0, 0, 0, 0),
        radius=18
    )
    core_layer = Image.alpha_composite(core_layer, core_glow)

    canvas = Image.alpha_composite(canvas, core_layer)

    # Layer 5: Subtle outer geometric accent marks (technical precision)
    accent_layer = Image.new('RGBA', size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(accent_layer)

    # Small dots at beam endpoints
    dot_radius = 2
    for i in range(6):
        angle = math.pi / 3 * i - math.pi / 6
        x = center[0] + (hex_radius + beam_length) * math.cos(angle)
        y = center[1] + (hex_radius + beam_length) * math.sin(angle)
        draw.ellipse(
            [x - dot_radius, y - dot_radius, x + dot_radius, y + dot_radius],
            fill=(255, 180, 120, 200)
        )

    canvas = Image.alpha_composite(canvas, accent_layer)

    # Final refinement: subtle blur for luminous quality
    # Create a slightly blurred version for the glow
    glow_version = canvas.filter(ImageFilter.GaussianBlur(radius=1.5))

    # Composite: blurred glow beneath sharp geometry
    final = Image.alpha_composite(glow_version, canvas)

    return final

def create_icon_variants():
    """Create icon in multiple sizes and formats"""

    # Create master icon at 128x128
    icon_128 = create_lumos_icon()

    # Save as PNG
    icon_128.save('/Users/rz/local-dev/lumos/vscode-lumos/icon.png', 'PNG')
    print("✓ Created icon.png (128x128)")

    # Create larger version for branding (512x512)
    icon_512 = create_lumos_icon_large()
    icon_512.save('/Users/rz/local-dev/lumos/vscode-lumos/icon-512.png', 'PNG')
    print("✓ Created icon-512.png (512x512)")

    # Create smaller sizes for various uses
    icon_64 = icon_128.resize((64, 64), Image.Resampling.LANCZOS)
    icon_64.save('/Users/rz/local-dev/lumos/vscode-lumos/icon-64.png', 'PNG')
    print("✓ Created icon-64.png (64x64)")

    icon_32 = icon_128.resize((32, 32), Image.Resampling.LANCZOS)
    icon_32.save('/Users/rz/local-dev/lumos/vscode-lumos/icon-32.png', 'PNG')
    print("✓ Created icon-32.png (32x32)")

def create_lumos_icon_large():
    """Create larger 512x512 version with more detail"""

    # Scale up the design for high-res branding
    size = (512, 512)
    center = (256, 256)

    # Solana-inspired color palette
    bg_purple = (20, 15, 35, 255)

    # Create base canvas
    canvas = Image.new('RGBA', size, bg_purple)

    # Outer radial glow
    outer_glow = create_radial_gradient(
        size, center,
        inner_color=(120, 100, 255, 200),
        outer_color=(0, 0, 0, 0),
        radius=280
    )
    canvas = Image.alpha_composite(canvas, outer_glow)

    # Hexagon layer
    hex_layer = Image.new('RGBA', size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(hex_layer)

    hex_radius = 128
    hexagon_points = []
    for i in range(6):
        angle = math.pi / 3 * i - math.pi / 6
        x = center[0] + hex_radius * math.cos(angle)
        y = center[1] + hex_radius * math.sin(angle)
        hexagon_points.append((x, y))

    draw.polygon(hexagon_points, fill=(80, 70, 150, 255))

    inner_glow = create_radial_gradient(
        size, center,
        inner_color=(160, 140, 255, 255),
        outer_color=(0, 0, 0, 0),
        radius=140
    )
    hex_layer = Image.alpha_composite(hex_layer, inner_glow)
    draw.line(hexagon_points + [hexagon_points[0]], fill=(200, 180, 255, 255), width=6)

    canvas = Image.alpha_composite(canvas, hex_layer)

    # Radiating beams
    beams_layer = Image.new('RGBA', size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(beams_layer)

    beam_length = 200
    beam_width = 6
    for i in range(6):
        angle = math.pi / 3 * i - math.pi / 6
        x1 = center[0] + (hex_radius + 4) * math.cos(angle)
        y1 = center[1] + (hex_radius + 4) * math.sin(angle)
        x2 = center[0] + (hex_radius + beam_length) * math.cos(angle)
        y2 = center[1] + (hex_radius + beam_length) * math.sin(angle)

        draw.line([(x1, y1), (x2, y2)], fill=(255, 160, 100, 180), width=beam_width)

    canvas = Image.alpha_composite(canvas, beams_layer)

    # Central core
    core_layer = Image.new('RGBA', size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(core_layer)

    core_radius = 32
    draw.ellipse(
        [center[0] - core_radius, center[1] - core_radius,
         center[0] + core_radius, center[1] + core_radius],
        fill=(255, 240, 255, 255)
    )

    core_glow = create_radial_gradient(
        size, center,
        inner_color=(255, 220, 255, 255),
        outer_color=(0, 0, 0, 0),
        radius=72
    )
    core_layer = Image.alpha_composite(core_layer, core_glow)

    canvas = Image.alpha_composite(canvas, core_layer)

    # Accent dots
    accent_layer = Image.new('RGBA', size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(accent_layer)

    dot_radius = 6
    for i in range(6):
        angle = math.pi / 3 * i - math.pi / 6
        x = center[0] + (hex_radius + beam_length) * math.cos(angle)
        y = center[1] + (hex_radius + beam_length) * math.sin(angle)
        draw.ellipse(
            [x - dot_radius, y - dot_radius, x + dot_radius, y + dot_radius],
            fill=(255, 180, 120, 200)
        )

    canvas = Image.alpha_composite(canvas, accent_layer)

    # Final blur for luminous quality
    glow_version = canvas.filter(ImageFilter.GaussianBlur(radius=4))
    final = Image.alpha_composite(glow_version, canvas)

    return final

if __name__ == "__main__":
    print("Creating LUMOS icon following Radiant Precision philosophy...")
    create_icon_variants()
    print("\n✨ Icon creation complete - meticulously crafted with expert precision")
