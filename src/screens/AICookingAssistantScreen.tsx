import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert
} from 'react-native';
import {
    SendIcon,
    SaveIcon,
    RefreshCwIcon,
    ShoppingCartIcon,
    ChevronDownIcon,
    TrashIcon,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { usePantry } from '../contexts/pantryContext';
import { RecipeSuggestion, Recipe } from '../types';
import AppHeader from '../components/AppHeader';
import { chatApi, ChatResponseData, ChatResponseType, HistoryMessage } from '../api/chat';
import { mealPlanApi } from '../api/mealPlan';

interface ResponseCardData {
    recipeId?: string;
    recipeName?: string;
    ingredientCount?: number;
    steps?: string[];
    sourceUrl?: string;
    itemsAdded?: number;
    items?: Array<{ name: string; quantity?: string | number; unit?: string }>;
    mealPlanId?: string;
    mealType?: string;
    servingDate?: string;
    mealsScheduled?: number;
    meals?: Array<{ meal_name?: string; serving_date?: string; meal_type?: string }>;
    mergedGroups?: number;
    removedDuplicates?: number;
    suggestions?: Array<{ recipeId?: string; recipeName?: string; matchScore?: number }>;
    actionCount?: number;
    actions?: Array<Record<string, unknown>>;
    message?: string;
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    type?: ChatResponseType;
    cardData?: ResponseCardData;
    timestamp: number;
}

const WELCOME_MESSAGE: Message = {
    id: 'welcome',
    role: 'assistant',
    content: "Hi! Tell me what you need — import a recipe URL, plan your week, update your pantry, or ask what you can cook. I'll handle it and show you what changed.",
    timestamp: Date.now(),
};

const SUGGESTED_PROMPTS = [
    'What can I cook with what I have?',
    'Plan dinners for the rest of this week',
    'Import a recipe from a URL',
    'Add chicken, rice, and broccoli to my pantry',
];

export default function AICookingAssistantScreen() {
    const navigation = useNavigation();
    const {
        addRecipe,
        fetchAllRecipes,
        fetchAllShoppingListItems,
        fetchAllPantryItems,
        fetchAllMealPlans,
    } = usePantry();
    const flatListRef = useRef<FlatList>(null);

    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
    const [isTyping, setIsTyping] = useState(false);
    const [savedRecipes, setSavedRecipes] = useState<RecipeSuggestion[]>([]);
    const [showSaved, setShowSaved] = useState(false);
    const [addingToMenuRecipeId, setAddingToMenuRecipeId] = useState<string | null>(null);

    useEffect(() => {
        const loadHistory = async () => {
            try {
                const response = await chatApi.getHistory();
                if (response.success && response.data?.messages?.length) {
                    setMessages(response.data.messages.map((entry: HistoryMessage) => ({
                        id: entry.id,
                        role: entry.role,
                        content: entry.content,
                        timestamp: entry.createdAt * 1000,
                    })));
                }
            } catch (error) {
                console.error('Failed to load chat history', error);
            }
        };

        loadHistory();
    }, []);

    const cardTypes: ChatResponseType[] = [
        'recipe_created', 'recipe_imported', 'recipe_updated',
        'shopping_list_updated', 'meal_plan_updated', 'pantry_updated',
        'meal_suggestions', 'multi_action', 'action_result',
    ];

    const mapResponseToMessage = (aiData: ChatResponseData): Message => ({
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: aiData.message,
        type: aiData.type,
        cardData: cardTypes.includes(aiData.type)
            ? (aiData.data as ResponseCardData | undefined)
            : undefined,
        timestamp: Date.now(),
    });

    const refreshAfterAgentAction = async (type: ChatResponseType) => {
        const tasks: Promise<unknown>[] = [];
        if (['recipe_created', 'recipe_imported', 'recipe_updated', 'meal_suggestions', 'multi_action', 'action_result'].includes(type)) {
            tasks.push(fetchAllRecipes());
        }
        if (['meal_plan_updated', 'meal_suggestions', 'multi_action', 'action_result'].includes(type)) {
            tasks.push(fetchAllMealPlans());
        }
        if (['pantry_updated', 'meal_suggestions', 'multi_action', 'action_result'].includes(type)) {
            tasks.push(fetchAllPantryItems());
        }
        if (['shopping_list_updated', 'meal_plan_updated', 'multi_action', 'action_result'].includes(type)) {
            tasks.push(fetchAllShoppingListItems());
        }
        await Promise.all(tasks);
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessageContent = input.trim();
        const userMessage: Message = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: userMessageContent,
            timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsTyping(true);

        try {
            const response = await chatApi.send(userMessageContent);

            if (response.success && response.data) {
                const assistantMessage = mapResponseToMessage(response.data!);
                setMessages((prev) => [...prev, assistantMessage]);
                if (assistantMessage.type && assistantMessage.type !== 'text' && assistantMessage.type !== 'error') {
                    await refreshAfterAgentAction(assistantMessage.type);
                }
            } else {
                setMessages((prev) => [...prev, {
                    id: `error-${Date.now()}`,
                    role: 'assistant',
                    content: response.message || "Sorry, I couldn't get a response. Please try again.",
                    type: 'error',
                    timestamp: Date.now(),
                }]);
            }
        } catch (error) {
            console.error(error);
            setMessages((prev) => [...prev, {
                id: `error-${Date.now()}`,
                role: 'assistant',
                content: 'Network error. Please check your connection.',
                type: 'error',
                timestamp: Date.now(),
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleAddCreatedRecipeToMenu = async (recipeId: string) => {
        setAddingToMenuRecipeId(recipeId);
        try {
            await mealPlanApi.create({ recipe_id: recipeId, meal_type: 'dinner' });
            Alert.alert('Success', 'Recipe added to your dinner menu.');
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Could not add recipe to menu.');
        } finally {
            setAddingToMenuRecipeId(null);
        }
    };

    const handleViewCreatedRecipe = async (recipeId: string) => {
        await fetchAllRecipes();
        (navigation as { navigate: (name: string, params?: object) => void }).navigate('Main', {
            screen: 'RecipesTab',
            params: { recipeId },
        });
    };

    const handleViewShoppingList = async () => {
        await fetchAllShoppingListItems();
        (navigation as { navigate: (name: string, params?: object) => void }).navigate('Main', {
            screen: 'ShoppingTab',
        });
    };

    const handleViewCalendar = async () => {
        await fetchAllMealPlans();
        (navigation as { navigate: (name: string, params?: object) => void }).navigate('Main', {
            screen: 'CalendarTab',
        });
    };

    const handleViewPantry = async () => {
        await fetchAllPantryItems();
        (navigation as { navigate: (name: string, params?: object) => void }).navigate('Main', {
            screen: 'PantryTab',
        });
    };

    const handleSaveRecipe = (recipe: RecipeSuggestion) => {
        setSavedRecipes((prev) => [...prev, { ...recipe, savedAt: Date.now() }]);
    };

    const handleAddToRecipes = async (recipe: RecipeSuggestion) => {
        const newRecipe: Recipe = {
            id: `recipe-${Date.now()}`,
            folder_id: 'uncategorized',
            meal_name: recipe.name,
            ingredients: recipe.ingredients,
            instructions: recipe.instructions,
            image: null,
        };

        await addRecipe(newRecipe);
        Alert.alert('Success', 'Recipe added to your collection!');
    };

    const handleClearChat = () => {
        setMessages([{
            ...WELCOME_MESSAGE,
            id: `welcome-${Date.now()}`,
            content: "Chat cleared! Tell me what ingredients you have, and I'll suggest some recipes!",
            timestamp: Date.now(),
        }]);
        setSavedRecipes([]);
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isUser = item.role === 'user';

        return (
            <View className={`mb-4 ${isUser ? 'items-end' : 'items-start'}`}>
                <View
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${isUser ? 'bg-orange-500' : item.type === 'error' ? 'bg-red-50 border border-red-200' : 'bg-white border border-gray-200'
                        }`}
                >
                    <Text className={isUser ? 'text-white' : item.type === 'error' ? 'text-red-700' : 'text-gray-800'}>
                        {item.content}
                    </Text>

                    {(item.type === 'recipe_created' || item.type === 'recipe_imported') && item.cardData && (
                        <View className="mt-3 bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <Text className="font-bold text-lg text-gray-800 mb-1">
                                {item.type === 'recipe_imported' ? 'Imported' : 'Recipe'}: {item.cardData.recipeName}
                            </Text>
                            <Text className="text-sm text-gray-500 mb-3">
                                {item.cardData.ingredientCount ?? 0} ingredients · {(item.cardData.steps ?? []).length} steps
                            </Text>
                            <View className="flex-row gap-2">
                                <TouchableOpacity
                                    onPress={() => item.cardData?.recipeId && handleViewCreatedRecipe(item.cardData.recipeId)}
                                    className="flex-1 bg-blue-50 py-2 rounded-lg items-center"
                                >
                                    <Text className="text-blue-600 text-sm">Edit Recipe</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => item.cardData?.recipeId && handleAddCreatedRecipeToMenu(item.cardData.recipeId)}
                                    disabled={addingToMenuRecipeId === item.cardData.recipeId}
                                    className="flex-1 bg-green-50 py-2 rounded-lg items-center"
                                >
                                    <Text className="text-green-600 text-sm">Add to Menu</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {item.type === 'recipe_updated' && item.cardData && (
                        <View className="mt-3 bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <Text className="font-medium text-gray-800">Updated: {item.cardData.recipeName}</Text>
                            <TouchableOpacity
                                onPress={() => item.cardData?.recipeId && handleViewCreatedRecipe(item.cardData.recipeId)}
                                className="mt-3 bg-blue-50 py-2 rounded-lg items-center"
                            >
                                <Text className="text-blue-600 text-sm">Edit Recipe</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {item.type === 'shopping_list_updated' && item.cardData && (
                        <View className="mt-3 bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <Text className="font-medium text-gray-800 mb-2">
                                Added {item.cardData.itemsAdded ?? 0} items to your shopping list
                            </Text>
                            <View className="flex-row flex-wrap gap-2 mb-3">
                                {(item.cardData.items ?? []).map((shoppingItem, index) => (
                                    <View key={`${shoppingItem.name}-${index}`} className="bg-orange-50 px-2 py-1 rounded-full">
                                        <Text className="text-orange-700 text-xs">{shoppingItem.name}</Text>
                                    </View>
                                ))}
                            </View>
                            <TouchableOpacity
                                onPress={handleViewShoppingList}
                                className="bg-orange-500 py-2 rounded-lg items-center"
                            >
                                <Text className="text-white text-sm">View Shopping List</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {item.type === 'meal_plan_updated' && item.cardData && (
                        <View className="mt-3 bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <Text className="font-medium text-gray-800 mb-2">
                                {item.cardData.mealsScheduled
                                    ? `Scheduled ${item.cardData.mealsScheduled} meal(s)`
                                    : `${item.cardData.recipeName} — ${item.cardData.mealType} on ${item.cardData.servingDate}`}
                            </Text>
                            <TouchableOpacity onPress={handleViewCalendar} className="bg-orange-500 py-2 rounded-lg items-center">
                                <Text className="text-white text-sm">Open Calendar</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {item.type === 'pantry_updated' && item.cardData && (
                        <View className="mt-3 bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <Text className="font-medium text-gray-800 mb-2">
                                {item.cardData.removedDuplicates != null
                                    ? `Pantry organized — merged ${item.cardData.mergedGroups ?? 0} group(s)`
                                    : `Added ${item.cardData.itemsAdded ?? 0} item(s) to pantry`}
                            </Text>
                            <TouchableOpacity onPress={handleViewPantry} className="bg-orange-500 py-2 rounded-lg items-center">
                                <Text className="text-white text-sm">Open Pantry</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {item.type === 'meal_suggestions' && item.cardData && (
                        <View className="mt-3 bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <Text className="font-medium text-gray-800 mb-2">Meal suggestions</Text>
                            {(item.cardData.suggestions ?? []).map((s, index) => (
                                <Text key={index} className="text-sm text-gray-600">
                                    {s.recipeName} — {s.matchScore}% match
                                </Text>
                            ))}
                            <TouchableOpacity onPress={handleViewCalendar} className="mt-3 bg-blue-50 py-2 rounded-lg items-center">
                                <Text className="text-blue-600 text-sm">View Calendar</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {item.type === 'multi_action' && item.cardData && (
                        <View className="mt-3 bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <Text className="font-medium text-gray-800">
                                Completed {item.cardData.actionCount ?? 0} action(s)
                            </Text>
                        </View>
                    )}
                </View>

                <Text className="text-xs text-gray-400 mt-1 mx-2">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
        );
    };

    return (
        <View className="flex-1 bg-gray-50">
            <AppHeader
                title="AI Cooking Assistant"
                showBackButton
                rightElement={<RefreshCwIcon size={20} color="white" />}
                onRightPress={handleClearChat}
            />

            {savedRecipes.length > 0 && (
                <TouchableOpacity
                    onPress={() => setShowSaved(!showSaved)}
                    className="bg-blue-50 px-4 py-3 flex-row items-center justify-between border-b border-blue-100"
                >
                    <Text className="text-blue-600 font-medium">
                        Saved Recipes ({savedRecipes.length})
                    </Text>
                    <ChevronDownIcon
                        size={20}
                        color="#3b82f6"
                        style={{ transform: [{ rotate: showSaved ? '180deg' : '0deg' }] }}
                    />
                </TouchableOpacity>
            )}

            {showSaved && (
                <ScrollView className="max-h-40 bg-white border-b border-gray-200">
                    {savedRecipes.map((recipe) => (
                        <View
                            key={recipe.id}
                            className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100"
                        >
                            <Text className="text-gray-800 flex-1">{recipe.name}</Text>
                            <TouchableOpacity
                                onPress={() =>
                                    setSavedRecipes((prev) => prev.filter((r) => r.id !== recipe.id))
                                }
                            >
                                <TrashIcon size={18} color="#ef4444" />
                            </TouchableOpacity>
                        </View>
                    ))}
                </ScrollView>
            )}

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
                keyboardVerticalOffset={90}
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: 16 }}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
                />

                {isTyping && (
                    <View className="px-4 pb-2">
                        <View className="bg-white rounded-2xl px-4 py-3 self-start border border-gray-200 flex-row items-center gap-2">
                            <ActivityIndicator size="small" color="#f97316" />
                            <Text className="text-gray-500">Thinking...</Text>
                        </View>
                    </View>
                )}

                <View className="px-4 py-3 bg-white border-t border-gray-200">
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
                        {SUGGESTED_PROMPTS.map((prompt) => (
                            <TouchableOpacity
                                key={prompt}
                                onPress={() => setInput(prompt)}
                                className="bg-orange-50 px-3 py-1.5 rounded-full mr-2"
                            >
                                <Text className="text-orange-700 text-xs">{prompt}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    <View className="flex-row items-center gap-2">
                        <TextInput
                            className="flex-1 bg-gray-100 rounded-xl px-4 py-3"
                            placeholder="Ask CookPlanner to plan, import, or organize..."
                            placeholderTextColor="#9ca3af"
                            value={input}
                            onChangeText={setInput}
                            onSubmitEditing={handleSend}
                            returnKeyType="send"
                        />
                        <TouchableOpacity
                            onPress={handleSend}
                            disabled={!input.trim() || isTyping}
                            className={`p-3 rounded-xl ${input.trim() && !isTyping ? 'bg-orange-500' : 'bg-gray-200'}`}
                        >
                            <SendIcon size={20} color={input.trim() && !isTyping ? 'white' : '#9ca3af'} />
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}
