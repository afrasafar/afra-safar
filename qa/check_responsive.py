"""Afra Safar: run a viewport/overflow smoke test against a served build.
Usage: python qa/check_responsive.py http://127.0.0.1:8000
Requires: pip install playwright && python -m playwright install chromium.
To avoid modifying production data, use a staging URL with test accounts.
"""
import json, sys
from pathlib import Path
from playwright.sync_api import sync_playwright

base=(sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8000').rstrip('/')
root=Path(__file__).resolve().parents[1]
pages=sorted(p.name for p in root.glob('*.html'))
widths=[320,375,390,430,768,1024,1440]
errors=[]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    page=browser.new_page(viewport={'width':390,'height':850})
    for name in pages:
        for width in widths:
            page.set_viewport_size({'width':width,'height':850})
            try:
                response=page.goto(f'{base}/{name}',wait_until='domcontentloaded',timeout=12000)
                page.wait_for_timeout(150)
                data=page.evaluate('''() => ({viewport:window.innerWidth, scroll:document.documentElement.scrollWidth, expectedStyles:[...document.styleSheets].some(s=>s.href?.includes('afra-responsive-cards.css'))})''')
                if not response or response.status >= 400 or data['scroll']>width+2 or not data['expectedStyles']:
                    errors.append({'page':name,'width':width,'status':response.status if response else None,**data})
            except Exception as ex:
                errors.append({'page':name,'width':width,'error':str(ex)[:180]})
    browser.close()
print(json.dumps({'pages':len(pages),'viewport_tests':len(pages)*len(widths),'failures':errors},ensure_ascii=False,indent=2))
sys.exit(1 if errors else 0)
