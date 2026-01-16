import { search, SafeSearchType } from 'duck-duck-scrape';
import * as cheerio from 'cheerio';

export async function webSearch(query: string): Promise<string> {
    try {
        console.log("Searching web for:", query);
        const results = await search(query, {
            safeSearch: SafeSearchType.MODERATE,
            time: 'm',
        });

        if (!results.results.length) return "No results found.";

        return results.results.slice(0, 8).map(r =>
            `### ${r.title}\nURL: ${r.url}\n${r.description || 'No description'}`
        ).join('\n\n');
    } catch (e: any) {
        console.error("Web Search Error:", e);
        return `Search failed: ${e.message}`;
    }
}

export async function webScrape(url: string): Promise<string> {
    try {
        console.log("Scraping URL:", url);
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; OptimusAgent/1.0; +http://humaniq.com)',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            }
        });

        if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

        const html = await res.text();
        const $ = cheerio.load(html);

        // Remove scripts, styles
        $('script').remove();
        $('style').remove();
        $('nav').remove();
        $('footer').remove();
        $('iframe').remove();
        $('noscript').remove();

        // Extract Title and Main Content
        const title = $('title').text().trim();
        const body = $('body').text().replace(/\s+/g, ' ').trim();

        return `TITLE: ${title}\nURL: ${url}\n\nCONTENT:\n${body.slice(0, 10000)}... (truncated)`;
    } catch (e: any) {
        return `Failed to read page: ${e.message}`;
    }
}
