# Layout Principles

## Standard Bounds

- All content uses `max-w-6xl mx-auto px-4` for consistent alignment
- Header, footer, and page content all align to the same left/right margins

## Custom Utilities

**`.section-breakout`** - For full-width sections (heroes, colored backgrounds)

```html
<section class="section-breakout">
  <div class="max-w-6xl mx-auto px-4">
    <!-- Content stays within bounds -->
  </div>
</section>
```

**`.section-container`** - Intended as shorthand for `max-w-6xl mx-auto px-4`

- ⚠️ **BROKEN**: The utility class exists in tailwind.config.mjs but doesn't work correctly
- Currently not in use across the codebase - will fix implementation later
- For now, always use `max-w-6xl mx-auto px-4` directly instead

## Layout Rules

1. MainLayout does not impose container constraints - pages control their own layout
2. Use `section-breakout` for full-width sections, not inline breakout patterns
3. Use `max-w-6xl mx-auto px-4` directly for content containers (not `.section-container` yet)
4. Stick to `max-w-6xl` and `px-4` - avoid mixing different max-widths or padding values
5. Don't use Tailwind's default `container` class
