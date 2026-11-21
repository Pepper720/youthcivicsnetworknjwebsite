# Youth Civics Network NJ website

The website for Youth Civics Network New Jersey: nonpartisan civics for grades 4–8, taught by high schoolers.

It's a plain static site with no build step:

- `index.html`: all page content
- `styles.css`: colors and fonts from the YCN 2026–2027 Branding Guidelines
- `assets/`: official YCN logos (taken from the brand guide) and the classroom photo

## Editing

- **Form links:** at the bottom of `index.html`, paste the Google Form URLs into the `LINKS` block (`lcl`, `exec`, `policy`, `host`). Any link left empty opens a pre-addressed email to youthcivicsnetworknj@gmail.com instead.
- **Chapters:** each chapter is an `<article class="chapter">` card. Copy one to add a chapter, and update its status line when a venue is confirmed.
- **Team:** add people as `<article class="person">` cards in the Team section.

## Preview locally

Open `index.html` in a browser, or run:

```bash
python3 -m http.server 8000
```

## Publishing

Under the repo's Settings → Pages, deploy from the `main` branch, root folder.
