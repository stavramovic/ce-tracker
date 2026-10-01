// app/dashboard/compliance/new/page.tsx
import Link from "next/link";
import { addComplianceItem } from "../actions";

export default function NewComplianceItemPage() {
  return (
    <main className="min-h-screen bg-(--paper)">
      <header className="border-b border-(--line)">
        <div className="max-w-180 mx-auto px-7 py-5">
          <Link
            href="/dashboard"
            className="text-[13.5px] text-(--muted) hover:text-(--ink) transition-colors"
          >
            ← Back to dashboard
          </Link>
        </div>
      </header>

      <div className="max-w-180 mx-auto px-7 py-10">
        <h1 className="font-serif-brand text-[26px] font-semibold mb-1">
          Add E&O policy or carrier appointment
        </h1>
        <p className="text-(--muted) text-[14.5px] mb-8">
          Track expiration dates for E&O insurance and carrier appointments
          alongside your licenses.
        </p>

        <form
          action={addComplianceItem}
          className="bg-(--card) border border-(--line) rounded-[10px] p-6 space-y-5"
        >
          <div>
            <label className="block text-[13.5px] font-medium mb-1.5">Type</label>
            <select
              name="item_type"
              required
              defaultValue="eo_insurance"
              className="w-full rounded-md border border-(--line) px-3 py-2.5 text-[14.5px] bg-(--paper)"
            >
              <option value="eo_insurance">E&O Insurance</option>
              <option value="carrier_appointment">Carrier Appointment</option>
            </select>
          </div>

          <div>
            <label className="block text-[13.5px] font-medium mb-1.5">Label</label>
            <input
              type="text"
              name="label"
              required
              placeholder="e.g. Travelers E&O Policy, or State Farm Appointment"
              className="w-full rounded-md border border-(--line) px-3 py-2.5 text-[14.5px] bg-(--paper)"
            />
          </div>

          <div>
            <label className="block text-[13.5px] font-medium mb-1.5">
              State (optional, leave blank if it applies nationwide)
            </label>
            <select
              name="state_code"
              defaultValue=""
              className="w-full rounded-md border border-(--line) px-3 py-2.5 text-[14.5px] bg-(--paper)"
            >
              <option value="">All states / not state-specific</option>
              <option value="CA">California</option>
              <option value="TX">Texas</option>
              <option value="FL">Florida</option>
              <option value="NY">New York</option>
              <option value="PA">Pennsylvania</option>
              <option value="IL">Illinois</option>
              <option value="OH">Ohio</option>
              <option value="GA">Georgia</option>
              <option value="NC">North Carolina</option>
              <option value="WA">Washington</option>
            </select>
          </div>

          <div>
            <label className="block text-[13.5px] font-medium mb-1.5">Expiration date</label>
            <input
              type="date"
              name="expiration_date"
              required
              className="w-full rounded-md border border-(--line) px-3 py-2.5 text-[14.5px] bg-(--paper)"
            />
          </div>

          <div>
            <label className="block text-[13.5px] font-medium mb-1.5">Document link (optional)</label>
            <input
              type="url"
              name="document_url"
              placeholder="https://..."
              className="w-full rounded-md border border-(--line) px-3 py-2.5 text-[14.5px] bg-(--paper)"
            />
          </div>

          <div>
            <label className="block text-[13.5px] font-medium mb-1.5">Notes (optional)</label>
            <textarea
              name="notes"
              rows={3}
              className="w-full rounded-md border border-(--line) px-3 py-2.5 text-[14.5px] bg-(--paper)"
            />
          </div>

          <button
            type="submit"
            className="rounded-md bg-(--ink) text-(--paper) px-4 py-2.5 text-[14px] font-medium hover:opacity-90 transition-opacity"
          >
            Save
          </button>
        </form>
      </div>
    </main>
  );
}