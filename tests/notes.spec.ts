import { test, expect, Page } from '@playwright/test';

const storage = (page: Page, key: string) => page.evaluate(k => localStorage.getItem(k), key);

test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
        localStorage.clear();
        localStorage.setItem('notes', 'default note');
    });
    await page.reload();
});

test.describe('notes addressed by URL hash', () => {
    test('page without hash shows the default note', async ({ page }) => {
        await expect(page.locator('#notes')).toHaveValue('default note');
    });

    test('hash opens a separate note that survives reload', async ({ page }) => {
        await page.goto('/#práce');
        const notes = page.locator('#notes');
        await expect(notes).toHaveValue('');
        await notes.click();
        await page.keyboard.type('work stuff');
        expect(await storage(page, 'notes:práce')).toBe('work stuff');
        expect(await storage(page, 'notes')).toBe('default note');

        await page.reload();
        await expect(notes).toHaveValue('work stuff');
    });

    test('changing the hash switches the note', async ({ page }) => {
        await page.evaluate(() => localStorage.setItem('notes:other', 'other note'));
        await page.evaluate(() => { location.hash = 'other'; });
        await expect(page.locator('#notes')).toHaveValue('other note');
        await page.evaluate(() => { location.hash = ''; });
        await expect(page.locator('#notes')).toHaveValue('default note');
    });

    test('empty note is not stored', async ({ page }) => {
        await page.goto('/#empty');
        await page.locator('#notes').click();
        await page.keyboard.type('x');
        await page.keyboard.press('Backspace');
        await page.locator('#notes').blur();
        expect(await storage(page, 'notes:empty')).toBeNull();
    });
});
