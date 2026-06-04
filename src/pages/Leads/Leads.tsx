import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Download, Pencil, Archive, ExternalLink, Filter } from 'lucide-react';
import { useStore } from '@/store/store';
import { useDb, userName } from '@/store/hooks';
import {
  PageHeader, Button, Card, Table, Th, Td, Tr, Badge, StatusBadge, Avatar,
  SearchInput, Select, EmptyState,
} from '@/components/ui';
import { LeadFormModal } from './LeadFormModal';
import { LeadDrawer } from './LeadDrawer';
import { exportToCSV } from '@/utils/csvExport';
import { formatCurrency, timeAgo } from '@/utils/formatters';
import type { Lead } from '@/types';

export function Leads() {
  const [params] = useSearchParams();
  const { db, tenantId } = useDb();
  const archiveLead = useStore((s) => s.archiveLead);

  const [q, setQ] = useState(params.get('q') ?? '');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tempFilter, setTempFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [detailLead, setDetailLead] = useState<Lead | null>(null);

  const allLeads = db.leads.filter((l) => l.tenant_id === tenantId && !l.archived);
  const sources = useMemo(() => Array.from(new Set(allLeads.map((l) => l.source))), [allLeads]);

  const filtered = allLeads.filter((l) => {
    if (q && !`${l.name} ${l.email} ${l.company} ${l.phone}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (statusFilter !== 'all' && l.status !== statusFilter) return false;
    if (tempFilter !== 'all' && l.lead_temperature !== tempFilter) return false;
    if (sourceFilter !== 'all' && l.source !== sourceFilter) return false;
    return true;
  });

  // keep the live version of the detail lead
  const liveDetail = detailLead ? db.leads.find((l) => l.id === detailLead.id) ?? null : null;

  const exportCsv = () => {
    exportToCSV('leads', filtered.map((l) => ({
      Name: l.name, Email: l.email, Phone: l.phone, Company: l.company, Source: l.source,
      Campaign: l.campaign, Status: l.status, Temperature: l.lead_temperature, Score: l.qualification_score,
      Value: l.value, Owner: userName(db, l.assigned_user_id), Created: l.created_at,
    })));
  };

  return (
    <div>
      <PageHeader
        title="Leads"
        description={`${allLeads.length} leads · ${allLeads.filter((l) => l.lead_temperature === 'Hot').length} hot`}
        breadcrumb={['Revenue', 'Leads']}
        actions={
          <>
            <Button variant="secondary" onClick={exportCsv}><Download size={16} /> Export CSV</Button>
            <Button onClick={() => setShowAdd(true)}><Plus size={16} /> Add Lead</Button>
          </>
        }
      />

      <Card className="mb-4 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="min-w-[220px] flex-1"><SearchInput value={q} onChange={setQ} placeholder="Search name, email, company…" /></div>
          <Filter size={15} className="text-ink-400" />
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-auto">
            <option value="all">All statuses</option>
            {['New', 'Contacted', 'Qualified', 'Booked', 'Call Completed', 'Proposal Sent', 'Won', 'Lost', 'Nurture', 'Ghosted'].map((s) => <option key={s}>{s}</option>)}
          </Select>
          <Select value={tempFilter} onChange={(e) => setTempFilter(e.target.value)} className="w-auto">
            <option value="all">All temps</option>
            <option>Hot</option><option>Warm</option><option>Cold</option>
          </Select>
          <Select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="w-auto">
            <option value="all">All sources</option>
            {sources.map((s) => <option key={s}>{s}</option>)}
          </Select>
        </div>
      </Card>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState title="No leads match your filters" description="Try adjusting the search or filters, or add a new lead." action={<Button onClick={() => setShowAdd(true)}><Plus size={16} /> Add Lead</Button>} />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Lead</Th><Th>Status</Th><Th>Temp</Th><Th>Score</Th><Th>Source</Th>
                <Th>Owner</Th><Th>Value</Th><Th>Last contact</Th><Th></Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <Tr key={l.id} onClick={() => setDetailLead(l)}>
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={l.name} color="#6366f1" size={32} />
                      <div>
                        <p className="font-semibold text-ink-900">{l.name}</p>
                        <p className="text-xs text-ink-500">{l.company || l.email}</p>
                      </div>
                    </div>
                  </Td>
                  <Td><StatusBadge status={l.status} /></Td>
                  <Td><Badge tone={l.lead_temperature === 'Hot' ? 'red' : l.lead_temperature === 'Warm' ? 'amber' : 'gray'}>{l.lead_temperature}</Badge></Td>
                  <Td><span className="font-semibold">{l.qualification_score}</span><span className="text-ink-400">/10</span></Td>
                  <Td>{l.source}{l.opt_out_status && <Badge tone="red" className="ml-1">opt-out</Badge>}</Td>
                  <Td>{userName(db, l.assigned_user_id)}</Td>
                  <Td className="font-medium">{formatCurrency(l.value)}</Td>
                  <Td className="text-ink-500">{timeAgo(l.last_contacted_at)}</Td>
                  <Td>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => setDetailLead(l)} className="rounded p-1.5 text-ink-400 hover:bg-ink-100 hover:text-brand-600" title="Open"><ExternalLink size={15} /></button>
                      <button onClick={() => setEditLead(l)} className="rounded p-1.5 text-ink-400 hover:bg-ink-100 hover:text-brand-600" title="Edit"><Pencil size={15} /></button>
                      <button onClick={() => archiveLead(l.id)} className="rounded p-1.5 text-ink-400 hover:bg-ink-100 hover:text-red-600" title="Archive"><Archive size={15} /></button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      {showAdd && <LeadFormModal onClose={() => setShowAdd(false)} />}
      {editLead && <LeadFormModal lead={editLead} onClose={() => setEditLead(null)} />}
      {liveDetail && <LeadDrawer lead={liveDetail} onClose={() => setDetailLead(null)} />}
    </div>
  );
}
