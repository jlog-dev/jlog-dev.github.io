import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET() {
    const posts = await getCollection('blog');

    return rss({
        title: 'JLog by Jing Li',
        description: 'My digital logbook: thoughts, code, and things I build.',
        site: 'https://jlog-dev.github.io',
        items: posts.map((post) => ({
            title: post.data.title,
            pubDate: post.data.pubDate,
            description: post.data.description,
            link: `/blog/${post.slug}/`,
        })),
    });
}
