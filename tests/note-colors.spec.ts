import { test, expect, Page } from '@playwright/test';

const storage = (page: Page, key: string) => page.evaluate(k => localStorage.getItem(k), key);
const colorsOf = async (page: Page, name: string) => JSON.parse((await storage(page, 'settings:' + name))!);
const CREAM = 'rgb(255, 251, 213)';
const NORD = 'rgb(46, 52, 64)';
const DRACULA = 'rgb(40, 42, 54)';
const NORD_COLORS = { backgroundColor: '#2e3440', color: '#d8dee9' };
const DRACULA_COLORS = { backgroundColor: '#282a36', color: '#f8f8f2' };

async function saveSettings(page: Page) {
    // Dialog 'close' event (which persists the settings) fires asynchronously;
    // listeners run in registration order, so the app's handler is done first
    const closed = page.evaluate(() => new Promise(resolve =>
        document.getElementById('settings')!.addEventListener('close', resolve, { once: true })));
    await page.locator('#confirmBtn').click();
    await closed;
}

async function chooseTheme(page: Page, name: string) {
    await page.locator('#settingsButton').click();
    await page.locator('.theme-card', { hasText: name }).click();
    await saveSettings(page);
}

const switchTo = (page: Page, hash: string) => page.evaluate(h => { location.hash = h; }, hash);

test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
        localStorage.clear();
        localStorage.setItem('notes', 'default note');
        localStorage.setItem('notes:prace', 'work note');
    });
    await page.reload();
});

test('settings have no own-colors checkbox, colors always belong to the note', async ({ page }) => {
    await page.locator('#settingsButton').click();
    await expect(page.locator('#noteColors')).toHaveCount(0);
});

test('changing the theme affects only the current note', async ({ page }) => {
    await page.goto('/#prace');
    await chooseTheme(page, 'Nord');

    const notes = page.locator('#notes');
    await expect(notes).toHaveCSS('background-color', NORD);
    expect(await colorsOf(page, 'prace')).toEqual(NORD_COLORS);

    await switchTo(page, '');
    await expect(notes).toHaveValue('default note');
    await expect(notes).toHaveCSS('background-color', CREAM);
    await expect(page.locator('body')).toHaveCSS('background-color', CREAM);

    await page.goto('/#prace');
    await expect(notes).toHaveCSS('background-color', NORD);
});

test('the default note has its own colors too', async ({ page }) => {
    await page.evaluate(dracula => localStorage.setItem('settings:prace', JSON.stringify(dracula)), DRACULA_COLORS);
    await chooseTheme(page, 'Nord');
    expect(await colorsOf(page, '')).toEqual(NORD_COLORS);
    await page.goto('/#prace');
    await expect(page.locator('#notes')).toHaveCSS('background-color', DRACULA);
});

test('global settings keep no colors', async ({ page }) => {
    await chooseTheme(page, 'Nord');
    const global = JSON.parse((await storage(page, 'settings'))!);
    expect(global.backgroundColor).toBeUndefined();
    expect(global.color).toBeUndefined();
});

test('a new note takes the colors of the note used last', async ({ page }) => {
    await page.goto('/#prace');
    await chooseTheme(page, 'Nord');
    await switchTo(page, 'nova');
    const notes = page.locator('#notes');
    await expect(notes).toHaveValue('');
    await expect(notes).toHaveCSS('background-color', NORD);
    expect(await colorsOf(page, 'nova')).toEqual(NORD_COLORS);
});

test('changing the new note colors leaves the note it inherited from alone', async ({ page }) => {
    await page.goto('/#prace');
    await chooseTheme(page, 'Nord');
    await switchTo(page, 'nova');
    await chooseTheme(page, 'Dracula');
    await expect(page.locator('#notes')).toHaveCSS('background-color', DRACULA);
    expect(await colorsOf(page, 'nova')).toEqual(DRACULA_COLORS);
    expect(await colorsOf(page, 'prace')).toEqual(NORD_COLORS);
});

test('a new note takes the colors of a note left empty', async ({ page }) => {
    await switchTo(page, 'prvni');
    await chooseTheme(page, 'Dracula');
    await switchTo(page, 'druha');
    await expect(page.locator('#notes')).toHaveCSS('background-color', DRACULA);
    expect(await storage(page, 'settings:prvni')).toBeNull();
});

test('a note opened by URL in a fresh tab takes the colors of the note used last', async ({ page }) => {
    await page.goto('/#prace');
    await chooseTheme(page, 'Nord');
    await page.goto('/#jina');
    await expect(page.locator('#notes')).toHaveCSS('background-color', NORD);
});

test('a new note created from the switcher takes the current colors', async ({ page }) => {
    await chooseTheme(page, 'Nord');
    await page.keyboard.press('ControlOrMeta+KeyK');
    await page.keyboard.type('nova');
    await page.keyboard.press('Enter');
    await expect(page.locator('#notes')).toHaveCSS('background-color', NORD);
});

test('global colors of older versions move to every note', async ({ page }) => {
    await page.evaluate(nord => {
        // State left by the version with global colors
        localStorage.removeItem('settings:');
        localStorage.setItem('settings', JSON.stringify({ ...nord, fontFamily: 'monospace', fontSize: '20px' }));
        localStorage.setItem('settings:prace', JSON.stringify({ backgroundColor: '#282a36', color: '#f8f8f2' }));
        localStorage.setItem('notes:dalsi', 'another note');
    }, NORD_COLORS);
    await page.reload();

    const notes = page.locator('#notes');
    await expect(notes).toHaveCSS('background-color', NORD);
    await expect(notes).toHaveCSS('font-size', '20px');
    expect(await colorsOf(page, '')).toEqual(NORD_COLORS);
    expect(await colorsOf(page, 'dalsi')).toEqual(NORD_COLORS);
    expect(await colorsOf(page, 'prace')).toEqual(DRACULA_COLORS);
    expect(JSON.parse((await storage(page, 'settings'))!)).toEqual({ fontFamily: 'monospace', fontSize: '20px' });
});

test('cancel restores the note colors', async ({ page }) => {
    await page.evaluate(nord => localStorage.setItem('settings:prace', JSON.stringify(nord)), NORD_COLORS);
    await page.goto('/#prace');
    await page.locator('#settingsButton').click();
    await page.locator('.theme-card', { hasText: 'Krém' }).click();
    await page.locator('#settings .s-btn', { hasText: 'Zrušit' }).click();
    await expect(page.locator('#notes')).toHaveCSS('background-color', NORD);
    expect(await colorsOf(page, 'prace')).toEqual(NORD_COLORS);
});

test('font size stays global', async ({ page }) => {
    await page.goto('/#prace');
    await page.locator('#settingsButton').click();
    await page.locator('#fontSize').fill('20');
    await saveSettings(page);
    await page.goto('/');
    await expect(page.locator('#notes')).toHaveCSS('font-size', '20px');
});

test('switcher shows a swatch with the colors of each note', async ({ page }) => {
    await page.evaluate(nord => localStorage.setItem('settings:prace', JSON.stringify(nord)), NORD_COLORS);
    await page.keyboard.press('ControlOrMeta+KeyK');
    await expect(page.locator('.sw-item', { hasText: 'prace' }).locator('.sw-swatch')).toHaveCSS('background-color', NORD);
    await expect(page.locator('.sw-item', { hasText: 'Hlavní' }).locator('.sw-swatch')).toHaveCSS('background-color', CREAM);
});

test('deleting a note removes its colors', async ({ page }) => {
    await page.evaluate(nord => localStorage.setItem('settings:prace', JSON.stringify(nord)), NORD_COLORS);
    page.on('dialog', dialog => dialog.accept());
    await page.keyboard.press('ControlOrMeta+KeyK');
    await page.keyboard.type('prace');
    await page.keyboard.press('ControlOrMeta+Backspace');
    expect(await storage(page, 'settings:prace')).toBeNull();
});

test('leaving an emptied note removes its colors', async ({ page }) => {
    await page.evaluate(nord => localStorage.setItem('settings:prace', JSON.stringify(nord)), NORD_COLORS);
    await page.goto('/#prace');
    await page.locator('#notes').fill('');
    await switchTo(page, '');
    await expect(page.locator('#notes')).toHaveValue('default note');
    expect(await storage(page, 'notes:prace')).toBeNull();
    expect(await storage(page, 'settings:prace')).toBeNull();
});

test('colors of a note never saved are dropped on the next start', async ({ page }) => {
    await page.evaluate(nord => localStorage.setItem('settings:zapomenuta', JSON.stringify(nord)), NORD_COLORS);
    await page.reload();
    await expect(page.locator('#notes')).toHaveValue('default note');
    expect(await storage(page, 'settings:zapomenuta')).toBeNull();
});
