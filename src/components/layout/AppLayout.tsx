import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useStore } from '@/store/store';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const currentUserId = useStore((s) => s.currentUserId);

  if (!currentUserId) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-ink-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-64">
        <Topbar onMenu={() => setSidebarOpen(true)} />
        <main className="mx-auto max-w-[1400px] px-4 py-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
