"use client";

import { useCallback, useEffect, useState } from "react";
import { Users, UserPlus, RefreshCw, Loader2, X } from "lucide-react";
import { phoneGet, phonePost, phoneAsset, okOf, asArray } from "@/lib/api";
import { Loading, EmptyState } from "@/components/ui";

type Contact = {
  id: string;
  name: string;
  contactImg: string;
  emails: string[];
  phones: string[];
};

export default function ContactsPanel() {
  const [contacts, setContacts] = useState<Contact[] | null>(null);
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setContacts(null);
    setContacts(asArray<Contact>(await phoneGet("/datas/addressBook/contacts.xhtml")));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = (contacts ?? []).filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.phones?.some((p) => p.includes(query))
  );

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un contact…"
          className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm outline-none focus:border-[var(--accent)]"
        />
        <button onClick={load} className="rounded-lg border border-slate-200 bg-white p-2.5 text-slate-500 hover:bg-slate-100">
          <RefreshCw size={16} />
        </button>
        <button
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-dark)]"
        >
          <UserPlus size={16} /> Ajouter
        </button>
      </div>

      {contacts === null ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Users size={28} />} title="Aucun contact" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <div key={c.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200 font-semibold text-slate-500">
                {c.contactImg ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={phoneAsset("/" + c.contactImg)}
                    alt=""
                    className="h-full w-full object-cover"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                ) : (
                  c.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-800">{c.name}</p>
                {c.phones?.map((p, i) => (
                  <p key={i} className="truncate text-sm text-slate-500">
                    {p}
                  </p>
                ))}
                {c.emails?.map((e, i) => (
                  <p key={i} className="truncate text-xs text-slate-400">
                    {e}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {adding && <AddContact onClose={() => setAdding(false)} onSaved={load} />}
    </div>
  );
}

function AddContact({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({ name: "", phone: "", cellphone: "", email: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function save() {
    setBusy(true);
    setErr(null);
    const r = okOf(await phonePost("/datas/addressBook/create_contact.xhtml", f));
    setBusy(false);
    if (r.success) {
      onSaved();
      onClose();
    } else setErr(r.error || "Échec de l'ajout");
  }

  const inputCls =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--accent)]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="mrd-fade w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-800">Nouveau contact</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-3 px-6 py-5">
          <input value={f.name} onChange={set("name")} placeholder="Nom" className={inputCls} />
          <input value={f.phone} onChange={set("phone")} placeholder="Téléphone" className={inputCls} />
          <input value={f.cellphone} onChange={set("cellphone")} placeholder="Mobile (optionnel)" className={inputCls} />
          <input value={f.email} onChange={set("email")} placeholder="E-mail (optionnel)" className={inputCls} />
          {err && <p className="text-sm text-red-600">{err}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
            Annuler
          </button>
          <button
            onClick={save}
            disabled={busy || !f.name || !f.phone}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-5 py-2 text-sm font-medium text-white hover:bg-[var(--accent-dark)] disabled:opacity-50"
          >
            {busy && <Loader2 size={16} className="mrd-spin" />}
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
