#!/usr/bin/env node
/**
 * Scrape LM-92 (Pratiche) course professor data from UNIFI Cineca.
 * Uses Playwright for JavaScript-rendered pages.
 */

const { chromium } = require('playwright');

const PROGRAM_URL = 'https://www.unifi.it/it/studia-con-noi/corsi-di-laurea/corsi-di-laurea-magistrali/pratiche-linguaggi-e-culture-della';

// Course URLs from Cineca catalogue (known URLs)
// These are the B385 course pages indexed by course name
// Format: /corsi/{year}/{corso_id}/insegnamenti/{year}/{ad_code}/{year}/{ad_code}
const COURSE_PAGES = [
  { name: "LINGUAGGI DELLA DIVERSITA' NELLE SOCIETA' COMPLESSE", url: null, year: 1, semester: "Secondo Semestre", cfu: 6 },
  { name: "ESTETICA DELL'ESPERIENZA VISIVA", url: "https://unifi.coursecatalogue.cineca.it/corsi/2025/4680/insegnamenti/2025/58140_B385-25-25_113457_779277/2025/58140?annoOrdinamento=2025&coorte=2025", year: 1, semester: "Primo Semestre", cfu: 6 },
  { name: "FILOSOFIA DELL'EDUCAZIONE E DELLA COMUNICAZIONE", url: null, year: 1, semester: "Secondo Semestre", cfu: 6 },
  { name: "MENTE E LINGUAGGI", url: null, year: 1, semester: "Primo Semestre", cfu: 12 },
  { name: "ETICA E SOCIETA' DELL'INFORMAZIONE", url: null, year: 1, semester: "Primo Semestre", cfu: 6 },
  { name: "COMUNICAZIONE GENERATIVA: INTERVENTI E PROGETTI", url: null, year: 1, semester: "Primo Semestre", cfu: 6 },
  { name: "CAMBIAMENTO ORGANIZZATIVO", url: null, year: 1, semester: "Primo Semestre", cfu: 6 },
  { name: "SCIENZA, LETTERATURA E PSEUDOSCIENZA", url: null, year: 1, semester: "Primo Semestre", cfu: 6 },
  { name: "COMUNICAZIONE CORPOREA E FILOSOFIE DELL'EMOZIONE", url: null, year: 1, semester: "Primo Semestre", cfu: 6 },
  { name: "STRATEGIA E VALORE D'IMPRESA", url: null, year: 1, semester: "Secondo Semestre", cfu: 6 },
  { name: "ANTROPOLOGIA PUBBLICA", url: null, year: 1, semester: "Secondo Semestre", cfu: 6 },
  { name: "STORIA DEL GIORNALISMO E DEI MEDIA", url: null, year: 1, semester: "Primo Semestre", cfu: 6 },
  { name: "MENTI E TECNOLOGIE", url: null, year: 1, semester: "Secondo Semestre", cfu: 6 },
  { name: "TEORIA DELLA RAZIONALITA'", url: null, year: 1, semester: "Primo Semestre", cfu: 6 },
  { name: "PROVA FINALE", url: null, year: 2, semester: "Annuale", cfu: 18 },
  { name: "LABORATORIO: TELEVISIONE E MEDIA DIGITALI", url: null, year: 2, semester: "Secondo Semestre", cfu: 3 },
  { name: "LABORATORIO: EDITORIA MULTIMEDIALE", url: null, year: 2, semester: "Primo Semestre", cfu: 3 },
  { name: "LABORATORIO: TECNOLOGIE DEL KNOWLEDGE MANAGEMENT", url: null, year: 2, semester: "Secondo Semestre", cfu: 3 },
  { name: "LABORATORIO: PRATICHE DI ARGOMENTAZIONE DIGITALE", url: null, year: 2, semester: "Primo Semestre", cfu: 3 },
  { name: "ESTETICA E LINGUAGGI DELL'ARTE", url: null, year: 2, semester: "Primo Semestre", cfu: 6 },
  { name: "DISCORSO POLITICO E STRATEGIE LINGUISTICHE", url: null, year: 2, semester: "Primo Semestre", cfu: 12 },
  { name: "SOCIOLINGUISTICA", url: null, year: 2, semester: "Primo Semestre", cfu: 6 },
  { name: "TEORIA E ANALISI DEL LINGUAGGIO CINE-TELEVISIVO", url: null, year: 2, semester: "Primo Semestre", cfu: 6 },
  { name: "CINEMA, MEDIA E CULTURA VISUALE", url: null, year: 2, semester: "Primo Semestre", cfu: 6 },
  { name: "CINEMA ITALIANO", url: null, year: 2, semester: "Secondo Semestre", cfu: 6 },
  { name: "LINGUAGGI DEL TEATRO MUSICALE", url: null, year: 2, semester: "Secondo Semestre", cfu: 6 },
  { name: "STRUMENTI E PRATICHE PER L'ANALISI DEL TESTO", url: null, year: 2, semester: "Primo Semestre", cfu: 6 },
  { name: "STRUMENTI PER L'ANALISI DELLA COMUNICAZIONE PARLATA", url: null, year: 2, semester: "Primo Semestre", cfu: 6 },
];

async function scrapeProfessor(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const html = await response.text();
    // Try to find professor name in the HTML
    // Pattern: professor name is in a link with "docente" class or near "Docente" label
    const patterns = [
      /<a[^>]*href[^>]*docente[^>]*>([^<]+)<\/a>/i,
      /<span[^>]*class[^>]*docente[^>]*>([^<]+)<\/span>/i,
      /Docente[:\s]*<\/[^>]+>\s*<[^>]+>([^<]+)</i,
      /[Cc]attedra[:\s]*([A-Z][a-zàèéìòù]+ [A-Z][a-zàèéìòù]+)/i,
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) return match[1].trim();
    }

    // Look for all-caps professor name pattern (Italian format)
    const professorPattern = /([A-Z]{2,}\s+[A-Z]{2,})/g;
    const matches = html.match(professorPattern);
    if (matches) {
      return matches[0];
    }

    return null;
  } catch (e) {
    return null;
  }
}

async function getPageWithPlaywright(url) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
    // Wait a bit for JS to render
    await page.waitForTimeout(2000);

    // Try to find professor name
    // Method 1: look for the "Docente" label and adjacent content
    const professor1 = await page.evaluate(() => {
      // Look for links containing professor-like content
      const links = Array.from(document.querySelectorAll('a'));
      for (const link of links) {
        const href = link.getAttribute('href') || '';
        const text = link.textContent?.trim() || '';
        if ((href.includes('docente') || href.includes('CANTELLI') || href.includes('professor')) && text.length > 3 && text.length < 60) {
          return text;
        }
      }
      return null;
    });

    if (professor1) {
      await browser.close();
      return professor1;
    }

    // Method 2: look for the specific Cineca page structure
    const professor2 = await page.evaluate(() => {
      // Look for links with aria labels or text containing professor name
      const allLinks = Array.from(document.querySelectorAll('a[href*="docente"], a[href*="CINE"], .docente, [class*="docente"]'));
      for (const el of allLinks) {
        const text = el.textContent?.trim() || '';
        if (text && text.length > 3 && text.length < 60) {
          return text;
        }
      }

      // Try finding by looking for the pattern in the breadcrumb area
      const mainContent = document.querySelector('#main-content, main, .main, .content-area');
      if (mainContent) {
        const text = mainContent.textContent || '';
        // Look for capitalized name pattern near "Docente"
        const match = text.match(/Docente[:\s]*([A-Z][a-zàèéìòù']+\s+[A-Z][a-zàèéìòù']+)/i);
        if (match) return match[1].trim();
      }
      return null;
    });

    await browser.close();
    return professor2;
  } catch (e) {
    await browser.close();
    return null;
  }
}

async function main() {
  console.log('Starting LM-92 professor scraper...\n');

  const results = [];
  let knownCount = 0;

  for (let i = 0; i < COURSE_PAGES.length; i++) {
    const course = COURSE_PAGES[i];
    let professor = null;

    if (course.url) {
      console.log(`[${i+1}/${COURSE_PAGES.length}] Scraping: ${course.name.substring(0, 40)}...`);
      professor = await getPageWithPlaywright(course.url);
    } else {
      console.log(`[${i+1}/${COURSE_PAGES.length}] No URL for: ${course.name.substring(0, 40)}...`);
    }

    results.push({ ...course, professor });
    if (professor) knownCount++;

    // Small delay to be polite
    if (course.url) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  console.log(`\n\nResults: ${knownCount}/${COURSE_PAGES.length} professors found`);

  // Output as JSON
  console.log('\n--- JSON OUTPUT ---');
  console.log(JSON.stringify(results, null, 2));

  // Generate Markdown report
  let md = `# LM-92: Pratiche, linguaggi e culture della comunicazione

**Programma**: LM-92 | **Facoltà**: Scuola di Studi Umanistici e della Formazione
**Fonte**: https://www.unifi.it/it/studia-con-noi/corsi-di-laurea/corsi-di-laurea-magistrali/pratiche-linguaggi-e-culture-della
**Anno Accademico**: 2025/2026

> ⚠️ **NOTA**: I professori indicati con "?" sono ancora da verificare. La colonna "Tipo" è basata sulla struttura del piano di studi ufficiale.

---

`;

  // Group by year and semester
  const year1 = results.filter(r => r.year === 1);
  const year2 = results.filter(r => r.year === 2);
  const sem1_1 = year1.filter(r => r.semester === "Primo Semestre");
  const sem2_1 = year1.filter(r => r.semester === "Secondo Semestre");
  const sem1_2 = year2.filter(r => r.semester === "Primo Semestre");
  const sem2_2 = year2.filter(r => r.semester === "Secondo Semestre");
  const annual_2 = year2.filter(r => r.semester === "Annuale");

  function courseType(name) {
    if (name === "PROVA FINALE") return "Prova Finale";
    if (name.startsWith("LABORATORIO:")) return "Laboratorio";
    return "Obbligatorio";
  }

  let idx = 1;
  md += `## Anno 1\n\n`;
  md += `### 1° Semestre\n\n`;
  md += `| # | Insegnamento | CFU | Semestre | Professore | Tipo |\n`;
  md += `|---|-------------|-----|----------|------------|------|\n`;
  for (const r of sem1_1) {
    md += `| ${idx++} | ${r.name} | ${r.cfu} | 1° | ${r.professor || '?'} | ${courseType(r.name)} |\n`;
  }

  md += `\n### 2° Semestre\n\n`;
  md += `| # | Insegnamento | CFU | Semestre | Professore | Tipo |\n`;
  md += `|---|-------------|-----|----------|------------|------|\n`;
  for (const r of sem2_1) {
    md += `| ${idx++} | ${r.name} | ${r.cfu} | 2° | ${r.professor || '?'} | ${courseType(r.name)} |\n`;
  }

  md += `\n## Anno 2\n\n`;
  md += `### 1° Semestre\n\n`;
  md += `| # | Insegnamento | CFU | Semestre | Professore | Tipo |\n`;
  md += `|---|-------------|-----|----------|------------|------|\n`;
  for (const r of sem1_2) {
    md += `| ${idx++} | ${r.name} | ${r.cfu} | 1° | ${r.professor || '?'} | ${courseType(r.name)} |\n`;
  }

  md += `\n### 2° Semestre\n\n`;
  md += `| # | Insegnamento | CFU | Semestre | Professore | Tipo |\n`;
  md += `|---|-------------|-----|----------|------------|------|\n`;
  for (const r of sem2_2) {
    md += `| ${idx++} | ${r.name} | ${r.cfu} | 2° | ${r.professor || '?'} | ${courseType(r.name)} |\n`;
  }

  if (annual_2.length > 0) {
    md += `\n### Annuale\n\n`;
    md += `| # | Insegnamento | CFU | Semestre | Professore | Tipo |\n`;
    md += `|---|-------------|-----|----------|------------|------|\n`;
    for (const r of annual_2) {
      md += `| ${idx++} | ${r.name} | ${r.cfu} | Ann. | ${r.professor || '?'} | ${courseType(r.name)} |\n`;
    }
  }

  const totalCfu = results.reduce((s, r) => s + r.cfu, 0);
  md += `\n---\n\n**Totale CFU**: ${totalCfu} | **Totale corsi**: ${results.length} | **Professori trovati**: ${knownCount}\n`;

  const outputPath = '/Users/suchuanhao/Desktop/vibe coding/游戏/佛罗伦萨学生-web/LM92_verifica.md';
  const fs = require('fs');
  fs.writeFileSync(outputPath, md);
  console.log(`\nMarkdown report saved: ${outputPath}`);
}

main().catch(console.error);
