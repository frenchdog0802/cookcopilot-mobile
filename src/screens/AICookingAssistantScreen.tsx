import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
    NativeSyntheticEvent,
    TextInputContentSizeChangeEventData,
} from 'react-native';
import { FlashList, type FlashListRef } from '@shopify/flash-list';
import { useTranslation } from 'react-i18next';
import {
    SendIcon,
    RefreshCwIcon,
    ShoppingCartIcon,
} from 'lucide-react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePantry } from '../contexts/pantryContext';
import AppHeader from '../components/AppHeader';
import { ChatMessageRow } from '../components/chat/ChatMessageRow';
import { chatApi, ChatResponseData, ChatResponseType, HistoryMessage } from '../api/chat';
import { mealPlanApi } from '../api/mealPlan';
import { colors } from '../theme/tokens';
import { SkeletonList } from '../components/ui/Skeleton';

/** Matches ChatGPT / Claude-style mobile composers: comfortable single line, grows with content. */
const INPUT_MIN_HEIGHT = 44;
const INPUT_MAX_HEIGHT = 140;

type AICookingAssistantParams = {
  AICookingAssistant?: { initialPrompt?: string };
};

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
    content: "Hi! Tell me what you need ??import a recipe URL, plan your week, update your pantry, or ask what you can cook. I'll handle it and show you what changed.",
    timestamp: Date.now(),
};

const SUGGESTED_PROMPTS = [
    'What can I cook with what I have?',
    'Plan dinners for the rest of this week',
    'Import a recipe from a URL',
    'Add chicken, rice, and broccoli to my pantry',
];

export default function AICookingAssistantScreen() {
    const { t } = useTranslation();
    const navigation = useNavigation();
    const route = useRoute<RouteProp<AICookingAssistantParams, 'AICookingAssistant'>>();
    const insets = useSafeAreaInsets();
    const {
        fetchAllRecipes,
        fetchAllShoppingListItems,
        fetchAllPantryItems,
        fetchAllMealPlans,
    } = usePantry();
    const flatListRef = useRef<FlashListRef<Message>>(null);
    const [historyReady, setHistoryReady] = useState(false);

    const [input, setInput] = useState('');
    const [inputHeight, setInputHeight] = useState(INPUT_MIN_HEIGHT);
    const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
    const [isTyping, setIsTyping] = useState(false);
    const [addingToMenuRecipeId, setAddingToMenuRecipeId] = useState<string | null>(null);

    const canSend = input.trim().length > 0 && !isTyping;

    useEffect(() => {
        const prompt = route.params?.initialPrompt;
        if (!prompt) return;
        setInput(prompt);
        navigation.setParams({ initialPrompt: undefined } as never);
    }, [route.params?.initialPrompt, navigation]);

    const handleInputContentSizeChange = (
        event: NativeSyntheticEvent<TextInputContentSizeChangeEventData>,
    ) => {
        const next = Math.min(
            INPUT_MAX_HEIGHT,
            Math.max(INPUT_MIN_HEIGHT, event.nativeEvent.contentSize.height),
        );
        setInputHeight(next);
    };

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
            } finally {
                setHistoryReady(true);
            }
        };

        void loadHistory();
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
        setInputHeight(INPUT_MIN_HEIGHT);
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

    const handleAddCreatedRecipeToMenu = useCallback(async (recipeId: string) => {
        setAddingToMenuRecipeId(recipeId);
        try {
            const servingDate = new Date().toISOString().slice(0, 10);
            const response = await mealPlanApi.create({
                recipe_id: recipeId,
                meal_type: 'dinner',
                serving_date: servingDate,
            });
            if (!response.success) {
                throw new Error(response.message || "Failed to add recipe to today's dinner");
            }
            await Promise.all([fetchAllMealPlans(), fetchAllRecipes()]);
            Alert.alert(
                "Added to today's dinner",
                `On the calendar for ${servingDate}. Also filed under Dinner.`
            );
        } catch (error) {
            console.error(error);
            Alert.alert('Error', "Could not add recipe to today's dinner.");
        } finally {
            setAddingToMenuRecipeId(null);
        }
    }, [fetchAllMealPlans, fetchAllRecipes]);

    const handleViewCreatedRecipe = useCallback(async (recipeId: string) => {
        await fetchAllRecipes();
        (navigation as { navigate: (name: string, params?: object) => void }).navigate('Main', {
            screen: 'RecipesTab',
            params: { recipeId },
        });
    }, [fetchAllRecipes, navigation]);

    const handleViewShoppingList = useCallback(async () => {
        await fetchAllShoppingListItems();
        (navigation as { navigate: (name: string, params?: object) => void }).navigate('Main', {
            screen: 'ShoppingTab',
        });
    }, [fetchAllShoppingListItems, navigation]);

    const handleViewCalendar = useCallback(async () => {
        await fetchAllMealPlans();
        (navigation as { navigate: (name: string, params?: object) => void }).navigate('Main', {
            screen: 'CalendarTab',
        });
    }, [fetchAllMealPlans, navigation]);

    const handleViewPantry = useCallback(async () => {
        await fetchAllPantryItems();
        (navigation as { navigate: (name: string, params?: object) => void }).navigate('Main', {
            screen: 'PantryTab',
        });
    }, [fetchAllPantryItems, navigation]);

    const handleClearChat = () => {
        setMessages([{
            ...WELCOME_MESSAGE,
            id: `welcome-${Date.now()}`,
            content: "Chat cleared! Tell me what ingredients you have, and I'll suggest some recipes!",
            timestamp: Date.now(),
        }]);
    };

    const renderMessage = useCallback(({ item }: { item: Message }) => (
        <ChatMessageRow
            item={item}
            addingToMenuRecipeId={addingToMenuRecipeId}
            onViewCreatedRecipe={handleViewCreatedRecipe}
            onAddCreatedRecipeToMenu={handleAddCreatedRecipeToMenu}
            onViewShoppingList={handleViewShoppingList}
            onViewCalendar={handleViewCalendar}
            onViewPantry={handleViewPantry}
        />
    ), [
        addingToMenuRecipeId,
        handleViewCreatedRecipe,
        handleAddCreatedRecipeToMenu,
        handleViewShoppingList,
        handleViewCalendar,
        handleViewPantry,
    ]);

    return (
        <View className="flex-1 bg-linen">
            <AppHeader
                title={t('ai.title')}
                showBackButton
                rightElement={<RefreshCwIcon size={20} color={colors.ink} />}
                onRightPress={handleClearChat}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
                keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
            >
                {!historyReady ? (
                    <View className="flex-1 px-4 pt-4">
                        <SkeletonList count={4} />
                    </View>
                ) : (
                    <FlashList
                        ref={flatListRef}
                        data={messages}
                        renderItem={renderMessage}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
                        keyboardShouldPersistTaps="handled"
                    />
                )}

                {isTyping && (
                    <View className="px-4 pb-2">
                        <View className="bg-surface rounded-2xl px-4 py-3 self-start border border-line flex-row items-center gap-2">
                            <ActivityIndicator size="small" color={colors.herb} />
                            <Text className="text-muted">Thinking...</Text>
                        </View>
                    </View>
                )}

                <View
                    className="bg-surface border-t border-line px-3 pt-3"
                    style={{ paddingBottom: Math.max(insets.bottom, 12) }}
                >
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        className="mb-3"
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={{ paddingHorizontal: 2 }}
                    >
                        {SUGGESTED_PROMPTS.map((prompt) => (
                            <TouchableOpacity
                                key={prompt}
                                onPress={() => setInput(prompt)}
                                className="bg-sage px-3.5 py-2 rounded-full mr-2 border border-line"
                            >
                                <Text className="text-herb-deep text-sm">{prompt}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* ChatGPT / Claude-style pill composer */}
                    <View className="flex-row items-end gap-2.5">
                        <View className="flex-1 flex-row items-end rounded-[28px] border border-line bg-linen pl-4 pr-2 py-2 min-h-[56px]">
                            <TextInput
                                className="flex-1 text-ink"
                                style={{
                                    fontSize: 16,
                                    lineHeight: 22,
                                    maxHeight: INPUT_MAX_HEIGHT,
                                    height: Math.max(inputHeight, INPUT_MIN_HEIGHT),
                                    paddingTop: Platform.OS === 'ios' ? 10 : 8,
                                    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
                                    marginRight: 8,
                                }}
                                placeholder="Message LarderMind"
                                placeholderTextColor={colors.muted}
                                value={input}
                                onChangeText={setInput}
                                onContentSizeChange={handleInputContentSizeChange}
                                multiline
                                textAlignVertical="top"
                                blurOnSubmit={false}
                                editable={!isTyping}
                                returnKeyType="default"
                            />
                            <TouchableOpacity
                                onPress={handleSend}
                                disabled={!canSend}
                                accessibilityRole="button"
                                accessibilityLabel="Send message"
                                className={`w-11 h-11 rounded-full items-center justify-center mb-0.5 ${
                                    canSend ? 'bg-herb' : 'bg-sage'
                                }`}
                            >
                                <SendIcon size={20} color={canSend ? colors.onHerb : colors.muted} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}
