import { CustomAlert } from '@/components/CustomAlert';
import { ExpenseCard } from '@/components/ExpenseCard';
import { useExpenses } from '@/context/ExpenseContext';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import { Category, CATEGORY_COLORS, CATEGORY_ICONS } from '@/types/expense';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { ActivityIndicator, Alert, Linking, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const { expenses, getTotalSpending, getSpendingByCategory, isLoading, clearAllExpenses } = useExpenses();
  const { alertConfig, visible: alertVisible, showAlert, handleConfirm: handleAlertConfirm, handleCancel: handleAlertCancel } = useCustomAlert();
  const [showScanner, setShowScanner] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const recentExpenses = expenses.slice(0, 5);
  const totalSpending = getTotalSpending();

  const handleClearAll = async () => {
    showAlert({
      type: 'confirm',
      title: 'Clear All Expenses',
      message: 'Are you sure you want to delete all expenses? This action cannot be undone.',
      confirmText: 'Delete All',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          await clearAllExpenses();
          showAlert({
            type: 'success',
            title: 'Success!',
            message: 'All expenses have been deleted',
            confirmText: 'OK',
            onConfirm: () => {},
          });
        } catch (error) {
          showAlert({
            type: 'error',
            title: 'Error',
            message: 'Failed to clear expenses',
            confirmText: 'OK',
            onConfirm: () => {},
          });
        }
      },
      onCancel: () => {},
    });
  };

  const openScanner = async () => {
    if (!permission) {
      return;
    }

    if (!permission.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert('Permission Required', 'Camera permission is needed to scan QR codes');
        return;
      }
    }

    setScanned(false);
    setShowScanner(true);
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    
    setScanned(true);
    setShowScanner(false);

    // Log the scanned data for debugging
    console.log('Scanned QR Code:', data);

    // Check if it's a UPI QR code
    if (data.startsWith('upi://pay')) {
      try {
        // Parse and clean the UPI URL
        let cleanUrl = data.trim();
        
        // Sometimes QR codes have extra whitespace or special characters
        cleanUrl = cleanUrl.replace(/\s/g, '');
        
        // Show user what was scanned
        Alert.alert(
          'UPI Payment Detected',
          'Opening payment app...',
          [
            {
              text: 'OK',
              onPress: async () => {
                try {
                  const supported = await Linking.canOpenURL(cleanUrl);
                  if (supported) {
                    await Linking.openURL(cleanUrl);
                  } else {
                    Alert.alert('Error', 'No UPI app found. Please install GPay, PhonePe, or Paytm.');
                  }
                } catch (error) {
                  console.error('Error opening UPI app:', error);
                  Alert.alert('Error', 'Failed to open payment app. The QR code might be invalid.');
                }
              }
            },
            {
              text: 'Cancel',
              style: 'cancel'
            }
          ]
        );
      } catch (error) {
        console.error('Error processing QR code:', error);
        Alert.alert('Error', 'Failed to process QR code');
      }
    } else if (data.startsWith('upi://')) {
      // Handle other UPI formats
      Alert.alert('Invalid Format', 'This UPI QR code format is not supported for payments. Please use a standard UPI payment QR code.');
    } else {
      Alert.alert('Invalid QR Code', 'This is not a UPI payment QR code. Please scan a valid UPI QR code.');
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
          
          {/* GPay QR Scanner Button */}
          <TouchableOpacity style={styles.gpayButton} onPress={openScanner}>
            <Text style={styles.gpayButtonText}>📷 Scan & Pay with GPay</Text>
          </TouchableOpacity>
        </View>

        {/* QR Scanner Modal */}
        <Modal
          visible={showScanner}
          transparent={false}
          animationType="slide"
          onRequestClose={() => setShowScanner(false)}
        >
          <View style={styles.scannerContainer}>
            <View style={styles.scannerHeader}>
              <Text style={styles.scannerTitle}>Scan UPI QR Code</Text>
              <TouchableOpacity onPress={() => setShowScanner(false)} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.cameraWrapper}>
              <CameraView
                style={styles.camera}
                facing="back"
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                  barcodeTypes: ['qr'],
                }}
              />
              <View style={styles.scannerOverlay}>
                <View style={styles.scannerFrame} />
                <Text style={styles.scannerInstructions}>
                  Position the QR code within the frame
                </Text>
              </View>
            </View>
          </View>
        </Modal>

        {/* Category Breakdown */}
        {categorySpending.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Spending by Category</Text>
              {expenses.length > 0 && (
                <TouchableOpacity onPress={handleClearAll} style={styles.clearButton}>
                  <Text style={styles.clearButtonText}>🗑️ Clear All</Text>
                </TouchableOpacity>
              )}
            </View>
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

      {/* Custom Alert */}
      {alertConfig && (
        <CustomAlert
          visible={alertVisible}
          type={alertConfig.type}
          title={alertConfig.title}
          message={alertConfig.message}
          onConfirm={handleAlertConfirm}
          onCancel={handleAlertCancel}
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
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#B0BACF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#B0BACF',
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
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  scannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#1A1A1A',
  },
  scannerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFF',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#FFF',
    fontWeight: '600',
  },
  camera: {
    flex: 1,
  },
  cameraWrapper: {
    flex: 1,
    position: 'relative',
  },
  scannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#FFF',
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  scannerInstructions: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 30,
    textAlign: 'center',
    paddingHorizontal: 40,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 12,
    borderRadius: 10,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#7EA2FF',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  clearButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
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
