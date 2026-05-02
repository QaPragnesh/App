import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useExpenses } from '../../hooks/useExpenses';
import { Ionicons } from '@expo/vector-icons';

export default function HistoryScreen() {
  const { expenses, deleteExpense } = useExpenses();
  const [filter, setFilter] = useState('All');

  const categories = [
    { label: 'All', value: 'All' },
    { label: '🛒 Grocery', value: 'Grocery' },
    { label: '🥦 Sabkbhaji', value: 'Sakbhaji and fruits' },
    { label: '⛽ Petrol', value: 'Petrol and diesel' },
    { label: '🥛 Milk', value: 'Milk' },
    { label: '🥨 Nasto', value: 'Nasto' },
    { label: '🤷 Other', value: 'Other' },
  ];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Grocery': return '🛒';
      case 'Sakbhaji and fruits': return '🥬';
      case 'Petrol and diesel': return '⛽';
      case 'Milk': return '🥛';
      case 'Nasto': return '🥐';
      default: return '🧼';
    }
  };

  const filteredExpenses = filter === 'All' 
    ? expenses 
    : expenses.filter(e => e.category === filter);

  const sortedExpenses = [...filteredExpenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const currentMonthTotal = expenses
    .filter(e => new Date(e.date).getMonth() === new Date().getMonth())
    .reduce((sum, e) => sum + e.amount, 0);

  const handleDelete = (id: string) => {
    Alert.alert('Delete Expense', 'Are you sure you want to delete this expense?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteExpense(id) },
    ]);
  };

  const formatDateShort = (dateStr: string) => {
    const d = new Date(dateStr);
    const day = d.getDate().toString().padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${day} ${months[d.getMonth()]}`;
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>{getCategoryIcon(item.category)}</Text>
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.categoryTitleText}>
            {item.category === 'Sakbhaji and fruits' ? 'Sabkbhaji & fruits' : item.category}
          </Text>
          {item.description ? (
            <Text style={styles.descriptionSubtext} numberOfLines={1}>
              {item.description}
            </Text>
          ) : null}
        </View>
        <View style={styles.amountContainer}>
          <Text style={styles.amountText}>₹{item.amount.toLocaleString('en-IN')}</Text>
          <Text style={styles.dateText}>{formatDateShort(item.date)}</Text>
        </View>
        <TouchableOpacity style={styles.deleteAction} onPress={() => handleDelete(item.id)}>
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const currentMonthName = new Date().toLocaleString('default', { month: 'short', year: 'numeric' });

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.headerCard}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerLabel}>EXPENSE DIARY</Text>
            <Text style={styles.entriesCount}>{expenses.length} entries</Text>
            <Text style={styles.totalLogged}>Total ₹{currentMonthTotal.toLocaleString('en-IN')} logged this month</Text>
          </View>
          <View style={styles.headerRight}>
            <Ionicons name="book" size={32} color="#FDE68A" />
            <Text style={styles.monthYearText}>{currentMonthName}</Text>
          </View>
        </View>
      </View>

      <View style={styles.filterWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.value}
              style={[
                styles.filterChip,
                filter === cat.value ? styles.filterChipActive : styles.filterChipInactive,
              ]}
              onPress={() => setFilter(cat.value)}
            >
              <Text style={[
                styles.filterText,
                filter === cat.value ? styles.filterTextActive : styles.filterTextInactive
              ]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={sortedExpenses}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No entries found for this filter.</Text>
          </View>
        }
        ListFooterComponent={
          sortedExpenses.length > 5 ? (
            <TouchableOpacity style={styles.loadMoreButton}>
              <Text style={styles.loadMoreText}>Load more entries ↓</Text>
            </TouchableOpacity>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', // Dark background
  },
  headerContainer: {
    padding: 16,
    paddingTop: 50,
  },
  headerCard: {
    backgroundColor: '#262626', // Dark card
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  headerLeft: {
    flex: 1,
  },
  headerLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#F59E0B',
    letterSpacing: 1,
    marginBottom: 4,
  },
  entriesCount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  totalLogged: {
    fontSize: 14,
    color: '#A3A3A3',
    marginTop: 4,
  },
  headerRight: {
    alignItems: 'center',
  },
  monthYearText: {
    fontSize: 12,
    color: '#F59E0B',
    marginTop: 4,
    fontWeight: '600',
  },
  filterWrapper: {
    marginBottom: 16,
  },
  filterRow: {
    paddingHorizontal: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#F59E0B', // Active filter color
  },
  filterChipInactive: {
    backgroundColor: '#262626',
    borderWidth: 1,
    borderColor: '#333',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#121212',
  },
  filterTextInactive: {
    color: '#A3A3A3',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#262626',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#1C1C1C',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 24,
  },
  infoContainer: {
    flex: 1,
  },
  categoryTitleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  descriptionSubtext: {
    fontSize: 12,
    color: '#A3A3A3',
  },
  amountContainer: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  dateText: {
    fontSize: 11,
    color: '#A3A3A3',
    marginTop: 2,
  },
  deleteAction: {
    padding: 8,
    justifyContent: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#A3A3A3',
    fontSize: 16,
  },
  loadMoreButton: {
    borderWidth: 1,
    borderColor: '#333',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  loadMoreText: {
    color: '#F59E0B',
    fontWeight: '600',
  }
});
