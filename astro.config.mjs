import remarkPlugin from "@astrojs/markdown-remark";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://jlog-dev.github.io",
  base: "/",
  integrations: [
    mdx(),
    sitemap(),
    remarkPlugin({
      syntaxHighlight: "shiki",
      shikiConfig: {
        theme: "github-dark",
      },
    }),
  ],
});
