# skills/new-page.md — Adding a new page

**When to load**: the journalist says "add a page", "new section", "I want a page for X", "make a /something route".

---

## Decide the URL first

Astro uses file-based routing. The path of the file in `src/pages/` becomes the URL.

| Journalist asks for…              | File path                                  | URL                       |
|-----------------------------------|--------------------------------------------|---------------------------|
| "an about page"                   | `src/pages/about.astro`                    | `/about`                  |
| "a contact page"                  | `src/pages/contact.astro`                  | `/contact`                |
| "one page per article"            | `src/pages/articles/[slug].astro`          | `/articles/<anything>`    |
| "a homepage"                      | `src/pages/index.astro`                    | `/`                       |

Slugs in brackets are dynamic — they capture whatever's in the URL.

---

## Write the page

Use the `Base` layout. Inherit `showFaChrome` from the homepage's choice — if the rest of the app shows the FA header, this page should too.

```astro
---
// src/pages/about.astro
import Base from '../layouts/Base.astro';
---
<Base title="About" description="What this site is about." showFaChrome={true}>
  <section class="mx-auto max-w-2xl px-6 py-16">
    <h1 class="mb-4 text-3xl font-semibold text-gray-900">About</h1>
    <p class="text-gray-600">
      Your content here.
    </p>
  </section>
</Base>
```

Defaults the journalist gets for free:
- Inter font everywhere.
- The FA palette as Tailwind utilities (`bg-blue-500`, `text-gray-900`, etc.).
- Responsive layout via Tailwind classes.

---

## Linking between pages

Use plain `<a>` tags, **not** any router library:

```astro
<a href="/about" class="text-blue-500 hover:underline">About</a>
```

Full-page navigation is correct here — it keeps the Zephr CDN in the request path, which keeps the FA header up-to-date with login state.

If the page collection grows enough that the journalist wants a shared nav, factor it into `src/components/Nav.astro` and drop it into `Base.astro` next to the slot.

---

## Dynamic pages (one page per item)

For "one page per article" or "one page per tag", use a dynamic route:

```astro
---
// src/pages/articles/[slug].astro
import Base from '../../layouts/Base.astro';

export async function getStaticPaths() {
  // List the slugs you want pre-rendered. Reading from a JSON file,
  // markdown collection, or hardcoded array all work. Ask the journalist.
  return [
    { params: { slug: 'first-post' } },
    { params: { slug: 'second-post' } },
  ];
}

const { slug } = Astro.params;
---
<Base title={slug} showFaChrome={true}>
  <article class="mx-auto max-w-2xl px-6 py-16">
    <h1 class="mb-4 text-3xl font-semibold text-gray-900">{slug}</h1>
  </article>
</Base>
```

If the journalist wants the article content in markdown, propose Astro Content Collections — markdown files in `src/content/` with type-checked frontmatter. Don't reach for a CMS yet.

---

## When a page needs to be interactive

If the journalist says "this page is a dashboard / app", read `skills/add-react.md`. The page itself is still an Astro file; the React app lives inside one `client:only="react"` island.

---

## Verify

```bash
pnpm dev
```

Open `http://localhost:3000/<your-new-url>`. Tell the journalist to click around. If anything looks off, `pnpm exec astro check` will surface type errors.
