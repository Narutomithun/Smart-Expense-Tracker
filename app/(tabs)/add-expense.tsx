import { Button } from '@/components/Button';
import { CategoryPicker } from '@/components/CategoryPicker';
import { CustomAlert } from '@/components/CustomAlert';
import { Input } from '@/components/Input';
import { useExpenses } from '@/context/ExpenseContext';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import { Category } from '@/types/expense';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function AddExpenseScreen() {
  const { addExpense } = useExpenses();
  const { alertConfig, visible, showAlert, handleConfirm, handleCancel } = useCustomAlert();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>(Category.FOOD);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [errors, setErrors] = useState<{ amount?: string; description?: string }>({});

  const validateForm = () => {
    const newErrors: { amount?: string; description?: string } = {};

    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }

    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddExpense = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await addExpense({
        amount: parseFloat(amount),
        description: description.trim(),
        category,
        date: date,
      });

      // Reset form
      setAmount('');
      setDescription('');
      setCategory(Category.FOOD);
      setDate(new Date().toISOString().split('T')[0]);
      setErrors({});

      showAlert({
        type: 'success',
        title: 'Success!',
        message: 'Expense added successfully!',
        confirmText: 'OK',
        onConfirm: () => {},
      });
    } catch (error) {
      showAlert({
        type: 'error',
        title: 'Error',
        message: 'Failed to add expense. Please try again.',
        confirmText: 'OK',
        onConfirm: () => {},
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Add Expense</Text>
            <Text style={styles.headerSubtitle}>Track a new expense</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="Amount (₹)"
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              error={errors.amount}
            />

            <Input
              label="Description"
              placeholder="e.g., Grocery shopping"
              value={description}
              onChangeText={setDescription}
              error={errors.description}
            />

            <Input
              label="Date"
              placeholder="YYYY-MM-DD"
              value={date}
              onChangeText={setDate}
            />

            <CategoryPicker
              selectedCategory={category}
              onSelectCategory={setCategory}
            />

            <Button
              title="Add Expense"
              onPress={handleAddExpense}
              style={styles.addButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Custom Alert */}
      {alertConfig && (
        <CustomAlert
          visible={visible}
          type={alertConfig.type}
          title={alertConfig.title}
          message={alertConfig.message}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          confirmText={alertConfig.confirmText}
          cancelText={alertConfig.cancelText}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05123d',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 5,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#B0BACF',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#B0BACF',
  },
  form: {
    padding: 20,
    paddingTop: 10,
  },
  addButton: {
    marginTop: 4,
  },
});
