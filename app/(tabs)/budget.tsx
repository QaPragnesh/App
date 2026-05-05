import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useExpenses } from '../../hooks/useExpenses';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function BudgetSetupScreen() {
  const { monthlyBudget, setMonthlyBudget, expenses } = useExpenses();
  const [budgetInput, setBudgetInput] = useState(monthlyBudget.toString());

  useEffect(() => {
    setBudgetInput(monthlyBudget.toString());
  }, [monthlyBudget]);

  const handleSaveBudget = async () => {
    const amount = parseFloat(budgetInput);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid budget amount.');
      return;
    }
    await setMonthlyBudget(amount);
    Alert.alert('Success', 'Monthly budget limit updated!');
  };

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const currentMonthTotal = expenses
    .filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, e) => sum + e.amount, 0);

  const budgetPercentage = monthlyBudget > 0 ? (currentMonthTotal / monthlyBudget) * 100 : 0;
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysLeft = daysInMonth - new Date().getDate();

  const getStatusMessage = () => {
    if (budgetPercentage >= 100) return "Wallet empty!";
    if (budgetPercentage >= 90) return "Slow down!";
    if (budgetPercentage >= 75) return "Getting close, be careful!";
    return "You're doing great!";
  };

  const getEmoji = () => {
    if (budgetPercentage >= 100) return "😵";
    if (budgetPercentage >= 90) return "😟";
    if (budgetPercentage >= 75) return "😟";
    return "😊";
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView 
          style={styles.container} 
          contentContainerStyle={[styles.content, { paddingBottom: 100 }]}
          keyboardShouldPersistTaps="handled"
        >
      <Text style={styles.headerTitle}>Budget Setup</Text>

      {/* Modern Budget Limit Card */}
      <View style={styles.budgetCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.budgetLabel}>SET MONTHLY BUDGET</Text>
          <Ionicons name="wallet-outline" size={20} color="#D64545" />
        </View>
        
        <Text style={styles.budgetSubHeader}>Keep track of your spending and take control of your finances.</Text>
        
        <View style={styles.inputSection}>
          <View style={styles.amountInputBox}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              style={styles.mainInput}
              value={budgetInput}
              onChangeText={setBudgetInput}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#A3A3A3"
            />
          </View>
          
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveBudget}>
            <Text style={styles.saveButtonText}>Save Budget</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.footerText}>You can update or change this limit anytime.</Text>
      </View>

      {/* Status Card */}
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <View style={styles.emojiContainer}>
            <Text style={styles.emoji}>{getEmoji()}</Text>
          </View>
          <View style={styles.statusInfo}>
            <Text style={styles.statusTitle}>{getStatusMessage()}</Text>
            <Text style={styles.statusSubtext}>
              ₹{currentMonthTotal.toLocaleString('en-IN')} spent of ₹{monthlyBudget.toLocaleString('en-IN')} — {daysLeft} days left
            </Text>
          </View>
        </View>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBarBg}>
            <View 
              style={[
                styles.progressBarFill, 
                { width: `${Math.min(budgetPercentage, 100)}%` }
              ]} 
            />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>₹0</Text>
            <Text style={styles.progressLabel}>{Math.round(budgetPercentage)}% used</Text>
            <Text style={styles.progressLabel}>₹{monthlyBudget.toLocaleString('en-IN')}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
    </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  content: {
    padding: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  budgetCard: {
    backgroundColor: '#FFF0F0',
    borderRadius: 28,
    padding: 24,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#FFB3B3',
    borderStyle: 'dashed',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  budgetLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#D64545',
    letterSpacing: 1.2,
  },
  budgetSubHeader: {
    fontSize: 16,
    color: '#4A1D1D',
    marginBottom: 24,
    fontWeight: '500',
    lineHeight: 22,
  },
  inputSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  amountInputBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#FFD1D1',
  },
  currencySymbol: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#D64545',
    marginRight: 8,
  },
  mainInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#121212',
  },
  saveButton: {
    backgroundColor: '#D64545',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#D64545',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  footerText: {
    fontSize: 12,
    color: '#D64545',
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '500',
  },
  statusCard: {
    backgroundColor: '#262626',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#333',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  emojiContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1C1C1C',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  emoji: {
    fontSize: 36,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statusSubtext: {
    fontSize: 14,
    color: '#A3A3A3',
  },
  progressContainer: {
    width: '100%',
  },
  progressBarBg: {
    height: 14,
    backgroundColor: '#333',
    borderRadius: 7,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 7,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 12,
    color: '#A3A3A3',
  },
});
