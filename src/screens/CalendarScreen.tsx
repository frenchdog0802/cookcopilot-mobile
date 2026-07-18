import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Modal,
    TextInput,
    Alert,
    Dimensions,
} from 'react-native';
import { Calendar as RNCalendar } from 'react-native-calendars';
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    Trash2,
    X,
    AlertCircle,
    Search,
    ChevronDown,
    ChevronUp,
    Calendar as CalendarIcon,
    List,
    MoreHorizontal,
    Check,
} from 'lucide-react-native';

import { usePantry, normalizeRecipe } from '../contexts/pantryContext';
import type { MealPlan, Recipe } from '../types';
import { recipeApi } from '../api/recipe';
import { useNavigation } from '@react-navigation/native';
import AppHeader from '../components/AppHeader';

const { width } = Dimensions.get('window');

interface CalendarProps {
    onBack?: () => void;
}

export default function CalendarScreen({ onBack }: CalendarProps = {}) {
    const navigation = useNavigation();
    const handleBack = onBack || (() => navigation.goBack());
    const { addMealPlan, deleteMealPlan, fetchAllMealPlans, fetchAllRecipes, confirmMealPlan, skipMealPlan } = usePantry();

    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);

    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

    // Add modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedRecipeId, setSelectedRecipeId] = useState<string>('');
    const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('dinner');
    const [searchQuery, setSearchQuery] = useState('');

    // Delete confirmation
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [recipeToDelete, setRecipeToDelete] = useState<MealPlan | null>(null);

    // Recipe detail modal
    const [showRecipeDetail, setShowRecipeDetail] = useState(false);
    const [selectedRecipeDetail, setSelectedRecipeDetail] = useState<Recipe | null>(null);

    // Week view
    const [currentWeekStart, setCurrentWeekStart] = useState(() => {
        const today = new Date();
        const day = today.getDay();
        const diff = today.getDate() - day;
        const start = new Date(today);
        start.setDate(diff);
        start.setHours(0, 0, 0, 0);
        return start;
    });

    const [expandedDates, setExpandedDates] = useState<string[]>([]);

    // Fetch data
    useEffect(() => {
        (async () => {
            const plans = await fetchAllMealPlans();
            const recs = await fetchAllRecipes();

            setMealPlans(plans || []);
            setRecipes(recs || []);
        })();
    }, []);

    // ──────────────────────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────────────────────
    const formatDateString = (date: Date) =>
        `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    const getHistoryForDate = (date: Date | null) => {
        if (!date) return [];
        const dateStr = formatDateString(date);
        return mealPlans.filter((plan) => plan.serving_date === dateStr);
    };

    const getHistoryByType = () => {
        const items = getHistoryForDate(selectedDate);
        return {
            breakfast: items.filter((i) => i.meal_type === 'breakfast'),
            lunch: items.filter((i) => i.meal_type === 'lunch'),
            dinner: items.filter((i) => i.meal_type === 'dinner'),
            snack: items.filter((i) => i.meal_type === 'snack'),
        };
    };

    // ──────────────────────────────────────────────────────────────
    // Calendar Header + Navigation
    // ──────────────────────────────────────────────────────────────
    const monthNames = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
    ];

    // ──────────────────────────────────────────────────────────────
    // Add Recipe Logic
    // ──────────────────────────────────────────────────────────────
    const handleAddMeal = async () => {
        if (!selectedRecipeId) return;

        const recipe = recipes.find((r) => r.id === selectedRecipeId);
        if (!recipe || !selectedDate) return;

        const dateStr = formatDateString(selectedDate);

        const newMeal: any = {
            recipe_id: selectedRecipeId,
            meal_name: recipe.meal_name,
            meal_type: selectedMealType,
            serving_date: dateStr,
        };

        try {
            const response = await addMealPlan(newMeal);
            if (response?.success && response.data) {
                setMealPlans((prev) => [
                    ...prev,
                    {
                        ...newMeal,
                        id: response.data!.id,
                    },
                ]);
                setShowAddModal(false);
                setSelectedRecipeId('');
                setSearchQuery('');
            }
        } catch (err) {
            console.error('Error adding meal plan:', err);
        }
    };

    const handleDelete = async () => {
        if (!recipeToDelete?.id) return;

        try {
            await deleteMealPlan(recipeToDelete.id);
            setMealPlans((prev) => prev.filter((p) => p.id !== recipeToDelete.id));
            setShowDeleteConfirm(false);
            setRecipeToDelete(null);
        } catch (err) {
            console.error('Error deleting meal plan:', err);
        }
    };

    const canActOnMeal = (item: MealPlan) =>
        !item.status || item.status === 'PLANNED' || item.status === 'PENDING_CONFIRM';

    const pendingMeals = mealPlans.filter((m) => m.status === 'PENDING_CONFIRM');

    const handleConfirmMeal = async (item: MealPlan) => {
        const response = await confirmMealPlan(item.id);
        if (response.success && response.data) {
            setMealPlans((prev) =>
                prev.map((mp) => (mp.id === item.id ? { ...mp, status: 'CONFIRMED' } : mp))
            );
            const shortages = response.data.shortages || [];
            if (shortages.length > 0) {
                const summary = shortages
                    .slice(0, 3)
                    .map((s) => `${s.name} (had ${s.available}${s.unit}, needed ${s.needed}${s.unit})`)
                    .join('\n');
                Alert.alert(
                    'Confirmed with pantry shortfall',
                    `Pantry was updated (clamped at 0).\n\n${summary}\n\nYou can adjust stock in Pantry.`
                );
            } else {
                Alert.alert('Meal confirmed', `${item.meal_name} — pantry updated.`);
            }
        }
    };

    const handleSkipMeal = async (item: MealPlan) => {
        const response = await skipMealPlan(item.id);
        if (response.success) {
            setMealPlans((prev) =>
                prev.map((mp) => (mp.id === item.id ? { ...mp, status: 'SKIPPED' } : mp))
            );
            Alert.alert('Skipped', `${item.meal_name} — no pantry change.`);
        }
    };

    // ──────────────────────────────────────────────────────────────
    // Render
    // ──────────────────────────────────────────────────────────────
    return (
        <View className="flex-1 bg-gray-50">
            <AppHeader
                title="Cooking Calendar"
                showBackButton
                onBack={handleBack}
                rightElement={<Plus size={24} color="white" />}
                onRightPress={() => {
                    setSelectedDate(new Date());
                    setShowAddModal(true);
                }}
            />

            {/* View Mode Toggle */}
            <View className="px-4 py-3 bg-white border-b border-gray-200">
                <View className="flex-row bg-gray-100 rounded-xl p-1.5">
                    <TouchableOpacity
                        onPress={() => setViewMode('calendar')}
                        className={`flex-1 py-2.5 rounded-lg ${viewMode === 'calendar' ? 'bg-red-500' : ''}`}
                    >
                        <Text
                            className={`text-center font-medium ${viewMode === 'calendar' ? 'text-white' : 'text-gray-600'
                                }`}
                        >
                            Month
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setViewMode('list')}
                        className={`flex-1 py-2.5 rounded-lg ${viewMode === 'list' ? 'bg-red-500' : ''}`}
                    >
                        <Text
                            className={`text-center font-medium ${viewMode === 'list' ? 'text-white' : 'text-gray-600'
                                }`}
                        >
                            Week
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView className="flex-1 px-4 pt-3">
                {pendingMeals.length > 0 && (
                    <View className="mb-4 bg-orange-50 border border-orange-200 rounded-2xl p-3">
                        <Text className="text-sm font-semibold text-gray-800 mb-2">
                            {pendingMeals.length === 1
                                ? `Did you cook ${pendingMeals[0].meal_name}?`
                                : `${pendingMeals.length} meals waiting for confirmation`}
                        </Text>
                        {pendingMeals.map((item) => (
                            <View
                                key={item.id}
                                className="flex-row items-center justify-between bg-white rounded-xl px-3 py-2 mb-2 border border-orange-100"
                            >
                                <View className="flex-1 mr-2">
                                    <Text className="font-medium text-gray-800" numberOfLines={1}>
                                        {item.meal_name}
                                    </Text>
                                    <Text className="text-xs text-gray-500">{item.serving_date}</Text>
                                </View>
                                <View className="flex-row gap-2">
                                    <TouchableOpacity
                                        onPress={() => handleConfirmMeal(item)}
                                        className="bg-red-500 px-3 py-1.5 rounded-lg"
                                    >
                                        <Text className="text-white text-xs font-medium">Done</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => handleSkipMeal(item)}
                                        className="border border-gray-300 px-3 py-1.5 rounded-lg"
                                    >
                                        <Text className="text-gray-600 text-xs font-medium">Skip</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
                {viewMode === 'calendar' && (
                    <>
                        {/* Month Navigation */}
                        <View className="flex-row justify-between items-center mb-4">
                            <TouchableOpacity onPress={() => setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}>
                                <ChevronLeft size={28} color="#4b5563" />
                            </TouchableOpacity>

                            <Text className="text-xl font-bold text-gray-800">
                                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                            </Text>

                            <TouchableOpacity onPress={() => setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}>
                                <ChevronRight size={28} color="#4b5563" />
                            </TouchableOpacity>
                        </View>

                        <RNCalendar
                            key={currentDate.toISOString()}
                            current={currentDate.toISOString().split('T')[0]}
                            onDayPress={(day) => {
                                // Fix: Parse year, month, day separately to avoid UTC offset
                                const [year, month, dayNum] = day.dateString.split('-').map(Number);
                                setSelectedDate(new Date(year, month - 1, dayNum));
                            }}
                            markedDates={{
                                [selectedDate ? formatDateString(selectedDate) : '']: {
                                    selected: true,
                                    selectedColor: '#f97316',
                                },
                            }}
                            theme={{
                                backgroundColor: 'transparent',
                                calendarBackground: 'white',
                                textSectionTitleColor: '#6b7280',
                                selectedDayBackgroundColor: '#f97316',
                                selectedDayTextColor: '#ffffff',
                                todayTextColor: '#f97316',
                                dayTextColor: '#374151',
                                monthTextColor: '#111827',
                                arrowColor: '#f97316',
                            }}
                            hideExtraDays={false}
                            hideArrows={true}
                            renderHeader={() => null}
                            onMonthChange={(month) => {
                                setCurrentDate(new Date(month.year, month.month - 1, 1));
                            }}
                        />
                    </>
                )}

                {/* Selected Day Content - Calendar View */}
                {viewMode === 'calendar' && selectedDate && (
                    <View className="mt-5 bg-white rounded-2xl p-4 mb-8 border border-gray-100 shadow-sm">
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-lg font-bold text-gray-800">
                                {selectedDate.toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    month: 'long',
                                    day: 'numeric',
                                })}
                            </Text>

                            <TouchableOpacity
                                onPress={() => setShowAddModal(true)}
                                className="bg-red-500 px-4 py-2 rounded-xl"
                            >
                                <Text className="text-white font-medium">+ Add</Text>
                            </TouchableOpacity>
                        </View>

                        {(() => {
                            const byType = getHistoryByType();
                            const types = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

                            return types.map((type) =>
                                byType[type].length > 0 ? (
                                    <View key={type} className="mb-5">
                                        <Text className="text-base font-semibold mb-2 capitalize text-gray-700">
                                            {type}
                                        </Text>

                                        {byType[type].map((item) => (
                                            <TouchableOpacity
                                                key={item.id}
                                                onPress={async () => {
                                                    const recipeId = String(item.recipe_id ?? '').trim();
                                                    let recipe = recipes.find((r) => String(r.id) === recipeId) ?? null;

                                                    if (!recipe && recipeId) {
                                                        try {
                                                            const response = await recipeApi.get(recipeId);
                                                            if (response.success && response.data) {
                                                                const raw = response.data as unknown;
                                                                const payload = (raw && typeof raw === 'object' && 'recipe' in (raw as object)
                                                                    ? (raw as { recipe: Record<string, unknown> }).recipe
                                                                    : raw) as Record<string, unknown>;
                                                                recipe = normalizeRecipe(payload);
                                                                setRecipes((prev) =>
                                                                    prev.some((r) => r.id === recipe!.id) ? prev : [...prev, recipe!]
                                                                );
                                                            }
                                                        } catch (err) {
                                                            console.error('Failed to load recipe for meal plan:', err);
                                                        }
                                                    }

                                                    setSelectedRecipeDetail(
                                                        recipe ?? {
                                                            id: recipeId,
                                                            meal_name: item.meal_name || 'Recipe',
                                                            folder_id: '',
                                                            instructions: [],
                                                            ingredients: [],
                                                            image: null,
                                                        }
                                                    );
                                                    setShowRecipeDetail(true);
                                                }}
                                                className="bg-gray-50 p-4 rounded-xl mb-2.5 border border-gray-200"
                                            >
                                                <View className="flex-row justify-between items-center">
                                                    <View className="flex-1 mr-2">
                                                        <Text className="font-medium text-gray-800">{item.meal_name}</Text>
                                                        {item.status && item.status !== 'PLANNED' && (
                                                            <Text className="text-xs text-gray-500 mt-0.5">
                                                                {item.status === 'PENDING_CONFIRM' && 'Awaiting confirmation'}
                                                                {item.status === 'CONFIRMED' && 'Cooked'}
                                                                {item.status === 'SKIPPED' && 'Skipped'}
                                                            </Text>
                                                        )}
                                                    </View>

                                                    <View className="flex-row items-center">
                                                        {canActOnMeal(item) && (
                                                            <>
                                                                <TouchableOpacity
                                                                    onPress={() => handleConfirmMeal(item)}
                                                                    className="p-2 mr-1"
                                                                >
                                                                    <Check size={20} color="#16a34a" />
                                                                </TouchableOpacity>
                                                                <TouchableOpacity
                                                                    onPress={() => handleSkipMeal(item)}
                                                                    className="p-2 mr-1"
                                                                >
                                                                    <X size={20} color="#6b7280" />
                                                                </TouchableOpacity>
                                                            </>
                                                        )}
                                                        <TouchableOpacity
                                                            onPress={() => {
                                                                setRecipeToDelete(item);
                                                                setShowDeleteConfirm(true);
                                                            }}
                                                        >
                                                            <Trash2 size={20} color="#ef4444" />
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                ) : null
                            );
                        })()}
                    </View>
                )}

                {/* ────────────── WEEK / LIST VIEW ────────────── */}
                {viewMode === 'list' && (
                    <View className="mb-10">
                        {/* Week Navigation */}
                        <View className="flex-row justify-between items-center mb-4">
                            <TouchableOpacity
                                onPress={() => setCurrentWeekStart((d) => {
                                    const newD = new Date(d);
                                    newD.setDate(d.getDate() - 7);
                                    return newD;
                                })}
                                className="flex-row items-center px-3 py-2 rounded-lg bg-gray-100"
                            >
                                <ChevronLeft size={16} color="#4b5563" />
                                <Text className="text-gray-600 font-medium">Prev</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => {
                                    const today = new Date();
                                    const day = today.getDay();
                                    const diff = today.getDate() - day;
                                    const start = new Date(today);
                                    start.setDate(diff);
                                    start.setHours(0, 0, 0, 0);
                                    setCurrentWeekStart(start);
                                }}
                                className="px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-100"
                            >
                                <Text className="text-blue-600 font-medium text-sm">Today</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => setCurrentWeekStart((d) => {
                                    const newD = new Date(d);
                                    newD.setDate(d.getDate() + 7);
                                    return newD;
                                })}
                                className="flex-row items-center px-3 py-2 rounded-lg bg-gray-100"
                            >
                                <Text className="text-gray-600 font-medium">Next</Text>
                                <ChevronRight size={16} color="#4b5563" />
                            </TouchableOpacity>
                        </View>

                        <Text className="text-center font-semibold text-gray-800 mb-4">
                            {currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} —{' '}
                            {(() => {
                                const end = new Date(currentWeekStart);
                                end.setDate(currentWeekStart.getDate() + 6);
                                return end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                            })()}
                        </Text>

                        {/* Week Days List */}
                        {(() => {
                            const weekDates: Date[] = [];
                            for (let i = 0; i < 7; i++) {
                                const d = new Date(currentWeekStart);
                                d.setDate(currentWeekStart.getDate() + i);
                                weekDates.push(d);
                            }
                            return weekDates.map((date) => {
                                const dateStr = formatDateString(date);
                                const dayMeals = mealPlans.filter((p) => p.serving_date === dateStr);
                                const isExpanded = expandedDates.includes(dateStr);
                                const isToday = date.toDateString() === new Date().toDateString();

                                const formatDisplayDate = (d: Date) => {
                                    const today = new Date();
                                    if (d.toDateString() === today.toDateString()) return 'Today';
                                    const yesterday = new Date(today);
                                    yesterday.setDate(today.getDate() - 1);
                                    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
                                    const tomorrow = new Date(today);
                                    tomorrow.setDate(today.getDate() + 1);
                                    if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
                                    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                                };

                                return (
                                    <View
                                        key={dateStr}
                                        className={`mb-2 rounded-xl overflow-hidden border ${isToday ? 'border-orange-300' : 'border-gray-200'} bg-white`}
                                    >
                                        <TouchableOpacity
                                            onPress={() => {
                                                if (isExpanded) {
                                                    setExpandedDates(expandedDates.filter((d) => d !== dateStr));
                                                } else {
                                                    setExpandedDates([...expandedDates, dateStr]);
                                                }
                                            }}
                                            className={`px-4 py-3 flex-row justify-between items-center ${dayMeals.length > 0 ? 'bg-gray-50' : 'bg-white'}`}
                                        >
                                            <View className="flex-row items-center">
                                                <CalendarIcon size={16} color="#6b7280" />
                                                <Text className={`ml-2 font-medium ${isToday ? 'text-orange-600' : 'text-gray-800'}`}>
                                                    {formatDisplayDate(date)}
                                                </Text>
                                                {dayMeals.length > 0 && (
                                                    <View className="bg-red-100 rounded-full px-2 py-0.5 ml-2">
                                                        <Text className="text-red-700 text-xs font-medium">{dayMeals.length}</Text>
                                                    </View>
                                                )}
                                            </View>
                                            {dayMeals.length > 0 && (
                                                isExpanded ? <ChevronUp size={18} color="#6b7280" /> : <ChevronDown size={18} color="#6b7280" />
                                            )}
                                        </TouchableOpacity>

                                        {isExpanded && dayMeals.length > 0 && (
                                            <View className="border-t border-gray-100">
                                                {dayMeals.map((item) => (
                                                    <View
                                                        key={item.id}
                                                        className="px-4 py-3 flex-row justify-between items-center border-b border-gray-50"
                                                    >
                                                        <View className="flex-row items-center flex-1">
                                                            <View className={`w-2 h-2 rounded-full mr-3 ${item.meal_type === 'breakfast' ? 'bg-blue-500' :
                                                                    item.meal_type === 'lunch' ? 'bg-amber-500' :
                                                                        item.meal_type === 'dinner' ? 'bg-red-500' : 'bg-green-500'
                                                                }`} />
                                                            <View className="flex-1">
                                                                <Text className="font-medium text-gray-800">{item.meal_name}</Text>
                                                                <Text className="text-xs text-gray-500 capitalize">{item.meal_type}</Text>
                                                            </View>
                                                        </View>
                                                        <View className="flex-row items-center">
                                                            {canActOnMeal(item) && (
                                                                <>
                                                                    <TouchableOpacity onPress={() => handleConfirmMeal(item)} className="p-2">
                                                                        <Check size={16} color="#16a34a" />
                                                                    </TouchableOpacity>
                                                                    <TouchableOpacity onPress={() => handleSkipMeal(item)} className="p-2">
                                                                        <X size={16} color="#6b7280" />
                                                                    </TouchableOpacity>
                                                                </>
                                                            )}
                                                            <TouchableOpacity
                                                                onPress={() => {
                                                                    setRecipeToDelete(item);
                                                                    setShowDeleteConfirm(true);
                                                                }}
                                                                className="p-2"
                                                            >
                                                                <Trash2 size={16} color="#ef4444" />
                                                            </TouchableOpacity>
                                                        </View>
                                                    </View>
                                                ))}
                                            </View>
                                        )}

                                        <TouchableOpacity
                                            onPress={() => {
                                                setSelectedDate(date);
                                                setShowAddModal(true);
                                            }}
                                            className="py-2 bg-gray-50 border-t border-gray-100"
                                        >
                                            <View className="flex-row items-center justify-center">
                                                <Plus size={14} color="#dc2626" />
                                                <Text className="text-red-600 font-medium ml-1 text-sm">Add meal</Text>
                                            </View>
                                        </TouchableOpacity>
                                    </View>
                                );
                            });
                        })()}
                    </View>
                )}
            </ScrollView>

            {/* ──────────────────────────────────────────────────────────────
          ADD RECIPE BOTTOM MODAL
      ────────────────────────────────────────────────────────────── */}
            <Modal
                visible={showAddModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowAddModal(false)}
            >
                <View className="flex-1 justify-end bg-black/50">
                    <View className="bg-white rounded-t-3xl p-6 max-h-[85%]">
                        <View className="flex-row justify-between items-center mb-5">
                            <Text className="text-xl font-bold text-gray-800">Add to Calendar</Text>
                            <TouchableOpacity onPress={() => setShowAddModal(false)}>
                                <X size={28} color="#6b7280" />
                            </TouchableOpacity>
                        </View>

                        {/* Meal Type */}
                        <Text className="text-gray-700 font-medium mb-2">Meal Type</Text>
                        <View className="flex-row flex-wrap gap-2 mb-6">
                            {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((type) => (
                                <TouchableOpacity
                                    key={type}
                                    onPress={() => setSelectedMealType(type)}
                                    className={`px-4 py-2.5 rounded-full border ${selectedMealType === type
                                        ? 'bg-red-500 border-red-500'
                                        : 'border-gray-300 bg-white'
                                        }`}
                                >
                                    <Text
                                        className={`capitalize ${selectedMealType === type ? 'text-white' : 'text-gray-700'
                                            }`}
                                    >
                                        {type}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Recipe Search / Select */}
                        <Text className="text-gray-700 font-medium mb-2">Recipe</Text>
                        <View className="relative mb-6">
                            <TextInput
                                className="bg-gray-50 border border-gray-200 rounded-xl pl-10 py-3"
                                placeholder="Search recipe..."
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                            <Search size={20} color="#9ca3af" className="absolute left-3 top-3.5" />
                        </View>

                        {/* Recipe list - can be improved with FlatList */}
                        <ScrollView className="max-h-64 mb-6">
                            {recipes
                                .filter((r) => r.meal_name?.toLowerCase().includes(searchQuery.toLowerCase()))
                                .map((recipe) => (
                                    <TouchableOpacity
                                        key={recipe.id}
                                        onPress={() => setSelectedRecipeId(recipe.id)}
                                        className={`p-3 border-b border-gray-100 ${selectedRecipeId === recipe.id ? 'bg-red-50' : ''
                                            }`}
                                    >
                                        <Text className="text-gray-800">{recipe.meal_name}</Text>
                                    </TouchableOpacity>
                                ))}
                        </ScrollView>

                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                onPress={() => setShowAddModal(false)}
                                className="flex-1 py-4 bg-gray-200 rounded-xl"
                            >
                                <Text className="text-center font-medium text-gray-700">Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleAddMeal}
                                disabled={!selectedRecipeId}
                                className={`flex-1 py-4 rounded-xl ${selectedRecipeId ? 'bg-red-500' : 'bg-gray-300'
                                    }`}
                            >
                                <Text className="text-center font-medium text-white">Add</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Delete Confirmation */}
            <Modal visible={showDeleteConfirm} transparent animationType="fade">
                <View className="flex-1 justify-center items-center bg-black/60 px-5">
                    <View className="bg-white rounded-2xl p-6 w-full max-w-sm">
                        <View className="flex-row items-center mb-4">
                            <AlertCircle size={28} color="#ef4444" />
                            <Text className="ml-3 text-xl font-bold text-gray-800">Delete?</Text>
                        </View>

                        <Text className="text-gray-600 mb-6">
                            Are you sure you want to remove this meal plan?
                        </Text>

                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                onPress={() => setShowDeleteConfirm(false)}
                                className="flex-1 py-3.5 bg-gray-200 rounded-xl"
                            >
                                <Text className="text-center font-medium">Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleDelete}
                                className="flex-1 py-3.5 bg-red-500 rounded-xl"
                            >
                                <Text className="text-center font-medium text-white">Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Recipe Detail Modal */}
            <Modal
                visible={showRecipeDetail}
                transparent
                animationType="slide"
                onRequestClose={() => {
                    setShowRecipeDetail(false);
                    setSelectedRecipeDetail(null);
                }}
            >
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-3xl max-h-[85%]">
                        <View className="p-4 border-b border-gray-100 flex-row justify-between items-start">
                            <Text className="text-xl font-bold text-gray-800 flex-1 mr-3">
                                {selectedRecipeDetail?.meal_name || 'Recipe'}
                            </Text>
                            <TouchableOpacity
                                onPress={() => {
                                    setShowRecipeDetail(false);
                                    setSelectedRecipeDetail(null);
                                }}
                                className="p-1"
                            >
                                <X size={24} color="#6b7280" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView className="px-4 py-4">
                            {(selectedRecipeDetail?.ingredients?.length ?? 0) > 0 ? (
                                <View className="mb-6">
                                    <Text className="text-lg font-semibold text-gray-800 mb-3">Ingredients</Text>
                                    {selectedRecipeDetail!.ingredients.map((ing, index) => (
                                        <View key={index} className="flex-row justify-between py-2 border-b border-gray-100">
                                            <Text className="text-gray-800 capitalize flex-1">{ing.name}</Text>
                                            <Text className="text-gray-500">
                                                {ing.quantity} {ing.unit}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            ) : (
                                <Text className="text-gray-500 mb-6">No ingredients listed for this recipe.</Text>
                            )}

                            <View className="mb-8">
                                <Text className="text-lg font-semibold text-gray-800 mb-3">Instructions</Text>
                                {(selectedRecipeDetail?.instructions?.length ?? 0) > 0 ? (
                                    selectedRecipeDetail!.instructions.map((step, index) => (
                                        <View key={index} className="flex-row mb-3">
                                            <View className="w-6 h-6 rounded-full bg-orange-100 items-center justify-center mr-3 mt-0.5">
                                                <Text className="text-xs font-medium text-orange-700">{index + 1}</Text>
                                            </View>
                                            <Text className="flex-1 text-gray-800 leading-5">{step}</Text>
                                        </View>
                                    ))
                                ) : (
                                    <Text className="text-gray-500">No instructions available for this recipe.</Text>
                                )}
                            </View>
                        </ScrollView>

                        <View className="p-4 border-t border-gray-100">
                            <TouchableOpacity
                                onPress={() => {
                                    setShowRecipeDetail(false);
                                    setSelectedRecipeDetail(null);
                                }}
                                className="bg-gray-100 py-3 rounded-xl"
                            >
                                <Text className="text-center text-gray-800 font-medium">Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}