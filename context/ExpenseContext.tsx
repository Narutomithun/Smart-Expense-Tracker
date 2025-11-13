import { Category, Expense } from '@/types/expense';
import { storageService } from '@/utils/storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface ExpenseContextType {
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  updateExpense: (expense: Expense) => Promise<void>;
  clearAllExpenses: () => Promise<void>;
  getTotalSpending: () => number;
  getSpendingByCategory: (category: Category) => number;
  isLoading: boolean;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export const useExpenses = () => {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpenses must be used within ExpenseProvider');
  }
  return context;
};

interface ExpenseProviderProps {
  children: ReactNode;
}

export const ExpenseProvider: React.FC<ExpenseProviderProps> = ({ children }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load expenses on mount
  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    setIsLoading(true);
    const loadedExpenses = await storageService.getExpenses();
    setExpenses(loadedExpenses);
    setIsLoading(false);
  };

  const addExpense = async (expenseData: Omit<Expense, 'id' | 'createdAt'>) => {
    const newExpense: Expense = {
      ...expenseData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    };
    await storageService.addExpense(newExpense);
    setExpenses((prev) => [newExpense, ...prev]);
  };

  const deleteExpense = async (id: string) => {
    await storageService.deleteExpense(id);
    setExpenses((prev) => prev.filter((exp) => exp.id !== id));
  };

  const updateExpense = async (updatedExpense: Expense) => {
    await storageService.updateExpense(updatedExpense);
    setExpenses((prev) =>
      prev.map((exp) => (exp.id === updatedExpense.id ? updatedExpense : exp))
    );
  };

  const clearAllExpenses = async () => {
    await storageService.clearAllExpenses();
    setExpenses([]);
  };

  const getTotalSpending = () => {
    return expenses.reduce((total, expense) => total + expense.amount, 0);
  };

  const getSpendingByCategory = (category: Category) => {
    return expenses
      .filter((exp) => exp.category === category)
      .reduce((total, expense) => total + expense.amount, 0);
  };

  const value: ExpenseContextType = {
    expenses,
    addExpense,
    deleteExpense,
    updateExpense,
    clearAllExpenses,
    getTotalSpending,
    getSpendingByCategory,
    isLoading,
  };

  return <ExpenseContext.Provider value={value}>{children}</ExpenseContext.Provider>;
};
