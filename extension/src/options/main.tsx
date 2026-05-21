import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type { Settings } from '../lib/types';
import '../styles.css';

const REGIONS = [
  { value: 'global', label: 'Global average' },
  { value: 'us', label: 'United States' },
  { value: 'eu', label: 'European Union' },
  { value: 'in', label: 'India' },
  { value: 'cn', label: 'China' },
];

function Options() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [email, setEmail] = useState('');
  const [authMsg, setAuthMsg] = useState('');
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null);

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }).then(setSettings);
    if (supabase) {
      supabase.auth.getUser().then(({ data }) => setSignedInEmail(data.user?.email ?? null));
    }
  }, []);

  function update(patch: Partial<Settings>) {
    chrome.runtime.sendMessage({ type: 'SET_SETTINGS', settings: patch }).then(setSettings);
  }

  async function sendMagicLink() {
    if (!supabase) return;
    const { error } = await supabase.auth.signInWithOtp({ email });
    setAuthMsg(error ? error.message : 'Check your email for a sign-in link.');
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setSignedInEmail(null);
  }

  if (!settings) return <div className="p-6 text-sm text-gray-500">Loading…</div>;

  return (
    <div className="mx-auto max-w-lg p-6 text-gray-900">
      <h1 className="text-xl font-bold">TruePrice Settings</h1>

      <section className="mt-6 space-y-4">
        <label className="flex items-center justify-between rounded-lg bg-white p-4 shadow-sm">
          <div>
            <div className="font-medium">Grid region</div>
            <p className="text-xs text-gray-500">Carbon intensity used for CO₂ estimates.</p>
          </div>
          <select
            className="rounded-md border border-gray-300 px-2 py-1 text-sm"
            value={settings.gridRegion}
            onChange={(e) => update({ gridRegion: e.target.value })}
          >
            {REGIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center justify-between rounded-lg bg-white p-4 shadow-sm">
          <div>
            <div className="font-medium">Cloud sync</div>
            <p className="text-xs text-gray-500">
              Sync aggregates across devices (requires sign-in).
            </p>
          </div>
          <input
            type="checkbox"
            className="h-5 w-5"
            checked={settings.syncEnabled}
            onChange={(e) => update({ syncEnabled: e.target.checked })}
          />
        </label>
      </section>

      <section className="mt-6 rounded-lg bg-white p-4 shadow-sm">
        <div className="font-medium">Account</div>
        {!isSupabaseConfigured ? (
          <p className="mt-1 text-xs text-gray-500">
            Sync is not configured in this build (no Supabase keys).
          </p>
        ) : signedInEmail ? (
          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm text-gray-700">{signedInEmail}</span>
            <button
              onClick={signOut}
              className="rounded-md border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
            >
              Sign out
            </button>
          </div>
        ) : (
          <div className="mt-2 flex gap-2">
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 rounded-md border border-gray-300 px-2 py-1 text-sm"
            />
            <button
              onClick={sendMagicLink}
              className="rounded-md bg-emerald-600 px-3 py-1 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Send link
            </button>
          </div>
        )}
        {authMsg && <p className="mt-2 text-xs text-gray-500">{authMsg}</p>}
      </section>
    </div>
  );
}

createRoot(document.getElementById('root') as HTMLElement).render(<Options />);
