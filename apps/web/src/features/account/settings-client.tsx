'use client';

import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiFetch } from '@/lib/api';

type Me = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
};

export function SettingsClient() {
  const [me, setMe] = useState<Me | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const u = (await apiFetch<Me>('/auth/me', { method: 'GET' })) as Me;
      if (!u) {
        setMe(null);
        return;
      }
      setMe(u);
      setName(u.name);
      setPhone(u.phone ?? '');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    setOk(false);
    try {
      const body: { name?: string; phone?: string | null } = {};
      if (name.trim() && name.trim() !== me?.name) {
        body.name = name.trim();
      }
      const phoneVal = phone.trim() === '' ? null : phone.trim();
      if (phoneVal !== (me?.phone ?? null)) {
        body.phone = phoneVal;
      }
      if (Object.keys(body).length === 0) {
        setOk(true);
        return;
      }
      const u = (await apiFetch<Me>('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify(body),
      })) as Me;
      setMe(u);
      setName(u.name);
      setPhone(u.phone ?? '');
      setOk(true);
    } catch (er) {
      setErr(er instanceof Error ? er.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  if (!me) {
    return err ? (
      <p className="text-destructive text-sm">{err}</p>
    ) : (
      <p className="text-sm">Loading…</p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="max-w-md space-y-4">
      {err ? <p className="text-destructive text-sm">{err}</p> : null}
      {ok ? <p className="text-brand-600 text-sm">Saved.</p> : null}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="text-muted-foreground">Email (sign-in)</p>
            <p className="font-mono text-xs tabular-nums">{me.email}</p>
          </div>
          <div>
            <label htmlFor="name" className="text-muted-foreground block text-xs font-medium">
              Name
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border-input bg-background focus-visible:ring-ring mt-1 w-full rounded-md border px-2 py-1.5"
            />
          </div>
          <div>
            <label htmlFor="phone" className="text-muted-foreground block text-xs font-medium">
              Phone (optional)
            </label>
            <input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Clear field to remove"
              className="border-input bg-background focus-visible:ring-ring mt-1 w-full rounded-md border px-2 py-1.5"
            />
          </div>
        </CardContent>
      </Card>
      <Button type="submit" disabled={saving}>
        {saving ? 'Saving…' : 'Save changes'}
      </Button>
    </form>
  );
}
