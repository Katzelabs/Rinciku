import { createDashboardApi } from '@rinciku/domain/dashboard';

import { supabase } from '@/lib/supabase';

// Shared aggregation layer (@rinciku/domain) bound to the mobile Supabase
// client. Only the current-cycle summary is portable today; the filterable
// analytics charts are web-only (deferred per the M7 plan).
const api = createDashboardApi(supabase);

export const { getMonthlySummary } = api;

export type { DashboardApi } from '@rinciku/domain/dashboard';
