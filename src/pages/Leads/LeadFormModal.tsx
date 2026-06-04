import { useState } from 'react';
import { useStore } from '@/store/store';
import { useUsers } from '@/store/hooks';
import { Modal, Button, Input, Field, Select } from '@/components/ui';
import { toast } from '@/store/toastStore';
import type { Lead, LeadStatus } from '@/types';

const SOURCES = ['Meta Ads', 'Google Ads', 'LinkedIn', 'Webinar', 'Referral', 'Organic', 'Cold Outreach', 'YouTube', 'Direct'];
const SEGMENTS = ['Coaches', 'EdTech', 'SaaS Founders', 'Ecommerce', 'Agencies', 'Consultants'];
const STATUSES: LeadStatus[] = ['New', 'Contacted', 'Qualified', 'Booked', 'Call Completed', 'Proposal Sent', 'Won', 'Lost', 'Nurture', 'Ghosted'];

export function LeadFormModal({ lead, onClose }: { lead?: Lead; onClose: () => void }) {
  const { createLead, updateLead, db } = useStore();
  const users = useUsers();
  const isEdit = Boolean(lead);
  const [form, setForm] = useState({
    name: lead?.name ?? '', email: lead?.email ?? '', phone: lead?.phone ?? '',
    whatsapp_number: lead?.whatsapp_number ?? '', company: lead?.company ?? '',
    source: lead?.source ?? 'Meta Ads', campaign: lead?.campaign ?? '',
    segment: lead?.segment ?? 'Coaches', status: lead?.status ?? 'New',
    value: lead?.value ?? 0, assigned_user_id: lead?.assigned_user_id ?? users[0]?.id ?? '',
    utm_source: lead?.utm_source ?? '', utm_medium: lead?.utm_medium ?? '', utm_campaign: lead?.utm_campaign ?? '',
  });

  const set = (k: string, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    if (!form.name.trim()) return toast.error('Name required');
    // Duplicate detection by email or phone
    if (!isEdit) {
      const dup = db.leads.find((l) => (form.email && l.email === form.email) || (form.phone && l.phone === form.phone));
      if (dup) {
        toast.warning('Possible duplicate', `${dup.name} has the same email/phone`);
      }
    }
    if (isEdit && lead) {
      updateLead(lead.id, { ...form, status: form.status as LeadStatus, value: Number(form.value), whatsapp_number: form.whatsapp_number || form.phone });
      toast.success('Lead updated', form.name);
    } else {
      createLead({ ...form, status: form.status as LeadStatus, value: Number(form.value), whatsapp_number: form.whatsapp_number || form.phone });
    }
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? 'Edit Lead' : 'Add New Lead'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>{isEdit ? 'Save changes' : 'Create lead'}</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Full name"><Input value={form.name} onChange={(e) => set('name', e.target.value)} /></Field>
        <Field label="Company"><Input value={form.company} onChange={(e) => set('company', e.target.value)} /></Field>
        <Field label="Email"><Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} /></Field>
        <Field label="Phone"><Input value={form.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
        <Field label="WhatsApp number"><Input value={form.whatsapp_number} onChange={(e) => set('whatsapp_number', e.target.value)} placeholder="defaults to phone" /></Field>
        <Field label="Deal value (USD)"><Input type="number" value={form.value} onChange={(e) => set('value', e.target.value)} /></Field>
        <Field label="Source">
          <Select value={form.source} onChange={(e) => set('source', e.target.value)}>{SOURCES.map((s) => <option key={s}>{s}</option>)}</Select>
        </Field>
        <Field label="Segment">
          <Select value={form.segment} onChange={(e) => set('segment', e.target.value)}>{SEGMENTS.map((s) => <option key={s}>{s}</option>)}</Select>
        </Field>
        <Field label="Status">
          <Select value={form.status} onChange={(e) => set('status', e.target.value)}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</Select>
        </Field>
        <Field label="Assigned to">
          <Select value={form.assigned_user_id} onChange={(e) => set('assigned_user_id', e.target.value)}>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </Select>
        </Field>
        <Field label="Campaign"><Input value={form.campaign} onChange={(e) => set('campaign', e.target.value)} /></Field>
        <Field label="UTM Source"><Input value={form.utm_source} onChange={(e) => set('utm_source', e.target.value)} /></Field>
      </div>
    </Modal>
  );
}
