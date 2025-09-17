'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type EventPriceRow = { id: string; label: string; amount: string; currency: string };

type ProductListItem = {
  _id: string;
  name: string;
  kind: 'event' | 'gym';
  stripeProductId: string;
  prices: Array<{
    _id: string;
    stripePriceId: string;
    label?: string;
    currency: string;
    unitAmount?: number | null;
    usageType: 'licensed' | 'metered' | 'one_time';
  }>;
};

interface StripeAccountStatus {
  accountExists: boolean;
  onboardingCompleted?: boolean;
  accountEnabled?: boolean;
}

export default function StripeProductsManager() {
  const [kind, setKind] = useState<'event' | 'gym'>('event');
  const [name, setName] = useState('');
  const [rows, setRows] = useState<EventPriceRow[]>([
    { id: crypto.randomUUID(), label: '大人', amount: '', currency: 'jpy' },
    { id: crypto.randomUUID(), label: '子ども', amount: '', currency: 'jpy' },
  ]);
  const [baseAmount, setBaseAmount] = useState('');
  const [enableMetered, setEnableMetered] = useState(true);
  const [includedVisits, setIncludedVisits] = useState('4');
  const [overageAmount, setOverageAmount] = useState('1000');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<ProductListItem[]>([]);
  const [accountStatus, setAccountStatus] = useState<StripeAccountStatus | null>(null);
  const [accountError, setAccountError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    if (!name.trim()) return false;

    if (kind === 'event') {
      return rows.every((row) => row.label.trim() && Number.isInteger(Number(row.amount)) && Number(row.amount) > 0);
    }

    if (!Number.isInteger(Number(baseAmount)) || Number(baseAmount) <= 0) return false;
    if (enableMetered) {
      if (!Number.isInteger(Number(includedVisits)) || Number(includedVisits) < 0) return false;
      if (!Number.isInteger(Number(overageAmount)) || Number(overageAmount) < 0) return false;
    }

    return true;
  }, [name, kind, rows, baseAmount, enableMetered, includedVisits, overageAmount]);

  const fetchList = async () => {
    try {
      const response = await fetch('/api/stripe/connect/products');
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      const data = await response.json();
      setItems(data.items || []);
    } catch (err) {
      console.error(err);
      setError('商品の取得に失敗しました。Stripeの設定をご確認ください。');
    }
  };

  const fetchAccountStatus = async () => {
    try {
      setAccountError(null);
      const response = await fetch('/api/stripe/connect/account');
      if (!response.ok) {
        setAccountError('Stripeアカウントの状態を取得できませんでした。');
        return;
      }
      const data = await response.json();
      setAccountStatus(data);
    } catch (err) {
      console.error(err);
      setAccountError('Stripeアカウントの状態を取得できませんでした。');
    }
  };

  useEffect(() => {
    fetchList();
    fetchAccountStatus();
  }, []);

  const onboardingIncomplete = accountStatus
    ? !accountStatus.accountExists || accountStatus.onboardingCompleted === false
    : false;

  const addRow = () => {
    setRows((rs) => [...rs, { id: crypto.randomUUID(), label: '', amount: '', currency: 'jpy' }]);
  };

  const removeRow = (id: string) => {
    setRows((rs) => rs.filter((row) => row.id !== id));
  };

  const submit = async () => {
    if (onboardingIncomplete) {
      setError('Stripe Connectのオンボーディングを完了してください。');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const payload =
        kind === 'event'
          ? {
              kind,
              name,
              prices: rows.map((row) => ({ label: row.label, currency: row.currency, amount: Number(row.amount) })),
            }
          : {
              kind,
              name,
              plan: {
                currency: 'jpy',
                baseAmount: Number(baseAmount),
                enableMetered,
                includedVisits: Number(includedVisits),
                overageAmount: Number(overageAmount),
              },
            };

      const response = await fetch('/api/stripe/connect/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create product');
      }

      await fetchList();
      setName('');
      if (kind === 'event') {
        setRows([
          { id: crypto.randomUUID(), label: '大人', amount: '', currency: 'jpy' },
          { id: crypto.randomUUID(), label: '子ども', amount: '', currency: 'jpy' },
        ]);
      } else {
        setBaseAmount('');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unexpected error';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>商品/価格の作成</CardTitle>
        <CardDescription>Stripeで商品と価格を管理します。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {(onboardingIncomplete || accountError) && (
          <Alert>
            <AlertTitle>Stripe Connect オンボーディングが未完了です</AlertTitle>
            <AlertDescription className="flex flex-col gap-3">
              <span>
                Stripe Connectのオンボーディングが完了していないため、商品管理はまだ利用できません。上の
                Stripe Connect設定カードからアカウント作成とオンボーディングを完了してください。
              </span>
              {accountError && <span className="text-sm text-destructive">{accountError}</span>}
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertTitle>エラー</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <Label>商品名</Label>
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="例: Concert 2025-12-01" />
          </div>
          <div>
            <Label>種別</Label>
            <Select value={kind} onValueChange={(value: 'event' | 'gym') => setKind(value)}>
              <SelectTrigger>
                <SelectValue placeholder="種別を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="event">買い切り（イベント）</SelectItem>
                <SelectItem value="gym">サブスク（ジム）</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {kind === 'event' ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>価格（複数可：大人/子どもなど）</Label>
              <Button variant="secondary" type="button" onClick={addRow}>行を追加</Button>
            </div>
            {rows.map((row) => (
              <div key={row.id} className="grid grid-cols-12 gap-3 items-end">
                <div className="col-span-4">
                  <Label className="text-xs">ラベル</Label>
                  <Input
                    value={row.label}
                    onChange={(event) =>
                      setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, label: event.target.value } : r)))
                    }
                  />
                </div>
                <div className="col-span-4">
                  <Label className="text-xs">金額（JPY, 税込/最小単位）</Label>
                  <Input
                    inputMode="numeric"
                    value={row.amount}
                    onChange={(event) =>
                      setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, amount: event.target.value } : r)))
                    }
                    placeholder="例: 8000"
                  />
                </div>
                <div className="col-span-3">
                  <Label className="text-xs">通貨</Label>
                  <Select
                    value={row.currency}
                    onValueChange={(value) =>
                      setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, currency: value } : r)))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="jpy">JPY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-1 flex justify-end">
                  <Button variant="ghost" type="button" disabled={rows.length <= 1} onClick={() => removeRow(row.id)}>
                    削除
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <Label>基本料金（JPY）</Label>
              <Input
                inputMode="numeric"
                value={baseAmount}
                onChange={(event) => setBaseAmount(event.target.value)}
                placeholder="例: 8000"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="enableMetered"
                type="checkbox"
                checked={enableMetered}
                onChange={(event) => setEnableMetered(event.target.checked)}
              />
              <Label htmlFor="enableMetered" className="text-sm">
                回数制（メーター課金）を有効化
              </Label>
            </div>
            {enableMetered && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>含まれる回数</Label>
                  <Input
                    inputMode="numeric"
                    value={includedVisits}
                    onChange={(event) => setIncludedVisits(event.target.value)}
                  />
                </div>
                <div>
                  <Label>超過料金（JPY）</Label>
                  <Input
                    inputMode="numeric"
                    value={overageAmount}
                    onChange={(event) => setOverageAmount(event.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end">
          <Button type="button" onClick={submit} disabled={!canSubmit || loading || onboardingIncomplete}>
            {loading ? '作成中...' : 'Stripeに作成'}
          </Button>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium">Stripe上の商品</h3>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">登録済みの商品はありません。</p>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item._id} className="rounded-md border p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.kind}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{item.stripeProductId}</span>
                  </div>
                  <div className="mt-2 space-y-1">
                    {item.prices.map((price) => (
                      <p key={price._id} className="text-sm">
                        <span className="font-medium">{price.label || price.usageType}</span> - {price.currency.toUpperCase()}{' '}
                        {price.unitAmount ? (price.unitAmount / 100).toLocaleString() : '0'}
                        {price.usageType === 'metered' && price.tiers
                          ? `（${price.tiers
                              .map((tier) => `${tier.up_to === 'inf' ? '以降' : `〜${tier.up_to}`}: ${tier.unit_amount ? tier.unit_amount / 100 : 0}`)
                              .join(', ')}）`
                          : ''}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
