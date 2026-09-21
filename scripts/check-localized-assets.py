from pathlib import Path
from playwright.sync_api import sync_playwright

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True, executable_path='/usr/bin/chromium')
    page = browser.new_page(viewport={'width': 1280, 'height': 800})
    failures = []
    responses = {}
    page.on('requestfailed', lambda request: failures.append({'url': request.url, 'error': request.failure}))
    page.on('response', lambda response: responses.__setitem__(response.url, response.status) if '/assets/' in response.url else None)
    page.goto('http://127.0.0.1:3000/', wait_until='networkidle')
    page.evaluate('window.scrollTo(0, document.body.scrollHeight)')
    for image in page.locator('img').all():
        image.scroll_into_view_if_needed()
        page.wait_for_timeout(100)
    page.wait_for_timeout(1500)
    images = page.locator('img').evaluate_all('(nodes) => nodes.map((node) => ({src: node.getAttribute("src"), complete: node.complete, width: node.naturalWidth}))')
    broken = [image for image in images if image['src'] and image['src'].startswith('/assets/') and (not image['complete'] or image['width'] == 0)]
    page.screenshot(path='/tmp/santos-soka-localized-assets.png', full_page=False)
    print({'image_count': len(images), 'localized_count': sum(1 for image in images if image['src'] and image['src'].startswith('/assets/')), 'broken_localized': broken, 'asset_failures': failures, 'asset_responses': {url: status for url, status in responses.items() if status != 200}})
    browser.close()
