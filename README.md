# Poster Splicer Pro Lite

A browser-based Collaborative Poster Builder. This project is a static website, so it can run locally or be hosted on GitHub Pages, Netlify, Vercel, Cloudflare Pages, or any simple static host.

## Features

- 2 image uploads:
  - Main Poster Image
  - Second Page Image / Guide Image, optional
- Paper size:
  - US Letter (default / optimized layout)
  - A4
- Grid layouts:
  - 2 × 2
  - 3 × 3
  - 4 × 4
  - 5 × 5
  - 6 × 6
  - Custom rows and columns
- Worksheet templates:
  - Bright Learn
  - Brainy Bloom Studio
  - SheetHub
- Live Template Preview: switching templates updates the preview instantly.
- US Letter-safe image placement: preview and tile artwork frames are calculated to fit Letter pages cleanly by default.
- Balanced larger tile artwork frames: tile images are enlarged while staying safely below the instruction text; the artwork area remains 1:1.
- PDF Preview modal now generates a 3-page preview only: Main Poster Preview, Guide Preview, and Template Tile A1.
- Generate PDF Preview Live Preview: the 3 preview pages are shown on screen before exporting.
- Optional shop logo watermark for the 3-page PDF Preview, with adjustable opacity and size. The logo watermark is fixed at 0° rotation.
- Download PDF Poster.
- Download ZIP of PNG pages.
- Options for instructions page, preview page, second image page, glue margins, grid overlay, and mini assembly guide.

## How to run locally

Open `index.html` directly in your browser.

For best reliability, run a tiny local server:

```bash
python3 -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

## Required internet access

The current version loads these client-side libraries from CDN:

- jsPDF
- JSZip
- FileSaver.js

If you want the app to work fully offline, download those library files and update the `<script>` tags in `index.html` to point to local files.

## Important workflow

1. Enter the poster title.
2. Choose paper size. US Letter is selected by default and has the optimized image layout.
3. Choose grid layout.
4. Upload the main poster image.
5. Optional: upload a second guide / colored preview image.
6. Optional: upload your shop logo, adjust the watermark opacity, and adjust the logo size. The watermark is used only for Generate PDF Preview.
7. Click a template. The preview updates instantly.
8. Generate PDF Preview for the 3-page preview PDF, or download the full PDF / ZIP.

## Notes for production

- All image processing happens in the browser; no server upload is required.
- For very large images and 6 × 6 grids, PDF generation can take several seconds.
- Use High export quality for print products and Standard when testing quickly.

## Latest layout adjustment

Tile artwork on the printable pages has been enlarged compared with the previous smaller version. The app now calculates a safe top position from the bottom of the bullet instructions, then keeps the artwork square at 1:1 while fitting within US Letter pages.


## Latest PDF Preview adjustment

Generate PDF Preview now exports only three pages for quick product previews:

1. Main Poster Preview
2. Guide Preview
3. Live Template Tile Preview - A1

The full Download PDF Poster button still exports the full printable product pages according to the selected options and grid.

## Latest live preview adjustment

The workspace now includes a **Generate PDF Preview Live Preview** section with three page previews:

1. Main Poster
2. Guide Preview
3. A1 Tile Preview

These three canvases update instantly when you change the title, paper size, grid, template, uploaded images, logo watermark, watermark opacity, or logo size. They match the pages produced by the Generate PDF Preview button.
