from playwright.sync_api import sync_playwright
import os

OUT = r"C:\Users\hp\lex-manage\report_screenshots"
BASE = "http://localhost:5173"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, args=["--no-sandbox"])
    ctx = browser.new_context(viewport={"width": 1440, "height": 900})
    page = ctx.new_page()

    # Login
    page.goto(BASE, wait_until="networkidle", timeout=15000)
    page.wait_for_timeout(800)
    page.fill("input[type='email'], input[type='text']", "admin@demo.com")
    page.fill("input[type='password']", "password123")
    page.locator("button:has-text('Login')").click()
    page.wait_for_timeout(2500)

    # Profile view
    print("Profile...")
    try:
        # Click user avatar / profile in sidebar
        page.locator("nav *:has-text('Profile'), nav *:has-text('Profil'), nav *:has-text('Mon Profil'), [aria-label*='profile']").first.click(timeout=4000)
        page.wait_for_timeout(1500)
        page.screenshot(path=f"{OUT}/16_profile.png", full_page=True)
        print("  saved 16_profile.png")
    except:
        # Try clicking the user avatar in header/sidebar
        try:
            page.locator(".avatar, img[alt*='profile'], button.user-menu").first.click(timeout=3000)
            page.wait_for_timeout(1000)
            page.screenshot(path=f"{OUT}/16_profile.png", full_page=True)
            print("  saved 16_profile.png (from avatar click)")
        except Exception as e:
            print(f"  profile failed: {e}")

    # Search palette
    print("Search palette...")
    page.goto(BASE, wait_until="networkidle", timeout=15000)
    page.wait_for_timeout(1500)
    page.keyboard.press("Control+k")
    page.wait_for_timeout(1200)
    page.screenshot(path=f"{OUT}/21_search_palette.png", full_page=True)
    print("  saved 21_search_palette.png")
    page.keyboard.press("Escape")

    # Dashboard full - resize to wider to show sidebar
    print("Dashboard with full sidebar...")
    ctx2 = browser.new_context(viewport={"width": 1600, "height": 900})
    page2 = ctx2.new_page()
    page2.goto(BASE, wait_until="networkidle", timeout=15000)
    page2.wait_for_timeout(800)
    page2.fill("input[type='email'], input[type='text']", "admin@demo.com")
    page2.fill("input[type='password']", "password123")
    page2.locator("button:has-text('Login')").click()
    page2.wait_for_timeout(2500)
    page2.screenshot(path=f"{OUT}/20_dashboard_with_sidebar.png", full_page=False)
    print("  saved 20_dashboard_with_sidebar.png")

    # Case drawer / detail
    print("Case drawer...")
    try:
        page2.locator("nav *:has-text('Case'), nav a[href*='case']").first.click(timeout=4000)
        page2.wait_for_timeout(1500)
        # Click first case row
        page2.locator("table tr:nth-child(2), .case-row, [data-testid='case-row']").first.click(timeout=4000)
        page2.wait_for_timeout(1500)
        page2.screenshot(path=f"{OUT}/22_case_drawer.png", full_page=False)
        print("  saved 22_case_drawer.png")
    except Exception as e:
        print(f"  case drawer failed: {e}")

    # Document with import button visible
    print("Document import button...")
    try:
        page2.locator("nav *:has-text('Document')").first.click(timeout=4000)
        page2.wait_for_timeout(1500)
        page2.screenshot(path=f"{OUT}/23_documents_import_btn.png", full_page=False)
        print("  saved 23_documents_import_btn.png")
    except Exception as e:
        print(f"  doc import btn failed: {e}")

    # Notification bell popup
    print("Notification bell popup...")
    try:
        page2.goto(BASE, wait_until="networkidle", timeout=15000)
        page2.wait_for_timeout(800)
        page2.fill("input[type='email'], input[type='text']", "admin@demo.com")
        page2.fill("input[type='password']", "password123")
        page2.locator("button:has-text('Login')").click()
        page2.wait_for_timeout(2000)
        page2.locator("button[aria-label*='notif'], button[aria-label*='Notification'], header button").nth(1).click(timeout=3000)
        page2.wait_for_timeout(1000)
        page2.screenshot(path=f"{OUT}/24_notification_bell.png", full_page=False)
        print("  saved 24_notification_bell.png")
    except Exception as e:
        print(f"  notification bell failed: {e}")

    browser.close()

print("Done!")
import os
files = sorted(f for f in os.listdir(OUT) if f.endswith('.png'))
print(f"Total screenshots: {len(files)}")
for f in files:
    print(f"  {f}")
