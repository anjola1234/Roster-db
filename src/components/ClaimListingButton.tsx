"use client";

import Link from "next/link";
import { useState } from "react";

type Props = {
  companySlug: string;
  signedIn: boolean;
  /** Set when this user already has a pending or approved claim on this listing. */
  existingStatus?: string | null;
};

export default function ClaimListingButton({ companySlug, signedIn, existingStatus }: Props) {
  const [open, setOpen] = useState(false);
  const [claimedRole, setClaimedRole] = useState("owner");
  const [proofMethod, setProofMethod] = useState("work_email");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");

  if (existingStatus === "approved") {
    return <span className="pill emerald">✔ You represent this listing</span>;
  }
  if (existingStatus === "pending" || state === "done") {
    return (
      <p className="admin-note" style={{ margin: 0 }}>
        Claim submitted — an admin will review it and may contact you to confirm.
      </p>
    );
  }

  if (!signedIn) {
    return (
      <Link className="btn btn-ghost" href="/login">
        Sign in to claim this listing
      </Link>
    );
  }

  if (!open) {
    return (
      <button className="btn btn-ghost" type="button" onClick={() => setOpen(true)}>
        Claim this listing
      </button>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    setError("");
    try {
      const res = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companySlug, claimedRole, proofMethod }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setState("idle");
        return;
      }
      setState("done");
    } catch {
      setError("Network error. Try again.");
      setState("idle");
    }
  }

  return (
    <form className="claim-form" onSubmit={submit}>
      <div className="field">
        <label htmlFor="claimedRole">Your relationship to this company</label>
        <select id="claimedRole" value={claimedRole} onChange={(e) => setClaimedRole(e.target.value)}>
          <option value="owner">Owner / founder</option>
          <option value="employee">Employee</option>
          <option value="agency">Agency acting for them</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="proofMethod">How can you prove it?</label>
        <select id="proofMethod" value={proofMethod} onChange={(e) => setProofMethod(e.target.value)}>
          <option value="work_email">A work email on the company domain</option>
          <option value="dns_txt">Adding a DNS TXT record</option>
          <option value="document">A registration or incorporation document</option>
          <option value="phone_callback">A callback to the phone number on our site</option>
        </select>
      </div>
      {error && <p className="form-msg err">{error}</p>}
      <div className="admin-actions-row">
        <button className="btn btn-primary" type="submit" disabled={state === "sending"}>
          {state === "sending" ? "Submitting…" : "Submit claim"}
        </button>
        <button className="btn btn-ghost" type="button" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </form>
  );
}
