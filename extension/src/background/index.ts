import { domainOf } from '../lib/domain';
import { getSettings, pruneUsage, setSettings } from '../lib/storage';
import type { RuntimeMessage } from '../lib/types';
import { buildSiteImpact, buildTotals } from './aggregator';
import { recordBytes } from './bytesTracker';
import { flushActive, recordVisit, setActiveDomain, setIdle } from './historyTracker';
import { runProfileBatch } from './profileBatcher';
import { runSync } from './sync';

const ALARMS = {
  flush: 'flush',
  batch: 'batch',
  sync: 'sync',
  prune: 'prune',
} as const;

const IDLE_SECONDS = 30;

async function currentActiveDomain(): Promise<string | null> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    return domainOf(tab?.url);
  } catch {
    return null;
  }
}

function setupAlarms(): void {
  chrome.alarms.create(ALARMS.flush, { periodInMinutes: 1 });
  chrome.alarms.create(ALARMS.batch, { periodInMinutes: 60 });
  chrome.alarms.create(ALARMS.sync, { periodInMinutes: 60 });
  chrome.alarms.create(ALARMS.prune, { periodInMinutes: 1440 });
}

chrome.runtime.onInstalled.addListener(async () => {
  chrome.idle.setDetectionInterval(IDLE_SECONDS);
  setupAlarms();
  await setActiveDomain(await currentActiveDomain());
});

chrome.runtime.onStartup.addListener(async () => {
  chrome.idle.setDetectionInterval(IDLE_SECONDS);
  setupAlarms();
  await setActiveDomain(await currentActiveDomain());
});

// --- Active-time tracking --------------------------------------------------

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  try {
    const tab = await chrome.tabs.get(tabId);
    await setActiveDomain(domainOf(tab.url));
  } catch {
    await setActiveDomain(null);
  }
});

chrome.tabs.onUpdated.addListener(async (_tabId, changeInfo, tab) => {
  if (changeInfo.url && tab.active) {
    await setActiveDomain(domainOf(changeInfo.url));
  }
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    await setActiveDomain(null);
  } else {
    await setActiveDomain(await currentActiveDomain());
  }
});

chrome.idle.onStateChanged.addListener(async (state) => {
  await setIdle(state !== 'active');
});

chrome.history.onVisited.addListener(async (item) => {
  const domain = domainOf(item.url);
  if (domain) await recordVisit(domain);
});

// --- Alarms ----------------------------------------------------------------

chrome.alarms.onAlarm.addListener(async (alarm) => {
  switch (alarm.name) {
    case ALARMS.flush:
      await flushActive();
      break;
    case ALARMS.batch:
      await runProfileBatch();
      break;
    case ALARMS.sync:
      await runSync();
      break;
    case ALARMS.prune:
      await pruneUsage();
      break;
  }
});

// --- Messaging -------------------------------------------------------------

chrome.runtime.onMessage.addListener(
  (message: RuntimeMessage, sender, sendResponse) => {
    (async () => {
      switch (message.type) {
        case 'GET_TOTALS':
          sendResponse(await buildTotals(message.range));
          break;
        case 'GET_SITE_IMPACT':
          sendResponse(await buildSiteImpact(message.domain));
          break;
        case 'GET_BADGE': {
          const domain = domainOf(sender.tab?.url);
          sendResponse(domain ? await buildSiteImpact(domain) : null);
          break;
        }
        case 'PAGE_BYTES': {
          const domain = domainOf(sender.tab?.url);
          if (domain) await recordBytes(domain, message.bytes);
          sendResponse({ ok: true });
          break;
        }
        case 'GET_SETTINGS':
          sendResponse(await getSettings());
          break;
        case 'SET_SETTINGS':
          sendResponse(await setSettings(message.settings));
          break;
        default:
          sendResponse(null);
      }
    })();
    return true; // async response
  },
);
