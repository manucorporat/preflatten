import { Browser, Coverage, CoverageEntry, Page, launch } from 'puppeteer';
import * as CleanCSS from 'clean-css';


let resourceIds = 0;
export type ResourceType = 'document' | 'stylesheet' | 'image' | 'media'| 'font'| 'script'| 'texttrack'| 'xhr'| 'fetch'| 'eventsource'| 'websocket'| 'manifest'| 'other';

export interface Resource<T> {
  url: string;
  type: ResourceType;
  text: string;
  timestamp: number;
  usedBytes: number;
  sameOrigin: boolean;
}

export interface CSSAnalysis {
  coverage: CoverageEntry[];

  resources: Resource<'stylesheet'>[];
  totalBytes: number;
  usedBytes: number;
  minifiedBytes: number;
  minifiedCSS: string;
}

export interface JSAnalysis {
  coverage: CoverageEntry[];

  resources: Resource<'script'>[];
  scripts: Resource<'script'>[];
  modules: Resource<'script'>[];
  totalBytes: number;
  usedBytes: number;
}

export interface HTMLAnalysis {

}

export interface Analysis {
  resources: Resource<ResourceType>[];
  css: CSSAnalysis;
  js: JSAnalysis;
}

export class Preflatten {
  private browser: Browser;

  constructor(private opts: any) {}

  async run(openURL: string): Promise<Analysis> {
    this.browser = await launch();
    const page = await this.browser.newPage();

    const resources: Resource<ResourceType>[] = [];
    const start = Date.now();
    page.on('response', async response => {
      if (!await response.ok()) {
        return;
      }
      const request = response.request();
      if (request.method() !== 'GET') {
        return;
      }
      const url = await response.url();
      const text = await response.text();
      resources.push({
        url,
        text,
        type: (await request.resourceType()) as ResourceType,
        timestamp: Date.now() - start,
        usedBytes: text.length,
        sameOrigin: url.startsWith(openURL)
      });
    });
    await page.coverage.startCSSCoverage();
    await page.coverage.startJSCoverage();
    await page.goto(openURL, {
      waitUntil: 'networkidle2'
    });

    const cssCoverage = await page.coverage.stopCSSCoverage();
    const jsCoverage = await page.coverage.stopJSCoverage();

    return {
      resources,
      css: await generateCSSAnalysis(cssCoverage, resources),
      js: await generateJSAnalysis(jsCoverage, resources, page)
    };
  }
}

function generateCSSAnalysis(cssCoverage: CoverageEntry[], resources: Resource<ResourceType>[]): CSSAnalysis {
  let css = '';
  let totalBytes = 0;
  let usedBytes = 0;
  for (const entry of cssCoverage) {
    totalBytes += entry.text.length;
    for (const range of entry.ranges) {
      usedBytes += range.end - range.start - 1;
      css += entry.text.slice(range.start, range.end);
    }
  }
  const engine = new CleanCSS({
    level: 2
  } as any);
  const minified = engine.minify(css);
  return {
    resources: resources.filter(r => r.type === 'stylesheet') as Resource<'stylesheet'>[],
    coverage: cssCoverage,
    minifiedBytes: minified.stats.minifiedSize,
    minifiedCSS: minified.styles,
    totalBytes,
    usedBytes
  };
}

async function generateJSAnalysis(jsCoverage: CoverageEntry[], resources: Resource<ResourceType>[], page: Page): Promise<JSAnalysis> {
  const scriptData = await page.$$eval('script', (elements) => {
    return Array.from(elements).map(el => {
      const id = `_preflatten_${resourceIds++}`;
      const script = el as HTMLScriptElement;
      el.id = id;
      return {
        id,
        src: script.src,
        async: script.async,
        defer: script.defer,
        isModule: script.type === 'module',
        inHead: script.parentElement === document.head
      };
    });
  });

  const allJS = resources.filter(js => js.type === 'script' && js.sameOrigin) as Resource<'script'>[];
  for (const resource of allJS) {
    
  }

  let totalBytes = 0;
  let usedBytes = 0;
  for (const entry of jsCoverage) {
    totalBytes += entry.text.length;
    for (const range of entry.ranges) {
      usedBytes += range.end - range.start - 1;
    }
    entry.url
  }

  const allJS = resources.filter(js => js.type === 'script') as Resource<'script'>[];
  for (const js of allJS) {
    js.
  }
  return {
    resources: allJS,
    coverage: jsCoverage,
    totalBytes,
    usedBytes
  };
}

