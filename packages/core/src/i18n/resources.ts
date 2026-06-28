// Explicit, build-tool-agnostic translation bundles. Replaces the Vite-only
// `import.meta.glob` so the same i18n setup works under Vite, Metro (RN), and
// Node. Add a namespace by dropping the JSON file in and adding two imports.
import enAiChat from './locales/en/aiChat.json';
import enAuth from './locales/en/auth.json';
import enBudgets from './locales/en/budgets.json';
import enCategories from './locales/en/categories.json';
import enCommon from './locales/en/common.json';
import enDashboard from './locales/en/dashboard.json';
import enEssentials from './locales/en/essentials.json';
import enExpenses from './locales/en/expenses.json';
import enFxRates from './locales/en/fxRates.json';
import enIncomes from './locales/en/incomes.json';
import enLegal from './locales/en/legal.json';

import idAiChat from './locales/id/aiChat.json';
import idAuth from './locales/id/auth.json';
import idBudgets from './locales/id/budgets.json';
import idCategories from './locales/id/categories.json';
import idCommon from './locales/id/common.json';
import idDashboard from './locales/id/dashboard.json';
import idEssentials from './locales/id/essentials.json';
import idExpenses from './locales/id/expenses.json';
import idFxRates from './locales/id/fxRates.json';
import idIncomes from './locales/id/incomes.json';
import idLegal from './locales/id/legal.json';

export const resources = {
  en: {
    aiChat: enAiChat,
    auth: enAuth,
    budgets: enBudgets,
    categories: enCategories,
    common: enCommon,
    dashboard: enDashboard,
    essentials: enEssentials,
    expenses: enExpenses,
    fxRates: enFxRates,
    incomes: enIncomes,
    legal: enLegal,
  },
  id: {
    aiChat: idAiChat,
    auth: idAuth,
    budgets: idBudgets,
    categories: idCategories,
    common: idCommon,
    dashboard: idDashboard,
    essentials: idEssentials,
    expenses: idExpenses,
    fxRates: idFxRates,
    incomes: idIncomes,
    legal: idLegal,
  },
} as const;
