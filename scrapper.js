#!/usr/bin/env node
/**
 * Scrape OpenText Partner Directory + Partner Solutions Catalog,
 * then join by partner name and output JSON.
 */
const puppeteer = require('puppeteer');

const PARTNER_DIR_URL = 'https://www.opentext.com/partners/partner-directory';
const SOLUTIONS_URL   = 'https://www.opentext.com/products-and-solutions/partners-and-alliances/partner-solutions-catalog';

function normalizeName(raw) {
  if (!raw) return '';
  let s = raw.replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim();
  s = s.replace(/\b(inc|inc\.|ltd|llc|llp|corp|co|gmbh)\b\.?/gi, '');
  s = s.replace(/[.,']/g, '').replace(/&/g, 'and').toLowerCase().trim();
  return s;
}

async function autoScroll(page) {
  let lastHeight = await page.evaluate(() => document.body.scrollHeight);
  while (true) {
    await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
    // replace waitForTimeout with plain setTimeout
    await new Promise(r => setTimeout(r, 500));
    let newHeight = await page.evaluate(() => document.body.scrollHeight);
    if (newHeight === lastHeight) break;
    lastHeight = newHeight;
  }
}

async function scrapePartners(page) {
  await page.goto(PARTNER_DIR_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('h3.text-lg.mb-1 a.more');
  await autoScroll(page);

  return await page.evaluate(() => {
    return Array.from(document.querySelectorAll('h3.text-lg.mb-1 a.more')).map(a => ({
      partnerName: a.textContent.trim()
      
    }));
   
  });
}

async function scrapeSolutions(page) {
  await page.goto(SOLUTIONS_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('h3.text-lg.mb-1 a.more');
  await autoScroll(page);

  return await page.evaluate(() => {
    return Array.from(document.querySelectorAll('h3.text-lg.mb-1 a.more')).map(a => {
      const card = a.closest('.card') || a.closest('div');
      const partner = card?.querySelector('.partner, .eyebrow, .subtitle')?.textContent?.trim() || '';
      return {
        solutionTitle: a.textContent.trim(),
        partnerName: partner
      };
    });
  });
}

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  const partners = await scrapePartners(page);
  const solutions = await scrapeSolutions(page);

  // Join by normalized partner name
  const map = new Map();
  for (const p of partners) {
    const norm = normalizeName(p.partnerName);
    if (!map.has(norm)) {
      map.set(norm, { partnerName: p.partnerName, solutions: [] });
    }
  }

  for (const s of solutions) {
    const norm = normalizeName(s.partnerName);
    if (!norm) continue;
    if (!map.has(norm)) {
      map.set(norm, { partnerName: s.partnerName, solutions: [] });
    }
    map.get(norm).solutions.push(s.solutionTitle);
  }

  const result = Array.from(map.values()).filter(p => p.solutions.length > 0);
  console.log(JSON.stringify(result, null, 2));

  await browser.close();
})();
