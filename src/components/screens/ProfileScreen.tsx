"use client";

import { useState, useEffect } from "react";

interface ProfileScreenProps {
  xp: number;
  streak: number;
  theme: "light" | "dark";
  onGoHome: () => void;
}

export default function ProfileScreen({ xp, streak, theme, onGoHome }: ProfileScreenProps) {
  const isDark = theme === "dark";
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{
    display_name: string;
    display_initial: string;
    created_at: string;
    total_roots_learned: number;
    level_name: string;
  } | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/user/profile");
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        }
      } catch (err) {
        console.error("Failed to load profile details", err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.reload();
    } catch (err) {
      console.error("Logout failed", err);
      alert("Failed to log out.");
    }
  }

  const joinDate = profile ? new Date(profile.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long' }) : "";

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
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-4 border-green border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : profile ? (
        <>
          {/* Avatar & Name */}
          <div className={`flex flex-col items-center mb-8 border-b-2 pb-8 ${isDark ? 'border-[#1E314A]' : 'border-gray2'}`}>
            <div className="w-24 h-24 rounded-[32px] bg-gradient-to-br from-blue to-purple text-white text-[40px] font-black flex items-center justify-center shadow-lg mb-4">
              {profile.display_initial}
            </div>
            <h2 className="text-[24px] font-black text-center">{profile.display_name}</h2>
            <p className="text-[13px] text-text-light font-bold mt-1 uppercase tracking-wide">Joined {joinDate}</p>
          </div>

          {/* Statistics Section */}
          <h3 className="text-[18px] font-black uppercase mb-4">Statistics</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-10">
            <div className={`rounded-[16px] p-4 border-2 ${isDark ? 'bg-[#1E314A]/20 border-[#1E314A]' : 'bg-gray1 border-gray2'} flex items-center gap-3`}>
              <div className="text-[28px]">🔥</div>
              <div>
                <p className="text-[20px] font-black">{streak}</p>
                <p className="text-[12px] text-text-light font-bold uppercase tracking-wide">Day Streak</p>
              </div>
            </div>
            <div className={`rounded-[16px] p-4 border-2 ${isDark ? 'bg-[#1E314A]/20 border-[#1E314A]' : 'bg-gray1 border-gray2'} flex items-center gap-3`}>
              <div className="text-[28px]">⚡</div>
              <div>
                <p className="text-[20px] font-black">{xp}</p>
                <p className="text-[12px] text-text-light font-bold uppercase tracking-wide">Total XP</p>
              </div>
            </div>
            <div className={`rounded-[16px] p-4 border-2 ${isDark ? 'bg-[#1E314A]/20 border-[#1E314A]' : 'bg-gray1 border-gray2'} flex items-center gap-3`}>
              <div className="text-[28px]">🌱</div>
              <div>
                <p className="text-[20px] font-black">{profile.total_roots_learned}</p>
                <p className="text-[12px] text-text-light font-bold uppercase tracking-wide">Roots</p>
              </div>
            </div>
            <div className={`rounded-[16px] p-4 border-2 ${isDark ? 'bg-[#1E314A]/20 border-[#1E314A]' : 'bg-gray1 border-gray2'} flex items-center gap-3`}>
              <div className="text-[28px]">🛡️</div>
              <div className="min-w-0">
                <p className="text-[18px] font-black leading-tight truncate">{profile.level_name}</p>
                <p className="text-[12px] text-text-light font-bold uppercase tracking-wide">Current Rank</p>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <div className="mt-auto">
            <button
              onClick={handleLogout}
              className={`w-full bg-transparent hover:bg-red-50 text-red-500 rounded-[16px] py-4 px-6 text-[16px] font-black uppercase tracking-wide border-2 border-red-200 active:bg-red-100 transition-all mb-4 ${isDark ? 'hover:bg-red-900/20 border-red-900/50 text-red-400' : ''}`}
            >
              Log Out
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
