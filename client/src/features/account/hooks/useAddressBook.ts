import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  fetchAddresses, createAddress, updateAddress, deleteAddress,
  type Address, type AddressInput,
} from "@/lib/api";
import type { AddressFieldsValue } from "@/types/api";

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

  // Client-side validation — mirrors the backend ShippingInfoDto rules (same
  // ones CreateAddressDto/UpdateAddressDto extend) so the user gets a friendly
  // message instead of a raw 400 from the API.
  function validateForm(): boolean {
    const name = form.recipient.trim();
    if (!/^[\p{L}][\p{L}\s.'-]{1,59}$/u.test(name)) {
      toast.error("Full name must contain letters only (no numbers).");
      return false;
    }
    if (!/^(0\d{9}|\+84\d{9})$/.test(form.phone.trim())) {
      toast.error("Phone must be a valid Vietnamese number, e.g. 0901234567.");
      return false;
    }
    const street = form.street.trim();
    if (street.length < 3 || !/^(?=.*\d)(?=.*\p{L}).*$/u.test(street)) {
      toast.error("Street address must include both a house number and a street name, e.g. 123 Nguyen Hue.");
      return false;
    }
    if (!form.ward.trim()) {
      toast.error("Please select your ward.");
      return false;
    }
    if (!form.city.trim()) {
      toast.error("Please select your city / province.");
      return false;
    }
    return true;
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;
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
