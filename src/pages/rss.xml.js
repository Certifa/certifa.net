import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const writeups = (await getCollection('writeups'))
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  return rss({
    title: 'Certifa · Writeups',
    description: 'HackTheBox writeups across Active Directory, Linux, and web.',
    site: context.site,
    items: writeups.map((w) => ({
      title: w.data.title,
      description: w.data.description,
      pubDate: w.data.date,
      link: `/writeups/${w.slug}/`,
      categories: w.data.tags,
    })),
  });
}
