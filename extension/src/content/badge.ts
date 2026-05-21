const HOST_ID = '__trueprice_badge_host__';

export type Severity = 'low' | 'mid' | 'high';

export interface BadgeHandle {
  update: (label: string, severity: Severity) => void;
}

/** Mount a floating impact pill in a shadow root. Returns null if already mounted. */
export function mountBadge(): BadgeHandle | null {
  if (document.getElementById(HOST_ID)) return null;

  const host = document.createElement('div');
  host.id = HOST_ID;
  host.style.cssText = 'all: initial; position: fixed; z-index: 2147483647;';
  document.documentElement.appendChild(host);

  const shadow = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = `
    .pill {
      position: fixed;
      bottom: 16px;
      right: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 9999px;
      background: rgba(17, 24, 39, 0.92);
      color: #f9fafb;
      font: 600 12px/1.2 -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      box-shadow: 0 4px 14px rgba(0,0,0,0.25);
      cursor: default;
      user-select: none;
      transition: opacity 0.2s ease;
    }
    .dot { width: 8px; height: 8px; border-radius: 9999px; background: #16a34a; }
    .dot.mid { background: #d97706; }
    .dot.high { background: #dc2626; }
    .label { white-space: nowrap; }
    .close {
      margin-left: 2px; cursor: pointer; opacity: 0.6; font-weight: 700;
    }
    .close:hover { opacity: 1; }
    .muted { opacity: 0.55; }
  `;
  shadow.appendChild(style);

  const pill = document.createElement('div');
  pill.className = 'pill';

  const dot = document.createElement('span');
  dot.className = 'dot';

  const label = document.createElement('span');
  label.className = 'label';
  label.textContent = 'TruePrice';

  const close = document.createElement('span');
  close.className = 'close';
  close.textContent = '×';
  close.title = 'Hide for this page';
  close.addEventListener('click', () => host.remove());

  pill.append(dot, label, close);
  shadow.appendChild(pill);

  return {
    update(text: string, severity: Severity) {
      label.textContent = text;
      dot.className = severity === 'low' ? 'dot' : `dot ${severity}`;
    },
  };
}
