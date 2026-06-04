import { useState } from 'react';
import { Plus, ChevronLeft, ChevronRight, Trash2, GripVertical } from 'lucide-react';
import { useStore } from '@/store/store';
import { useDb, useSettings, useUsers, userName } from '@/store/hooks';
import { PageHeader, Card, Badge, Button, Avatar, Select, Modal, Field, Input, cn } from '@/components/ui';
import { KpiCard } from '@/components/ui/KpiCard';
import { formatCurrency, formatCompact } from '@/utils/formatters';
import { toast } from '@/store/toastStore';
import type { Deal, PipelineStageId } from '@/types';

export function Pipeline() {
  const { db, tenantId } = useDb();
  const settings = useSettings();
  const users = useUsers();
  const { moveDealStage, deleteDeal, createDeal } = useStore();

  const stages = settings.pipeline_stages;
  const allDeals = db.deals.filter((d) => d.tenant_id === tenantId);
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [dragId, setDragId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const deals = allDeals.filter((d) => ownerFilter === 'all' || d.assigned_user_id === ownerFilter);

  const won = allDeals.filter((d) => d.stage === 'won');
  const lost = allDeals.filter((d) => d.stage === 'lost');
  const openValue = allDeals.filter((d) => !['won', 'lost'].includes(d.stage)).reduce((s, d) => s + d.value, 0);
  const wonValue = won.reduce((s, d) => s + d.value, 0);

  const onDrop = (stage: PipelineStageId) => {
    if (dragId) {
      const deal = allDeals.find((d) => d.id === dragId);
      if (deal && deal.stage !== stage) moveDealStage(dragId, stage);
      setDragId(null);
    }
  };

  const leadsWithoutClosedDeals = db.leads.filter((l) => l.tenant_id === tenantId && !l.archived);
  const [form, setForm] = useState({ lead_id: leadsWithoutClosedDeals[0]?.id ?? '', value: 5000, stage: 'new_lead' as PipelineStageId });
  const addDeal = () => {
    const lead = db.leads.find((l) => l.id === form.lead_id);
    if (!lead) return toast.error('Select a lead');
    createDeal({ lead_id: lead.id, title: `${lead.company || lead.name} — Revenue OS`, value: Number(form.value), stage: form.stage, source: lead.source, campaign: lead.campaign, assigned_user_id: lead.assigned_user_id });
    setShowAdd(false);
  };

  return (
    <div>
      <PageHeader
        title="Pipeline"
        description="Drag deals between stages — every move updates the lead, timeline & attribution."
        breadcrumb={['Revenue', 'Pipeline']}
        actions={
          <>
            <Select value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)} className="w-auto">
              <option value="all">All owners</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </Select>
            <Button onClick={() => setShowAdd(true)}><Plus size={16} /> Add Deal</Button>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Open pipeline" value={formatCompact(openValue)} icon={<GripVertical size={18} />} accent="#6366f1" />
        <KpiCard label="Won value" value={formatCompact(wonValue)} icon={<GripVertical size={18} />} accent="#10b981" />
        <KpiCard label="Win rate" value={`${won.length + lost.length ? Math.round((won.length / (won.length + lost.length)) * 100) : 0}%`} icon={<GripVertical size={18} />} accent="#f59e0b" />
        <KpiCard label="Active deals" value={allDeals.filter((d) => !['won', 'lost'].includes(d.stage)).length} icon={<GripVertical size={18} />} accent="#06b6d4" />
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const stageDeals = deals.filter((d) => d.stage === stage.id);
          const stageValue = stageDeals.reduce((s, d) => s + d.value, 0);
          return (
            <div
              key={stage.id}
              className="flex w-72 shrink-0 flex-col rounded-xl bg-ink-100/60"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(stage.id)}
            >
              <div className="flex items-center justify-between px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: stage.color }} />
                  <span className="text-sm font-semibold text-ink-800">{stage.name}</span>
                  <span className="rounded-full bg-white px-1.5 text-xs font-medium text-ink-500">{stageDeals.length}</span>
                </div>
                <span className="text-xs font-medium text-ink-400">{formatCompact(stageValue)}</span>
              </div>
              <div className="flex-1 space-y-2 px-2 pb-2">
                {stageDeals.map((d) => (
                  <DealCard key={d.id} deal={d} stages={stages} onDragStart={() => setDragId(d.id)} onMove={moveDealStage} onDelete={deleteDeal} db={db} />
                ))}
                {stageDeals.length === 0 && <div className="rounded-lg border border-dashed border-ink-300 py-6 text-center text-xs text-ink-400">Drop deals here</div>}
              </div>
            </div>
          );
        })}
      </div>

      {showAdd && (
        <Modal open onClose={() => setShowAdd(false)} title="Add Deal" footer={<><Button variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button><Button onClick={addDeal}>Create deal</Button></>}>
          <div className="space-y-4">
            <Field label="Lead"><Select value={form.lead_id} onChange={(e) => setForm({ ...form, lead_id: e.target.value })}>{leadsWithoutClosedDeals.map((l) => <option key={l.id} value={l.id}>{l.name} — {l.company}</option>)}</Select></Field>
            <Field label="Deal value (USD)"><Input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} /></Field>
            <Field label="Stage"><Select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value as PipelineStageId })}>{settings.pipeline_stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field>
          </div>
        </Modal>
      )}
    </div>
  );
}

function DealCard({ deal, stages, onDragStart, onMove, onDelete, db }: {
  deal: Deal; stages: { id: PipelineStageId; name: string }[]; onDragStart: () => void;
  onMove: (id: string, s: PipelineStageId) => void; onDelete: (id: string) => void; db: ReturnType<typeof useDb>['db'];
}) {
  const lead = db.leads.find((l) => l.id === deal.lead_id);
  const idx = stages.findIndex((s) => s.id === deal.stage);
  return (
    <div draggable onDragStart={onDragStart} className="card group cursor-grab p-3 active:cursor-grabbing">
      <div className="flex items-start justify-between">
        <p className="text-sm font-semibold text-ink-900">{deal.title}</p>
        <button onClick={() => onDelete(deal.id)} className="text-ink-300 opacity-0 transition hover:text-red-500 group-hover:opacity-100"><Trash2 size={13} /></button>
      </div>
      <p className="mt-0.5 text-xs text-ink-500">{lead?.name}</p>
      <div className="mt-2 flex items-center justify-between">
        <Badge tone="green">{formatCurrency(deal.value)}</Badge>
        <span className="text-xs text-ink-400">{deal.probability}%</span>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Avatar name={userName(db, deal.assigned_user_id)} size={20} color="#8b5cf6" />
          <span className="text-[11px] text-ink-500">{deal.source}</span>
        </div>
        <div className="flex gap-0.5 opacity-0 transition group-hover:opacity-100">
          <button disabled={idx <= 0} onClick={() => onMove(deal.id, stages[idx - 1].id)} className="rounded p-1 text-ink-400 hover:bg-ink-100 disabled:opacity-30"><ChevronLeft size={14} /></button>
          <button disabled={idx >= stages.length - 1} onClick={() => onMove(deal.id, stages[idx + 1].id)} className="rounded p-1 text-ink-400 hover:bg-ink-100 disabled:opacity-30"><ChevronRight size={14} /></button>
        </div>
      </div>
    </div>
  );
}
