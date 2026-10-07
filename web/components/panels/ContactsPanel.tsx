"use client";

import { useCallback, useEffect, useState } from "react";
import { Users, UserPlus, RefreshCw, Loader2, Phone, Mail } from "lucide-react";
import { phoneGet, phonePost, phoneAsset, okOf, asArray } from "@/lib/api";
import { useApp } from "@/components/providers/AppProvider";
import PageTitle from "@/components/layout/PageTitle";
import { Loading, EmptyState, Modal } from "@/components/ui";

type Contact = { id: string; name: string; contactImg: string; emails: string[]; phones: string[] };

export default function ContactsPanel() {
  const { t } = useApp();
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
    (c) => c.name.toLowerCase().includes(query.toLowerCase()) || c.phones?.some((p) => p.includes(query))
  );

  return (
    <>
      <PageTitle
        icon="pe-7s-users"
        iconBg="bg-arielle-smile"
        title={t("nav.contacts")}
        subtitle={contacts ? `${contacts.length} contacts` : undefined}
        actions={
          <>
            <button className="btn btn-light me-2" onClick={load}>
              <RefreshCw size={16} />
            </button>
            <button className="btn btn-primary d-inline-flex align-items-center gap-2" onClick={() => setAdding(true)}>
              <UserPlus size={16} /> {t("common.add")}
            </button>
          </>
        }
      />

      <div className="mb-3">
        <input className="form-control" placeholder={t("contacts.search")} value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      {contacts === null ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Users size={28} />} title={t("contacts.none")} />
      ) : (
        <div className="row">
          {filtered.map((c) => (
            <div key={c.id} className="col-md-6 col-xl-4">
              <div className="card mb-3">
                <div className="card-body d-flex align-items-center gap-3">
                  <span className="rounded-circle bg-secondary text-white d-inline-flex align-items-center justify-content-center fw-bold overflow-hidden flex-shrink-0" style={{ width: 48, height: 48 }}>
                    {c.contactImg ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={phoneAsset("/" + c.contactImg)} alt="" className="w-100 h-100" style={{ objectFit: "cover" }} onError={(e) => (e.currentTarget.style.display = "none")} />
                    ) : (
                      c.name.charAt(0).toUpperCase()
                    )}
                  </span>
                  <div className="min-w-0">
                    <div className="fw-semibold text-truncate">{c.name}</div>
                    {c.phones?.map((p, i) => (
                      <div key={i} className="small text-muted d-flex align-items-center gap-1">
                        <Phone size={12} /> {p}
                      </div>
                    ))}
                    {c.emails?.map((e, i) => (
                      <div key={i} className="small text-muted d-flex align-items-center gap-1 text-truncate">
                        <Mail size={12} /> {e}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {adding && <AddContact onClose={() => setAdding(false)} onSaved={load} />}
    </>
  );
}

function AddContact({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { t, notify } = useApp();
  const [f, setF] = useState({ name: "", phone: "", cellphone: "", email: "" });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function save() {
    setBusy(true);
    const r = okOf(await phonePost("/datas/addressBook/create_contact.xhtml", f));
    setBusy(false);
    if (r.success) {
      notify("success", t("contacts.added"));
      onSaved();
      onClose();
    } else {
      notify("error", r.error || t("common.error"));
    }
  }

  return (
    <Modal
      title={t("contacts.new")}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-light" onClick={onClose}>
            {t("common.cancel")}
          </button>
          <button className="btn btn-primary d-inline-flex align-items-center gap-2" disabled={busy || !f.name || !f.phone} onClick={save}>
            {busy && <Loader2 size={16} className="mrd-spin" />}
            {t("common.save")}
          </button>
        </>
      }
    >
      <div className="d-flex flex-column gap-2">
        <input className="form-control" value={f.name} onChange={set("name")} placeholder={t("common.name")} />
        <input className="form-control" value={f.phone} onChange={set("phone")} placeholder={t("contacts.phone")} />
        <input className="form-control" value={f.cellphone} onChange={set("cellphone")} placeholder={t("contacts.mobile")} />
        <input className="form-control" value={f.email} onChange={set("email")} placeholder={t("contacts.email")} />
      </div>
    </Modal>
  );
}
