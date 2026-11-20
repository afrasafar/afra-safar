"""Afra Safar Jalali/Dark + mobile smoke test against a deployed staging URL.
Usage: python qa/check_jalali_theme.py https://staging.example.com
Requires playwright, Chromium installed locally.
Read-only: this script does not submit reservations or mutate Supabase.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import sys,json
base=(sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8000').rstrip('/')
root=Path(__file__).resolve().parents[1]
widths=[320,390,430,768,1024,1440]
files=sorted(p.name for p in root.glob('*.html'))
issues=[]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    page=browser.new_page(viewport={'width':390,'height':820})
    for name in files:
        for width in widths:
            page.set_viewport_size({'width':width,'height':820})
            try:
                response=page.goto(f'{base}/{name}',wait_until='domcontentloaded',timeout=15000)
                data=page.evaluate('''() => ({width:innerWidth,scroll:document.documentElement.scrollWidth,
                    calendar:!!window.AfraJalali,theme:!!window.AfraTheme})''')
                if not response or response.status>=400 or data['scroll']>width+2 or not data['calendar'] or not data['theme']:
                    issues.append({'page':name,'width':width,'response':response.status if response else None,**data})
            except Exception as e:issues.append({'page':name,'width':width,'error':str(e)[:160]})
    browser.close()
print(json.dumps({'pages':len(files),'checks':len(files)*len(widths),'issues':issues},ensure_ascii=False,indent=2))
raise SystemExit(1 if issues else 0)
