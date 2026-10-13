import { test, expect } from '@playwright/test';

test('wide window: textarea spans the window, text stays 1260px wide and centered', async ({ page }) => {
    await page.setViewportSize({ width: 1800, height: 600 });
    await page.goto('/');
    const box = await page.locator('#notes').boundingBox();
    // Full width, so a scrollbar of long notes sits at the window edge
    expect(box!.x).toBe(0);
    expect(box!.width).toBe(1800);
    const padding = await page.locator('#notes').evaluate(el => getComputedStyle(el).paddingLeft);
    expect(padding).toBe('270px');
});

test('narrow window keeps the 10px padding', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 600 });
    await page.goto('/');
    const padding = await page.locator('#notes').evaluate(el => getComputedStyle(el).paddingLeft);
    expect(padding).toBe('10px');
});

test('long notes scroll without a visible scrollbar', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('notes', 'line\n'.repeat(500)));
    await page.reload();
    const notes = page.locator('#notes');
    // Headless browsers hide scrollbars anyway, so check the style itself
    // (older WebKit doesn't know 'scrollbar-width' and uses ::-webkit-scrollbar)
    const scrollbarWidth = await notes.evaluate(el => (getComputedStyle(el) as any).scrollbarWidth);
    if (scrollbarWidth !== undefined) expect(scrollbarWidth).toBe('none');
    expect(await notes.evaluate(el => el.scrollHeight > el.clientHeight)).toBe(true);
    await notes.evaluate(el => { el.scrollTop = 0; });
    await notes.hover();
    await page.mouse.wheel(0, 500);
    await expect.poll(() => notes.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
});

for (const width of [600, 1000, 1800]) {
    test(`Alt+X separator fits on one line at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 600 });
        await page.goto('/');
        await page.evaluate(() => localStorage.clear());
        await page.reload();
        const notes = page.locator('#notes');
        await notes.click();
        await page.keyboard.press('Alt+KeyX');
        const dashes = (await notes.inputValue()).replace(/\n/g, '').length;

        // Measure the text width independently of the app with a span in the same font
        const { contentWidth, charWidth } = await notes.evaluate(el => {
            const style = getComputedStyle(el);
            const span = document.createElement('span');
            span.style.font = style.font;
            span.style.whiteSpace = 'pre';
            span.textContent = '-'.repeat(100);
            document.body.appendChild(span);
            const charWidth = span.getBoundingClientRect().width / 100;
            span.remove();
            return {
                contentWidth: el.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight),
                charWidth,
            };
        });
        expect(dashes * charWidth).toBeLessThanOrEqual(contentWidth);
        expect((dashes + 1) * charWidth).toBeGreaterThan(contentWidth);
    });
}
