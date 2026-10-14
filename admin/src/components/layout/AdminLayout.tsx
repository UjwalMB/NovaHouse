import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import MobileSidebar from './MobileSidebar';
import { ToastProvider } from '../ui/Toast';

export default function AdminLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <ToastProvider>
      <div className="admin-shell">
        {/* Desktop Fixed Sidebar */}
        <div className="admin-sidebar-desktop">
          <Sidebar />
        </div>

        {/* Mobile Drawer */}
        <MobileSidebar
          isOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
        />

        {/* Main Content Wrap */}
        <div className="admin-main-wrap">
          <Topbar onToggleMobile={() => setMobileSidebarOpen(true)} />
          <main className="admin-content-area">
            <Outlet />
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
