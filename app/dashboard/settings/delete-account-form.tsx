// app/dashboard/settings/delete-account-form.tsx
"use client";

import { useState } from "react";
import { deleteAccountAction } from "./actions";

export default function DeleteAccountForm({ email }: { email: string }) {
  const [confirmText, setConfirmText] = useState("");
  const canDelete = confirmText === "DELETE";

  return (
    <form action={deleteAccountAction} className="mt-5 flex flex-col gap-3">
      <label className="text-[13px] font-medium">
        Type <span className="font-semibold">DELETE</span> to confirm
      </label>
      <input
        type="text"
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        placeholder="DELETE"
        className="rounded-md border border-(--line) px-3.5 py-2.5 text-[14.5px] outline-none focus:border-(--red) transition-colors bg-(--paper) max-w-60"
      />
      <button
        type="submit"
        disabled={!canDelete}
        className="rounded-md px-3.5 py-2.5 text-[14.5px] font-medium w-fit transition-opacity disabled:opacity-40 hover:opacity-90"
        style={{ background: "var(--red)", color: "var(--paper)" }}
      >
        {`Permanently delete ${email}`}
      </button>
    </form>
  );
}
