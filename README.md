# Poznamky (Notes)
Quick notes in browser, try on www.poznamky.info

## Features
- Notes are stored only in your browser with [LocalStorage](https://developer.mozilla.org/en-US/docs/Web/API/Storage/LocalStorage).
- The editor is centered and at most 1280px wide; the whole page uses the background color of the selected theme.

### Export to PDF with Markdown
Press `CTRL+P` or click the 📄 button to open the browser print dialog, where you can print the notes or save them as PDF.

- Notes are rendered as Markdown ([GitHub Flavored Markdown](https://github.github.com/gfm/)): headings, bold/italic, lists, links, code blocks, quotes and tables.
- Single line breaks are kept, so plain notes print the same way as you see them in the editor.
- A line of dashes (`ALT+X`) is printed as a horizontal rule.
- The PDF uses a print-friendly style (serif font, black text on white), independent of the selected color theme.
- The suggested file name is `poznamky-YYYY-MM-DD`.
- Rendering uses [marked](https://marked.js.org/) and [DOMPurify](https://github.com/cure53/DOMPurify) from CDN. When they can't be loaded (e.g. offline), the notes are printed as plain text.

### Keyboard shortcuts
The list of shortcuts is also available in the settings dialog (⚙️ button).

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
