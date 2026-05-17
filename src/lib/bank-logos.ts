import { supabase } from "@/integrations/supabase/client";
import { bankLogo as defaultBankLogo } from "@/lib/us-banks";

export type BankLogoOverride = { domain: string; logo_url: string };

export async function fetchBankLogoOverrides(): Promise<Record<string, string>> {
  const { data } = await supabase.from("bank_logos").select("domain, logo_url");
  const map: Record<string, string> = {};
  (data ?? []).forEach((r: BankLogoOverride) => {
    map[r.domain] = r.logo_url;
  });
  return map;
}

export function effectiveLogo(domain: string, overrides: Record<string, string>) {
  return overrides[domain] || defaultBankLogo(domain);
}
