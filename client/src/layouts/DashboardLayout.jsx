import React, { useState } from 'react';
import { Sidebar, Topbar } from '../components/dashboard';

export function DashboardLayout({
  role = 'user',
  navigation = [],
  activeTab,
  onTabChange,
  title,
  subtitle,
  userProfile,
  onSwitchRole,
  onBackToHome,
  searchValue,
  onSearchChange,
  children,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-800 antialiased font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        role={role}
        navigation={navigation}
        activeTab={activeTab}
        onTabChange={onTabChange}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userProfile={userProfile}
        onSwitchRole={onSwitchRole}
        onBackToHome={onBackToHome}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        {/* Sticky Topbar */}
        <Topbar
          title={title}
          subtitle={subtitle}
          role={role}
          onSwitchRole={onSwitchRole}
          onToggleSidebar={() => setSidebarOpen(true)}
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          onBackToHome={onBackToHome}
          userProfile={userProfile}
        />

        {/* Page View Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

