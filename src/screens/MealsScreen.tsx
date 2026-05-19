import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import Card from '../components/Card';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import BottomSheet from '../components/BottomSheet';
import { colors, fontSize, spacing, borderRadius } from '../components/Theme';
import { mealTemplates, MealTemplate } from '../data/meals';
import { Meal } from '../types';
import { searchFood } from '../api/nutritionApi';

export default function MealsScreen() {
  const insets = useSafeAreaInsets();
  const meals = useStore((s) => s.meals);
  const addMeal = useStore((s) => s.addMeal);
  const deleteMeal = useStore((s) => s.deleteMeal);

  const [showAddSheet, setShowAddSheet] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'today' | 'history'>('today');
  const [customMealName, setCustomMealName] = useState('');
  const [customCalories, setCustomCalories] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const todayMeals = meals.filter((m) => m.date === today);
  const mealHistory = meals
    .filter((m) => m.date !== today)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalCalories = todayMeals.reduce((sum, m) => sum + m.calories, 0);

  const mealTypeIcons: Record<string, string> = {
    breakfast: '🌅',
    lunch: '☀️',
    dinner: '🌙',
    snack: '🍿',
  };

  const handleAddTemplateMeal = (template: MealTemplate) => {
    const meal: Meal = {
      id: `meal-${Date.now()}`,
      name: template.name,
      calories: template.calories,
      protein: template.protein,
      carbs: template.carbs,
      fat: template.fat,
      date: today,
      mealType: template.mealType,
    };
    addMeal(meal);
    setShowAddSheet(false);
  };

  const handleAddCustomMeal = () => {
    if (!customMealName || !customCalories) return;
    const meal: Meal = {
      id: `meal-${Date.now()}`,
      name: customMealName,
      calories: parseInt(customCalories, 10) || 0,
      notes: customNotes,
      date: today,
      mealType: 'snack',
    };
    addMeal(meal);
    setCustomMealName('');
    setCustomCalories('');
    setCustomNotes('');
    setShowCustomForm(false);
    setShowAddSheet(false);
  };

  const handleSearchFood = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const results = await searchFood(query);
    setSearchResults(results.slice(0, 5));
    setSearching(false);
  };

  const handleAddSearchedFood = (product: any) => {
    const name = product.product_name || 'Unknown Food';
    const cal = product.nutriments?.['energy-kcal_100g'] || 0;
    const meal: Meal = {
      id: `meal-${Date.now()}`,
      name,
      calories: Math.round(cal),
      date: today,
      mealType: 'snack',
    };
    addMeal(meal);
    setSearchQuery('');
    setSearchResults([]);
    setShowAddSheet(false);
  };

  const renderMealItem = (meal: Meal) => (
    <TouchableOpacity
      key={meal.id}
      style={styles.mealItem}
      onLongPress={() => deleteMeal(meal.id)}
    >
      <Text style={styles.mealIcon}>{mealTypeIcons[meal.mealType] || '🍽️'}</Text>
      <View style={styles.mealInfo}>
        <Text style={styles.mealName}>{meal.name}</Text>
        <Text style={styles.mealCalories}>{meal.calories} cal</Text>
        {meal.notes && <Text style={styles.mealNotes}>{meal.notes}</Text>}
        {meal.protein != null && (
          <Text style={styles.macroText}>P: {meal.protein}g C: {meal.carbs}g F: {meal.fat}g</Text>
        )}
      </View>
      <TouchableOpacity onPress={() => deleteMeal(meal.id)}>
        <Text style={styles.deleteIcon}>✕</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meals</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddSheet(true)}>
          <Text style={styles.addButtonText}>+ Add Meal</Text>
        </TouchableOpacity>
      </View>

      {/* Calories Summary */}
      <Card style={styles.calCard}>
        <Text style={styles.calLabel}>Today's Calories</Text>
        <Text style={styles.calValue}>{totalCalories}</Text>
        <Text style={styles.calSubtext}>kcal consumed</Text>
        <View style={styles.calBar}>
          <View style={[styles.calFill, { width: `${Math.min(100, (totalCalories / 2000) * 100)}%` }]} />
        </View>
      </Card>

      {/* Tab Switcher */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'today' && styles.tabActive]}
          onPress={() => setSelectedTab('today')}
        >
          <Text style={[styles.tabText, selectedTab === 'today' && styles.tabTextActive]}>Today</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'history' && styles.tabActive]}
          onPress={() => setSelectedTab('history')}
        >
          <Text style={[styles.tabText, selectedTab === 'history' && styles.tabTextActive]}>History</Text>
        </TouchableOpacity>
      </View>

      {/* Meal List */}
      <ScrollView contentContainerStyle={styles.listContent}>
        {selectedTab === 'today' ? (
          todayMeals.length === 0 ? (
            <EmptyState title="No meals today" message="Tap + Add Meal to log what you ate" />
          ) : (
            todayMeals.map(renderMealItem)
          )
        ) : (
          mealHistory.length === 0 ? (
            <EmptyState title="No meal history" message="Your logged meals will appear here" />
          ) : (
            mealHistory.map((meal) => (
              <View key={meal.id}>
                <Text style={styles.historyDate}>
                  {new Date(meal.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </Text>
                {renderMealItem(meal)}
              </View>
            ))
          )
        )}
      </ScrollView>

      {/* Add Meal Bottom Sheet */}
      <BottomSheet visible={showAddSheet} onClose={() => { setShowAddSheet(false); setShowCustomForm(false); setSearchQuery(''); setSearchResults([]); }} title="Add Meal">
        {showCustomForm ? (
          <View>
            <TextInput
              style={styles.sheetInput}
              placeholder="Meal Name"
              placeholderTextColor={colors.textMuted}
              value={customMealName}
              onChangeText={setCustomMealName}
            />
            <TextInput
              style={styles.sheetInput}
              placeholder="Calories"
              placeholderTextColor={colors.textMuted}
              value={customCalories}
              onChangeText={setCustomCalories}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.sheetInput}
              placeholder="Notes (optional)"
              placeholderTextColor={colors.textMuted}
              value={customNotes}
              onChangeText={setCustomNotes}
            />
            <Button title="Add Meal" onPress={handleAddCustomMeal} fullWidth disabled={!customMealName || !customCalories} />
            <Button title="Back" onPress={() => setShowCustomForm(false)} variant="ghost" fullWidth />
          </View>
        ) : (
          <ScrollView>
            <Text style={styles.sheetSectionTitle}>Search Food</Text>
            <TextInput
              style={styles.sheetInput}
              placeholder="Search food (e.g., chicken)"
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={handleSearchFood}
            />
            {searching && <Text style={styles.searchingText}>Searching...</Text>}
            {searchResults.map((r, i) => (
              <TouchableOpacity key={i} style={styles.searchResult} onPress={() => handleAddSearchedFood(r)}>
                <Text style={styles.searchResultName}>{r.product_name || 'Unknown'}</Text>
                <Text style={styles.searchResultCal}>{Math.round(r.nutriments?.['energy-kcal_100g'] || 0)} cal/100g</Text>
              </TouchableOpacity>
            ))}

            <Text style={styles.sheetSectionTitle}>Quick Add</Text>
            <View style={styles.mealTypeSection}>
              {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((type) => (
                <View key={type}>
                  <Text style={styles.mealTypeLabel}>{mealTypeIcons[type]} {type}</Text>
                  {mealTemplates
                    .filter((t) => t.mealType === type)
                    .slice(0, 3)
                    .map((template) => (
                      <TouchableOpacity
                        key={template.id}
                        style={styles.templateItem}
                        onPress={() => handleAddTemplateMeal(template)}
                      >
                        <Text style={styles.templateName}>{template.name}</Text>
                        <Text style={styles.templateCal}>{template.calories} cal</Text>
                      </TouchableOpacity>
                    ))}
                </View>
              ))}
            </View>

            <Button
              title="Custom Meal"
              onPress={() => setShowCustomForm(true)}
              variant="outline"
              fullWidth
              style={{ marginTop: spacing.sm }}
            />
          </ScrollView>
        )}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: { color: colors.text, fontSize: fontSize.xxl, fontWeight: '700' },
  addButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  addButtonText: { color: colors.text, fontWeight: '600', fontSize: fontSize.sm },
  calCard: { marginHorizontal: spacing.lg, marginBottom: spacing.md, alignItems: 'center' },
  calLabel: { color: colors.textSecondary, fontSize: fontSize.sm },
  calValue: { color: colors.text, fontSize: fontSize.hero, fontWeight: '700' },
  calSubtext: { color: colors.textMuted, fontSize: fontSize.xs, marginBottom: spacing.sm },
  calBar: {
    width: '100%',
    height: 6,
    backgroundColor: colors.surfaceLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  calFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center' },
  tabActive: { backgroundColor: colors.primary },
  tabText: { color: colors.textSecondary, fontWeight: '600', fontSize: fontSize.sm },
  tabTextActive: { color: colors.text },
  listContent: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  mealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mealIcon: { fontSize: 24, marginRight: spacing.md },
  mealInfo: { flex: 1 },
  mealName: { color: colors.text, fontWeight: '600', fontSize: fontSize.md },
  mealCalories: { color: colors.primary, fontWeight: '700', fontSize: fontSize.sm },
  mealNotes: { color: colors.textSecondary, fontSize: fontSize.xs, marginTop: 2 },
  macroText: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 },
  deleteIcon: { color: colors.error, fontSize: fontSize.lg, padding: spacing.xs },
  historyDate: { color: colors.textSecondary, fontSize: fontSize.xs, marginTop: spacing.md, marginBottom: spacing.xs, fontWeight: '600' },
  sheetSectionTitle: { color: colors.text, fontWeight: '700', fontSize: fontSize.md, marginTop: spacing.md, marginBottom: spacing.sm },
  sheetInput: {
    backgroundColor: colors.inputBackground,
    color: colors.text,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.md,
    marginBottom: spacing.sm,
  },
  searchingText: { color: colors.textMuted, fontSize: fontSize.sm, marginBottom: spacing.sm },
  searchResult: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  searchResultName: { color: colors.text, fontSize: fontSize.sm, flex: 1 },
  searchResultCal: { color: colors.textSecondary, fontSize: fontSize.xs },
  mealTypeSection: { gap: spacing.sm },
  mealTypeLabel: { color: colors.text, fontWeight: '600', fontSize: fontSize.sm, marginTop: spacing.sm, marginBottom: spacing.xs },
  templateItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  templateName: { color: colors.text, fontSize: fontSize.sm },
  templateCal: { color: colors.textSecondary, fontSize: fontSize.sm },
});
