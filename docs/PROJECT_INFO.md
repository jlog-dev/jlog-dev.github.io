# 📖 JLog - Personal Blog & Portfolio

> A modern, minimalist blog and portfolio website built with Astro, featuring bilingual content and a sophisticated theme system.

## 🌐 Live Site
**URL:** [https://jlog-dev.github.io](https://jlog-dev.github.io)

## 👤 Author
**Jing Li** - Software Developer & Technical Writer

## 📋 Project Overview

JLog is a personal digital logbook where I share what I build, learn, and think. It serves as both a technical blog and a portfolio showcase, featuring a clean, modern design with comprehensive dark mode support.

## 🚀 Key Features

### 📝 Content Management
- **Bilingual Support**: Content in both English and Chinese
- **Blog System**: Technical articles, tutorials, and personal reflections
- **Project Showcase**: Portfolio with tech stack and repository links
- **Code Snippets**: Reusable code examples with syntax highlighting
- **AI Prompts**: Curated collection of effective AI prompts for various tasks
- **TIL (Today I Learned)**: Quick notes and discoveries from daily learning
- **Bookmarks**: Curated links to useful resources and articles
- **Tag System**: Categorization and filtering by topics
- **Featured Posts**: Highlighted content on homepage
- **Table of Contents**: Auto-generated for blog posts
- **RSS Feed**: Automatic feed generation for subscribers

### 🎨 Design & User Experience
- **Dark/Light Theme**: Seamless theme switching with system preference detection
- **Responsive Design**: Mobile-first approach with CSS Grid/Flexbox
- **Modern UI**: Clean, minimalist design with smooth animations
- **Typography**: Carefully crafted reading experience
- **Syntax Highlighting**: Code blocks with Shiki (GitHub Dark theme)
- **Popular Tags**: Dynamic tag cloud based on usage frequency

### ⚡ Performance & Technical
- **Static Site Generation**: Fast loading with pre-built pages
- **SEO Optimized**: Meta tags, Open Graph, structured data
- **Sitemap**: Automatic sitemap generation
- **Progressive Enhancement**: Works without JavaScript
- **Optimized Images**: Responsive image handling
- **Fast Build Times**: Efficient compilation and deployment

### 🛠️ Developer Experience
- **Type Safety**: Full TypeScript support with strict configuration
- **Content Collections**: Type-safe content with Zod schemas
- **Hot Reload**: Instant development feedback
- **Centralized Themes**: Organized CSS architecture
- **Component Library**: Reusable UI components
- **Git Workflow**: Automated deployment via GitHub Actions

## 🏗️ Tech Stack

### Core Framework
- **[Astro v5.13.7](https://astro.build)** - Static Site Generator
- **TypeScript** - Type-safe development
- **CSS3** - Modern styling with custom properties

### Content & Markdown
- **[MDX](https://mdxjs.com)** - Enhanced Markdown with components
- **[Shiki](https://shiki.matsu.io)** - Syntax highlighting
- **Zod** - Content schema validation

### Integrations
- **[@astrojs/sitemap](https://docs.astro.build/en/guides/integrations-guide/sitemap/)** - Automatic sitemap generation
- **[@astrojs/rss](https://docs.astro.build/en/guides/rss/)** - RSS feed generation
- **[@astrojs/markdown-remark](https://docs.astro.build/en/guides/markdown-content/)** - Markdown processing

### Deployment & CI/CD
- **GitHub Pages** - Static site hosting
- **GitHub Actions** - Automated deployment pipeline
- **Git** - Version control and collaboration

## 📁 Project Structure

```
jlog-dev.github.io/
├── .github/
│   └── workflows/
│       └── deploy.yaml           # GitHub Actions deployment
├── public/                       # Static assets
│   ├── avatar.jpg               # Profile image
│   ├── favicon.svg              # Site favicon
│   └── wechat-qrcode.png        # WeChat QR code
├── src/
│   ├── components/              # Reusable UI components
│   │   ├── BlogCard.astro       # Blog post preview cards
│   │   ├── Footer.astro         # Site footer with social links
│   │   ├── Header.astro         # Navigation with theme toggle
│   │   └── ProjectCard.astro    # Project showcase cards
│   ├── content/                 # Content collections
│   │   ├── blog/                # Blog posts (16 articles)
│   │   ├── projects/            # Project showcases
│   │   ├── snippets/            # Code snippets collection
│   │   ├── prompts/             # AI prompts collection
│   │   ├── til/                 # Today I Learned posts
│   │   ├── bookmarks/           # Curated bookmarks
│   │   └── config.ts            # Content schema definitions
│   ├── layouts/                 # Page templates
│   │   ├── BaseLayout.astro     # Main page template
│   │   ├── BlogPost.astro       # Blog post template
│   │   └── ProjectLayout.astro  # Project page template
│   ├── pages/                   # File-based routing
│   │   ├── blog/                # Blog listing & individual posts
│   │   ├── projects/            # Projects listing & individual projects
│   │   ├── snippets/            # Code snippets listing & individual snippets
│   │   ├── prompts/             # AI prompts listing & individual prompts
│   │   ├── til/                 # TIL posts listing & individual posts
│   │   ├── bookmarks/           # Bookmarks listing & individual bookmarks
│   │   ├── tags/                # Tag-based filtering
│   │   ├── about.astro          # About page
│   │   └── index.astro          # Homepage
│   ├── styles/                  # Styling system
│   │   ├── themes/              # Centralized theme system
│   │   ├── components.css       # Component-specific styles
│   │   └── global.css           # Global styles and imports
│   └── utils/
│       ├── consts.ts            # Site constants and configuration
│       └── content.ts           # Content utility functions
├── astro.config.mjs             # Astro configuration
├── package.json                 # Dependencies and scripts
├── tsconfig.json                # TypeScript configuration
├── PROJECT_INFO.md              # This documentation
└── THEME_ORGANIZATION.md        # Theme system documentation
```

## 📊 Content Statistics

### Blog Posts (16 articles)
- **Technical Posts**: 10 articles
  - Kafka, Spring Boot, Microservices
  - Database optimization, System architecture
  - Frontend development, Domain-driven design
- **Philosophy & Thoughts**: 4 articles
  - Personal reflections on morality and understanding
  - Self-development and learning methodologies
- **Chinese Content**: 6 articles
  - Technical and philosophical posts in Chinese
- **Mixed Languages**: Bilingual content strategy

### Content Collections
- **Project Showcases**: Technical projects with live demos and source code
- **Code Snippets**: Reusable code examples with language-specific categorization
- **AI Prompts**: Curated prompts for coding, writing, analysis, and creative tasks
- **TIL Posts**: Quick learning notes and discoveries
- **Bookmarks**: Curated resources with ratings and personal notes
- **Comprehensive Tagging**: Cross-collection tag system for content discovery

## 🎯 Target Audience

- **Developers**: Technical tutorials and architecture insights
- **Learners**: Educational content and learning methodologies
- **Readers**: Personal thoughts and philosophical reflections
- **Bilingual Community**: English and Chinese speaking audiences

## 🔧 Development Workflow

### Local Development
```bash
npm install          # Install dependencies
npm run dev         # Start development server
npm run build       # Build for production
npm run preview     # Preview production build
```

### Content Creation
1. **Blog Posts**: Add Markdown files to `src/content/blog/`
2. **Projects**: Add MDX files to `src/content/projects/`
3. **Code Snippets**: Add Markdown files to `src/content/snippets/`
4. **AI Prompts**: Add Markdown files to `src/content/prompts/`
5. **TIL Posts**: Add Markdown files to `src/content/til/`
6. **Bookmarks**: Add Markdown files to `src/content/bookmarks/`
7. **Assets**: Place images in `public/` directory
8. **Metadata**: Update frontmatter with title, date, tags, and collection-specific fields

### Deployment
- **Automatic**: Push to `main` branch triggers GitHub Actions
- **Manual**: Run `npm run build` and deploy `dist/` folder
- **Preview**: Use `npm run preview` for local testing

## 🌟 Notable Features

### Theme System
- **Centralized Variables**: Semantic CSS custom properties
- **Design Tokens**: Consistent spacing, typography, and colors
- **Dark Mode**: Comprehensive dark theme with smooth transitions
- **Component Library**: Reusable styled components

### Content Features
- **Rich Schemas**: Type-safe content with comprehensive metadata
- **Code Highlighting**: Syntax highlighting for multiple languages
- **Cross-Collection Search**: Unified search across all content types
- **Related Content**: Automatic suggestions based on tags and topics
- **Reading Time**: Calculated reading time for all content
- **Effectiveness Ratings**: Star ratings for AI prompts and bookmarks
- **Multi-format Support**: Markdown, MDX, and data collections

### Performance
- **Static Generation**: Pre-built pages for optimal loading
- **Optimized Assets**: Compressed images and efficient CSS
- **SEO**: Comprehensive meta tags and structured data

## 📈 Future Enhancements

### Planned Features
- **Search Functionality**: Full-text search across content
- **Comment System**: Reader engagement and discussion
- **Newsletter**: Email subscription for updates
- **Analytics**: Visitor insights and content performance
- **Multi-language**: Expanded language support

### Technical Improvements
- **Image Optimization**: Advanced image processing
- **PWA Features**: Offline support and app-like experience
- **Performance Monitoring**: Core Web Vitals tracking
- **Content Management**: Headless CMS integration

## 📞 Contact & Links

- **GitHub**: [jlog-dev](https://github.com/jlog-dev)
- **Email**: Available in site footer
- **WeChat**: QR code in site footer

## 📄 License

This project is open source and available under standard web development practices.

---

*Last updated: September 2025 - Added AI Prompts, Code Snippets, TIL, and Bookmarks collections*
*Built with ❤️ using Astro and modern web technologies*
