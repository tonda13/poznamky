import { test, expect, Page } from '@playwright/test';

const storage = (page: Page, key: string) => page.evaluate(k => localStorage.getItem(k), key);
const switchTo = (page: Page, hash: string) => page.evaluate(h => { location.hash = h; }, hash);

async function setup(page: Page, notes: Record<string, string>) {
    await page.goto('/');
    await page.evaluate(n => {
        localStorage.clear();
        for (const [key, value] of Object.entries(n)) localStorage.setItem(key, value);
    }, notes);
    await page.reload();
}

test.beforeEach(async ({ page }) => {
    await setup(page, { notes: '# Ahoj\n\nsvete', 'notes:prace': 'work note' });
});

test('preview button is the last one in the toolbar', async ({ page }) => {
    await expect(page.locator('#toolbar > button').last()).toHaveId('previewButton');
});

test('button toggles between editing and rendered Markdown', async ({ page }) => {
    const notes = page.locator('#notes');
    const preview = page.locator('#preview');
    await expect(preview).toBeHidden();

    await page.locator('#previewButton').click();
    await expect(notes).toBeHidden();
    await expect(preview).toBeVisible();
    await expect(preview.locator('h1')).toHaveText('Ahoj');
    await expect(page.locator('#previewButton')).toHaveText('✏️');

    await page.locator('#previewButton').click();
    await expect(preview).toBeHidden();
    await expect(notes).toBeVisible();
    await expect(notes).toBeFocused();
    await expect(page.locator('#previewButton')).toHaveText('👁️');
});

test('Ctrl/Cmd+E toggles the preview, Esc goes back to editing', async ({ page }) => {
    const preview = page.locator('#preview');
    await page.keyboard.press('ControlOrMeta+KeyE');
    await expect(preview).toBeVisible();
    await page.keyboard.press('ControlOrMeta+KeyE');
    await expect(preview).toBeHidden();

    await page.keyboard.press('ControlOrMeta+KeyE');
    await expect(preview).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(preview).toBeHidden();
    await expect(page.locator('#notes')).toBeFocused();
});

test('preview shows unsaved edits', async ({ page }) => {
    const notes = page.locator('#notes');
    await notes.fill('## Nove');
    await page.locator('#previewButton').click();
    await expect(page.locator('#preview h2')).toHaveText('Nove');
    expect(await storage(page, 'notes')).toBe('## Nove');
});

test('editing shortcuts do nothing in the preview', async ({ page }) => {
    await page.locator('#previewButton').click();
    for (const key of ['Alt+KeyX', 'ControlOrMeta+KeyD', 'Control+KeyQ', 'Alt+ArrowDown']) {
        await page.keyboard.press(key);
    }
    await page.locator('#previewButton').click();
    await expect(page.locator('#notes')).toHaveValue('# Ahoj\n\nsvete');
    expect(await storage(page, 'notes')).toBe('# Ahoj\n\nsvete');
});

test('preview uses the note colors', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('settings:prace', JSON.stringify({ backgroundColor: '#2e3440', color: '#d8dee9' })));
    await page.goto('/#prace');
    await page.locator('#previewButton').click();
    await expect(page.locator('#preview')).toHaveCSS('color', 'rgb(216, 222, 233)');
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(46, 52, 64)');
});

test('preview is sanitized and links open in a new tab', async ({ page }) => {
    await page.locator('#notes').fill('<img src=x onerror="window.pwned=1">\n\n[odkaz](https://example.com)');
    await page.locator('#previewButton').click();
    await expect(page.locator('#preview a')).toHaveAttribute('target', '_blank');
    await expect(page.locator('#preview a')).toHaveAttribute('rel', 'noopener');
    await expect(page.locator('#preview img')).not.toHaveAttribute('onerror');
    expect(await page.evaluate(() => (window as any).pwned)).toBeUndefined();
});

test('switching to a note with text keeps the preview', async ({ page }) => {
    await page.locator('#previewButton').click();
    await switchTo(page, 'prace');
    await expect(page.locator('#preview')).toBeVisible();
    await expect(page.locator('#preview')).toHaveText('work note');
});

test('switching to an empty note goes back to editing', async ({ page }) => {
    await page.locator('#previewButton').click();
    await switchTo(page, 'nova');
    await expect(page.locator('#preview')).toBeHidden();
    await expect(page.locator('#notes')).toBeVisible();
    await expect(page.locator('#notes')).toBeFocused();
});

test('preview follows changes of the note from another tab', async ({ page }) => {
    await page.locator('#previewButton').click();
    await page.evaluate(() => window.dispatchEvent(new StorageEvent('storage', { key: 'notes', newValue: '# Jinde' })));
    await expect(page.locator('#preview h1')).toHaveText('Jinde');
});

test('settings list the preview shortcut', async ({ page }) => {
    await expect(page.locator('#previewButton')).toHaveAttribute('title', /Náhled Markdown \((⌘|Ctrl\+)E\)/);
    await page.locator('#settingsButton').click();
    await expect(page.locator('.shortcut-desc', { hasText: 'Náhled Markdown' })).toBeVisible();
});

test('without the Markdown libraries the preview shows plain text', async ({ page }) => {
    await page.route('**/cdn.jsdelivr.net/**', route => route.abort());
    await page.reload();
    await page.locator('#previewButton').click();
    await expect(page.locator('#preview')).toHaveClass(/plain/);
    await expect(page.locator('#preview')).toHaveText('# Ahoj\n\nsvete');
});
