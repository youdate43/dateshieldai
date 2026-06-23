import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Ad = {
  id: string;
  slot: string;
  title: string | null;
  image_url: string | null;
  link_url: string | null;
  html: string | null;
  enabled: boolean;
  sort_order: number;
};

export function AdsSlot({ slot = "home", className = "" }: { slot?: string; className?: string }) {
  const [ads, setAds] = useState<Ad[]>([]);

  useEffect(() => {
    let mounted = true;
    supabase
      .from("ads")
      .select("*")
      .eq("slot", slot)
      .eq("enabled", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (mounted && data) setAds(data as Ad[]);
      });
    return () => {
      mounted = false;
    };
  }, [slot]);

  if (ads.length === 0) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      {ads.map((ad) => (
        <div key={ad.id} className="relative">
          <span className="absolute right-2 top-2 z-10 rounded-full bg-black/60 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white/80">
            Ad
          </span>
          {ad.html ? (
            <div
              className="overflow-hidden rounded-2xl border border-white/10 bg-white/5"
              dangerouslySetInnerHTML={{ __html: ad.html }}
            />
          ) : ad.image_url ? (
            <a
              href={ad.link_url || "#"}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="block overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition hover:border-white/20"
            >
              <img src={ad.image_url} alt={ad.title || "Sponsored"} className="w-full object-cover" />
              {ad.title && (
                <div className="px-4 py-3 text-sm text-white/90">{ad.title}</div>
              )}
            </a>
          ) : ad.title ? (
            <a
              href={ad.link_url || "#"}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/90 hover:border-white/20"
            >
              {ad.title}
            </a>
          ) : null}
        </div>
      ))}
    </div>
  );
}
