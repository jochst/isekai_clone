"use client";

import { useEffect, useState } from "react";
import { Wallet } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatUsd } from "@/lib/sites/isekaizero-ai-0e4f18da/format-usd";
import { useUsage } from "@/lib/sites/isekaizero-ai-0e4f18da/chat-store";
import { isProviderConfigured, providerHeaders, useProviderSettings } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-settings";

/**
 * - `sidebar`: full-width 28px pill (desktop sidebar).
 * - `compact`: 32px pill (desktop TopBar, chat header).
 * - `small`: 25px pill (mobile header and PageHeader right slot).
 */
export type BalancePillsVariant = "sidebar" | "compact" | "small";

export interface BalancePillsProps {
  variant?: BalancePillsVariant;
  className?: string;
}

/** Live provider balance (NanoGPT `check-balance`), falling back to the last balance a generation reported. */
function useProviderBalance(): number | undefined {
  const [settings, , hydrated] = useProviderSettings();
  const usage = useUsage();
  const configured = hydrated && isProviderConfigured(settings);
  const key = configured ? `${settings.preset}|${settings.baseUrl}|${settings.apiKey}` : "";
  const [live, setLive] = useState<{ key: string; usd: number } | null>(null);

  useEffect(() => {
    if (!key) return;
    const controller = new AbortController();
    fetch("/api/providers/balance", { headers: providerHeaders(settings), signal: controller.signal, cache: "no-store" })
      .then((res) => (res.ok ? (res.json() as Promise<{ usd?: number | null }>) : null))
      .then((json) => {
        if (json && typeof json.usd === "number") setLive({ key, usd: json.usd });
      })
      .catch(() => {});
    return () => controller.abort();
    // Refetch when the connection changes or a generation reports a new balance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, usage.remainingBalance]);

  return live && live.key === key ? live.usd : usage.remainingBalance;
}

/** The provider's remaining balance in USD ("—" when unknown, e.g. no key or a provider without a balance API). */
export function BalancePills({ variant = "sidebar", className }: BalancePillsProps) {
  const balance = useProviderBalance();
  const label = balance !== undefined ? formatUsd(balance) : "—";
  const small = variant === "small";

  return (
    <span
      className={cn(
        "flex items-center justify-center gap-[6px] rounded-[20px] border border-[rgba(128,128,255,0.5)] bg-[rgba(23,23,38,0.8)]",
        variant === "compact" ? "h-[32px] px-[12px]" : small ? "h-[25px] px-[10px]" : "h-[28px] flex-1 px-[10px]",
        className,
      )}
      title="Provider balance (USD)"
      aria-label={`Balance: ${label}`}
    >
      <Wallet size={small ? 13 : 14} className="shrink-0 text-[rgb(167,185,255)]" aria-hidden="true" />
      <span className="text-[12px] font-bold leading-none text-white">{label}</span>
    </span>
  );
}
