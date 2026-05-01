import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
      const storedExpenses = await AsyncStorage.getItem('@expenses');
      const storedBudget = await AsyncStorage.getItem('@budget');
      if (storedExpenses) setExpenses(JSON.parse(storedExpenses));
      if (storedBudget) setMonthlyBudgetState(Number(storedBudget));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const addExpense = async (expense: Omit<Expense, 'id'>) => {
    const newExpense = { ...expense, id: Date.now().toString() };
    const updatedExpenses = [newExpense, ...expenses];
    setExpenses(updatedExpenses);
    await AsyncStorage.setItem('@expenses', JSON.stringify(updatedExpenses));
  };

  const deleteExpense = async (id: string) => {
    const updatedExpenses = expenses.filter(e => e.id !== id);
    setExpenses(updatedExpenses);
    await AsyncStorage.setItem('@expenses', JSON.stringify(updatedExpenses));
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
