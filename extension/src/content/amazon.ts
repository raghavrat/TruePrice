import { co2Equivalence, formatCo2Kg, formatKwh, formatWater } from '../lib/copy';
import type { ProductCategory, ProductImpact } from '../lib/types';

// Injects an estimated manufacturing/shipping footprint panel on Amazon product
// (detail) pages, below the product title. AI estimates come from the proxy via
// the background service worker; copy is templated (no LLM-generated text).

const PANEL_ID = '__trueprice_product_panel__';

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  electronics: 'Electronics',
  clothing: 'Clothing',
  book: 'Book',
  food: 'Food',
  beauty: 'Beauty',
  home: 'Home',
  furniture: 'Furniture',
  toy: 'Toy',
  tool: 'Tool',
  other: 'Product',
};

// --- Extension-context-safe messaging --------------------------------------

function extensionAlive(): boolean {
  try {
    return Boolean(chrome.runtime?.id);
  } catch {
    return false;
  }
}

async function getImpact(title: string): Promise<ProductImpact | null> {
  if (!extensionAlive()) return null;
  try {
    return ((await chrome.runtime.sendMessage({
      type: 'GET_PRODUCT_IMPACT',
      title,
    })) as ProductImpact | null) ?? null;
  } catch {
    return null;
  }
}

// --- DOM helpers -----------------------------------------------------------

function titleEl(): HTMLElement | null {
  return document.getElementById('productTitle');
}

function productTitle(): string | null {
  const t = titleEl()?.textContent?.trim();
  return t && t.length > 0 ? t : null;
}

function buildPanel(): { root: HTMLElement; setBody: (html: string) => void } {
  const root = document.createElement('div');
  root.id = PANEL_ID;
  root.style.cssText = [
    'margin:12px 0',
    'padding:12px 14px',
    'border:1px solid #d5d9d9',
    'border-radius:10px',
    'background:#f7fdf9',
    'font:13px/1.4 "Amazon Ember",Arial,sans-serif',
    'color:#0f1111',
    'max-width:560px',
  ].join(';');

  const header = document.createElement('div');
  header.style.cssText = 'display:flex;align-items:center;gap:6px;font-weight:700;margin-bottom:6px';
  const dot = document.createElement('span');
  dot.style.cssText = 'width:9px;height:9px;border-radius:9999px;background:#16a34a;display:inline-block';
  const title = document.createElement('span');
  title.textContent = 'TruePrice — estimated footprint';
  header.append(dot, title);

  const body = document.createElement('div');

  root.append(header, body);
  return { root, setBody: (html) => (body.innerHTML = html) };
}

function metricsHtml(impact: ProductImpact): string {
  const cell = (label: string, value: string, sub: string) =>
    `<div style="flex:1;min-width:120px">
       <div style="font-size:11px;color:#565959">${label}</div>
       <div style="font-size:16px;font-weight:700">${value}</div>
       <div style="font-size:11px;color:#848a8a">${sub}</div>
     </div>`;

  const lowConf =
    impact.confidence < 0.4
      ? `<div style="font-size:11px;color:#b76e00;margin-top:6px">Low-confidence estimate — title was vague.</div>`
      : '';

  return `
    <div style="display:flex;flex-wrap:wrap;gap:14px">
      ${cell('CO₂ to make + ship', formatCo2Kg(impact.co2Kg), co2Equivalence(impact.co2Kg * 1000))}
      ${cell('Water', formatWater(impact.waterL), 'embodied in production')}
      ${cell('Energy', formatKwh(impact.energyKwh), 'to manufacture')}
    </div>
    <div style="font-size:11px;color:#565959;margin-top:8px">
      ${CATEGORY_LABELS[impact.category]} · estimate, not a measurement
    </div>
    ${lowConf}`;
}

let lastRenderedTitle: string | null = null;

async function render(): Promise<void> {
  const anchor = titleEl();
  const title = productTitle();
  if (!anchor || !title) return;

  // Already showing this product's panel.
  if (lastRenderedTitle === title && document.getElementById(PANEL_ID)) return;

  document.getElementById(PANEL_ID)?.remove();
  lastRenderedTitle = title;

  const { root, setBody } = buildPanel();
  setBody('<div style="color:#565959">Estimating environmental footprint…</div>');
  anchor.insertAdjacentElement('afterend', root);

  const impact = await getImpact(title);
  // Bail if the user navigated to a different product meanwhile.
  if (lastRenderedTitle !== title) return;
  if (!impact || impact.source === 'fallback') {
    setBody('<div style="color:#565959">Footprint estimate unavailable for this item.</div>');
    return;
  }
  setBody(metricsHtml(impact));
}

// --- Lifecycle (handle late render + Amazon SPA navigation) -----------------

function schedule(): void {
  void render();
}

if (window.top === window.self) {
  schedule();

  // Re-render when the DOM swaps in a new product (Amazon mixes SSR + SPA nav).
  let debounce: ReturnType<typeof setTimeout> | undefined;
  const observer = new MutationObserver(() => {
    clearTimeout(debounce);
    debounce = setTimeout(schedule, 400);
  });
  observer.observe(document.body, { childList: true, subtree: true });
}
