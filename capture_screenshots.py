"""
Screenshot capture script for LexManage report.
Logs in, navigates every section, takes full-page screenshots.
"""
from playwright.sync_api import sync_playwright
import os, time

OUT = r"C:\Users\hp\lex-manage\report_screenshots"
os.makedirs(OUT, exist_ok=True)

BASE = "http://localhost:5173"
EMAIL = "admin@demo.com"
PASSWORD = "password123"

def nav_wait(page, path, ms=1800):
    page.evaluate(f"window.__navTo = '{path}'")
    # click sidebar item by its href / data attribute
    page.goto(f"{BASE}{path}", wait_until="networkidle", timeout=15000)
    page.wait_for_timeout(ms)

def ss(page, name):
    p = f"{OUT}/{name}.png"
    page.screenshot(path=p, full_page=True)
    print(f"  saved {name}.png")
    return p

def click_sidebar(page, label_text):
    """Click a sidebar navigation item by text."""
    try:
        page.locator(f"text={label_text}").first.click(timeout=4000)
        page.wait_for_timeout(1500)
        return True
    except:
        return False

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, args=["--no-sandbox"])
    ctx = browser.new_context(viewport={"width": 1440, "height": 900})
    page = ctx.new_page()

    # ── 1. Login screen ──────────────────────────────────────────────
    print("Login screen...")
    page.goto(BASE, wait_until="networkidle", timeout=15000)
    page.wait_for_timeout(1000)
    ss(page, "01_login")

    # ── 2. Registration screen ───────────────────────────────────────
    print("Registration screen...")
    try:
        page.locator("text=Create a new firm").click(timeout=4000)
        page.wait_for_timeout(1000)
        ss(page, "02_register")
    except:
        ss(page, "02_register_fallback")

    # ── 3. Login ─────────────────────────────────────────────────────
    print("Logging in...")
    page.goto(BASE, wait_until="networkidle", timeout=15000)
    page.wait_for_timeout(800)
    page.fill("input[type='email'], input[type='text']", EMAIL)
    page.fill("input[type='password']", PASSWORD)
    page.locator("button:has-text('Login')").click()
    page.wait_for_timeout(2500)
    ss(page, "03_dashboard_top")

    # Scroll down dashboard
    page.evaluate("window.scrollTo(0,500)")
    page.wait_for_timeout(800)
    ss(page, "04_dashboard_mid")

    page.evaluate("window.scrollTo(0,1200)")
    page.wait_for_timeout(800)
    ss(page, "05_dashboard_charts")

    page.evaluate("window.scrollTo(0,0)")

    # ── 4. Open sidebar ──────────────────────────────────────────────
    # try to open sidebar if collapsed
    try:
        page.locator("button[aria-label*='menu'], button[aria-label*='sidebar'], button.sidebar-toggle").first.click(timeout=2000)
        page.wait_for_timeout(500)
    except:
        pass

    # ── 5. Cases ─────────────────────────────────────────────────────
    print("Cases view...")
    try:
        page.locator("a[href*='case'], li:has-text('Case'), button:has-text('Case'), nav a:has-text('Case')").first.click(timeout=4000)
        page.wait_for_timeout(2000)
    except:
        page.goto(f"{BASE}/#cases", wait_until="networkidle", timeout=15000)
        page.wait_for_timeout(1500)
    ss(page, "06_cases")

    # New Case dialog
    try:
        page.locator("button:has-text('New Case'), button:has-text('Nouveau')").first.click(timeout=4000)
        page.wait_for_timeout(1200)
        ss(page, "07_new_case_dialog")
        page.keyboard.press("Escape")
        page.wait_for_timeout(500)
    except:
        print("  new case dialog not found")

    # ── 6. Clients ───────────────────────────────────────────────────
    print("Clients view...")
    try:
        page.locator("a[href*='client'], nav *:has-text('Client')").first.click(timeout=4000)
        page.wait_for_timeout(2000)
        ss(page, "08_clients")
    except:
        print("  clients not found")

    # ── 7. Documents ─────────────────────────────────────────────────
    print("Documents view...")
    try:
        page.locator("a[href*='doc'], nav *:has-text('Document')").first.click(timeout=4000)
        page.wait_for_timeout(2000)
        ss(page, "09_documents")
        page.evaluate("window.scrollTo(0,400)")
        page.wait_for_timeout(600)
        ss(page, "10_documents_upload")
    except:
        print("  documents not found")

    # ── 8. LexAssist AI ──────────────────────────────────────────────
    print("LexAssist AI view...")
    try:
        page.locator("nav *:has-text('AI'), nav *:has-text('LexAssist'), nav *:has-text('Assistant')").first.click(timeout=5000)
        page.wait_for_timeout(2500)
        ss(page, "11_lexassist_ai")
    except:
        print("  lexassist not found")

    # ── 9. AI Dashboard ──────────────────────────────────────────────
    print("AI Dashboard...")
    try:
        page.locator("nav *:has-text('Dashboard IA'), nav *:has-text('AI Dashboard'), nav *:has-text('Tableau')").first.click(timeout=4000)
        page.wait_for_timeout(2000)
        ss(page, "12_ai_dashboard")
    except:
        # Try clicking the AI bot button in header
        try:
            page.locator("button[aria-label*='AI'], button.ai-btn, header button:nth-child(2)").first.click(timeout=4000)
            page.wait_for_timeout(2000)
            ss(page, "12_ai_dashboard")
        except:
            print("  AI dashboard not found")

    # ── 10. Notifications ────────────────────────────────────────────
    print("Notifications view...")
    try:
        page.locator("nav *:has-text('Notification'), nav *:has-text('Notif')").first.click(timeout=4000)
        page.wait_for_timeout(2000)
        ss(page, "13_notifications")
    except:
        # Click the bell icon
        try:
            page.locator("button[aria-label*='notif'], button[aria-label*='bell'], header button").nth(1).click(timeout=4000)
            page.wait_for_timeout(1500)
            ss(page, "13_notifications_bell")
        except:
            print("  notifications not found")

    # ── 11. Calendar ─────────────────────────────────────────────────
    print("Calendar view...")
    try:
        page.locator("nav *:has-text('Calendar'), nav *:has-text('Calendrier')").first.click(timeout=4000)
        page.wait_for_timeout(2000)
        ss(page, "14_calendar")
    except:
        print("  calendar not found")

    # ── 12. Settings ─────────────────────────────────────────────────
    print("Settings view...")
    try:
        page.locator("nav *:has-text('Settings'), nav *:has-text('Paramètre')").first.click(timeout=4000)
        page.wait_for_timeout(2000)
        ss(page, "15_settings")
    except:
        print("  settings not found")

    # ── 13. Profile ──────────────────────────────────────────────────
    print("Profile view...")
    try:
        page.locator("nav *:has-text('Profile'), nav *:has-text('Profil'), nav *:has-text('Mon Profil')").first.click(timeout=4000)
        page.wait_for_timeout(2000)
        ss(page, "16_profile")
    except:
        print("  profile not found")

    # ── 14. Admin / Firm Management ──────────────────────────────────
    print("Admin / Firm management...")
    try:
        page.locator("nav *:has-text('Admin'), nav *:has-text('Firm'), nav *:has-text('Cabinet')").first.click(timeout=4000)
        page.wait_for_timeout(2000)
        ss(page, "17_admin")
    except:
        print("  admin not found")

    # ── 15. Colleagues ───────────────────────────────────────────────
    print("Colleagues view...")
    try:
        page.locator("nav *:has-text('Colleagues'), nav *:has-text('Collègues')").first.click(timeout=4000)
        page.wait_for_timeout(2000)
        ss(page, "18_colleagues")
    except:
        print("  colleagues not found")

    # ── 16. Audit Logs ───────────────────────────────────────────────
    print("Audit logs (via admin)...")
    try:
        page.locator("nav *:has-text('Audit'), *:has-text('Security'), *:has-text('Sécurité')").first.click(timeout=3000)
        page.wait_for_timeout(1500)
        ss(page, "19_audit_logs")
    except:
        print("  audit logs not found separately")

    # ── 17. Go back to dashboard, open sidebar fully ─────────────────
    print("Dashboard with sidebar visible...")
    page.goto(BASE, wait_until="networkidle", timeout=15000)
    page.wait_for_timeout(1500)

    # Try to show full sidebar (click hamburger if sidebar collapsed)
    try:
        page.locator("button:has-text('☰'), button[aria-label*='menu']").first.click(timeout=2000)
        page.wait_for_timeout(500)
    except:
        pass
    ss(page, "20_dashboard_with_sidebar")

    # ── 18. Search palette ───────────────────────────────────────────
    print("Search palette (Ctrl+K)...")
    page.keyboard.press("Control+k")
    page.wait_for_timeout(1000)
    ss(page, "21_search_palette")
    page.keyboard.press("Escape")

    browser.close()

print("\nAll screenshots done!")
print(f"Saved to: {OUT}")
import os
files = sorted(os.listdir(OUT))
for f in files:
    size = os.path.getsize(f"{OUT}/{f}")
    print(f"  {f}  ({size//1024} KB)")
