"use client";

import { getLevel, getNextLevel } from "@/lib/constants";

interface TopBarProps {
  xp: number;
  hearts: number;
  streakDays: number;
  juzLabel: string;
  displayInitial: string;
  theme: "light" | "dark";
  onProfileClick: () => void;
}

export default function TopBar({ xp, hearts, streakDays, juzLabel, displayInitial, theme, onProfileClick }: TopBarProps) {
  const isDark = theme === "dark";
  const lv = getLevel(xp);
  const nx = getNextLevel(xp);
  const base = lv.minXP;
  const cap = nx ? nx.minXP : lv.minXP + 500;
  const pct = Math.min(100, Math.round(((xp - base) / (cap - base)) * 100));

  const heartsDisplay = Array.from({ length: 5 }, (_, i) => (i < hearts ? "❤️" : "🖤")).join("");

  return (
    <div className={`px-4 pt-3 pb-2 border-b-2 transition-colors duration-300 ${isDark ? 'bg-[#0B1121] border-[#1E314A]' : 'bg-white border-gray2'}`}>
      {/* Row 1 */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px] font-extrabold text-text-light tracking-wide uppercase">
          {juzLabel}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[16px] tracking-tight">{heartsDisplay}</span>
          <button
            onClick={onProfileClick}
            className="w-[30px] h-[30px] rounded-full bg-gradient-to-br from-blue to-purple border-none text-white text-[13px] font-black flex items-center justify-center shrink-0 shadow-[0_2px_6px_rgba(28,112,232,0.35)] hover:opacity-85 transition-opacity cursor-pointer"
          >
            {displayInitial}
          </button>
        </div>
      </div>
      {/* Row 2 */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 bg-[#FFF3D6] border-2 border-gold rounded-full px-2 py-[3px]">
          <span>🔥</span>
          <span className="text-[12px] font-extrabold text-gold-dark">{streakDays}</span>
        </div>
        <div className="flex-1 h-[11px] bg-gray2 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-green to-[#7BED00] transition-[width] duration-600"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-[11px] font-extrabold text-green-dark min-w-[50px] text-right">
          {xp} XP
        </span>
      </div>
    </div>
  );
}
