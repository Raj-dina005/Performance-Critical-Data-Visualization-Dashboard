Update components/DashboardShell.tsx to import the same type (optional but recommended)

If DashboardShell or other components declare a DataPoint type, make them import the shared one. Replace the top of components/DashboardShell.tsx with this import (or ensure it uses the same type):

// at top of components/DashboardShell.tsx
import type { DataPoint } from '../lib/types';  // adjust path if needed