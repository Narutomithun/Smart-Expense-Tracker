import { ExpenseCard } from '@/components/ExpenseCard';
import { useExpenses } from '@/context/ExpenseContext';
import { Category, CATEGORY_COLORS, CATEGORY_ICONS } from '@/types/expense';
import { ActivityIndicator, Alert, Linking, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const { expenses, getTotalSpending, getSpendingByCategory, isLoading } = useExpenses();

  const recentExpenses = expenses.slice(0, 5);
  const totalSpending = getTotalSpending();

  const openGPay = async () => {
    // GPay app deep link
    const gpayUrl = 'gpay://upi';
    // Fallback to Play Store if GPay is not installed
    const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.google.android.apps.nbu.paisa.user';
    
    try {
      const supported = await Linking.canOpenURL(gpayUrl);
      if (supported) {
        await Linking.openURL(gpayUrl);
      } else {
        // If GPay not installed, open Play Store
        Alert.alert(
          'GPay Not Installed',
          'Would you like to install Google Pay?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Install', onPress: () => Linking.openURL(playStoreUrl) }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Could not open Google Pay');
    }
  };

  const categorySpending = Object.values(Category).map((category) => ({
    category,
    amount: getSpendingByCategory(category),
  })).filter(item => item.amount > 0);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Expense Tracker</Text>
          <Text style={styles.headerSubtitle}>Track your spending</Text>
        </View>

        {/* Total Spending Card */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total Spending</Text>
          <Text style={styles.totalAmount}>₹{totalSpending.toFixed(2)}</Text>
          <Text style={styles.totalSubtext}>{expenses.length} expenses</Text>
          
          {/* GPay Button */}
          <TouchableOpacity style={styles.gpayButton} onPress={openGPay}>
            <Text style={styles.gpayButtonText}>💳 Pay with GPay</Text>
          </TouchableOpacity>
        </View>

        {/* Category Breakdown */}
        {categorySpending.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Spending by Category</Text>
            <View style={styles.categoryGrid}>
              {categorySpending.map(({ category, amount }) => (
                <View key={category} style={styles.categoryCard}>
                  <View
                    style={[
                      styles.categoryIconContainer,
                      { backgroundColor: CATEGORY_COLORS[category] + '20' },
                    ]}
                  >
                    <Text style={styles.categoryIcon}>{CATEGORY_ICONS[category]}</Text>
                  </View>
                  <Text style={styles.categoryName}>{category}</Text>
                  <Text style={styles.categoryAmount}>₹{amount.toFixed(2)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Recent Expenses */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Expenses</Text>
          {recentExpenses.length > 0 ? (
            recentExpenses.map((expense) => (
              <ExpenseCard key={expense.id} expense={expense} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📊</Text>
              <Text style={styles.emptyText}>No expenses yet</Text>
              <Text style={styles.emptySubtext}>Tap the + tab to add your first expense</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  totalCard: {
    backgroundColor: '#007AFF',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 24,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: '#E8F4FF',
    fontWeight: '600',
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 42,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  totalSubtext: {
    fontSize: 14,
    color: '#B3D9FF',
  },
  gpayButton: {
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginTop: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gpayButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    width: '30%',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryIcon: {
    fontSize: 24,
  },
  categoryName: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
    textAlign: 'center',
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#FFF',
    borderRadius: 12,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
  },
});
