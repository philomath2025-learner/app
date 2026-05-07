"use client";

import { NAV_ITEMS, type ScreenId } from "@/lib/constants";

interface BottomNavProps {
  activeScreen: ScreenId;
  onNavigate: (id: ScreenId) => void;
}

export default function BottomNav({ activeScreen, onNavigate }: BottomNavProps) {
  return (
    <div className="flex border-t-2 border-gray2 bg-white">
      {NAV_ITEMS.map((item) => {
        const isActive = activeScreen === item.id;
        return (
          <button
            key={item.id}
            id={`nav-${item.id}`}
            onClick={() => onNavigate(item.id as ScreenId)}
            className={`flex-1 py-2 px-[1px] text-[8px] font-bold border-none bg-none cursor-pointer flex flex-col items-center gap-[2px] tracking-wide uppercase font-[DM_Sans] transition-colors duration-150 ${
              isActive ? "text-blue" : "text-gray1"
            }`}
          >
            <span className="text-[17px] leading-none">{item.icon}</span>
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
