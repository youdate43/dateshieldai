export function PaypalLoadingOverlay() {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#f5f7fa]">
      <div className="relative h-32 w-32">
        {/* Track */}
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="#d8dde3"
            strokeWidth="3"
          />
        </svg>
        {/* Spinning arc */}
        <svg
          className="absolute inset-0 h-full w-full animate-spin"
          style={{ animationDuration: "1.1s" }}
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="#0070ba"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="80 200"
          />
        </svg>
        {/* Lock icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            width="32"
            height="36"
            viewBox="0 0 24 28"
            fill="none"
            stroke="#9aa3ad"
            strokeWidth="1.6"
          >
            <rect x="3.5" y="11" width="17" height="14" rx="2.5" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            <line x1="12" y1="16" x2="12" y2="20" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}
