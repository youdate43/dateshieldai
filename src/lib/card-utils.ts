export type CardBrand =
  | "visa"
  | "mastercard"
  | "amex"
  | "discover"
  | "unionpay"
  | "jcb"
  | null;

export function detectCardBrand(num: string): CardBrand {
  const n = num.replace(/\D/g, "");
  if (!n) return null;
  if (/^4/.test(n)) return "visa";
  if (/^(5[1-5]|2(2[2-9][1-9]|2[3-9]\d{2}|[3-6]\d{3}|7([01]\d{2}|20\d{1})))/.test(n))
    return "mastercard";
  if (/^3[47]/.test(n)) return "amex";
  if (/^(6011|65|64[4-9]|622)/.test(n)) return "discover";
  if (/^62/.test(n)) return "unionpay";
  if (/^35(2[89]|[3-8]\d)/.test(n)) return "jcb";
  return null;
}

export function luhnCheck(num: string): boolean {
  const n = num.replace(/\D/g, "");
  if (n.length < 12) return false;
  let sum = 0;
  let alt = false;
  for (let i = n.length - 1; i >= 0; i--) {
    let d = parseInt(n[i], 10);
    if (alt) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    alt = !alt;
  }
  return sum % 10 === 0;
}

export type BinInfo = { bank: string | null; country: string | null };

export async function lookupBin(num: string): Promise<BinInfo | null> {
  const bin = num.replace(/\D/g, "").slice(0, 8);
  if (bin.length < 6) return null;
  try {
    const res = await fetch(`https://lookup.binlist.net/${bin}`, {
      headers: { "Accept-Version": "3" },
    });
    if (!res.ok) return null;
    const j = await res.json();
    return {
      bank: j?.bank?.name ?? null,
      country: j?.country?.name ?? null,
    };
  } catch {
    return null;
  }
}
