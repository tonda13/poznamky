import { test, expect } from '@playwright/test';

// Behaviour of the single-note app that must survive the multi-note change.

test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
});

test('typed text survives reload', async ({ page }) => {
    const notes = page.locator('#notes');
    await notes.click();
    await page.keyboard.type('hello world');
    await page.reload();
    await expect(notes).toHaveValue('hello world');
    expect(await page.evaluate(() => localStorage.getItem('notes'))).toBe('hello world');
});

test('existing notes key is loaded on start', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('notes', 'legacy note'));
    await page.reload();
    await expect(page.locator('#notes')).toHaveValue('legacy note');
});

test('theme from settings survives reload', async ({ page }) => {
    await page.locator('#settingsButton').click();
    await page.locator('.theme-card', { hasText: 'Nord' }).click();
    await page.locator('#confirmBtn').click();
    // Dialog 'close' event (which persists the settings) fires asynchronously
    await expect.poll(() => page.evaluate(() => localStorage.getItem('settings:'))).toContain('#2e3440');
    await page.reload();
    await expect(page.locator('#notes')).toHaveCSS('background-color', 'rgb(46, 52, 64)');
});

test('Alt+X inserts a horizontal rule', async ({ page }) => {
    await page.locator('#notes').click();
    await page.keyboard.type('abc');
    await page.keyboard.press('Alt+KeyX');
    // Length depends on the window width, see layout.spec.ts
    await expect(page.locator('#notes')).toHaveValue(/^abc\n-{3,}\n$/);
});

test.describe('settings shortcut', () => {
    test('Ctrl/Cmd+, opens settings and closes them without saving', async ({ page }) => {
        await page.keyboard.press('ControlOrMeta+Comma');
        await expect(page.locator('#settings')).toBeVisible();
        await page.locator('.theme-card', { hasText: 'Nord' }).click();
        await page.keyboard.press('ControlOrMeta+Comma');
        await expect(page.locator('#settings')).toBeHidden();
        await expect(page.locator('#notes')).toHaveCSS('background-color', 'rgb(255, 251, 213)');
    });

    test('settings list and button tooltip mention the shortcut', async ({ page }) => {
        await expect(page.locator('#settingsButton')).toHaveAttribute('title', /Nastavení \((⌘|Ctrl\+),\)/);
        await page.locator('#settingsButton').click();
        await expect(page.locator('.shortcut-row', { hasText: 'Otevřít nastavení' })).toBeVisible();
    });
});
