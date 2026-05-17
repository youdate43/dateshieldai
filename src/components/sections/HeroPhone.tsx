import { PhoneFrame } from "@/components/PhoneFrame";
import { Upload, ShieldAlert, AlertTriangle, ImageOff } from "lucide-react";

export function HeroPhone() {
  return (
    <PhoneFrame>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-white/50">DateShield</p>
            <h3 className="font-display text-lg font-semibold text-white">Profile Scan</h3>
          </div>
          <div className="grid h-9 w-9 place-items-center rounded-full bg-azure/20">
            <ShieldAlert className="h-4 w-4 text-azure-glow" />
          </div>
        </div>

        {/* Upload */}
        <button className="group glass-strong flex w-full flex-col items-center gap-2 rounded-2xl border-dashed py-7 transition hover:border-azure/60">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-azure/20 transition group-hover:scale-110">
            <Upload className="h-5 w-5 text-azure-glow" />
          </div>
          <p className="text-sm font-medium text-white">Upload Screenshot</p>
          <p className="text-[11px] text-white/50">PNG · JPG · max 10MB</p>
        </button>

        {/* Result card */}
        <div className="glass rounded-2xl p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-white/50">Risk Score</span>
            <span className="rounded-full bg-danger/20 px-2 py-0.5 text-[10px] font-semibold text-danger">
              HIGH
            </span>
          </div>
          <div className="mb-3 flex items-end gap-2">
            <span className="font-display text-3xl font-bold text-white">87</span>
            <span className="mb-1 text-xs text-white/50">/ 100</span>
          </div>
          <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-[87%] rounded-full bg-gradient-to-r from-warning to-danger" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2">
              <ImageOff className="h-4 w-4 text-warning" />
              <span className="text-xs text-white/85">Image reused on 4 sites</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2">
              <AlertTriangle className="h-4 w-4 text-danger" />
              <span className="text-xs text-white/85">Suspicious bio patterns</span>
            </div>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}
