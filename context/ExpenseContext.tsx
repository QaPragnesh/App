import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useWorkspace } from './WorkspaceContext';

export type Expense = {
  id: string;
  date: string; // ISO string
  category: string;
  description: string;
  amount: number;
  workspace_id?: string;
  added_by?: string;
};

type ExpenseContextType = {
  expenses: Expense[];
  monthlyBudget: number;
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  setMonthlyBudget: (budget: number) => Promise<{ ok: boolean; error?: string }>;
  loading: boolean;
  refreshExpenses: () => Promise<void>;
};

export const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

const budgetKey = (workspaceId: string) => `@budget_${workspaceId}`;
const expensesKey = (workspaceId: string) => `@expenses_${workspaceId}`;

export const ExpenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [monthlyBudget, setMonthlyBudgetState] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const { workspace, displayName } = useWorkspace();

  useEffect(() => {
    if (workspace?.id) {
      loadData(workspace.id);
    } else {
      setExpenses([]);
      setMonthlyBudgetState(0);
      setLoading(false);
    }
  }, [workspace?.id]);

  const refreshExpenses = async () => {
    if (workspace?.id) {
      await loadData(workspace.id);
    }
  };

  const loadData = async (workspaceId: string) => {
    try {
      setLoading(true);
      setMonthlyBudgetState(0);
      setExpenses([]);

      const { data: budgetData, error: budgetError } = await supabase
        .from('budgets')
        .select('amount')
        .eq('workspace_id', workspaceId)
        .maybeSingle();

      if (!budgetError && budgetData) {
        setMonthlyBudgetState(Number(budgetData.amount));
        await AsyncStorage.setItem(budgetKey(workspaceId), String(budgetData.amount));
      } else {
        const storedBudget = await AsyncStorage.getItem(budgetKey(workspaceId));
        if (storedBudget) setMonthlyBudgetState(Number(storedBudget));
      }

      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('date', { ascending: false });

      if (error) {
        console.warn('Supabase fetch error, falling back to local storage:', error.message);
        const storedExpenses = await AsyncStorage.getItem(expensesKey(workspaceId));
        if (storedExpenses) {
          const parsed: Expense[] = JSON.parse(storedExpenses);
          setExpenses(parsed.filter((e) => e.workspace_id === workspaceId || !e.workspace_id));
        }
      } else if (data) {
        setExpenses(data);
        await AsyncStorage.setItem(expensesKey(workspaceId), JSON.stringify(data));
      }
    } catch (e) {
      console.error('Error loading data:', e);
    } finally {
      setLoading(false);
    }
  };

  const addExpense = async (expense: Omit<Expense, 'id'>) => {
    if (!workspace?.id) return;

    const workspaceId = workspace.id;
    const newExpenseData = {
      ...expense,
      workspace_id: workspaceId,
      added_by: displayName,
    };

    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert([newExpenseData])
        .select();

      if (error) throw error;

      if (data) {
        const updatedExpenses = [data[0], ...expenses];
        setExpenses(updatedExpenses);
        await AsyncStorage.setItem(expensesKey(workspaceId), JSON.stringify(updatedExpenses));
      }
    } catch (error: any) {
      console.error('Error adding expense to Supabase:', error?.message || error);

      const newExpense = { ...newExpenseData, id: Date.now().toString() };
      const updatedExpenses = [newExpense, ...expenses];
      setExpenses(updatedExpenses);
      await AsyncStorage.setItem(expensesKey(workspaceId), JSON.stringify(updatedExpenses));
    }
  };

  const deleteExpense = async (id: string) => {
    if (!workspace?.id) return;
    const workspaceId = workspace.id;

    try {
      const { error } = await supabase.from('expenses').delete().match({ id, workspace_id: workspaceId });

      if (error) throw error;

      const updatedExpenses = expenses.filter((e) => e.id !== id);
      setExpenses(updatedExpenses);
      await AsyncStorage.setItem(expensesKey(workspaceId), JSON.stringify(updatedExpenses));
    } catch (error: any) {
      console.error('Error deleting expense from Supabase:', error?.message || error);

      const updatedExpenses = expenses.filter((e) => e.id !== id);
      setExpenses(updatedExpenses);
      await AsyncStorage.setItem(expensesKey(workspaceId), JSON.stringify(updatedExpenses));
    }
  };

  const setMonthlyBudget = async (budget: number): Promise<{ ok: boolean; error?: string }> => {
    if (!workspace?.id) {
      return { ok: false, error: 'No workspace selected.' };
    }
    const workspaceId = workspace.id;

    try {
      setMonthlyBudgetState(budget);
      await AsyncStorage.setItem(budgetKey(workspaceId), budget.toString());

      const payload = {
        workspace_id: workspaceId,
        amount: budget,
        updated_at: new Date().toISOString(),
      };

      const { data: existing, error: fetchError } = await supabase
        .from('budgets')
        .select('id')
        .eq('workspace_id', workspaceId)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching budget:', fetchError);
        return { ok: false, error: fetchError.message };
      }

      let error = null;

      if (existing?.id) {
        ({ error } = await supabase.from('budgets').update(payload).eq('id', existing.id));
      } else {
        const { data: maxRow } = await supabase
          .from('budgets')
          .select('id')
          .order('id', { ascending: false })
          .limit(1)
          .maybeSingle();

        const nextId = (Number(maxRow?.id) || 0) + 1;
        ({ error } = await supabase.from('budgets').insert([{ ...payload, id: nextId }]));
      }

      if (error) {
        console.error('Error saving budget to Supabase:', error);
        return { ok: false, error: error.message };
      }

      return { ok: true };
    } catch (error: any) {
      console.error('Error saving budget:', error);
      return { ok: false, error: 'Could not save budget.' };
    }
  };

  return (
    <ExpenseContext.Provider
      value={{ expenses, monthlyBudget, addExpense, deleteExpense, setMonthlyBudget, loading, refreshExpenses }}
    >
      {children}
    </ExpenseContext.Provider>
  );
};
