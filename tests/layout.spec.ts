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
