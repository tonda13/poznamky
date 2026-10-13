import { test, expect } from '@playwright/test';

// Two tabs of the app: a tab with unchanged (stale) content must not overwrite
// what the other tab saved.

test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
        localStorage.clear();
        localStorage.setItem('notes', 'original');
    });
    await page.reload();
});

test('unchanged note is not saved over a newer version from another tab', async ({ page, context }) => {
    const other = await context.newPage();
    await other.goto('/');
    await other.locator('#notes').fill('edited in other tab');
    await other.locator('#notes').blur();

    // The first tab still shows the old text; leaving the textarea must not save it
    await page.locator('#notes').focus();
    await page.locator('#notes').blur();
    await page.keyboard.press('ControlOrMeta+KeyK');
    await page.keyboard.type('elsewhere');
    await page.keyboard.press('Enter');

    expect(await page.evaluate(() => localStorage.getItem('notes'))).toBe('edited in other tab');
});

test('unchanged note shows changes made in another tab', async ({ page, context }) => {
    const other = await context.newPage();
    await other.goto('/');
    await other.locator('#notes').fill('edited in other tab');
    await other.locator('#notes').blur();
    await expect(page.locator('#notes')).toHaveValue('edited in other tab');
});

test('changed note is still saved on blur', async ({ page }) => {
    await page.locator('#notes').fill('changed');
    await page.locator('#notes').blur();
    expect(await page.evaluate(() => localStorage.getItem('notes'))).toBe('changed');
});
