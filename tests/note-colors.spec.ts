import { test, expect, Page } from '@playwright/test';

const storage = (page: Page, key: string) => page.evaluate(k => localStorage.getItem(k), key);
const CREAM = 'rgb(255, 251, 213)';
const NORD = 'rgb(46, 52, 64)';

async function saveSettings(page: Page) {
    // Dialog 'close' event (which persists the settings) fires asynchronously;
    // listeners run in registration order, so the app's handler is done first
    const closed = page.evaluate(() => new Promise(resolve =>
        document.getElementById('settings')!.addEventListener('close', resolve, { once: true })));
    await page.locator('#confirmBtn').click();
    await closed;
}

test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
        localStorage.clear();
        localStorage.setItem('notes', 'default note');
        localStorage.setItem('notes:prace', 'work note');
    });
    await page.reload();
});

test('default note has no own-colors option', async ({ page }) => {
    await page.locator('#settingsButton').click();
    await expect(page.locator('#noteColorsRow')).toBeHidden();
});

test('note can have its own colors, the default note keeps the global ones', async ({ page }) => {
    await page.goto('/#prace');
    await page.locator('#settingsButton').click();
    await expect(page.locator('#noteColorsRow')).toBeVisible();
    await expect(page.locator('#noteColorsLabel')).toHaveText('Barvy jen pro poznámku „prace“');
    await page.locator('#noteColors').check();
    await page.locator('.theme-card', { hasText: 'Nord' }).click();
    await saveSettings(page);

    const notes = page.locator('#notes');
    await expect(notes).toHaveCSS('background-color', NORD);
    expect(JSON.parse((await storage(page, 'settings:prace'))!)).toEqual({ backgroundColor: '#2e3440', color: '#d8dee9' });
    expect(JSON.parse((await storage(page, 'settings'))!).backgroundColor.toLowerCase()).toBe('#fffbd5');

    await page.evaluate(() => { location.hash = ''; });
    await expect(notes).toHaveValue('default note');
    await expect(notes).toHaveCSS('background-color', CREAM);
    await expect(page.locator('body')).toHaveCSS('background-color', CREAM);

    await page.goto('/#prace');
    await expect(notes).toHaveCSS('background-color', NORD);
});

test('without the checkbox the colors change globally', async ({ page }) => {
    await page.goto('/#prace');
    await page.locator('#settingsButton').click();
    await page.locator('.theme-card', { hasText: 'Nord' }).click();
    await saveSettings(page);
    expect(await storage(page, 'settings:prace')).toBeNull();
    await page.goto('/');
    await expect(page.locator('#notes')).toHaveCSS('background-color', NORD);
});

test('unchecking removes the note colors and previews the global ones', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('settings:prace', JSON.stringify({ backgroundColor: '#2e3440', color: '#d8dee9' })));
    await page.goto('/#prace');
    const notes = page.locator('#notes');
    await expect(notes).toHaveCSS('background-color', NORD);
    await page.locator('#settingsButton').click();
    await expect(page.locator('#noteColors')).toBeChecked();
    await page.locator('#noteColors').uncheck();
    await expect(notes).toHaveCSS('background-color', CREAM);
    await saveSettings(page);
    expect(await storage(page, 'settings:prace')).toBeNull();
    await expect(notes).toHaveCSS('background-color', CREAM);
});

test('cancel restores the note colors', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('settings:prace', JSON.stringify({ backgroundColor: '#2e3440', color: '#d8dee9' })));
    await page.goto('/#prace');
    await page.locator('#settingsButton').click();
    await page.locator('.theme-card', { hasText: 'Krém' }).click();
    await page.locator('#settings .s-btn', { hasText: 'Zrušit' }).click();
    await expect(page.locator('#notes')).toHaveCSS('background-color', NORD);
    expect(await storage(page, 'settings:prace')).not.toBeNull();
});

test('font size stays global when saving note colors', async ({ page }) => {
    await page.goto('/#prace');
    await page.locator('#settingsButton').click();
    await page.locator('#noteColors').check();
    await page.locator('#fontSize').fill('20');
    await saveSettings(page);
    await page.goto('/');
    await expect(page.locator('#notes')).toHaveCSS('font-size', '20px');
});

test('switcher shows a swatch for notes with own colors', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('settings:prace', JSON.stringify({ backgroundColor: '#2e3440', color: '#d8dee9' })));
    await page.keyboard.press('ControlOrMeta+KeyK');
    await expect(page.locator('.sw-item', { hasText: 'prace' }).locator('.sw-swatch')).toHaveCSS('background-color', NORD);
    await expect(page.locator('.sw-item', { hasText: 'Hlavní' }).locator('.sw-swatch')).toHaveCount(0);
});

test('deleting a note removes its colors', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('settings:prace', JSON.stringify({ backgroundColor: '#2e3440', color: '#d8dee9' })));
    page.on('dialog', dialog => dialog.accept());
    await page.keyboard.press('ControlOrMeta+KeyK');
    await page.keyboard.type('prace');
    await page.keyboard.press('ControlOrMeta+Backspace');
    expect(await storage(page, 'settings:prace')).toBeNull();
});

test('leaving an emptied note removes its colors', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('settings:prace', JSON.stringify({ backgroundColor: '#2e3440', color: '#d8dee9' })));
    await page.goto('/#prace');
    await page.locator('#notes').fill('');
    await page.evaluate(() => { location.hash = ''; });
    await expect(page.locator('#notes')).toHaveValue('default note');
    expect(await storage(page, 'notes:prace')).toBeNull();
    expect(await storage(page, 'settings:prace')).toBeNull();
});
