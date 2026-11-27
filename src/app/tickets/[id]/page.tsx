"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [ticket, setTicket] = useState<any>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const loadTicket = async () => {
    const res = await fetch(`/api/tickets/${id}`);
    if (res.ok) setTicket(await res.json());
  };

  useEffect(() => {
    loadTicket();
  }, [id]);

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    const res = await fetch(`/api/tickets/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: reply }),
    });
    if (res.ok) {
      setReply("");
      loadTicket();
    }
    setSending(false);
  };

  const closeTicket = async () => {
    await fetch(`/api/tickets/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "CLOSE" }),
    });
    loadTicket();
  };

  if (!ticket) return <div className="p-6 text-zinc-400">Laen ticketit...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto text-white">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/tickets" className="text-sm text-zinc-400 hover:text-white">
          ← Tagasi ticketite juurde
        </Link>
        {ticket.status !== "SULETUD" && (
          <button
            onClick={closeTicket}
            className="px-4 py-1.5 text-xs bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/20"
          >
            Sulge ticket
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* VASAK VEERG: Info ja Vestlus */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#111216] border border-zinc-800/80 rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-4">Ticketi informatsioon</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-[11px] uppercase text-zinc-500">PRIORITEET</p>
                <span className="inline-block mt-1 px-2.5 py-0.5 text-xs rounded-md bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                  {ticket.priority}
                </span>
              </div>
              <div>
                <p className="text-[11px] uppercase text-zinc-500">VALDKOND</p>
                <span className="inline-block mt-1 px-2.5 py-0.5 text-xs rounded-md bg-zinc-800 text-zinc-300">
                  {ticket.category}
                </span>
              </div>
            </div>
            <div className="mb-4">
              <p className="text-[11px] uppercase text-zinc-500">PEALKIRI</p>
              <p className="font-semibold mt-1">{ticket.title}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase text-zinc-500">KIRJELDUS</p>
              <p className="text-sm text-zinc-300 mt-1 whitespace-pre-wrap">{ticket.description}</p>
            </div>
            {ticket.evidenceUrl && (
              <div className="mt-4 pt-4 border-t border-zinc-800/80">
                <p className="text-[11px] uppercase text-zinc-500">LISATUD TÕEND / LINK</p>
                <a
                  href={ticket.evidenceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-[#e11d48] hover:underline break-all"
                >
                  {ticket.evidenceUrl}
                </a>
              </div>
            )}
          </div>

          <div className="bg-[#111216] border border-zinc-800/80 rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-4">Vestlus</h2>
            <div className="space-y-4 mb-6">
              {ticket.messages.map((m: any) => (
                <div key={m.id} className="flex gap-3 bg-[#16181d] p-4 rounded-xl border border-zinc-800/50">
                  <img
                    src={m.user?.avatar || "/vercel.svg"}
                    alt=""
                    className="w-9 h-9 rounded-full object-cover bg-zinc-800"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{m.user?.username}</span>
                      {m.isStaff ? (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-400">Meeskond</span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">Kodanik</span>
                      )}
                    </div>
                    <p className="text-sm text-zinc-200 mt-1 whitespace-pre-wrap">{m.content}</p>
                    <p className="text-[11px] text-zinc-500 mt-2">
                      {new Date(m.createdAt).toLocaleString("et-EE")}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {ticket.status === "SULETUD" ? (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                ⊗ Sellele ticketile ei saa enam vastata, kuna see on suletud.
              </div>
            ) : (
              <form onSubmit={sendReply} className="flex gap-3">
                <input
                  type="text"
                  placeholder="Kirjuta vastus..."
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  className="flex-1 bg-[#181a20] border border-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none"
                />
                <button
                  type="submit"
                  disabled={sending}
                  className="bg-[#e11d48] hover:bg-[#be123c] px-5 py-2.5 rounded-xl text-sm font-medium"
                >
                  Saada
                </button>
              </form>
            )}
          </div>
        </div>

        {/* PAREM VEERG: Osalejad ja Ajajoon */}
        <div className="space-y-6">
          <div className="bg-[#111216] border border-zinc-800/80 rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-4">Osalejad</h2>
            <div className="flex items-center gap-3">
              <img
                src={ticket.user?.avatar || "/vercel.svg"}
                alt=""
                className="w-9 h-9 rounded-full bg-zinc-800"
              />
              <div>
                <span className="font-medium text-sm">{ticket.user?.username}</span>
                <span className="ml-2 text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">Looja</span>
              </div>
            </div>
          </div>

          <div className="bg-[#111216] border border-zinc-800/80 rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-1">Ajajoon</h2>
            <p className="text-[11px] uppercase text-zinc-500 mb-4">AJALUGU — TICKETI TEGEVUSED</p>
            <div className="space-y-4 border-l border-zinc-800 ml-2 pl-4">
              {ticket.logs.map((log: any) => (
                <div key={log.id} className="relative">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#e11d48] absolute -left-[21px] top-1.5" />
                  <p className="text-sm font-medium">{log.action}</p>
                  {log.details && <p className="text-xs text-zinc-400">{log.details}</p>}
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    {new Date(log.createdAt).toLocaleString("et-EE")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
