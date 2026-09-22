from playwright.sync_api import sync_playwright

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True, executable_path='/usr/bin/chromium')
    page = browser.new_page(viewport={'width': 1280, 'height': 900})
    page.goto('http://127.0.0.1:3000/gallery.html', wait_until='networkidle')
    assert page.locator('#gallery').count() == 1
    assert page.locator('#filters button').count() == 5
    assert page.locator('.gallery figure').count() >= 1
    assert page.locator('text=Training').count() >= 1
    page.screenshot(path='/tmp/santos-soka-gallery.png', full_page=False)

    page.goto('http://127.0.0.1:3000/manage-senior-players.html', wait_until='networkidle')
    page.wait_for_timeout(500)
    assert '/admin/login' in page.url
    print({'public_gallery_visible': True, 'gallery_filters': 5, 'admin_gallery_protected': True})
    browser.close()
