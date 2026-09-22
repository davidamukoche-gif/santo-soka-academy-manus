from playwright.sync_api import sync_playwright

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True, executable_path='/usr/bin/chromium')
    page = browser.new_page(viewport={'width': 1280, 'height': 800})
    page.goto('http://127.0.0.1:3000/', wait_until='networkidle')
    public_text = page.locator('body').inner_text()
    public_nav = page.locator('.nav-links').inner_text()
    assert 'Sign in' not in public_text and 'Admin dashboard' not in public_text and 'Sign out' not in public_text
    assert 'WhatsApp us' in public_text
    assert '/admin/login' not in public_nav

    page.goto('http://127.0.0.1:3000/admin/login.html', wait_until='networkidle')
    assert page.locator('#admin-login-form input[type=email]').count() == 1
    assert page.locator('#admin-login-form input[type=password]').count() == 1
    assert page.locator('#admin-reset-request').count() == 1
    assert page.locator('text=Administrator login').count() == 1
    page.screenshot(path='/tmp/santos-soka-admin-login.png', full_page=False)
    page.goto('http://127.0.0.1:3000/admin/reset-password.html', wait_until='networkidle')
    assert page.locator('#admin-reset-form input[type=password]').count() == 2
    page.goto('http://127.0.0.1:3000/manage-senior-players.html', wait_until='networkidle')
    page.wait_for_timeout(500)
    assert '/admin/login' in page.url
    print({'public_has_login_controls': False, 'public_has_whatsapp': True, 'admin_password_form': True, 'admin_guard_redirects': True})
    browser.close()
