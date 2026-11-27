"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function TicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Üldine abi");
  const [priority, setPriority] = useState("Normaalne");
  const [description, setDescription] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");

  const fetchTickets = async () => {
    const res = await fetch("/api/tickets");
    if (res.ok) {
      const data = await res.json();
      setTickets(Array.isArray(data) ? data : []);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, category, priority, description, evidenceUrl }),
    });
    if (res.ok) {
      setShowModal(false);
      setTitle("");
      setDescription("");
      setEvidenceUrl("");
      fetchTickets();
    }
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OOTEL":
        return <span className="px-3 py-1 text-xs rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">• Ootel</span>;
      case "KASUTAJA_VASTUS":
        return <span className="px-3 py-1 text-xs rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">• Sinu vastuse ootel</span>;
      case "ADMIN_VASTUS":
        return <span className="px-3 py-1 text-xs rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">• Admini vastuse ootel</span>;
      default:
        return <span className="px-3 py-1 text-xs rounded-full bg-red-500/10 text-red-400 border border-red-500/20">• Suletud</span>;
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto text-white">
      <div className="flex justify-between items-center mb-8">
        <div>
          <p className="text-xs uppercase tracking-wider text-zinc-400">KASUTAJATUGI</p>
          <h1 className="text-3xl font-bold mt-1">Minu ticketid</h1>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#e11d48] hover:bg-[#be123c] text-white font-medium px-5 py-2.5 rounded-xl transition"
        >
          + Uus ticket
        </button>
      </div>

      {/* Ticketite nimekiri */}
      <div className="bg-[#111216] border border-zinc-800/80 rounded-2xl p-5 space-y-3">
        {tickets.length === 0 ? (
          <p className="text-zinc-500 text-sm py-8 text-center">Sul pole veel ühtegi ticketit loodud.</p>
        ) : (
          tickets.map((t: any) => (
            <div
              key={t.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#16181d] border border-zinc-800/60 p-4 rounded-xl hover:border-zinc-700 transition"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2.5 py-0.5 rounded-md bg-zinc-800 text-zinc-300">{t.category}</span>
                  <h3 className="font-semibold text-white">{t.title}</h3>
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  Loodud: {new Date(t.createdAt).toLocaleDateString("et-EE")} • Autor: {t.user?.username}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {getStatusBadge(t.status)}
                <Link
                  href={`/tickets/${t.id}`}
                  className="px-4 py-1.5 text-xs font-medium bg-zinc-800 hover:bg-zinc-700 rounded-lg transition"
                >
                  Vaata
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Uue ticketi modaalaken */}
      {showModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#111216] border border-zinc-800 rounded-2xl max-w-lg w-full p-6">
            <h2 className="text-xl font-bold mb-4">Loo uus ticket</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Valdkond *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#181a20] border border-zinc-800 rounded-xl px-3 py-2.5 text-sm outline-none"
                  >
                    <option>Üldine abi</option>
                    <option>Mängija kaebus</option>
                    <option>Autod & Eritellimused</option>
                    <option>Annetused / Tebex</option>
                    <option>Bugi teatamine</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Prioriteet</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full bg-[#181a20] border border-zinc-800 rounded-xl px-3 py-2.5 text-sm outline-none"
                  >
                    <option>Madal</option>
                    <option>Normaalne</option>
                    <option>Kõrge</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">Pealkiri *</label>
                <input
                  type="text"
                  required
                  placeholder="Lühike kokkuvõte probleemist"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#181a20] border border-zinc-800 rounded-xl px-3 py-2.5 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">Kirjeldus *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Kirjelda olukorda võimalikult täpselt..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#181a20] border border-zinc-800 rounded-xl px-3 py-2.5 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">Video või pildi link (valikuline)</label>
                <input
                  type="url"
                  placeholder="https://medal.tv... või https://imgur.com..."
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  className="w-full bg-[#181a20] border border-zinc-800 rounded-xl px-3 py-2.5 text-sm outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-zinc-400 hover:text-white"
                >
                  Tühista
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#e11d48] hover:bg-[#be123c] px-5 py-2 rounded-xl text-sm font-medium"
                >
                  {loading ? "Saadan..." : "Esita ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
