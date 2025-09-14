import { getCollection, type CollectionEntry } from 'astro:content';

// Type definitions for enhanced content
export type BlogPost = CollectionEntry<'blog'>;
export type Project = CollectionEntry<'projects'>;
export type Snippet = CollectionEntry<'snippets'>;
export type Bookmark = CollectionEntry<'bookmarks'>;
export type TILPost = CollectionEntry<'til'>;
export type Prompt = CollectionEntry<'prompts'>;

// Reading time calculation
export function calculateReadingTime(content: string): {
  minutes: number;
  words: number;
  text: string;
} {
  // Remove markdown syntax and HTML tags
  const cleanContent = content
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/`[^`]*`/g, '') // Remove inline code
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[#*_~`]/g, '') // Remove markdown formatting
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to text
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1'); // Convert images to alt text

  const words = cleanContent.trim().split(/\s+/).filter(word => word.length > 0).length;
  const wordsPerMinute = 200; // Average reading speed
  const minutes = Math.ceil(words / wordsPerMinute);

  return {
    minutes,
    words,
    text: `${minutes} min read`
  };
}

// Get all published blog posts sorted by date
export async function getAllBlogPosts(lang?: 'en' | 'zh'): Promise<BlogPost[]> {
  const posts = await getCollection('blog', (entry) => {
    const isPublished = !entry.data.draft;
    const matchesLang = !lang || entry.data.lang === lang;
    return isPublished && matchesLang;
  });

  return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

// Get featured blog posts
export async function getFeaturedBlogPosts(limit = 3, lang?: 'en' | 'zh'): Promise<BlogPost[]> {
  const posts = await getCollection('blog', (entry) => {
    const isPublished = !entry.data.draft;
    const isFeatured = entry.data.featured;
    const matchesLang = !lang || entry.data.lang === lang;
    return isPublished && isFeatured && matchesLang;
  });

  return posts
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
    .slice(0, limit);
}

// Get posts by series
export async function getPostsBySeries(seriesName: string, lang?: 'en' | 'zh'): Promise<BlogPost[]> {
  const posts = await getCollection('blog', (entry) => {
    const isPublished = !entry.data.draft;
    const inSeries = entry.data.series?.name === seriesName;
    const matchesLang = !lang || entry.data.lang === lang;
    return isPublished && inSeries && matchesLang;
  });

  return posts.sort((a, b) => (a.data.series?.order || 0) - (b.data.series?.order || 0));
}

// Get related posts based on tags
export async function getRelatedPosts(
  currentPost: BlogPost, 
  limit = 3, 
  lang?: 'en' | 'zh'
): Promise<BlogPost[]> {
  const allPosts = await getAllBlogPosts(lang);
  const currentTags = currentPost.data.tags;
  
  if (!currentTags || currentTags.length === 0) {
    return allPosts
      .filter(post => post.slug !== currentPost.slug)
      .slice(0, limit);
  }

  // Calculate similarity score based on shared tags
  const postsWithScore = allPosts
    .filter(post => post.slug !== currentPost.slug)
    .map(post => {
      const postTags = post.data.tags || [];
      const sharedTags = postTags.filter(tag => currentTags.includes(tag));
      const score = sharedTags.length / Math.max(currentTags.length, postTags.length);
      return { post, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);

  return postsWithScore.slice(0, limit).map(({ post }) => post);
}

// Get all unique tags from blog posts
export async function getAllTags(lang?: 'en' | 'zh'): Promise<string[]> {
  const posts = await getAllBlogPosts(lang);
  const tagSet = new Set<string>();
  
  posts.forEach(post => {
    post.data.tags?.forEach(tag => tagSet.add(tag));
  });
  
  return Array.from(tagSet).sort();
}

// Get posts by tag
export async function getPostsByTag(tag: string, lang?: 'en' | 'zh'): Promise<BlogPost[]> {
  const posts = await getCollection('blog', (entry) => {
    const isPublished = !entry.data.draft;
    const hasTag = entry.data.tags?.includes(tag);
    const matchesLang = !lang || entry.data.lang === lang;
    return isPublished && hasTag && matchesLang;
  });

  return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

// Get all projects
export async function getAllProjects(lang?: 'en' | 'zh'): Promise<Project[]> {
  const projects = await getCollection('projects', (entry) => {
    const isPublished = !entry.data.draft;
    const matchesLang = !lang || entry.data.lang === lang;
    return isPublished && matchesLang;
  });

  return projects.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

// Get featured projects
export async function getFeaturedProjects(limit = 3, lang?: 'en' | 'zh'): Promise<Project[]> {
  const projects = await getCollection('projects', (entry) => {
    const isPublished = !entry.data.draft;
    const isFeatured = entry.data.featured;
    const matchesLang = !lang || entry.data.lang === lang;
    return isPublished && isFeatured && matchesLang;
  });

  return projects
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
    .slice(0, limit);
}

// Get all snippets
export async function getAllSnippets(lang?: 'en' | 'zh'): Promise<Snippet[]> {
  const snippets = await getCollection('snippets', (entry) => {
    const isPublished = !entry.data.draft;
    const matchesLang = !lang || entry.data.lang === lang;
    return isPublished && matchesLang;
  });

  return snippets.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

// Get all bookmarks
export async function getAllBookmarks(lang?: 'en' | 'zh'): Promise<Bookmark[]> {
  const bookmarks = await getCollection('bookmarks', (entry) => {
    const isPublished = !entry.data.draft;
    const matchesLang = !lang || entry.data.lang === lang;
    return isPublished && matchesLang;
  });

  return bookmarks.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

// Get all TIL posts
export async function getAllTILPosts(lang?: 'en' | 'zh'): Promise<TILPost[]> {
  const tilPosts = await getCollection('til', (entry) => {
    const isPublished = !entry.data.draft;
    const matchesLang = !lang || entry.data.lang === lang;
    return isPublished && matchesLang;
  });

  return tilPosts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

// Get all AI prompts
export async function getAllPrompts(lang?: 'en' | 'zh'): Promise<Prompt[]> {
  const prompts = await getCollection('prompts', (entry) => {
    const isPublished = !entry.data.draft;
    const matchesLang = !lang || entry.data.lang === lang;
    return isPublished && matchesLang;
  });

  return prompts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

// Get content stats for homepage
export async function getContentStats(lang?: 'en' | 'zh') {
  const [blogPosts, projects, snippets, bookmarks, tilPosts, prompts] = await Promise.all([
    getAllBlogPosts(lang),
    getAllProjects(lang),
    getAllSnippets(lang),
    getAllBookmarks(lang),
    getAllTILPosts(lang),
    getAllPrompts(lang)
  ]);

  return {
    blogPosts: blogPosts.length,
    projects: projects.length,
    snippets: snippets.length,
    bookmarks: bookmarks.length,
    tilPosts: tilPosts.length,
    prompts: prompts.length,
    total: blogPosts.length + projects.length + snippets.length + bookmarks.length + tilPosts.length + prompts.length
  };
}

// Search content across all collections
export async function searchContent(query: string, lang?: 'en' | 'zh') {
  const [blogPosts, projects, snippets, bookmarks, tilPosts, prompts] = await Promise.all([
    getAllBlogPosts(lang),
    getAllProjects(lang),
    getAllSnippets(lang),
    getAllBookmarks(lang),
    getAllTILPosts(lang),
    getAllPrompts(lang)
  ]);

  const searchTerm = query.toLowerCase();
  
  const searchInContent = (content: any, type: string) => {
    const title = content.data.title.toLowerCase();
    const description = content.data.description?.toLowerCase() || '';
    const tags = content.data.tags?.join(' ').toLowerCase() || '';
    
    const titleMatch = title.includes(searchTerm);
    const descriptionMatch = description.includes(searchTerm);
    const tagMatch = tags.includes(searchTerm);
    
    if (titleMatch || descriptionMatch || tagMatch) {
      return {
        ...content,
        type,
        relevance: titleMatch ? 3 : (descriptionMatch ? 2 : 1)
      };
    }
    return null;
  };

  const results = [
    ...blogPosts.map(post => searchInContent(post, 'blog')),
    ...projects.map(project => searchInContent(project, 'project')),
    ...snippets.map(snippet => searchInContent(snippet, 'snippet')),
    ...bookmarks.map(bookmark => searchInContent(bookmark, 'bookmark')),
    ...tilPosts.map(til => searchInContent(til, 'til')),
    ...prompts.map(prompt => searchInContent(prompt, 'prompt'))
  ].filter(Boolean);

  return results.sort((a, b) => b.relevance - a.relevance);
}

// Format date for display
export function formatDate(date: Date, locale = 'en-US'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

// Get translation link for content
export function getTranslationLink(content: BlogPost | Project, targetLang: 'en' | 'zh'): string | null {
  if (!content.data.translationKey) return null;
  
  // This would need to be implemented based on your routing structure
  // For now, return a placeholder
  const baseSlug = content.slug.replace(/\/(en|zh)\//, '/');
  return `/${targetLang}/${baseSlug}`;
}
