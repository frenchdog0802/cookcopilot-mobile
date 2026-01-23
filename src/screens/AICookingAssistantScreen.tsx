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

    // Mock recipe suggestions based on input
    const generateRecipeSuggestion = (userInput: string): RecipeSuggestion => {
        const ingredients = userInput.toLowerCase();

        // Simple mock logic - in real app, this would call an AI API
        let recipe: RecipeSuggestion = {
            id: `recipe-${Date.now()}`,
            name: 'Quick Stir Fry',
            ingredients: [
                { name: 'Vegetables', quantity: 200, unit: 'g' },
                { name: 'Soy Sauce', quantity: 2, unit: 'tbsp' },
                { name: 'Oil', quantity: 1, unit: 'tbsp' },
            ],
            instructions: [
                'Heat oil in a wok over high heat',
                'Add vegetables and stir fry for 3-4 minutes',
                'Add soy sauce and toss to coat',
                'Serve hot with rice',
            ],
            cookTime: 15,
            difficulty: 'Easy',
        };

        if (ingredients.includes('pasta') || ingredients.includes('noodle')) {
            recipe = {
                id: `recipe-${Date.now()}`,
                name: 'Simple Pasta',
                ingredients: [
                    { name: 'Pasta', quantity: 200, unit: 'g' },
                    { name: 'Garlic', quantity: 2, unit: 'cloves' },
                    { name: 'Olive Oil', quantity: 3, unit: 'tbsp' },
                    { name: 'Parmesan', quantity: 50, unit: 'g' },
                ],
                instructions: [
                    'Boil pasta according to package directions',
                    'Sauté garlic in olive oil until golden',
                    'Toss drained pasta with garlic oil',
                    'Top with parmesan and serve',
                ],
                cookTime: 20,
                difficulty: 'Easy',
            };
        } else if (ingredients.includes('chicken')) {
            recipe = {
                id: `recipe-${Date.now()}`,
                name: 'Honey Garlic Chicken',
                ingredients: [
                    { name: 'Chicken Breast', quantity: 400, unit: 'g' },
                    { name: 'Honey', quantity: 3, unit: 'tbsp' },
                    { name: 'Garlic', quantity: 4, unit: 'cloves' },
                    { name: 'Soy Sauce', quantity: 2, unit: 'tbsp' },
                ],
                instructions: [
                    'Season chicken with salt and pepper',
                    'Sear chicken in a hot pan until golden',
                    'Add garlic, honey, and soy sauce',
                    'Simmer until chicken is cooked through',
                    'Garnish with green onions',
                ],
                cookTime: 25,
                difficulty: 'Medium',
            };
        }

        return recipe;
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage: Message = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: input,
            timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsTyping(true);

        // Simulate AI thinking
        setTimeout(() => {
            const recipe = generateRecipeSuggestion(input);

            const aiMessage: Message = {
                id: `ai-${Date.now()}`,
                role: 'assistant',
                content: `Based on what you have, here's a recipe suggestion:`,
                type: 'recipe',
                recipe,
                timestamp: Date.now(),
            };

            setMessages((prev) => [...prev, aiMessage]);
            setIsTyping(false);
        }, 1500);
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

                            <View className="flex-row gap-4 mb-3">
                                <Text className="text-sm text-gray-500">⏱ {item.recipe.cookTime} min</Text>
                                <Text className="text-sm text-gray-500">📊 {item.recipe.difficulty}</Text>
                            </View>

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
                        <View className="bg-white rounded-2xl px-4 py-3 self-start border border-gray-200">
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
                            disabled={!input.trim()}
                            className={`p-3 rounded-xl ${input.trim() ? 'bg-orange-500' : 'bg-gray-200'}`}
                        >
                            <SendIcon size={20} color={input.trim() ? 'white' : '#9ca3af'} />
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}