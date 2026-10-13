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

test.describe('note switcher', () => {
    const openSwitcher = (page: Page) => page.keyboard.press('ControlOrMeta+KeyK');

    test('creates a new note from the query', async ({ page }) => {
        await openSwitcher(page);
        await expect(page.locator('#switcher')).toBeVisible();
        await page.keyboard.type('prace');
        await expect(page.locator('.sw-item.active')).toContainText('Nová poznámka „prace“');
        await page.keyboard.press('Enter');

        await expect(page.locator('#switcher')).toBeHidden();
        await expect(page).toHaveURL(/#prace$/);
        const notes = page.locator('#notes');
        await expect(notes).toHaveValue('');
        await expect(notes).toBeFocused();
        await page.keyboard.type('work');
        await page.reload();
        await expect(notes).toHaveValue('work');
    });

    test('Enter on empty query switches to the previous note', async ({ page }) => {
        await page.evaluate(() => localStorage.setItem('notes:other', 'other note'));
        await page.goto('/#other');
        await page.goto('/');
        await openSwitcher(page);
        await page.keyboard.press('Enter');
        await expect(page.locator('#notes')).toHaveValue('other note');
        await openSwitcher(page);
        await page.keyboard.press('Enter');
        await expect(page.locator('#notes')).toHaveValue('default note');
        await expect(page).not.toHaveURL(/#/);
    });

    test('filter matches note content without diacritics', async ({ page }) => {
        await page.evaluate(() => {
            localStorage.setItem('notes:shopping', 'mléko, chleba');
            localStorage.setItem('notes:work', 'review PR');
        });
        await openSwitcher(page);
        await page.keyboard.type('mleko');
        await expect(page.locator('.sw-item:not(.sw-new)')).toHaveCount(1);
        await expect(page.locator('.sw-item.active')).toContainText('shopping');
        await page.keyboard.press('Enter');
        await expect(page.locator('#notes')).toHaveValue('mléko, chleba');
    });

    test('arrows move the selection, click opens a note', async ({ page }) => {
        await page.evaluate(() => localStorage.setItem('notes:other', 'other note'));
        await openSwitcher(page);
        await page.keyboard.type('note');
        await page.keyboard.press('ArrowDown');
        await expect(page.locator('.sw-item.active')).toContainText('other');
        await page.locator('.sw-item', { hasText: 'Hlavní' }).click();
        await expect(page.locator('#notes')).toHaveValue('default note');
    });

    test('Ctrl/Cmd+Backspace deletes the selected note after confirmation', async ({ page }) => {
        await page.evaluate(() => localStorage.setItem('notes:old', 'old note'));
        page.on('dialog', dialog => dialog.accept());
        await openSwitcher(page);
        await page.keyboard.type('old');
        await page.keyboard.press('ControlOrMeta+Backspace');
        expect(await storage(page, 'notes:old')).toBeNull();
        await expect(page.locator('.sw-item:not(.sw-new)')).toHaveCount(0);
    });

    test('deleting the current note falls back to the default note', async ({ page }) => {
        await page.evaluate(() => localStorage.setItem('notes:old', 'old note'));
        await page.goto('/#old');
        page.on('dialog', dialog => dialog.accept());
        await openSwitcher(page);
        await page.keyboard.type('old');
        await page.keyboard.press('ControlOrMeta+Backspace');
        expect(await storage(page, 'notes:old')).toBeNull();
        await page.keyboard.press('Escape');
        await expect(page.locator('#notes')).toHaveValue('default note');
        await expect(page).not.toHaveURL(/#/);
    });

    test('Escape closes the switcher and focuses the notes', async ({ page }) => {
        await openSwitcher(page);
        await page.keyboard.press('Escape');
        await expect(page.locator('#switcher')).toBeHidden();
        await expect(page.locator('#notes')).toBeFocused();
    });

    test('empty note disappears after switching away', async ({ page }) => {
        await openSwitcher(page);
        await page.keyboard.type('temp');
        await page.keyboard.press('Enter');
        await openSwitcher(page);
        await page.keyboard.press('Enter');
        await openSwitcher(page);
        await expect(page.locator('.sw-item', { hasText: 'temp' })).toHaveCount(0);
    });

    test('note name from a crafted hash is rendered as text', async ({ page }) => {
        await page.goto('/#' + encodeURIComponent('<img src=x onerror="window.pwned=1">'));
        await page.keyboard.type('x');
        await openSwitcher(page);
        expect(await page.evaluate(() => (window as any).pwned)).toBeUndefined();
        await expect(page.locator('.sw-item img')).toHaveCount(0);
    });
});
