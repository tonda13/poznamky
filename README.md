# Poznamky (Notes)
Quick notes in browser, try on www.poznamky.info

## Features
- Notes are stored only in your browser with [LocalStorage](https://developer.mozilla.org/en-US/docs/Web/API/Storage/LocalStorage).
- The editor is centered and at most 1280px wide; the whole page uses the background color of the selected theme.

### Multiple notes
With a single note the app looks exactly as before. More notes are there when you need them:

- `CTRL+K` (`CMD+K` on macOS) opens the note switcher: notes are listed by recent use with a preview of the first line, typing filters them by name and content (diacritics are ignored).
- `Enter` opens the selected note. Without a query the previous note is preselected, so `CTRL+K`, `Enter` toggles between the last two notes.
- When no note has exactly the typed name, `+ New note` creates it.
- `CTRL+Backspace` (`CMD+Backspace`) deletes the selected note after confirmation. The default note can't be deleted.
- Every note has its own address: `www.poznamky.info/#work`. You can bookmark it or open it in another browser tab. The default note has no `#`.
- With more than one note, a small bubble below the ⚙️ button shows their count; clicking it opens the switcher.
- Empty notes (except the default one) are not kept, so they disappear when you leave them.
- PDF export, `CTRL+SHIFT+S` and `CTRL+SHIFT+O` work with the current note; the file name contains the note name.

### Export to PDF with Markdown
Press `CTRL+P` or click the 📄 button to open the browser print dialog, where you can print the notes or save them as PDF.

- Notes are rendered as Markdown ([GitHub Flavored Markdown](https://github.github.com/gfm/)): headings, bold/italic, lists, links, code blocks, quotes and tables.
- Single line breaks are kept, so plain notes print the same way as you see them in the editor.
- A line of dashes (`ALT+X`) is printed as a horizontal rule.
- The PDF uses a print-friendly style (serif font, black text on white), independent of the selected color theme.
- The suggested file name is `poznamky-YYYY-MM-DD` (`poznamky-<note>-YYYY-MM-DD` for other than the default note).
- Rendering uses [marked](https://marked.js.org/) and [DOMPurify](https://github.com/cure53/DOMPurify) from CDN. When they can't be loaded (e.g. offline), the notes are printed as plain text.

### Keyboard shortcuts
The list of shortcuts is also available in the settings dialog (⚙️ button).

- `CTRL+K` switch to another note or create a new one
- `CTRL+S` is overridden to prevent the browser save dialog.
- `ALT+X` to put set of dash (`-`) as horizontal rule.
- `CTRL+Q`, `ALT+Q` to remove current line (where the cursor current is).
- `CTRL+SHIFT+S` save the notes to text file
- `CTRL+SHIFT+O` load the notes from text file and replace current notes
- `CTRL+D` duplicate row
- `ALT+UP` / `ALT+DOWN` move row up/down
- `CTRL+L` select row
- `CTRL+P` export notes to PDF with Markdown formatting (also via the 📄 button)

On macOS, `CMD` can be used instead of `CTRL` (except `CTRL+Q` — `CMD+Q` quits the browser, use `ALT+Q`). The shortcuts list in settings then shows `⌘` instead of `Ctrl`.

## Tests
End-to-end tests use [Playwright](https://playwright.dev/) (Chromium and WebKit) against a small static server:

```sh
npm install
npx playwright install chromium webkit
npm test
```
