#!/usr/bin/env python3
"""
=============================================================================
SARATH KUMAR — PHYSICAL ID CARD QR CODE GENERATOR
=============================================================================
This tool generates high-resolution, print-ready QR codes for physical ID cards
once your portfolio is deployed to a live HTTPS URL (e.g., GitHub Pages or Cloudflare Pages).

Usage:
    python generate_qr.py [YOUR_DEPLOYED_URL]

Examples:
    python generate_qr.py https://sarathkumar.github.io/portfolio
    python generate_qr.py https://sarath.pages.dev
"""

import sys
import os

try:
    import qrcode
    from qrcode.constants import ERROR_CORRECT_H
except ImportError:
    print("[ERROR] 'qrcode' package is required. Install it using:")
    print("        pip install qrcode[pil]")
    sys.exit(1)


def generate_qr(url, output_prefix="sarath-id-card-qr"):
    if not url.startswith("http://") and not url.startswith("https://"):
        print("[WARNING] The URL does not start with https://. Public QR codes should use HTTPS.")
        proceed = input("Continue anyway? (y/N): ").strip().lower()
        if proceed != "y":
            print("Aborted.")
            return

    print(f"\n[INFO] Generating ID card QR code for target: {url}")

    # Use High Error Correction (30% recovery) for durable physical ID card scanning
    qr = qrcode.QRCode(
        version=None,
        error_correction=ERROR_CORRECT_H,
        box_size=16,
        border=3,
    )
    qr.add_data(url)
    qr.make(fit=True)

    output_dir = os.path.join("assets", "qr")
    os.makedirs(output_dir, exist_ok=True)

    # 1. Standard High-Contrast Black & White (Recommended for physical ID card printers)
    img_bw = qr.make_image(fill_color="black", back_color="white")
    bw_filename = os.path.join(output_dir, f"{output_prefix}-print-bw.png")
    img_bw.save(bw_filename)
    print(f"[SUCCESS] High-contrast print version saved to: {bw_filename}")

    # 2. Dark-Cinematic Gold Accent Version (Matching website branding)
    try:
        img_gold = qr.make_image(fill_color="#E5BD75", back_color="#050505")
        gold_filename = os.path.join(output_dir, f"{output_prefix}-cinematic-gold.png")
        img_gold.save(gold_filename)
        print(f"[SUCCESS] Dark & Gold themed version saved to: {gold_filename}")
    except Exception as e:
        print(f"[NOTE] Themed version skipped: {e}")

    print("\n[PRINTING TIP] For physical plastic ID cards, the high-contrast version")
    print(f"               ('{bw_filename}') offers the most reliable scanning across all phone cameras.")
    print("=============================================================================\n")


if __name__ == "__main__":
    if len(sys.argv) > 1:
        target_url = sys.argv[1].strip()
    else:
        print("--- Sarath ID Card QR Code Generator ---")
        target_url = input("Enter your deployed portfolio URL (e.g., https://sarath.pages.dev): ").strip()

    if not target_url:
        print("[ERROR] No URL provided. Please provide a valid deployed HTTPS URL.")
        sys.exit(1)

    generate_qr(target_url)
