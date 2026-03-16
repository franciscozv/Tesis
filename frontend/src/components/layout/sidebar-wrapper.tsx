'use client';

import { Sidebar } from './sidebar';

export function SidebarWrapper() {
  return (
    <div className="hidden lg:flex shrink-0 overflow-hidden">
      <Sidebar className="h-full" />
    </div>
  );
}
