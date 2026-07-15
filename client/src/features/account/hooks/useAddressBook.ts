import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  fetchAddresses, createAddress, updateAddress, deleteAddress,
  type Address, type AddressInput,
} from "@/lib/api";
import type { AddressFieldsValue } from "@/components/ui/AddressFields";

const EMPTY_FORM: AddressFieldsValue & { label: string } = {
  label: "", recipient: "", phone: "", street: "", ward: "", city: "",
};

// Data/logic for the account Address Book tab — loading saved addresses,
// add/edit form state, save (create or update), delete, and set-default.
// The component only renders what this returns.
export function useAddressBook() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    fetchAddresses().then(setAddresses).catch(() => setAddresses([])).finally(() => setLoading(false));
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  }

  function openEdit(a: Address) {
    setEditingId(a.id);
    setForm({ label: a.label ?? "", recipient: a.recipient, phone: a.phone, street: a.street, ward: a.ward, city: a.city });
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: AddressInput = {
        recipient: form.recipient.trim(),
        phone: form.phone.trim(),
        street: form.street.trim(),
        ward: form.ward.trim(),
        city: form.city.trim(),
        ...(form.label.trim() ? { label: form.label.trim() } : {}),
      };
      if (editingId) {
        const updated = await updateAddress(editingId, payload);
        setAddresses((prev) => normalizeDefault(prev.map((a) => (a.id === updated.id ? updated : a)), updated));
        toast.success("Address updated");
      } else {
        const created = await createAddress(payload);
        setAddresses((prev) => normalizeDefault([...prev, created], created));
        toast.success("Address added");
      }
      closeForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save address");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this address?")) return;
    setBusyId(id);
    try {
      await deleteAddress(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      toast.success("Address deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete address");
    } finally {
      setBusyId(null);
    }
  }

  async function setDefault(id: string) {
    setBusyId(id);
    try {
      const updated = await updateAddress(id, { isDefault: true });
      setAddresses((prev) => normalizeDefault(prev, updated));
      toast.success("Default address updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update default address");
    } finally {
      setBusyId(null);
    }
  }

  return {
    addresses, loading, formOpen, editingId, form, setForm, saving, busyId,
    openCreate, openEdit, closeForm, save, remove, setDefault,
  };
}

// Mirrors the backend's "only one default at a time" rule in local state so
// the list re-renders correctly without waiting for a full refetch.
function normalizeDefault(list: Address[], justUpdated: Address): Address[] {
  if (!justUpdated.isDefault) return list;
  return list.map((a) => (a.id === justUpdated.id ? justUpdated : { ...a, isDefault: false }));
}
