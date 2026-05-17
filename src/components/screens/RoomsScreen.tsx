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
  membersCount?: number;
  isMember?: boolean;
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
  const [activeTab, setActiveTab] = useState<"my_rooms" | "discover">("my_rooms");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [discoverRooms, setDiscoverRooms] = useState<Room[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomDesc, setNewRoomDesc] = useState("");
  const [newRoomPublic, setNewRoomPublic] = useState(true);

  async function loadRooms() {
    if (storageMode === "guest") {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/user/rooms");
      if (res.ok) {
        const data = await res.json();
        setRooms(data.rooms || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
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

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSearchLoading(true);
    try {
      const q = encodeURIComponent(searchQuery);
      const res = await fetch(`/api/user/rooms/search?q=${q}&roomType=GROUP`);
      if (res.ok) {
        const data = await res.json();
        setDiscoverRooms(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "discover" && discoverRooms.length === 0 && !searchQuery) {
      handleSearch();
    }
  }, [activeTab]);

  const handleJoin = async (roomId: string | number) => {
    try {
      const res = await fetch(`/api/user/rooms/${roomId}/join`, { method: "POST" });
      if (res.ok) {
        setActiveTab("my_rooms");
        await loadRooms();
        const joinedRoom = discoverRooms.find(r => r.id === roomId);
        if (joinedRoom) setSelectedRoom(joinedRoom);
      } else {
        alert("Failed to join room.");
      }
    } catch (err) {
      console.error(err);
      alert("Error joining room.");
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName) return;
    try {
      const res = await fetch("/api/user/rooms/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newRoomName,
          description: newRoomDesc,
          isPublic: newRoomPublic
        })
      });
      if (res.ok) {
        setIsCreatingRoom(false);
        setNewRoomName("");
        setNewRoomDesc("");
        setActiveTab("my_rooms");
        await loadRooms();
      } else {
        const data = await res.json();
        alert(`Failed to create room: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert("Error creating room.");
    }
  };

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
    <div className={`flex-1 flex flex-col p-4 transition-colors ${isDark ? 'bg-[#0B1121] text-white' : 'bg-[#F0F4F8] text-text'} relative`}>
      
      {!selectedRoom ? (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[24px] font-black tracking-tight">Competitions</h2>
            <button 
              onClick={() => setIsCreatingRoom(true)}
              className={`px-4 py-1.5 rounded-full text-[12px] font-bold uppercase tracking-wider transition-all ${isDark ? 'bg-[#202E45] text-[#60E0C1] hover:bg-[#2A3F5C]' : 'bg-blue-light text-blue-dark hover:bg-blue hover:text-white'}`}
            >
              + New Room
            </button>
          </div>

          <div className="flex gap-2 mb-6 border-b-2 border-transparent">
            <button 
              onClick={() => setActiveTab("my_rooms")}
              className={`flex-1 pb-2 font-bold transition-all ${activeTab === "my_rooms" ? (isDark ? 'border-b-2 border-[#60E0C1] text-[#60E0C1]' : 'border-b-2 border-blue text-blue') : 'opacity-50'}`}
            >
              My Rooms
            </button>
            <button 
              onClick={() => setActiveTab("discover")}
              className={`flex-1 pb-2 font-bold transition-all ${activeTab === "discover" ? (isDark ? 'border-b-2 border-[#60E0C1] text-[#60E0C1]' : 'border-b-2 border-blue text-blue') : 'opacity-50'}`}
            >
              Discover
            </button>
          </div>

          {activeTab === "discover" && (
            <form onSubmit={handleSearch} className="mb-4 flex gap-2">
              <input 
                type="text" 
                placeholder="Search public groups..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`flex-1 px-4 py-2 rounded-full outline-none font-bold ${isDark ? 'bg-[#152336] text-white placeholder-[#50728D]' : 'bg-white text-text border border-gray2 placeholder-text-light'}`}
              />
              <button 
                type="submit"
                className={`px-4 rounded-full font-bold uppercase text-[12px] ${isDark ? 'bg-[#60E0C1] text-[#0B1121]' : 'bg-blue text-white'}`}
              >
                Search
              </button>
            </form>
          )}

          {activeTab === "my_rooms" && (
            loading ? (
              <div className="flex-1 flex items-center justify-center animate-pulse-load">Loading rooms...</div>
            ) : rooms.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-center">
                <div>
                  <div className="text-[48px] mb-4">🏆</div>
                  <h2 className="text-[18px] font-black mb-2">No Rooms Yet</h2>
                  <p className="text-[13px] opacity-70 mb-6">You haven't joined any group competitions.</p>
                  <button 
                    onClick={() => setActiveTab("discover")}
                    className={`px-6 py-3 rounded-2xl font-black uppercase tracking-wider text-[14px] ${isDark ? 'bg-[#60E0C1] text-[#0B1121]' : 'bg-blue text-white shadow-active'}`}
                  >
                    Find a Group
                  </button>
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
            )
          )}

          {activeTab === "discover" && (
            searchLoading ? (
              <div className="flex-1 flex items-center justify-center animate-pulse-load">Searching...</div>
            ) : discoverRooms.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-center py-10 opacity-70 text-[13px]">
                No public groups found.
              </div>
            ) : (
              <div className="flex flex-col gap-3 overflow-y-auto pb-20">
                {discoverRooms.map(room => (
                  <div key={room.id} className={`flex items-center justify-between p-4 border-2 rounded-[var(--radius-card)] ${isDark ? 'bg-[#152336] border-[#1E314A]' : 'bg-white border-gray2'}`}>
                    <div className="flex-1 pr-4">
                      <div className="text-[16px] font-black mb-1">{room.name}</div>
                      <div className={`text-[12px] line-clamp-2 ${isDark ? 'text-[#50728D]' : 'text-text-light'}`}>{room.description || "No description"}</div>
                      <div className={`text-[10px] mt-2 font-bold uppercase tracking-wider ${isDark ? 'text-[#60E0C1]' : 'text-blue'}`}>
                        {room.membersCount || room.member_count || 0} Members
                      </div>
                    </div>
                    {room.isMember || rooms.some(r => r.id === room.id) ? (
                      <button 
                        onClick={() => setSelectedRoom(room)}
                        className={`px-4 py-2 rounded-xl font-bold text-[12px] ${isDark ? 'bg-[#202E45] text-[#60E0C1]' : 'bg-gray2 text-text'}`}
                      >
                        View
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleJoin(room.id)}
                        className={`px-4 py-2 rounded-xl font-bold text-[12px] uppercase ${isDark ? 'bg-[#60E0C1] text-[#0B1121]' : 'bg-blue text-white'}`}
                      >
                        Join
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )
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
            <h2 className="text-[20px] font-black tracking-tight flex-1 truncate">{selectedRoom.name}</h2>
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
            <div className="flex flex-col gap-2 overflow-y-auto pb-20">
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

      {/* Create Room Modal */}
      {isCreatingRoom && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className={`w-full max-w-sm rounded-[var(--radius-card)] p-6 shadow-2xl ${isDark ? 'bg-[#152336] text-white border border-[#1E314A]' : 'bg-white text-text'}`}>
            <h3 className="text-[20px] font-black mb-4">Create New Room</h3>
            <form onSubmit={handleCreateRoom} className="flex flex-col gap-4">
              <div>
                <label className="block text-[12px] font-bold uppercase tracking-wider mb-2 opacity-70">Room Name</label>
                <input 
                  type="text" 
                  required
                  maxLength={50}
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className={`w-full p-3 rounded-xl font-bold outline-none ${isDark ? 'bg-[#0B1121] focus:ring-2 focus:ring-[#60E0C1]' : 'bg-gray3 focus:ring-2 focus:ring-blue'}`}
                  placeholder="e.g. Daily Reciters"
                />
              </div>
              <div>
                <label className="block text-[12px] font-bold uppercase tracking-wider mb-2 opacity-70">Description</label>
                <textarea 
                  maxLength={200}
                  value={newRoomDesc}
                  onChange={(e) => setNewRoomDesc(e.target.value)}
                  className={`w-full p-3 rounded-xl font-bold outline-none resize-none h-24 ${isDark ? 'bg-[#0B1121] focus:ring-2 focus:ring-[#60E0C1]' : 'bg-gray3 focus:ring-2 focus:ring-blue'}`}
                  placeholder="What is this group about?"
                />
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="isPublic"
                  checked={newRoomPublic}
                  onChange={(e) => setNewRoomPublic(e.target.checked)}
                  className="w-5 h-5 rounded"
                />
                <label htmlFor="isPublic" className="font-bold text-[14px]">Make this room public</label>
              </div>
              <div className="flex gap-3 mt-4">
                <button 
                  type="button"
                  onClick={() => setIsCreatingRoom(false)}
                  className={`flex-1 py-3 rounded-2xl font-black uppercase text-[14px] ${isDark ? 'bg-[#202E45] text-white hover:bg-[#2A3F5C]' : 'bg-gray2 text-text hover:bg-gray1'}`}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className={`flex-1 py-3 rounded-2xl font-black uppercase text-[14px] ${isDark ? 'bg-[#60E0C1] text-[#0B1121]' : 'bg-blue text-white shadow-active hover:brightness-110'}`}
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
