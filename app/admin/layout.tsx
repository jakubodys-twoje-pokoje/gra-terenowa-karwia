'use client';

import { useEffect } from 'react';

function AdminBodySetup() {
  useEffect(() => {
    document.documentElement.setAttribute('data-admin', '');
    return () => document.documentElement.removeAttribute('data-admin');
  }, []);
  return null;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AdminBodySetup />
      {children}
    </>
  );
}
