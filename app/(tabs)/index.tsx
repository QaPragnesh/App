import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useExpenses } from '../../hooks/useExpenses';
import { Ionicons } from '@expo/vector-icons';

const screenWidth = Dimensions.get('window').width;

export default function DashboardScreen() {
  const { expenses, monthlyBudget } = useExpenses();

  // Current Month Data
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const currentMonthExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  
  const currentMonthTotal = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const budgetExceeded = monthlyBudget > 0 && currentMonthTotal > monthlyBudget;
  const budgetPercentage = monthlyBudget > 0 ? Math.min((currentMonthTotal / monthlyBudget) * 100, 100) : 0;
  
  const transactionsCount = currentMonthExpenses.length;
  const remainingBudget = monthlyBudget > 0 ? Math.max(monthlyBudget - currentMonthTotal, 0) : 0;
  
  // days in month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const currentDay = new Date().getDate();
  const avgPerDay = currentDay > 0 ? (currentMonthTotal / currentDay) : 0;

  // Category wise totals
  const categoryTotals: Record<string, number> = {};
  currentMonthExpenses.forEach(e => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });

  const categoriesOrdered = ['Grocery', 'Sakbhaji and fruits', 'Petrol and diesel', 'Milk', 'Nasto', 'Other'];
  const categoryColors: Record<string, string> = {
    'Grocery': '#EC4899',             // pink
    'Sakbhaji and fruits': '#8B5CF6', // purple
    'Petrol and diesel': '#3B82F6',   // blue
    'Milk': '#10B981',                // green
    'Nasto': '#F59E0B',               // orange
    'Other': '#6B7280',               // grey
  };
  
  const maxCategoryAmount = Math.max(...Object.values(categoryTotals), 1);

  // Month-wise Summary (Last 6 months)
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthlyTotals = Array(6).fill(0).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const m = d.getMonth();
    const y = d.getFullYear();
    const total = expenses.filter(e => {
      const ed = new Date(e.date);
      return ed.getMonth() === m && ed.getFullYear() === y;
    }).reduce((sum, e) => sum + e.amount, 0);
    return {
      label: monthNames[m],
      total,
      isCurrent: i === 5
    };
  });
  const activeMonthlyTotals = monthlyTotals.filter(m => m.total > 0);
  const maxMonthlyAmount = Math.max(...activeMonthlyTotals.map(m => m.total), 1);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      
      {/* Overview Top Card */}
      <View style={styles.overviewHeaderCard}>
        <Text style={styles.overviewText}>Overview</Text>
        {monthlyBudget > 0 && (
          <View style={styles.budgetPill}>
            <Text style={styles.budgetPillText}>{Math.round(budgetPercentage)}% of budget used</Text>
          </View>
        )}
      </View>

      {/* Main Budget Card */}
      <View style={styles.mainCard}>
        <Text style={styles.mainCardSubtitle}>TOTAL SPENT THIS MONTH</Text>
        <Text style={styles.mainCardTitle}>₹{currentMonthTotal.toLocaleString('en-IN')}</Text>
        
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBg}>
            <View 
              style={[
                styles.progressBarFill, 
                { 
                  width: `${budgetPercentage}%`,
                  backgroundColor: budgetExceeded ? '#EF4444' : '#F59E0B' // orange or red
                }
              ]} 
            />
          </View>
        </View>
        
        <View style={styles.budgetLabelsRow}>
          <Text style={styles.budgetLabelText}>₹0</Text>
          <Text style={styles.budgetLabelText}>Budget ₹{monthlyBudget.toLocaleString('en-IN')}</Text>
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { flex: 1 }]}>
          <Text style={styles.statSubtitle}>Remaining Budget</Text>
          <Text style={[styles.statTitle, { color: '#10B981', fontSize: 24 }]}>₹{remainingBudget.toLocaleString('en-IN')}</Text>
        </View>
      </View>

      {/* Category Breakdown */}
      <Text style={styles.sectionTitle}>Category breakdown</Text>
      <View style={styles.breakdownCard}>
        {categoriesOrdered.map(cat => {
          const amt = categoryTotals[cat] || 0;
          const pct = Math.max((amt / maxCategoryAmount) * 100, 0);
          return (
            <View key={cat} style={styles.categoryRow}>
              <View style={styles.categoryNameContainer}>
                <View style={[styles.dot, { backgroundColor: categoryColors[cat] }]} />
                <Text style={styles.categoryName} numberOfLines={1}>
                  {cat === 'Sakbhaji and fruits' ? 'Sabkbhaji & fruits' : cat === 'Petrol and diesel' ? 'Petrol & diesel' : cat}
                </Text>
              </View>
              <View style={styles.categoryBarContainer}>
                <View style={[styles.categoryBar, { width: `${pct}%`, backgroundColor: categoryColors[cat] }]} />
              </View>
              <Text style={styles.categoryAmount}>₹{amt.toLocaleString('en-IN')}</Text>
            </View>
          );
        })}
      </View>

      {/* Month-wise Summary */}
      {activeMonthlyTotals.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Month-wise summary</Text>
          <View style={styles.breakdownCard}>
            {activeMonthlyTotals.map((item, idx) => {
              const isOverBudget = monthlyBudget > 0 && item.total > monthlyBudget;
              const barColor = isOverBudget ? '#EF4444' : (item.isCurrent ? '#F59E0B' : '#8B5CF6');
              const pct = Math.max((item.total / maxMonthlyAmount) * 100, 0);
              
              return (
                <View key={idx} style={[styles.categoryRow, idx === activeMonthlyTotals.length - 1 ? {marginBottom: 0} : {}]}>
                  <Text style={styles.monthName}>{item.label}</Text>
                  <View style={styles.categoryBarContainer}>
                    <View style={[styles.categoryBar, { width: `${pct}%`, backgroundColor: barColor }]} />
                  </View>
                  <View style={styles.monthAmountContainer}>
                    <Text style={[styles.categoryAmount, isOverBudget && { color: '#EF4444' }, {width: 'auto'}]}>
                      ₹{item.total.toLocaleString('en-IN')}
                    </Text>
                    {isOverBudget && (
                      <Ionicons name="warning-outline" size={14} color="#EF4444" style={{marginLeft: 4}} />
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', // Very dark background matching the design
  },
  content: {
    padding: 16,
    paddingTop: 50,
    paddingBottom: 40,
  },
  overviewHeaderCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#262626',
    borderWidth: 1,
    borderColor: '#3A3A3A',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  overviewText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  budgetPill: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  budgetPillText: {
    color: '#B45309',
    fontSize: 12,
    fontWeight: '600',
  },
  mainCard: {
    backgroundColor: '#262626',
    borderWidth: 1,
    borderColor: '#3A3A3A',
    borderRadius: 8,
    padding: 20,
    marginBottom: 16,
  },
  mainCardSubtitle: {
    color: '#A3A3A3',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  mainCardTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  progressBarContainer: {
    marginBottom: 8,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#333333',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  budgetLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  budgetLabelText: {
    color: '#A3A3A3',
    fontSize: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#262626',
    borderWidth: 1,
    borderColor: '#3A3A3A',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 4,
  },
  statSubtitle: {
    color: '#A3A3A3',
    fontSize: 12,
    marginBottom: 6,
  },
  statTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    marginLeft: 4,
  },
  breakdownCard: {
    backgroundColor: '#262626',
    borderWidth: 1,
    borderColor: '#3A3A3A',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 130, // Fixed width for alignment
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  categoryName: {
    color: '#E5E5E5',
    fontSize: 14,
  },
  categoryBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: '#3A3A3A',
    borderRadius: 3,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  categoryBar: {
    height: '100%',
    borderRadius: 3,
  },
  categoryAmount: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    width: 65, // Fixed width to align right side
    textAlign: 'right',
  },
  monthName: {
    color: '#A3A3A3',
    fontSize: 14,
    width: 35,
  },
  monthAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 75,
    justifyContent: 'flex-end',
  }
});
