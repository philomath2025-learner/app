"use client";

import { useState, useEffect } from "react";
import { getStorageProvider } from "@/lib/storage";
import { getLevel, getNextLevel } from "@/lib/constants";

interface ProfileScreenProps {
  xp: number;
  streak: number;
  theme: "light" | "dark";
  storageMode: "guest" | "cloud";
  onGoHome: () => void;
}

export default function ProfileScreen({ xp, streak, theme, storageMode, onGoHome }: ProfileScreenProps) {
  const isDark = theme === "dark";
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<{ date: string; xp_earned: number }[]>([]);
  const [profile, setProfile] = useState<{
    display_name: string;
    display_initial: string;
    created_at: string;
    total_roots_learned: number;
    level_name: string;
  } | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const provider = getStorageProvider(storageMode);
        
        // Load Activity History (7 days)
        const hist = await provider.getActivityHistory(7);
        setHistory(hist);

        if (storageMode === "cloud") {
          const res = await fetch("/api/user/profile");
          if (res.ok) {
            const data = await res.json();
            setProfile(data);
          }
        } else {
          // Fallback for guest
          setProfile({
            display_name: "Guest Learner",
            display_initial: "G",
            created_at: new Date().toISOString(),
            total_roots_learned: 0, // This could be fetched from local ledger if needed
            level_name: getLevel(xp).name,
          });
        }
      } catch (err) {
        console.error("Failed to load profile details", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [storageMode, xp]);

  async function handleLogout() {
    if (storageMode === "guest") {
      // Just reload for guest to act as logout
      window.location.reload();
      return;
    }
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.reload();
    } catch (err) {
      console.error("Logout failed", err);
      alert("Failed to log out.");
    }
  }

  const joinDate = profile ? new Date(profile.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long' }) : "";
  
  // Progress Bar Calculations
  const currentLevel = getLevel(xp);
  const nextLevel = getNextLevel(xp);
  let progressPercent = 100;
  if (nextLevel) {
    const range = nextLevel.minXP - currentLevel.minXP;
    const current = xp - currentLevel.minXP;
    progressPercent = Math.max(0, Math.min(100, Math.round((current / range) * 100)));
  }

  return (
    <div className={`flex-1 overflow-y-auto p-4 animate-fade-in ${isDark ? 'bg-[#0B1121] text-white' : 'bg-white text-text'}`}>
      
      {/* Header */}
      <div className="flex items-center mb-6">
        <button onClick={onGoHome} className={`text-[24px] mr-4 opacity-50 hover:opacity-100 transition-opacity ${isDark ? 'text-white' : 'text-text'}`}>
          ←
        </button>
        <h1 className="text-[20px] font-black uppercase tracking-wide">Profile</h1>
      </div>

      {loading ? (
        <div className="flex flex-col gap-4 animate-pulse px-2 pt-4">
          <div className={`h-24 w-24 rounded-[32px] mx-auto ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}></div>
          <div className={`h-6 w-32 rounded mx-auto mt-2 ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}></div>
          <div className={`h-4 w-48 rounded mx-auto mt-1 mb-8 ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}></div>
          
          <div className="grid grid-cols-2 gap-4 mb-10">
             {[1,2,3,4].map(i => <div key={i} className={`h-24 rounded-[16px] ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}></div>)}
          </div>
        </div>
      ) : profile ? (
        <>
          {/* Avatar & Name */}
          <div className={`flex flex-col items-center mb-6 border-b-2 pb-6 ${isDark ? 'border-[#1E314A]' : 'border-gray2'}`}>
            <div className="w-24 h-24 rounded-[32px] bg-gradient-to-br from-blue to-purple text-white text-[40px] font-black flex items-center justify-center shadow-lg mb-4">
              {profile.display_initial}
            </div>
            <h2 className="text-[24px] font-black text-center">{profile.display_name}</h2>
            <p className="text-[13px] text-text-light font-bold mt-1 uppercase tracking-wide">Joined {joinDate}</p>
          </div>

          {/* Level Progress Bar */}
          <div className={`mb-8 p-4 rounded-[16px] border-2 ${isDark ? 'bg-[#1E314A]/20 border-[#1E314A]' : 'bg-gray1 border-gray2'}`}>
             <div className="flex justify-between items-end mb-2">
               <div>
                 <p className="text-[12px] text-text-light font-bold uppercase tracking-wide">Current Rank</p>
                 <p className="text-[18px] font-black flex items-center gap-2">
                   <span>{currentLevel.emoji}</span> {currentLevel.name}
                 </p>
               </div>
               {nextLevel && (
                 <div className="text-right">
                   <p className="text-[12px] text-text-light font-bold uppercase tracking-wide">Next Rank</p>
                   <p className="text-[14px] font-black opacity-50 flex items-center gap-1 justify-end">
                     {nextLevel.name} <span>{nextLevel.emoji}</span>
                   </p>
                 </div>
               )}
             </div>
             
             {nextLevel ? (
               <>
                 <div className={`h-4 rounded-full overflow-hidden flex ${isDark ? 'bg-[#1E314A]' : 'bg-gray2'}`}>
                   <div 
                     className="h-full bg-gradient-to-r from-green to-blue rounded-full transition-all duration-1000 ease-out"
                     style={{ width: `${progressPercent}%` }}
                   />
                 </div>
                 <p className="text-[12px] text-center mt-2 font-bold text-text-light">
                   {xp} / {nextLevel.minXP} XP
                 </p>
               </>
             ) : (
               <div className="text-center text-green font-black mt-2">Max Rank Achieved! 🏆</div>
             )}
          </div>

          {/* Activity Heatmap (7 Days) */}
          <h3 className="text-[16px] font-black uppercase mb-3">Recent Activity</h3>
          <div className={`mb-8 p-4 rounded-[16px] border-2 ${isDark ? 'bg-[#1E314A]/20 border-[#1E314A]' : 'bg-gray1 border-gray2'}`}>
            <div className="flex justify-between items-center gap-2">
              {history.map((day) => {
                // Determine color intensity based on XP
                let bgColor = isDark ? 'bg-[#1E314A]' : 'bg-gray2'; // 0 XP
                if (day.xp_earned > 0 && day.xp_earned < 20) bgColor = 'bg-green-300';
                else if (day.xp_earned >= 20 && day.xp_earned < 50) bgColor = 'bg-green-400';
                else if (day.xp_earned >= 50) bgColor = 'bg-green';
                
                const dateObj = new Date(day.date);
                const dayName = dateObj.toLocaleDateString(undefined, { weekday: 'short' }).charAt(0);
                
                return (
                  <div key={day.date} className="flex flex-col items-center gap-1 flex-1">
                    <div className={`w-full aspect-square rounded-[6px] ${bgColor} transition-colors`} title={`${day.date}: ${day.xp_earned} XP`}></div>
                    <span className="text-[10px] font-bold text-text-light uppercase">{dayName}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Statistics Section */}
          <h3 className="text-[16px] font-black uppercase mb-3">Statistics</h3>
          <div className="grid grid-cols-2 gap-3 mb-10">
            <div className={`rounded-[16px] p-3 border-2 ${isDark ? 'bg-[#1E314A]/20 border-[#1E314A]' : 'bg-gray1 border-gray2'} flex items-center gap-3`}>
              <div className="text-[24px]">🔥</div>
              <div>
                <p className="text-[18px] font-black">{streak}</p>
                <p className="text-[10px] text-text-light font-bold uppercase tracking-wide">Day Streak</p>
              </div>
            </div>
            <div className={`rounded-[16px] p-3 border-2 ${isDark ? 'bg-[#1E314A]/20 border-[#1E314A]' : 'bg-gray1 border-gray2'} flex items-center gap-3`}>
              <div className="text-[24px]">⚡</div>
              <div>
                <p className="text-[18px] font-black">{xp}</p>
                <p className="text-[10px] text-text-light font-bold uppercase tracking-wide">Total XP</p>
              </div>
            </div>
            <div className={`rounded-[16px] p-3 border-2 ${isDark ? 'bg-[#1E314A]/20 border-[#1E314A]' : 'bg-gray1 border-gray2'} flex items-center gap-3`}>
              <div className="text-[24px]">🌱</div>
              <div>
                <p className="text-[18px] font-black">{profile.total_roots_learned}</p>
                <p className="text-[10px] text-text-light font-bold uppercase tracking-wide">Roots</p>
              </div>
            </div>
            <div className={`rounded-[16px] p-3 border-2 ${isDark ? 'bg-[#1E314A]/20 border-[#1E314A]' : 'bg-gray1 border-gray2'} flex items-center gap-3`}>
              <div className="text-[24px]">🛡️</div>
              <div className="min-w-0">
                <p className="text-[16px] font-black leading-tight truncate">{currentLevel.name}</p>
                <p className="text-[10px] text-text-light font-bold uppercase tracking-wide">Current Rank</p>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <div className="mt-auto">
            <button
              onClick={handleLogout}
              className={`w-full bg-transparent hover:bg-red-50 text-red-500 rounded-[16px] py-4 px-6 text-[16px] font-black uppercase tracking-wide border-2 border-red-200 active:bg-red-100 transition-all mb-4 ${isDark ? 'hover:bg-red-900/20 border-red-900/50 text-red-400' : ''}`}
            >
              {storageMode === "guest" ? "Leave Guest Mode" : "Log Out"}
            </button>
          </div>
        </>
      ) : (
        <div className="text-center py-10 text-text-light font-bold">
          Could not load profile.
        </div>
      )}
    </div>
  );
}
