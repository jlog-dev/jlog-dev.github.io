import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://jlog-dev.github.io",
  base: "/",
  markdown: {
    syntaxHighlight: "shiki",
    shikiConfig: { theme: "github-dark" },
  },
  integrations: [
    mdx(),
    sitemap({
      sitemapIndexFile: "/sitemap.xml",
    }),
  ],
});
