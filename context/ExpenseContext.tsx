import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export type Expense = {
  id: string;
  date: string; // ISO string
  category: string;
  description: string;
  amount: number;
};

type ExpenseContextType = {
  expenses: Expense[];
  monthlyBudget: number;
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  setMonthlyBudget: (budget: number) => Promise<void>;
  loading: boolean;
};

export const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export const ExpenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [monthlyBudget, setMonthlyBudgetState] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load budget from AsyncStorage (keeping it local for now or you can move to Supabase too)
      const storedBudget = await AsyncStorage.getItem('@budget');
      if (storedBudget) setMonthlyBudgetState(Number(storedBudget));

      // Load expenses from Supabase
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.warn('Supabase fetch error, falling back to local storage:', error.message);
        // Fallback to local storage if Supabase fails or isn't set up
        const storedExpenses = await AsyncStorage.getItem('@expenses');
        if (storedExpenses) setExpenses(JSON.parse(storedExpenses));
      } else if (data) {
        setExpenses(data);
        // Sync local storage for offline access
        await AsyncStorage.setItem('@expenses', JSON.stringify(data));
      }
    } catch (e) {
      console.error('Error loading data:', e);
    } finally {
      setLoading(false);
    }
  };

  const addExpense = async (expense: Omit<Expense, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert([expense])
        .select();

      if (error) throw error;

      if (data) {
        const updatedExpenses = [data[0], ...expenses];
        setExpenses(updatedExpenses);
        await AsyncStorage.setItem('@expenses', JSON.stringify(updatedExpenses));
      }
    } catch (error: any) {
      console.error('Error adding expense to Supabase:', error?.message || error);
      if (error?.details) console.error('Error details:', error.details);
      if (error?.hint) console.error('Error hint:', error.hint);
      
      // Fallback: Add locally if Supabase fails
      const newExpense = { ...expense, id: Date.now().toString() };
      const updatedExpenses = [newExpense, ...expenses];
      setExpenses(updatedExpenses);
      await AsyncStorage.setItem('@expenses', JSON.stringify(updatedExpenses));
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .match({ id });

      if (error) throw error;

      const updatedExpenses = expenses.filter(e => e.id !== id);
      setExpenses(updatedExpenses);
      await AsyncStorage.setItem('@expenses', JSON.stringify(updatedExpenses));
    } catch (error: any) {
      console.error('Error deleting expense from Supabase:', error?.message || error);
      
      // Fallback: Delete locally
      const updatedExpenses = expenses.filter(e => e.id !== id);
      setExpenses(updatedExpenses);
      await AsyncStorage.setItem('@expenses', JSON.stringify(updatedExpenses));
    }
  };

  const setMonthlyBudget = async (budget: number) => {
    setMonthlyBudgetState(budget);
    await AsyncStorage.setItem('@budget', budget.toString());
  };

  return (
    <ExpenseContext.Provider value={{ expenses, monthlyBudget, addExpense, deleteExpense, setMonthlyBudget, loading }}>
      {children}
    </ExpenseContext.Provider>
  );
};
