import axios from 'axios';
import * as cheerio from 'cheerio';
import xml2js from 'xml2js';
const { parseStringPromise } = xml2js;
import dotenv from 'dotenv';

dotenv.config();

export interface ScrapedPage {
  url: string;
  title: string;
  content: string;
}

interface SitemapUrlEntry {
  loc: string[];
}

interface SitemapResult {
  urlset?: {
    url?: SitemapUrlEntry[];
  };
}

async function getUrlsFromSitemap(sitemapUrl: string): Promise<string[]> {
  try {
    console.log(`Fetching sitemap: ${sitemapUrl}`);
    const response = await axios.get(sitemapUrl);
    const result = await parseStringPromise(response.data) as SitemapResult;
    
    if (result.urlset && result.urlset.url) {
      return result.urlset.url.map((u) => u.loc[0]);
    }
    return [];
  } catch (err) {
    console.error(`Error parsing sitemap ${sitemapUrl}:`, (err as Error).message);
    return [];
  }
}

export async function scrapePage(url: string): Promise<ScrapedPage> {
  try {
    console.log(`Scraping: ${url}`);
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    const $ = cheerio.load(response.data);
    
    const title = $('title').text().trim() || url;
    
    // Remove boilerplate
    $('nav, footer, script, style, noscript, header, .header, .footer, .nav, .menu, .sidebar, aside').remove();
    
    // Common WordPress content selectors
    const selectors = [
      'article', 
      'main', 
      '.entry-content', 
      '.elementor-page', 
      '.elementor-widget-container',
      '#content',
      '.post-content'
    ];
    
    let content = '';
    for (const selector of selectors) {
      const element = $(selector);
      if (element.length > 0) {
        // Collect text from all matching elements if they are widgets, or just the first if it's main
        if (selector.includes('widget') || selector.includes('elementor')) {
            element.each((_, el) => {
                content += $(el).text() + ' ';
            });
        } else {
            content = element.first().text();
        }
        if (content.trim().length > 200) break; // Found enough content
      }
    }
    
    if (!content.trim()) {
      content = $('body').text();
    }
    
    // Clean up excessive whitespace and special characters
    content = content
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, ' ')
      .trim();
    
    return { url, title, content };
  } catch (err) {
    console.error(`Error scraping ${url}:`, (err as Error).message);
    return { url, title: '', content: '' };
  }
}

export async function scrapeSite(sitemaps: string[]): Promise<ScrapedPage[]> {
  let allUrls: string[] = [];
  for (const sitemap of sitemaps) {
    const urls = await getUrlsFromSitemap(sitemap);
    allUrls = [...allUrls, ...urls];
  }
  
  // De-duplicate URLs
  allUrls = [...new Set(allUrls)];
  console.log(`Total URLs found: ${allUrls.length}`);
  
  const results: ScrapedPage[] = [];
  // Limit to 50 pages for safety in dev, or filter for relevance
  const targetUrls = allUrls.filter(url => {
      // Exclude media, category tags, etc.
      return !url.includes('/category/') && !url.includes('/tag/') && !url.match(/\.(jpg|jpeg|png|gif|pdf)$/i);
  }).slice(0, 60);

  for (const url of targetUrls) {
    const pageData = await scrapePage(url);
    if (pageData.content.length > 100) {
      results.push(pageData);
    }
    // Respectful delay
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return results;
}

// CLI execution test
if (process.argv[1].endsWith('scrape.ts')) {
  const sitemaps = [
    'https://solanalytics.com/page-sitemap.xml',
    'https://solanalytics.com/post-sitemap.xml'
  ];
  scrapeSite(sitemaps).then(results => {
    console.log(`Scraped ${results.length} pages.`);
    // console.log(JSON.stringify(results.slice(0, 1), null, 2));
  });
}
