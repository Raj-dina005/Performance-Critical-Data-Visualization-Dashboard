'use client'; // 👈 Add this line at the top

import dynamic from 'next/dynamic';
import React from 'react';

// DashboardShell uses client-side rendering (Canvas, hooks, etc.)
const DashboardShell = dynamic(() => import('../../components/DashboardShell'), {
  ssr: false, // disable server-side rendering for this component
});

export default function Page() {
  return <DashboardShell />;
}
