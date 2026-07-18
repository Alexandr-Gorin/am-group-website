# Sanity Migration Notes

## Done (2026-07-18)

- Sanity build-time integration pilot for the homepage Hero block: `data-sanity` attributes in markup, Vite plugin (`vite-plugin-sanity.js`), Sanity client (`sanity.client.js`).
- Deployed to production and verified live on microbio.pro.

## Next steps

- Set up a Sanity webhook on Publish to trigger an automatic rebuild + deploy.
- Add live-preview in Sanity Studio (preview pane showing the live page while editing — Sanity's Presentation tool).
- Once the pattern is validated, roll out the same approach to remaining blocks/pages (Services, About, Contacts, etc.).
