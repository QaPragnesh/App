import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useExpenses } from '../../hooks/useExpenses';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

export default function AddExpenseScreen() {
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [category, setCategory] = useState('Grocery');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const { addExpense, monthlyBudget, expenses } = useExpenses();
  const router = useRouter();

  const categories = [
    { label: 'Grocery', sub: 'Daily essentials', value: 'Grocery', color: '#EC4899' },
    { label: 'Sabkbhaji & Fruits', sub: 'Healthy stuff', value: 'Sakbhaji and fruits', color: '#10B981' },
    { label: 'Petrol & Diesel', sub: 'Fuel for transport', value: 'Petrol and diesel', color: '#3B82F6' },
    { label: 'Milk', sub: 'Daily dairy', value: 'Milk', color: '#8B5CF6' },
    { label: 'Nasto', sub: 'Snacks & Fast food', value: 'Nasto', color: '#F59E0B' },
    { label: 'Other', sub: 'Miscellaneous', value: 'Other', color: '#6B7280' },
  ];

  const selectedCat = categories.find(c => c.value === category) || categories[0];

  // Budget calculations for the alert card
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const currentMonthTotal = expenses
    .filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, e) => sum + e.amount, 0);

  const budgetPercentage = monthlyBudget > 0 ? (currentMonthTotal / monthlyBudget) * 100 : 0;
  const remainingBudget = monthlyBudget > 0 ? monthlyBudget - currentMonthTotal : 0;

  const handleSave = async () => {
    if (!amount || isNaN(Number(amount))) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    
    const expenseAmount = Number(amount);
    
    if (monthlyBudget > 0 && (currentMonthTotal + expenseAmount) > monthlyBudget) {
      Alert.alert(
        'Budget Warning',
        `This expense exceeds your monthly budget. Do you want to proceed?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Proceed', onPress: () => saveAndGoBack(expenseAmount) }
        ]
      );
    } else {
      saveAndGoBack(expenseAmount);
    }
  };

  const saveAndGoBack = async (expenseAmount: number) => {
    await addExpense({
      date: date.toISOString(),
      category,
      description,
      amount: expenseAmount,
    });
    setAmount('');
    setDescription('');
    Alert.alert('Success', 'Expense saved successfully!');
  };

  const formatDate = (date: Date) => {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}-${m}-${y}`;
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        
        {/* Header Card */}
        <View style={styles.headerCard}>
          <Text style={styles.headerLabel}>NEW EXPENSE</Text>
          <Text style={styles.headerTitle}>Where did the money go? 🧐</Text>
        </View>

        {/* Budget Alert Card */}
        <View style={styles.alertCard}>
          <Ionicons name="warning-outline" size={20} color="#9D174D" />
          <Text style={styles.alertText}>
            Budget at {Math.round(budgetPercentage)}% — only ₹{remainingBudget.toLocaleString('en-IN')} left this month.
          </Text>
        </View>

        {/* Main Form */}
        <View style={styles.formCard}>
          
          {/* Date Picker */}
          <View style={styles.inputGroup}>
            <View style={styles.inputHeader}>
              <MaterialIcons name="calendar-today" size={16} color="#A3A3A3" />
              <Text style={styles.inputLabel}>PICK A DATE</Text>
            </View>
            <TouchableOpacity style={styles.inputBox} onPress={() => setShowDatePicker(true)}>
              <Text style={styles.inputText}>{formatDate(date)}</Text>
              <MaterialIcons name="calendar-today" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                maximumDate={new Date()}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) setDate(selectedDate);
                }}
              />
            )}
          </View>

          {/* Custom Funny Category Dropdown */}
          <View style={styles.inputGroup}>
            <View style={styles.inputHeader}>
              <Ionicons name="sparkles-outline" size={16} color="#A3A3A3" />
              <Text style={styles.inputLabel}>CATEGORY</Text>
            </View>
            <TouchableOpacity 
              style={[styles.inputBox, { borderColor: selectedCat.color }]} 
              onPress={() => setShowCategoryModal(true)}
            >
              <View>
                <Text style={styles.inputText}>{selectedCat.label}</Text>
                <Text style={styles.inputSubtext}>{selectedCat.sub}</Text>
              </View>
              <Ionicons name="chevron-down" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Description Input */}
          <View style={styles.inputGroup}>
            <View style={styles.inputHeader}>
              <Ionicons name="card-outline" size={16} color="#A3A3A3" />
              <Text style={styles.inputLabel}>WHAT DID YOU BUY?</Text>
            </View>
            <TextInput
              style={[styles.inputBox, { color: '#FFFFFF' }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Enter item name..."
              placeholderTextColor="#525252"
            />
          </View>

          {/* Amount Input */}
          <View style={styles.inputGroup}>
            <View style={styles.inputHeader}>
              <Ionicons name="help-circle-outline" size={16} color="#A3A3A3" />
              <Text style={styles.inputLabel}>HOW MUCH?</Text>
            </View>
            <View style={styles.inputBox}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#525252"
              />
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save this expense ✓</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Funny Category Modal */}
      <Modal
        visible={showCategoryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.value}
                  style={[
                    styles.categoryOption,
                    { borderLeftColor: cat.color },
                    category === cat.value && { backgroundColor: '#333' }
                  ]}
                  onPress={() => {
                    setCategory(cat.value);
                    setShowCategoryModal(false);
                  }}
                >
                  <View>
                    <Text style={styles.optionLabel}>{cat.label}</Text>
                    <Text style={styles.optionSub}>{cat.sub}</Text>
                  </View>
                  {category === cat.value && (
                    <Ionicons name="checkmark-circle" size={24} color={cat.color} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  content: {
    padding: 16,
    paddingTop: 50,
    paddingBottom: 40,
  },
  headerCard: {
    backgroundColor: '#E6FFFA',
    borderRadius: 16,
    padding: 24,
    marginBottom: 12,
  },
  headerLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 8,
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  alertCard: {
    backgroundColor: '#FFF5F7',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FED7E2',
  },
  alertText: {
    fontSize: 14,
    color: '#9D174D',
    marginLeft: 12,
    flex: 1,
    fontWeight: '500',
  },
  formCard: {
    backgroundColor: '#262626',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#A3A3A3',
    marginLeft: 8,
    letterSpacing: 1,
  },
  inputBox: {
    backgroundColor: '#1C1C1C',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  inputText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  inputSubtext: {
    fontSize: 11,
    color: '#A3A3A3',
    marginTop: 2,
  },
  currencySymbol: {
    fontSize: 18,
    color: '#A3A3A3',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#1E9A85',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#1E9A85',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#262626',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  categoryOption: {
    backgroundColor: '#1C1C1C',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 6,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  optionSub: {
    fontSize: 12,
    color: '#A3A3A3',
    marginTop: 4,
  }
});
