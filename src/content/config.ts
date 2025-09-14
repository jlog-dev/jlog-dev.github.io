import { defineCollection, z } from 'astro:content';

// Enhanced blog collection with comprehensive schema
const blog = defineCollection({
    type: "content",
    schema: z.object({
        title: z.string(),
        description: z.string(),
        pubDate: z.coerce.date(),
        updatedDate: z.coerce.date().optional(),
        
        // Content organization
        tags: z.array(z.string()).default([]),
        categories: z.array(z.string()).optional(),
        
        // Series support
        series: z.object({
            name: z.string(),
            order: z.number(),
        }).optional(),
        
        // Visual content
        heroImage: z.string().optional(),
        heroImageAlt: z.string().optional(),
        
        // Content metadata
        draft: z.boolean().default(false),
        featured: z.boolean().default(false),
        
        // Multilingual support
        lang: z.enum(['en', 'zh']).default('en'),
        translationKey: z.string().optional(), // Links translations together
        
        // SEO and social
        excerpt: z.string().optional(),
        canonicalURL: z.string().url().optional(),
        
        // Reading experience
        tableOfContents: z.boolean().default(true),
        
        // Author info (for multi-author support in future)
        author: z.string().default('JLog'),
        
        // Content type classification
        type: z.enum(['article', 'tutorial', 'note', 'review']).default('article'),
    }),
});

// Enhanced projects collection
const projects = defineCollection({
    type: "content",
    schema: z.object({
        title: z.string(),
        description: z.string(),
        pubDate: z.coerce.date(),
        updatedDate: z.coerce.date().optional(),
        
        // Technical details
        tech: z.array(z.string()),
        repo: z.string().url().optional(),
        demo: z.string().url().optional(),
        
        // Project metadata
        status: z.enum(['planning', 'in-progress', 'completed', 'archived']).default('completed'),
        featured: z.boolean().default(false),
        
        // Visual content
        heroImage: z.string().optional(),
        heroImageAlt: z.string().optional(),
        gallery: z.array(z.string()).optional(),
        
        // Multilingual support
        lang: z.enum(['en', 'zh']).default('en'),
        translationKey: z.string().optional(),
        
        // Project classification
        category: z.enum(['web', 'mobile', 'desktop', 'library', 'tool', 'other']).default('web'),
        
        // Content organization
        tags: z.array(z.string()).default([]),
        
        // Draft support
        draft: z.boolean().default(false),
    }),
});

// New collection: Code snippets
const snippets = defineCollection({
    type: "content",
    schema: z.object({
        title: z.string(),
        description: z.string(),
        pubDate: z.coerce.date(),
        updatedDate: z.coerce.date().optional(),
        
        // Code metadata
        language: z.string(),
        framework: z.string().optional(),
        tags: z.array(z.string()).default([]),
        
        // Difficulty and usefulness
        difficulty: z.enum(['beginner', 'intermediate', 'advanced']).default('intermediate'),
        
        // Multilingual support
        lang: z.enum(['en', 'zh']).default('en'),
        
        // Organization
        category: z.enum(['utility', 'component', 'hook', 'function', 'config', 'other']).default('utility'),
        draft: z.boolean().default(false),
    }),
});

// New collection: Bookmarks/Links
const bookmarks = defineCollection({
    type: "content",
    schema: z.object({
        title: z.string(),
        description: z.string(),
        url: z.string().url(),
        pubDate: z.coerce.date(),
        
        // Organization
        tags: z.array(z.string()).default([]),
        category: z.enum(['article', 'tool', 'resource', 'inspiration', 'tutorial', 'other']).default('article'),
        
        // Metadata
        author: z.string().optional(),
        site: z.string().optional(),
        
        // Personal notes
        notes: z.string().optional(),
        rating: z.number().min(1).max(5).optional(),
        
        // Multilingual
        lang: z.enum(['en', 'zh']).default('en'),
        draft: z.boolean().default(false),
    }),
});

// New collection: TIL (Today I Learned)
const til = defineCollection({
    type: "content",
    schema: z.object({
        title: z.string(),
        description: z.string(),
        pubDate: z.coerce.date(),
        
        // Organization
        tags: z.array(z.string()).default([]),
        category: z.enum(['javascript', 'css', 'astro', 'typescript', 'tools', 'git', 'other']).default('other'),
        
        // Content metadata
        difficulty: z.enum(['beginner', 'intermediate', 'advanced']).default('intermediate'),
        
        // Multilingual support
        lang: z.enum(['en', 'zh']).default('en'),
        draft: z.boolean().default(false),
    }),
});

// New collection: AI Prompts
const prompts = defineCollection({
    type: "content",
    schema: z.object({
        title: z.string(),
        description: z.string(),
        pubDate: z.coerce.date(),
        updatedDate: z.coerce.date().optional(),
        
        // AI-specific metadata
        model: z.string(), // e.g., "GPT-4", "Claude", "Gemini"
        category: z.enum(['coding', 'writing', 'analysis', 'creative', 'productivity', 'research', 'other']).default('other'),
        useCase: z.string().optional(), // e.g., "Code Review", "Content Creation"
        
        // Organization
        tags: z.array(z.string()).default([]),
        difficulty: z.enum(['beginner', 'intermediate', 'advanced']).default('intermediate'),
        
        // Effectiveness and examples
        effectiveness: z.number().min(1).max(5).optional(), // 1-5 star rating
        preview: z.string().optional(), // Short preview of the prompt
        examples: z.array(z.object({
            input: z.string().optional(),
            output: z.string().optional(),
        })).optional(),
        
        // Usage tips
        tips: z.array(z.string()).optional(),
        
        // Multilingual support
        lang: z.enum(['en', 'zh']).default('en'),
        draft: z.boolean().default(false),
    }),
});

export const collections = { 
    blog, 
    projects, 
    snippets, 
    bookmarks, 
    til,
    prompts
};
