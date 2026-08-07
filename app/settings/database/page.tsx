"use client";

import { useState, useEffect } from 'react';

export default function DatabaseTab() {
    const [doctors, setDoctors] = useState<any[]>([]);
    const [rooms, setRooms] = useState<any[]>([]);
    const [newDoc, setNewDoc] = useState({ name: '', specialty: '', availability: '' });
    const [newRoom, setNewRoom] = useState({ roomNumber: '', purpose: '', beds: 1, isOccupied: false });
    const [dbLoading, setDbLoading] = useState(false);

    useEffect(() => {
        fetchDbStats();
    }, []);

    const fetchDbStats = async () => {
        setDbLoading(true);
        try {
            const docRes = await fetch('/api/database/doctors');
            const docData = await docRes.json();
            if (docData.success) setDoctors(docData.data);
            
            const roomRes = await fetch('/api/database/rooms');
            const roomData = await roomRes.json();
            if (roomData.success) setRooms(roomData.data);
        } catch (e) {
            console.error("Failed to fetch DB:", e);
        }
        setDbLoading(false);
    };

    const addDoctor = async () => {
        if (!newDoc.name || !newDoc.specialty || !newDoc.availability) return;
        await fetch('/api/database/doctors', { method: 'POST', body: JSON.stringify(newDoc) });
        setNewDoc({ name: '', specialty: '', availability: '' });
        fetchDbStats();
    };

    const deleteDoctor = async (id: string) => {
        await fetch(`/api/database/doctors?id=${id}`, { method: 'DELETE' });
        fetchDbStats();
    };

    const addRoom = async () => {
        if (!newRoom.roomNumber || !newRoom.purpose) return;
        await fetch('/api/database/rooms', { method: 'POST', body: JSON.stringify(newRoom) });
        setNewRoom({ roomNumber: '', purpose: '', beds: 1, isOccupied: false });
        fetchDbStats();
    };

    const deleteRoom = async (id: string) => {
        await fetch(`/api/database/rooms?id=${id}`, { method: 'DELETE' });
        fetchDbStats();
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-cyan-400 uppercase tracking-widest font-bold mb-6 flex items-center gap-3 border-b border-cyan-500/30 pb-4 text-xl">
                Database Editor
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* DOCTORS TABLE */}
                <div className="border border-cyan-500/20 bg-slate-900/50 p-6 rounded relative overflow-hidden">
                    <h3 className="text-cyan-300 font-bold uppercase mb-4 sticky top-0 bg-slate-900 z-10 pb-2 border-b border-cyan-500/30">
                        Doctors
                    </h3>
                    <div className="space-y-3 mb-6 max-h-64 overflow-y-auto custom-scrollbar">
                        {dbLoading ? <p className="text-cyan-500/50">Loading...</p> : doctors.map((doc, i) => (
                            <div key={i} className="flex justify-between items-center p-3 border border-cyan-500/20 bg-black/40 rounded group hover:border-cyan-400/50 transition-all">
                                <div>
                                    <p className="font-bold text-cyan-200">{doc.name}</p>
                                    <p className="text-xs text-cyan-500/80">{doc.specialty} | <span className={doc.availability === 'Available' ? 'text-green-400' : 'text-yellow-400'}>{doc.availability}</span></p>
                                </div>
                                <button onClick={() => deleteDoctor(doc.id)} className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity p-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="pt-4 border-t border-cyan-500/30 space-y-2">
                        <input type="text" placeholder="Dr. Name" value={newDoc.name} onChange={e => setNewDoc({...newDoc, name: e.target.value})} className="w-full bg-black/50 border border-cyan-500/50 p-2 rounded text-cyan-100 text-sm focus:border-cyan-400 outline-none" />
                        <input type="text" placeholder="Specialty" value={newDoc.specialty} onChange={e => setNewDoc({...newDoc, specialty: e.target.value})} className="w-full bg-black/50 border border-cyan-500/50 p-2 rounded text-cyan-100 text-sm focus:border-cyan-400 outline-none" />
                        <select value={newDoc.availability} onChange={e => setNewDoc({...newDoc, availability: e.target.value})} className="w-full bg-black/50 border border-cyan-500/50 p-2 rounded text-cyan-100 text-sm focus:border-cyan-400 outline-none">
                            <option value="">Select Status</option>
                            <option value="Available">Available</option>
                            <option value="In Surgery">In Surgery</option>
                            <option value="Off Duty">Off Duty</option>
                        </select>
                        <button onClick={addDoctor} className="w-full bg-cyan-500/20 text-cyan-400 border border-cyan-400 py-2 rounded font-bold uppercase text-sm hover:bg-cyan-500/40">Add Doctor</button>
                    </div>
                </div>

                {/* ROOMS TABLE */}
                <div className="border border-cyan-500/20 bg-slate-900/50 p-6 rounded relative overflow-hidden">
                    <h3 className="text-cyan-300 font-bold uppercase mb-4 sticky top-0 bg-slate-900 z-10 pb-2 border-b border-cyan-500/30">
                        Rooms & Beds
                    </h3>
                    <div className="space-y-3 mb-6 max-h-64 overflow-y-auto custom-scrollbar">
                        {dbLoading ? <p className="text-cyan-500/50">Loading...</p> : rooms.map((room, i) => (
                            <div key={i} className="flex justify-between items-center p-3 border border-cyan-500/20 bg-black/40 rounded group hover:border-cyan-400/50 transition-all">
                                <div>
                                    <p className="font-bold text-cyan-200">Room {room.roomNumber}</p>
                                    <p className="text-xs text-cyan-500/80">{room.purpose} | {room.beds} Beds | <span className={room.isOccupied ? 'text-red-400' : 'text-green-400'}>{room.isOccupied ? 'Occupied' : 'Free'}</span></p>
                                </div>
                                <button onClick={() => deleteRoom(room.id)} className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity p-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="pt-4 border-t border-cyan-500/30 space-y-2">
                        <input type="text" placeholder="Room #" value={newRoom.roomNumber} onChange={e => setNewRoom({...newRoom, roomNumber: e.target.value})} className="w-full bg-black/50 border border-cyan-500/50 p-2 rounded text-cyan-100 text-sm focus:border-cyan-400 outline-none" />
                        <input type="text" placeholder="Purpose (e.g. ICU)" value={newRoom.purpose} onChange={e => setNewRoom({...newRoom, purpose: e.target.value})} className="w-full bg-black/50 border border-cyan-500/50 p-2 rounded text-cyan-100 text-sm focus:border-cyan-400 outline-none" />
                        <div className="flex gap-2">
                            <input type="number" min="1" placeholder="Beds" value={newRoom.beds} onChange={e => setNewRoom({...newRoom, beds: parseInt(e.target.value)||1})} className="w-1/2 bg-black/50 border border-cyan-500/50 p-2 rounded text-cyan-100 text-sm focus:border-cyan-400 outline-none" />
                            <label className="w-1/2 flex items-center justify-center gap-2 bg-black/50 border border-cyan-500/50 p-2 rounded text-cyan-100 text-sm cursor-pointer">
                                <input type="checkbox" checked={newRoom.isOccupied} onChange={e => setNewRoom({...newRoom, isOccupied: e.target.checked})} />
                                Occupied
                            </label>
                        </div>
                        <button onClick={addRoom} className="w-full bg-cyan-500/20 text-cyan-400 border border-cyan-400 py-2 rounded font-bold uppercase text-sm hover:bg-cyan-500/40">Add Room</button>
                    </div>
                </div>

            </div>
        </div>
    );
}
