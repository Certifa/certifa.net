import { getCollection, type CollectionEntry } from 'astro:content';

/** URL-safe slug for a tag. Case-variants (sqli / SQLi) collapse to one slug. */
export const tagSlug = (t: string): string =>
  t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export interface TagGroup {
  slug: string;
  display: string;
  writeups: CollectionEntry<'writeups'>[];
}

/** Group every writeup tag by slug, newest writeup first within each group. */
export async function getTagGroups(): Promise<TagGroup[]> {
  const all = await getCollection('writeups');
  const bySlug = new Map<string, TagGroup>();

  for (const w of all) {
    for (const t of w.data.tags) {
      const slug = tagSlug(t);
      if (!slug) continue;
      let group = bySlug.get(slug);
      if (!group) {
        group = { slug, display: t, writeups: [] };
        bySlug.set(slug, group);
      }
      if (!group.writeups.includes(w)) group.writeups.push(w);
    }
  }

  for (const group of bySlug.values()) {
    group.writeups.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
  }
  return [...bySlug.values()].sort((a, b) => a.display.localeCompare(b.display));
}
