"use client";

import { useState, useEffect } from "react";
import { T } from "@/lib/i18n";

interface RoomsScreenProps {
  theme: "light" | "dark";
  storageMode: "guest" | "cloud";
}

interface Room {
  id: string | number;
  name: string;
  description: string;
  member_count?: number;
}

interface Member {
  user_id: string;
  display_name: string;
  display_initial: string;
  score?: number;
  activity_seconds?: number;
}

export default function RoomsScreen({ theme, storageMode }: RoomsScreenProps) {
  const isDark = theme === "dark";
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRooms() {
      if (storageMode === "guest") {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch("/api/user/rooms");
        if (res.ok) {
          const data = await res.json();
          setRooms(data.rooms);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadRooms();
  }, [storageMode]);

  useEffect(() => {
    async function loadMembers() {
      if (!selectedRoom) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/user/rooms/${selectedRoom.id}/members`);
        if (res.ok) {
          const data = await res.json();
          // Sort by score or activity_seconds descending
          const sorted = (data.members || []).sort((a: any, b: any) => {
             const scoreA = a.score ?? a.activity_seconds ?? 0;
             const scoreB = b.score ?? b.activity_seconds ?? 0;
             return scoreB - scoreA;
          });
          setMembers(sorted);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadMembers();
  }, [selectedRoom]);

  if (storageMode === "guest") {
    return (
      <div className={`flex-1 flex flex-col p-4 transition-colors ${isDark ? 'bg-[#0B1121] text-white' : 'bg-[#F0F4F8] text-text'}`}>
        <div className="flex-1 flex items-center justify-center text-center py-20">
          <div>
            <div className="text-[48px] mb-4">🔒</div>
            <h2 className="text-[18px] font-black mb-2">Login Required</h2>
            <p className="text-[13px] opacity-70 mb-6 max-w-[250px] mx-auto">Create an account with Quran Foundation to join rooms and compete with your friends.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 flex flex-col p-4 transition-colors ${isDark ? 'bg-[#0B1121] text-white' : 'bg-[#F0F4F8] text-text'}`}>
      
      {!selectedRoom ? (
        <>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[24px] font-black tracking-tight">Competitions</h2>
            <button className={`px-4 py-1.5 rounded-full text-[12px] font-bold uppercase tracking-wider transition-all ${isDark ? 'bg-[#202E45] text-[#60E0C1] hover:bg-[#2A3F5C]' : 'bg-blue-light text-blue-dark hover:bg-blue hover:text-white'}`}>
              + New Room
            </button>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center animate-pulse-load">Loading rooms...</div>
          ) : rooms.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-center">
              <div>
                <div className="text-[48px] mb-4">🏆</div>
                <h2 className="text-[18px] font-black mb-2">No Rooms Yet</h2>
                <p className="text-[13px] opacity-70 mb-6">You haven't joined any group competitions.</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {rooms.map(room => (
                <button
                  key={room.id}
                  onClick={() => setSelectedRoom(room)}
                  className={`flex flex-col text-left p-4 border-2 rounded-[var(--radius-card)] transition-all ${isDark ? 'bg-[#152336] border-[#1E314A] hover:border-[#60E0C1]' : 'bg-white border-gray2 hover:border-blue'}`}
                >
                  <div className="text-[18px] font-black mb-1">{room.name}</div>
                  <div className={`text-[12px] ${isDark ? 'text-[#50728D]' : 'text-text-light'}`}>{room.description || "No description"}</div>
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex items-center gap-3 mb-6">
            <button 
              onClick={() => setSelectedRoom(null)}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-[18px] ${isDark ? 'bg-[#152336] text-white' : 'bg-white text-text shadow-sm'}`}
            >
              ←
            </button>
            <h2 className="text-[20px] font-black tracking-tight">{selectedRoom.name}</h2>
          </div>

          <div className={`p-5 rounded-[var(--radius-card)] mb-4 flex items-center justify-between text-white ${isDark ? 'bg-[#152336] border border-[#1E314A]' : 'bg-gradient-to-r from-blue-dark to-blue'}`}>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider opacity-80 mb-1">Leaderboard</div>
              <div className="text-[14px]">Ranked by recent activity</div>
            </div>
            <div className="text-[32px]">🏅</div>
          </div>

          {loading ? (
             <div className="flex-1 flex items-center justify-center animate-pulse-load">Loading leaderboard...</div>
          ) : members.length === 0 ? (
            <div className="text-center py-10 opacity-70 text-[13px]">No members found.</div>
          ) : (
            <div className="flex flex-col gap-2">
              {members.map((member, i) => (
                <div 
                  key={member.user_id}
                  className={`flex items-center gap-3 p-3 rounded-2xl ${isDark ? 'bg-[#101826]' : 'bg-white'} ${i === 0 ? 'border-2 border-yellow-400' : 'border border-transparent'}`}
                >
                  <div className={`w-8 text-center font-black text-[16px] ${i === 0 ? 'text-yellow-500' : isDark ? 'text-[#50728D]' : 'text-gray1'}`}>
                    {i + 1}
                  </div>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[18px] font-black text-white ${i === 0 ? 'bg-yellow-400' : isDark ? 'bg-[#202E45]' : 'bg-gray2'}`}>
                    {member.display_initial || "?"}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-[15px]">{member.display_name || "Anonymous"}</div>
                  </div>
                  <div className="font-black text-[15px] tabular-nums">
                    {member.score ?? member.activity_seconds ?? 0}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
