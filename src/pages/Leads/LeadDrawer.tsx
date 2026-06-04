import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { Sparkles, MessageCircle, CalendarPlus, CreditCard, Plus } from 'lucide-react';
import { useStore } from '@/store/store';
import { useDb, userName } from '@/store/hooks';
import { Drawer, Badge, StatusBadge, Button, Avatar, Field, Textarea } from '@/components/ui';
import { buildTimeline, recommendedNextAction } from '@/utils/calculations';
import { formatCurrency, formatDateTime, timeAgo } from '@/utils/formatters';
import type { Lead } from '@/types';

function TIcon({ name }: { name: string }) {
  const map: Record<string, string> = {
    'user-plus': 'UserPlus', activity: 'Activity', 'message-circle': 'MessageCircle',
    calendar: 'Calendar', phone: 'Phone', 'dollar-sign': 'DollarSign', 'git-branch': 'GitBranch',
  };
  const C = (Icons as unknown as Record<string, React.FC<{ size?: number }>>)[map[name] || 'Activity'];
  return C ? <C size={13} /> : <Icons.Activity size={13} />;
}

export function LeadDrawer({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const navigate = useNavigate();
  const { db } = useDb();
  const { updateLead, createBooking, createPayment } = useStore();
  const [note, setNote] = useState('');

  const timeline = buildTimeline(db, lead.id);
  const messages = db.messages.filter((m) => m.lead_id === lead.id);
  const deals = db.deals.filter((d) => d.lead_id === lead.id);
  const leadBookings = db.bookings.filter((b) => b.lead_id === lead.id);
  const calls = db.calls.filter((c) => c.lead_id === lead.id);
  const payments = db.payments.filter((p) => p.lead_id === lead.id);
  const tempTone = lead.lead_temperature === 'Hot' ? 'red' : lead.lead_temperature === 'Warm' ? 'amber' : 'gray';

  const addNote = () => {
    if (!note.trim()) return;
    updateLead(lead.id, { notes: `${lead.notes ? lead.notes + '\n' : ''}${note}` });
    setNote('');
  };

  return (
    <Drawer open onClose={onClose} title="Lead Details" width="max-w-2xl">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Avatar name={lead.name} color="#6366f1" size={48} />
        <div className="flex-1">
          <h3 className="text-lg font-bold text-ink-900">{lead.name}</h3>
          <p className="text-sm text-ink-500">{lead.company || '—'} · {lead.email}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <StatusBadge status={lead.status} />
            <Badge tone={tempTone}>{lead.lead_temperature}</Badge>
            <Badge tone="blue">Score {lead.qualification_score}/10</Badge>
            {lead.opt_out_status && <Badge tone="red">Opted out</Badge>}
            <Badge tone="gray">{lead.segment}</Badge>
          </div>
        </div>
      </div>

      {/* Recommended next action */}
      <div className="mt-4 flex items-start gap-3 rounded-xl border border-brand-200 bg-brand-50 p-3.5">
        <Sparkles size={18} className="mt-0.5 shrink-0 text-brand-600" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Recommended Next Action</p>
          <p className="text-sm font-medium text-ink-800">{recommendedNextAction(lead)}</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Button variant="secondary" className="flex-col !py-3 text-xs" onClick={() => navigate('/whatsapp')}>
          <MessageCircle size={18} /> WhatsApp
        </Button>
        <Button variant="secondary" className="flex-col !py-3 text-xs" onClick={() => navigate('/qualification')}>
          <Sparkles size={18} /> Qualify
        </Button>
        <Button variant="secondary" className="flex-col !py-3 text-xs" onClick={() => { createBooking({ lead_id: lead.id, source: lead.source, campaign: lead.campaign, meeting_date: new Date(Date.now() + 2 * 86400000).toISOString() }); }}>
          <CalendarPlus size={18} /> Book Call
        </Button>
        <Button variant="secondary" className="flex-col !py-3 text-xs" onClick={() => { createPayment({ lead_id: lead.id, amount: lead.value || 5000, source: lead.source, campaign: lead.campaign }); }}>
          <CreditCard size={18} /> Payment
        </Button>
      </div>

      {/* Source / UTM */}
      <Section title="Source & Attribution">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
          <Info label="Source" value={lead.source} />
          <Info label="Medium" value={lead.medium} />
          <Info label="Campaign" value={lead.campaign || '—'} />
          <Info label="UTM Source" value={lead.utm_source || '—'} />
          <Info label="UTM Medium" value={lead.utm_medium || '—'} />
          <Info label="UTM Campaign" value={lead.utm_campaign || '—'} />
          <Info label="UTM Content" value={lead.utm_content || '—'} />
          <Info label="UTM Term" value={lead.utm_term || '—'} />
          <Info label="Owner" value={userName(db, lead.assigned_user_id)} />
        </div>
      </Section>

      {/* Linked records */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Deals" value={deals.length} />
        <Stat label="Bookings" value={leadBookings.length} />
        <Stat label="Calls" value={calls.length} />
        <Stat label="Payments" value={payments.length} />
      </div>

      {/* WhatsApp messages */}
      {messages.length > 0 && (
        <Section title={`WhatsApp Messages (${messages.length})`}>
          <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg bg-ink-50 p-3">
            {messages.slice(-6).map((m) => (
              <div key={m.id} className={`flex ${m.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-3 py-1.5 text-sm ${m.direction === 'outbound' ? 'bg-brand-600 text-white' : 'bg-white text-ink-800 shadow-sm'}`}>
                  {m.body}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Notes */}
      <Section title="Notes">
        {lead.notes && <p className="mb-2 whitespace-pre-line rounded-lg bg-ink-50 p-3 text-sm text-ink-700">{lead.notes}</p>}
        <Field label="Add a note">
          <div className="flex gap-2">
            <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Type a note…" />
            <Button onClick={addNote} className="self-end"><Plus size={16} /></Button>
          </div>
        </Field>
      </Section>

      {/* Timeline */}
      <Section title="Activity Timeline">
        <div className="relative space-y-3 pl-6">
          <span className="absolute left-2 top-1 h-[calc(100%-1rem)] w-px bg-ink-200" />
          {timeline.map((t) => (
            <div key={t.id} className="relative">
              <span className="absolute -left-[1.4rem] top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-100 text-brand-600 ring-2 ring-white">
                <TIcon name={t.icon} />
              </span>
              <p className="text-sm font-medium text-ink-800">{t.title}</p>
              <p className="text-xs text-ink-500">{t.description}</p>
              <p className="text-[11px] text-ink-400">{formatDateTime(t.at)} · {timeAgo(t.at)}</p>
            </div>
          ))}
          {!timeline.length && <p className="text-sm text-ink-400">No activity yet.</p>}
        </div>
      </Section>

      <div className="mt-6 flex items-center justify-between text-xs text-ink-400">
        <span>Value: {formatCurrency(lead.value)}</span>
        <span>Last contacted: {timeAgo(lead.last_contacted_at)}</span>
      </div>
    </Drawer>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-400">{title}</h4>
      {children}
    </div>
  );
}
function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-ink-400">{label}</p>
      <p className="font-medium text-ink-800">{value}</p>
    </div>
  );
}
function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-ink-100 p-2.5 text-center">
      <p className="text-lg font-bold text-ink-900">{value}</p>
      <p className="text-xs text-ink-500">{label}</p>
    </div>
  );
}
