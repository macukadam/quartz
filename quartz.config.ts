import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

/**
 * Quartz 4 Configuration
 *
 * See https://quartz.jzhao.xyz/configuration for more information.
 */
const config: QuartzConfig = {
  configuration: {
    pageTitle: "Ugurcan Akpulat",
    pageTitleSuffix: " — notes",
    enableSPA: true,
    enablePopovers: true,
    analytics: {
      provider: "plausible",
    },
    locale: "en-US",
    baseUrl: "quartz.jzhao.xyz",
    ignorePatterns: ["private", "templates", ".obsidian"],
    defaultDateType: "modified",
    theme: {
      fontOrigin: "googleFonts",
      cdnCaching: true,
      typography: {
        title: {
          name: "Fraunces",
          weights: [400, 600, 700],
          includeItalic: true,
        },
        header: {
          name: "Sora",
          weights: [400, 600, 700],
        },
        body: {
          name: "Newsreader",
          weights: [400, 500, 600],
          includeItalic: true,
        },
        code: {
          name: "JetBrains Mono",
          weights: [400, 600],
        },
      },
      colors: {
        lightMode: {
          light: "#f8f4ee",
          lightgray: "#e6dfd6",
          gray: "#b2a99c",
          darkgray: "#3e392f",
          dark: "#1f1b16",
          secondary: "#315d7c",
          tertiary: "#b2522e",
          highlight: "rgba(49, 93, 124, 0.12)",
          textHighlight: "#ffd45c66",
        },
        darkMode: {
          light: "#0f1115",
          lightgray: "#22262f",
          gray: "#4b5160",
          darkgray: "#d0d6df",
          dark: "#f5f7fb",
          secondary: "#7aa2f7",
          tertiary: "#f0b28a",
          highlight: "rgba(122, 162, 247, 0.16)",
          textHighlight: "#ffc85755",
        },
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "git", "filesystem"],
      }),
      Plugin.SyntaxHighlighting({
        theme: {
          light: "github-light",
          dark: "github-dark",
        },
        keepBackground: false,
      }),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "katex" }),
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true,
      }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.Favicon(),
      Plugin.NotFoundPage(),
      // Comment out CustomOgImages to speed up build time
      Plugin.CustomOgImages(),
    ],
  },
}

export default config
