import { test, expect } from '@playwright/test';

// WCAG 2.1 contrast ratio of two 'rgb(r, g, b)' colors
function contrast(a: string, b: string): number {
    const luminance = (rgb: string) => {
        const [r, g, bl] = rgb.match(/\d+/g)!.slice(0, 3).map(n => {
            const c = Number(n) / 255;
            return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
    };
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
}

test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.locator('#settingsButton').click();
});

test('offers basic white and dark purple themes', async ({ page }) => {
    const names = page.locator('.theme-name');
    for (const name of ['Bílý', 'Fialový', 'Solarized']) {
        await expect(names.filter({ hasText: new RegExp(`^${name}$`) })).toHaveCount(1);
    }
});

test('every theme has text contrast of at least WCAG AA (4.5:1)', async ({ page }) => {
    const previews = await page.locator('.theme-card').evaluateAll(cards => cards.map(card => {
        const preview = getComputedStyle(card.querySelector('.theme-preview')!);
        return {
            name: card.querySelector('.theme-name')!.textContent,
            bg: preview.backgroundColor,
            color: preview.color,
        };
    }));
    expect(previews.length).toBeGreaterThan(0);
    for (const { name, bg, color } of previews) {
        expect(contrast(bg, color), `contrast of ${name}`).toBeGreaterThanOrEqual(4.5);
    }
});
