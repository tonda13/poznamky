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
    await expect.poll(() => page.evaluate(() => localStorage.getItem('settings'))).toContain('#2e3440');
    await page.reload();
    await expect(page.locator('#notes')).toHaveCSS('background-color', 'rgb(46, 52, 64)');
});

test('Alt+X inserts a horizontal rule', async ({ page }) => {
    await page.locator('#notes').click();
    await page.keyboard.type('abc');
    await page.keyboard.press('Alt+KeyX');
    await expect(page.locator('#notes')).toHaveValue('abc\n' + '-'.repeat(164) + '\n');
});
