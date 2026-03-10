/**
 * Unified Application Service Layer
 *
 * Centralizes all module CRUD operations into a single interface.
 * Both UI components and the voice assistant use this layer,
 * ensuring consistent data handling across the entire application.
 *
 * Modules: Calendar, Shopping, Expenses, Plans
 *
 * This layer:
 * - Provides a single entry point for all data operations
 * - Enables cross-module operations (voice commands spanning multiple modules)
 * - Decouples business logic from UI components
 * - Supports future cross-module relationships
 */

import * as calendarApi from "../api/calendar";
import * as shoppingApi from "../api/shopping";
import * as expensesApi from "../api/expenses";
import * as plansApi from "../api/plans";

// ─── Module Registry ────────────────────────────────────────
// Maps action types to their module for cache invalidation

export const MODULE_CALENDAR = "calendar";
export const MODULE_SHOPPING = "shopping";
export const MODULE_EXPENSES = "expenses";
export const MODULE_PLANS = "plans";

export const ACTION_MODULE_MAP = {
  // Calendar
  add_event: MODULE_CALENDAR,
  update_event: MODULE_CALENDAR,
  delete_event: MODULE_CALENDAR,
  delete_all_events: MODULE_CALENDAR,
  list_events: MODULE_CALENDAR,
  // Shopping
  create_shopping_list: MODULE_SHOPPING,
  add_shopping_items: MODULE_SHOPPING,
  delete_shopping_items: MODULE_SHOPPING,
  check_shopping_items: MODULE_SHOPPING,
  uncheck_shopping_items: MODULE_SHOPPING,
  // Expenses
  add_expense: MODULE_EXPENSES,
  add_recurring_expense: MODULE_EXPENSES,
  delete_recurring_expense: MODULE_EXPENSES,
  set_budget: MODULE_EXPENSES,
  list_expenses: MODULE_EXPENSES,
  // Plans
  add_goal: MODULE_PLANS,
  update_goal: MODULE_PLANS,
  delete_goal: MODULE_PLANS,
  toggle_goal: MODULE_PLANS,
  add_bucket_item: MODULE_PLANS,
  delete_bucket_item: MODULE_PLANS,
  toggle_bucket_item: MODULE_PLANS,
  list_goals: MODULE_PLANS,
};

// ─── Query Keys (centralized) ───────────────────────────────
// Single source of truth for TanStack Query cache keys

export const QUERY_KEYS = {
  // Calendar
  events: ["events"],
  // Shopping
  shoppingLists: ["shopping-lists"],
  shoppingList: ["shopping-list"],
  shoppingCategories: ["shopping-categories"],
  // Expenses
  expenses: ["expenses"],
  expenseSummary: ["expense-summary"],
  expenseComparison: ["expense-comparison"],
  expenseBudget: ["expense-budget"],
  recurringExpenses: ["recurring-expenses"],
  expenseCategories: ["expense-categories"],
  householdMembers: ["household-members"],
  // Plans
  goals: ["goals"],
  goal: ["goal"],
  bucketItems: ["bucket-items"],
  plansSummary: ["plans-summary"],
};

// ─── Cache Invalidation Map ─────────────────────────────────
// Defines which query keys to invalidate per module

export const MODULE_INVALIDATION_KEYS = {
  [MODULE_CALENDAR]: [QUERY_KEYS.events],
  [MODULE_SHOPPING]: [QUERY_KEYS.shoppingLists, QUERY_KEYS.shoppingList],
  [MODULE_EXPENSES]: [
    QUERY_KEYS.expenses,
    QUERY_KEYS.expenseSummary,
    QUERY_KEYS.expenseComparison,
    QUERY_KEYS.expenseBudget,
    QUERY_KEYS.recurringExpenses,
    QUERY_KEYS.expenseCategories,
    QUERY_KEYS.householdMembers,
  ],
  [MODULE_PLANS]: [
    QUERY_KEYS.goals,
    QUERY_KEYS.goal,
    QUERY_KEYS.bucketItems,
    QUERY_KEYS.plansSummary,
  ],
};

// ─── Unified Invalidation ───────────────────────────────────

export async function invalidateModuleQueries(queryClient, modules) {
  const uniqueModules = [...new Set(modules)];
  const promises = [];
  for (const mod of uniqueModules) {
    const keys = MODULE_INVALIDATION_KEYS[mod];
    if (keys) {
      for (const key of keys) {
        promises.push(queryClient.invalidateQueries({ queryKey: key }));
      }
    }
  }
  await Promise.all(promises);
}

export function getModulesForActions(actions) {
  const modules = new Set();
  for (const action of actions) {
    const actionType = action.action_type || action.action;
    const mod = ACTION_MODULE_MAP[actionType];
    if (mod) modules.add(mod);
  }
  return [...modules];
}

// ─── Calendar Service ───────────────────────────────────────

export const calendar = {
  getEvents: (start, end) => calendarApi.getEvents(start, end),
  createEvent: (data) => calendarApi.createEvent(data),
  updateEvent: (id, data) => calendarApi.updateEvent(id, data),
  deleteEvent: (id) => calendarApi.deleteEvent(id),
};

// ─── Shopping Service ───────────────────────────────────────

export const shopping = {
  getLists: () => shoppingApi.getLists(),
  getList: (id) => shoppingApi.getList(id),
  createList: (data) => shoppingApi.createList(data),
  updateList: (id, data) => shoppingApi.updateList(id, data),
  deleteList: (id) => shoppingApi.deleteList(id),
  addItem: (listId, data) => shoppingApi.addItem(listId, data),
  updateItem: (id, data) => shoppingApi.updateItem(id, data),
  toggleItem: (id) => shoppingApi.toggleItem(id),
  deleteItem: (id) => shoppingApi.deleteItem(id),
  getCategories: () => shoppingApi.getCategories(),
  createCategory: (data) => shoppingApi.createCategory(data),
};

// ─── Expenses Service ───────────────────────────────────────

export const expenses = {
  getExpenses: (filters) => expensesApi.getExpenses(filters),
  createExpense: (data) => expensesApi.createExpense(data),
  updateExpense: (id, data) => expensesApi.updateExpense(id, data),
  deleteExpense: (id) => expensesApi.deleteExpense(id),
  getCategories: () => expensesApi.getExpenseCategories(),
  createCategory: (data) => expensesApi.createExpenseCategory(data),
  getMembers: () => expensesApi.getMembers(),
  createMember: (data) => expensesApi.createMember(data),
  updateMember: (id, data) => expensesApi.updateMember(id, data),
  deleteMember: (id) => expensesApi.deleteMember(id),
  getRecurring: () => expensesApi.getRecurring(),
  createRecurring: (data) => expensesApi.createRecurring(data),
  updateRecurring: (id, data) => expensesApi.updateRecurring(id, data),
  deleteRecurring: (id) => expensesApi.deleteRecurring(id),
  getBudget: (year, month) => expensesApi.getBudget(year, month),
  setBudget: (year, month, data) => expensesApi.setBudget(year, month, data),
  getSummary: (year, month) => expensesApi.getSummary(year, month),
  getComparison: (year, month) => expensesApi.getComparison(year, month),
};

// ─── Plans Service ──────────────────────────────────────────

export const plans = {
  getSummary: () => plansApi.getPlansSummary(),
  getGoals: () => plansApi.getGoals(),
  getGoal: (id) => plansApi.getGoal(id),
  createGoal: (data) => plansApi.createGoal(data),
  updateGoal: (id, data) => plansApi.updateGoal(id, data),
  deleteGoal: (id) => plansApi.deleteGoal(id),
  addMilestone: (goalId, data) => plansApi.addMilestone(goalId, data),
  updateMilestone: (id, data) => plansApi.updateMilestone(id, data),
  toggleMilestone: (id) => plansApi.toggleMilestone(id),
  deleteMilestone: (id) => plansApi.deleteMilestone(id),
  getBucketItems: () => plansApi.getBucketItems(),
  createBucketItem: (data) => plansApi.createBucketItem(data),
  updateBucketItem: (id, data) => plansApi.updateBucketItem(id, data),
  deleteBucketItem: (id) => plansApi.deleteBucketItem(id),
  toggleBucketItem: (id) => plansApi.toggleBucketItem(id),
};

// ─── Cross-module helpers ───────────────────────────────────

export function getActionLabel(actionType) {
  const labels = {
    add_event: "Dodaj wydarzenie",
    update_event: "Zmień wydarzenie",
    delete_event: "Usuń wydarzenie",
    delete_all_events: "Usuń wszystkie wydarzenia",
    list_events: "Pokaż wydarzenia",
    create_shopping_list: "Nowa lista zakupów",
    add_shopping_items: "Dodaj do listy",
    delete_shopping_items: "Usuń z listy",
    check_shopping_items: "Oznacz jako kupione",
    uncheck_shopping_items: "Odznacz produkty",
    add_expense: "Dodaj wydatek",
    add_recurring_expense: "Dodaj stały koszt",
    delete_recurring_expense: "Usuń stały koszt",
    set_budget: "Ustaw budżet",
    list_expenses: "Podsumowanie wydatków",
    add_goal: "Dodaj cel",
    update_goal: "Zmień cel",
    delete_goal: "Usuń cel",
    toggle_goal: "Zmień status celu",
    add_bucket_item: "Dodaj marzenie",
    delete_bucket_item: "Usuń marzenie",
    toggle_bucket_item: "Zmień status marzenia",
    list_goals: "Pokaż cele",
  };
  return labels[actionType] || "Nieznana akcja";
}

export function getModuleColor(mod) {
  const colors = {
    [MODULE_CALENDAR]: "sky",
    [MODULE_SHOPPING]: "sage",
    [MODULE_EXPENSES]: "peach",
    [MODULE_PLANS]: "rose",
  };
  return colors[mod] || "gray";
}

export function getModuleLabel(mod) {
  const labels = {
    [MODULE_CALENDAR]: "Kalendarz",
    [MODULE_SHOPPING]: "Zakupy",
    [MODULE_EXPENSES]: "Wydatki",
    [MODULE_PLANS]: "Plany",
  };
  return labels[mod] || mod;
}
