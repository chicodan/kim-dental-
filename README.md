# Kim Dental Website

A modern, responsive dental practice website built with Astro and Tailwind CSS.

Icons from: https://healthicons.org

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
│   └── assets/
│       └── images/         # Place your static images here
├── src/
│   ├── components/          # Contains reusable components (e.g., Header, Footer)
│   ├── layouts/             # Layout components for consistent page structure
│   ├── pages/               # Contains page files (e.g., index.astro, about.astro)
│   └── styles/              # Global styles (e.g., Tailwind CSS)
└── package.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

Any static assets, like images, should be placed in the `public/assets/images/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command             | Action                                           |
| :------------------ | :----------------------------------------------- |
| `yarn install`      | Installs dependencies                            |
| `yarn dev`          | Starts local dev server at `localhost:4321`      |
| `yarn build`        | Build your production site to `./dist/`          |
| `yarn preview`      | Preview your build locally, before deploying     |
| `yarn astro ...`    | Run CLI commands like `astro add`, `astro check` |
| `yarn astro --help` | Get help using the Astro CLI                     |

## 🚀 Deployment

This site is configured for deployment on Cloudflare Pages. The build settings are:

- **Build command**: `yarn build`
- **Build output directory**: `dist`

## 📱 Mobile-Friendly Header

The project now includes a responsive header with a hamburger menu for mobile devices. This allows for better navigation on smaller screens.

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
