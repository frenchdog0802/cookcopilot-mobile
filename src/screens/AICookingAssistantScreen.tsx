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
import { chatApi, ChatResponseData } from '../api/chat';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    type?: 'text' | 'recipe';
    recipe?: RecipeSuggestion;
    timestamp: number;
}

export default function AICookingAssistantScreen() {
    const navigation = useNavigation();
    const { pantryItems, addRecipe, addShoppingListItem, folders } = usePantry();
    const flatListRef = useRef<FlatList>(null);

    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: "Hi! I'm your AI Cooking Assistant. Tell me what ingredients you have, and I'll suggest some recipes!",
            timestamp: Date.now(),
        },
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const [savedRecipes, setSavedRecipes] = useState<RecipeSuggestion[]>([]);
    const [showSaved, setShowSaved] = useState(false);

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
            console.log('AI Response:', response);

            if (response.success && response.data) {
                const aiData = response.data;

                let messageContent = aiData.message;
                let recipe: RecipeSuggestion | undefined;
                let messageType: 'text' | 'recipe' = 'text';

                if (aiData.type === 'recipe' && aiData.data) {
                    messageType = 'recipe';
                    // Map backend recipe data to frontend RecipeSuggestion
                    recipe = {
                        id: `recipe-${Date.now()}`,
                        name: aiData.data.title,
                        ingredients: aiData.data.ingredients,
                        instructions: aiData.data.steps,
                        cookTime: 0, // Not provided by backend currently
                        difficulty: 'Medium', // Not provided by backend currently
                    };
                } else if (aiData.type === 'tip') {
                    messageContent = aiData.data?.content || messageContent;
                } else if (aiData.type === 'clarification') {
                    messageContent = aiData.data?.question || messageContent;
                }

                const aiMessage: Message = {
                    id: `ai-${Date.now()}`,
                    role: 'assistant',
                    content: messageContent,
                    type: messageType,
                    recipe,
                    timestamp: Date.now(),
                };

                setMessages((prev) => [...prev, aiMessage]);
            } else {
                const errorMessage: Message = {
                    id: `error-${Date.now()}`,
                    role: 'assistant',
                    content: "Sorry, I couldn't get a response. Please try again.",
                    timestamp: Date.now(),
                };
                setMessages((prev) => [...prev, errorMessage]);
            }

        } catch (error) {
            console.error(error);
            const errorMessage: Message = {
                id: `error-${Date.now()}`,
                role: 'assistant',
                content: "Network error. Please check your connection.",
                timestamp: Date.now(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
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

    const handleAddToShoppingList = async (recipe: RecipeSuggestion) => {
        for (const ingredient of recipe.ingredients) {
            await addShoppingListItem({
                name: ingredient.name,
                quantity: ingredient.quantity,
                unit: ingredient.unit,
                checked: false,
            });
        }
        Alert.alert('Success', 'Ingredients added to shopping list!');
    };

    const handleClearChat = () => {
        setMessages([
            {
                id: 'welcome',
                role: 'assistant',
                content: "Chat cleared! Tell me what ingredients you have, and I'll suggest some recipes!",
                timestamp: Date.now(),
            },
        ]);
        setSavedRecipes([]);
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isUser = item.role === 'user';

        return (
            <View className={`mb-4 ${isUser ? 'items-end' : 'items-start'}`}>
                <View
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${isUser ? 'bg-orange-500' : 'bg-white border border-gray-200'
                        }`}
                >
                    <Text className={isUser ? 'text-white' : 'text-gray-800'}>{item.content}</Text>

                    {/* Recipe Card */}
                    {item.type === 'recipe' && item.recipe && (
                        <View className="mt-3 bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <Text className="font-bold text-lg text-gray-800 mb-2">{item.recipe.name}</Text>

                            {/* <View className="flex-row gap-4 mb-3">
                                <Text className="text-sm text-gray-500">⏱ {item.recipe.cookTime} min</Text>
                                <Text className="text-sm text-gray-500">📊 {item.recipe.difficulty}</Text>
                            </View> */}

                            <Text className="font-medium text-gray-700 mb-1">Ingredients:</Text>
                            {item.recipe.ingredients.map((ing, idx) => (
                                <Text key={idx} className="text-sm text-gray-600 ml-2">
                                    • {ing.name} ({ing.quantity} {ing.unit})
                                </Text>
                            ))}

                            <Text className="font-medium text-gray-700 mt-3 mb-1">Instructions:</Text>
                            {item.recipe.instructions.map((step, idx) => (
                                <Text key={idx} className="text-sm text-gray-600 ml-2 mb-1">
                                    {idx + 1}. {step}
                                </Text>
                            ))}

                            {/* Action Buttons */}
                            <View className="flex-row gap-2 mt-4">
                                <TouchableOpacity
                                    onPress={() => handleSaveRecipe(item.recipe!)}
                                    className="flex-1 flex-row items-center justify-center bg-blue-50 py-2 rounded-lg"
                                >
                                    <SaveIcon size={16} color="#3b82f6" />
                                    <Text className="text-blue-600 ml-1 text-sm">Save</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => handleAddToRecipes(item.recipe!)}
                                    className="flex-1 flex-row items-center justify-center bg-green-50 py-2 rounded-lg"
                                >
                                    <Text className="text-green-600 text-sm">+ Recipes</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => handleAddToShoppingList(item.recipe!)}
                                    className="flex-1 flex-row items-center justify-center bg-orange-50 py-2 rounded-lg"
                                >
                                    <ShoppingCartIcon size={16} color="#f97316" />
                                    <Text className="text-orange-600 ml-1 text-sm">Shop</Text>
                                </TouchableOpacity>
                            </View>
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

            {/* Saved Recipes Toggle */}
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

            {/* Saved Recipes Panel */}
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

            {/* Messages */}
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

                {/* Typing Indicator */}
                {isTyping && (
                    <View className="px-4 pb-2">
                        <View className="bg-white rounded-2xl px-4 py-3 self-start border border-gray-200 flex-row items-center gap-2">
                            <ActivityIndicator size="small" color="#f97316" />
                            <Text className="text-gray-500">Thinking...</Text>
                        </View>
                    </View>
                )}

                {/* Input Area */}
                <View className="px-4 py-3 bg-white border-t border-gray-200">
                    <View className="flex-row items-center gap-2">
                        <TextInput
                            className="flex-1 bg-gray-100 rounded-xl px-4 py-3"
                            placeholder="What ingredients do you have?"
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
