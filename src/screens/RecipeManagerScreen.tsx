/**
 * RecipeManagerScreen - Connected to Real Backend API
 * 
 * This screen manages recipes and folders with full CRUD operations
 * connected to the backend API.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Image,
    Modal,
    ActivityIndicator,
    Alert,
    RefreshControl,
} from 'react-native';
import {
    PlusIcon,
    TrashIcon,
    SearchIcon,
    EditIcon,
    XIcon,
    FolderIcon,
    ChevronRightIcon,
    HomeIcon,
    MoreVerticalIcon,
    FolderPlusIcon,
    PencilIcon,
    AlertCircleIcon,
    PackageIcon,
    CameraIcon,
    ImageIcon,
} from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import AppHeader from '../components/AppHeader';

// API imports
import { recipeApi } from '../api/recipe';
import { folderApi } from '../api/folder';
import { Recipe, Folder, ApiResponse } from '../types';

// ============================================================================
// TYPES (Local interfaces for component state)
// ============================================================================
interface Ingredient {
    name: string;
    quantity: number;
    unit: string;
}

// Default folders that always exist (created on backend if not present)
const DEFAULT_FOLDER_NAMES = ['Uncategorized', 'Favorites', 'Breakfast', 'Lunch', 'Dinner'];

export default function RecipeManagerScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const recipeIdParam = (route.params as { recipeId?: string } | undefined)?.recipeId;

    // ========================================================================
    // STATE - Data from API
    // ========================================================================
    const [folders, setFolders] = useState<Folder[]>([]);
    const [recipes, setRecipes] = useState<Recipe[]>([]);

    // ========================================================================
    // STATE - Loading and Error
    // ========================================================================
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ========================================================================
    // STATE - UI Navigation
    // ========================================================================
    const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [showAddRecipe, setShowAddRecipe] = useState(false);

    // ========================================================================
    // STATE - Folder Modals
    // ========================================================================
    const [showAddFolder, setShowAddFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
    const [showFolderActions, setShowFolderActions] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [folderToDelete, setFolderToDelete] = useState<Folder | null>(null);

    // ========================================================================
    // STATE - New/Edit Recipe Form
    // ========================================================================
    const [newRecipe, setNewRecipe] = useState<Partial<Recipe>>({
        meal_name: '',
        ingredients: [{ name: '', quantity: 1, unit: '' }],
        image: null,
        folder_id: '',
        instructions: [],
    });

    // ========================================================================
    // API CALLS - Fetch Data
    // ========================================================================

    /**
     * Fetch all folders from the backend
     */
    const fetchFolders = useCallback(async () => {
        try {
            const response = await folderApi.list();
            if (response.success && response.data) {
                setFolders(response.data);
            } else {
                console.error('[RecipeManager] Failed to fetch folders:', response.message);
            }
        } catch (err) {
            console.error('[RecipeManager] Error fetching folders:', err);
        }
    }, []);

    /**
     * Fetch all recipes from the backend
     */
    const fetchRecipes = useCallback(async () => {
        try {
            const response = await recipeApi.list();
            if (response.success && response.data) {
                setRecipes(response.data);
            } else {
                console.error('[RecipeManager] Failed to fetch recipes:', response.message);
            }
        } catch (err) {
            console.error('[RecipeManager] Error fetching recipes:', err);
        }
    }, []);

    /**
     * Initial data load
     */
    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            await Promise.all([fetchFolders(), fetchRecipes()]);
        } catch (err) {
            setError('Failed to load data. Please try again.');
            console.error('[RecipeManager] Load error:', err);
        } finally {
            setLoading(false);
        }
    }, [fetchFolders, fetchRecipes]);

    /**
     * Pull-to-refresh handler
     */
    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    }, [loadData]);

    // Load data on mount
    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        if (!recipeIdParam || recipes.length === 0) {
            return;
        }
        const match = recipes.find((recipe) => recipe.id === recipeIdParam);
        if (match) {
            setSelectedRecipe(match);
        }
    }, [recipeIdParam, recipes]);

    // ========================================================================
    // COMPUTED VALUES
    // ========================================================================

    /**
     * Filter recipes based on current folder and search query
     */
    const filteredRecipes = recipes.filter((recipe) => {
        // Filter by folder
        if (currentFolder && recipe.folder_id !== currentFolder.id) return false;

        // Filter by search query
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        const matchesName = recipe.meal_name.toLowerCase().includes(query);
        const matchesIngredient = recipe.ingredients?.some(
            (item) => item.name.toLowerCase().includes(query)
        );
        return matchesName || matchesIngredient;
    });

    // ========================================================================
    // FOLDER HANDLERS
    // ========================================================================

    /**
     * Create a new folder via API
     */
    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;

        setSaving(true);
        try {
            const response = await folderApi.create({
                name: newFolderName.trim(),
                icon: 'FolderIcon',
            });

            if (response.success && response.data) {
                setFolders([...folders, response.data]);
                setNewFolderName('');
                setShowAddFolder(false);
            } else {
                Alert.alert('Error', response.message || 'Failed to create folder');
            }
        } catch (err) {
            console.error('[RecipeManager] Create folder error:', err);
            Alert.alert('Error', 'Failed to create folder. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    /**
     * Update folder name via API
     */
    const handleUpdateFolder = async () => {
        if (!editingFolder || !newFolderName.trim()) return;

        setSaving(true);
        try {
            const response = await folderApi.update(editingFolder.id, {
                name: newFolderName.trim(),
            });

            if (response.success && response.data) {
                setFolders(folders.map((f) => (f.id === editingFolder.id ? response.data! : f)));
                setEditingFolder(null);
                setNewFolderName('');
            } else {
                Alert.alert('Error', response.message || 'Failed to update folder');
            }
        } catch (err) {
            console.error('[RecipeManager] Update folder error:', err);
            Alert.alert('Error', 'Failed to update folder. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    /**
     * Delete folder via API
     * TODO: Backend should handle moving recipes to 'Uncategorized' or we need to do it here
     */
    const handleDeleteFolder = async () => {
        if (!folderToDelete) return;

        setSaving(true);
        try {
            const response = await folderApi.delete(folderToDelete.id);

            if (response.success) {
                // Remove folder from state
                setFolders(folders.filter((f) => f.id !== folderToDelete.id));

                // Update recipes that were in this folder to 'uncategorized'
                // Note: This should ideally be handled by the backend
                const uncategorizedFolder = folders.find(
                    (f) => f.name.toLowerCase() === 'uncategorized'
                );
                if (uncategorizedFolder) {
                    setRecipes(
                        recipes.map((r) =>
                            r.folder_id === folderToDelete.id
                                ? { ...r, folder_id: uncategorizedFolder.id }
                                : r
                        )
                    );
                }

                setFolderToDelete(null);
                setShowDeleteConfirm(false);
                if (currentFolder?.id === folderToDelete.id) setCurrentFolder(null);
            } else {
                Alert.alert('Error', response.message || 'Failed to delete folder');
            }
        } catch (err) {
            console.error('[RecipeManager] Delete folder error:', err);
            Alert.alert('Error', 'Failed to delete folder. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    // ========================================================================
    // RECIPE HANDLERS
    // ========================================================================

    /**
     * Add new ingredient row to form
     */
    const handleAddIngredient = () => {
        if (isEditing && selectedRecipe) {
            setSelectedRecipe({
                ...selectedRecipe,
                ingredients: [...(selectedRecipe.ingredients || []), { name: '', quantity: 1, unit: '' }],
            });
        } else {
            setNewRecipe({
                ...newRecipe,
                ingredients: [...(newRecipe.ingredients || []), { name: '', quantity: 1, unit: '' }],
            });
        }
    };

    /**
     * Update ingredient field
     */
    const handleUpdateIngredient = (index: number, field: string, value: any) => {
        if (isEditing && selectedRecipe) {
            const updated = [...(selectedRecipe.ingredients || [])];
            updated[index] = {
                ...updated[index],
                [field]: field === 'quantity' ? parseFloat(value) || 0 : value,
            };
            setSelectedRecipe({ ...selectedRecipe, ingredients: updated });
        } else {
            const updated = [...(newRecipe.ingredients || [])];
            updated[index] = {
                ...updated[index],
                [field]: field === 'quantity' ? parseFloat(value) || 0 : value,
            };
            setNewRecipe({ ...newRecipe, ingredients: updated });
        }
    };

    /**
     * Remove ingredient row
     */
    const handleRemoveIngredient = (index: number) => {
        if (isEditing && selectedRecipe) {
            setSelectedRecipe({
                ...selectedRecipe,
                ingredients: (selectedRecipe.ingredients || []).filter((_, i) => i !== index),
            });
        } else {
            setNewRecipe({
                ...newRecipe,
                ingredients: (newRecipe.ingredients || []).filter((_, i) => i !== index),
            });
        }
    };

    /**
     * Save recipe (create or update) via API
     */
    const handleSaveRecipe = async () => {
        setSaving(true);
        try {
            if (isEditing && selectedRecipe) {
                // Update existing recipe
                const response = await recipeApi.update(selectedRecipe.id, {
                    meal_name: selectedRecipe.meal_name,
                    ingredients: selectedRecipe.ingredients,
                    folder_id: selectedRecipe.folder_id,
                    instructions: selectedRecipe.instructions,
                    image: selectedRecipe.image,
                });

                if (response.success && response.data) {
                    setRecipes(recipes.map((r) => (r.id === selectedRecipe.id ? response.data! : r)));
                    setSelectedRecipe(null);
                    setIsEditing(false);
                } else {
                    Alert.alert('Error', response.message || 'Failed to update recipe');
                }
            } else {
                // Create new recipe
                const recipeData: Partial<Recipe> = {
                    meal_name: newRecipe.meal_name,
                    ingredients: newRecipe.ingredients,
                    folder_id: currentFolder?.id || newRecipe.folder_id,
                    instructions: newRecipe.instructions || [],
                    image: newRecipe.image || null,
                };

                const response = await recipeApi.create(recipeData);

                if (response.success && response.data) {
                    setRecipes([...recipes, response.data]);
                    // Reset form
                    setNewRecipe({
                        meal_name: '',
                        ingredients: [{ name: '', quantity: 1, unit: '' }],
                        image: null,
                        folder_id: '',
                        instructions: [],
                    });
                    setShowAddRecipe(false);
                } else {
                    Alert.alert('Error', response.message || 'Failed to create recipe');
                }
            }
        } catch (err) {
            console.error('[RecipeManager] Save recipe error:', err);
            Alert.alert('Error', 'Failed to save recipe. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    /**
     * Delete recipe via API
     */
    const handleDeleteRecipe = async (recipeId: string) => {
        Alert.alert('Delete Recipe', 'Are you sure you want to delete this recipe?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        const response = await recipeApi.delete(recipeId);
                        if (response.success) {
                            setRecipes(recipes.filter((r) => r.id !== recipeId));
                        } else {
                            Alert.alert('Error', response.message || 'Failed to delete recipe');
                        }
                    } catch (err) {
                        console.error('[RecipeManager] Delete recipe error:', err);
                        Alert.alert('Error', 'Failed to delete recipe. Please try again.');
                    }
                },
            },
        ]);
    };

    // ========================================================================
    // IMAGE PICKER HANDLERS
    // ========================================================================

    /**
     * Pick image from gallery
     */
    const pickImage = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert('Permission Required', 'Please allow access to your photo library.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            const imageData = { public_id: '', url: result.assets[0].uri };
            if (isEditing && selectedRecipe) {
                setSelectedRecipe({ ...selectedRecipe, image: imageData });
            } else {
                setNewRecipe({ ...newRecipe, image: imageData });
            }
        }
    };

    /**
     * Take photo with camera
     */
    const takePhoto = async () => {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
            Alert.alert('Permission Required', 'Please allow access to your camera.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            const imageData = { public_id: '', url: result.assets[0].uri };
            if (isEditing && selectedRecipe) {
                setSelectedRecipe({ ...selectedRecipe, image: imageData });
            } else {
                setNewRecipe({ ...newRecipe, image: imageData });
            }
        }
    };

    /**
     * Remove uploaded image
     */
    const removeImage = () => {
        if (isEditing && selectedRecipe) {
            setSelectedRecipe({ ...selectedRecipe, image: null });
        } else {
            setNewRecipe({ ...newRecipe, image: null });
        }
    };

    /**
     * Handle instructions text change
     */
    const handleInstructionsChange = (text: string) => {
        const instructionsArray = text.split('\n').filter(line => line.trim());
        if (isEditing && selectedRecipe) {
            setSelectedRecipe({ ...selectedRecipe, instructions: instructionsArray });
        } else {
            setNewRecipe({ ...newRecipe, instructions: instructionsArray });
        }
    };

    /**
     * Get instructions as text
     */
    const getInstructionsText = () => {
        if (isEditing && selectedRecipe) {
            return (selectedRecipe.instructions || []).join('\n');
        }
        return (newRecipe.instructions || []).join('\n');
    };

    // ========================================================================
    // RENDER HELPERS
    // ========================================================================

    /**
     * Render folder card
     */
    const renderFolderCard = ({ item: folder }: { item: Folder }) => (
        <TouchableOpacity
            onPress={() => setCurrentFolder(folder)}
            className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100"
        >
            <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                    <FolderIcon size={20} color="#f59e0b" />
                    <Text className="font-medium text-gray-800 ml-2">{folder.name}</Text>
                </View>
                <View className="flex-row items-center">
                    <Text className="text-gray-500 text-sm mr-2">
                        {recipes.filter((r) => r.folder_id === folder.id).length} recipes
                    </Text>
                    <TouchableOpacity
                        onPress={() => setShowFolderActions(showFolderActions === folder.id ? null : folder.id)}
                        className="p-1"
                    >
                        <MoreVerticalIcon size={18} color="#6b7280" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Folder Actions Dropdown */}
            {showFolderActions === folder.id && (
                <View className="absolute right-2 top-12 bg-white rounded-lg shadow-lg border border-gray-200 z-10 w-36">
                    <TouchableOpacity
                        onPress={() => {
                            setEditingFolder(folder);
                            setNewFolderName(folder.name);
                            setShowFolderActions(null);
                        }}
                        className="flex-row items-center p-3 border-b border-gray-100"
                    >
                        <PencilIcon size={14} color="#374151" />
                        <Text className="text-gray-700 ml-2">Rename</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => {
                            setNewRecipe({ ...newRecipe, folder_id: folder.id });
                            setShowAddRecipe(true);
                            setShowFolderActions(null);
                        }}
                        className="flex-row items-center p-3 border-b border-gray-100"
                    >
                        <PlusIcon size={14} color="#374151" />
                        <Text className="text-gray-700 ml-2">Add Recipe</Text>
                    </TouchableOpacity>
                    {folder.name.toLowerCase() !== 'uncategorized' && (
                        <TouchableOpacity
                            onPress={() => {
                                setFolderToDelete(folder);
                                setShowDeleteConfirm(true);
                                setShowFolderActions(null);
                            }}
                            className="flex-row items-center p-3"
                        >
                            <TrashIcon size={14} color="#dc2626" />
                            <Text className="text-red-600 ml-2">Delete</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </TouchableOpacity>
    );

    /**
     * Render recipe card
     */
    const renderRecipeCard = ({ item: recipe }: { item: Recipe }) => (
        <TouchableOpacity
            onPress={() => {
                setSelectedRecipe(recipe);
                setIsEditing(false);
            }}
            className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100"
        >
            <View className="flex-row justify-between items-start">
                <View className="flex-1">
                    <Text className="font-medium text-gray-800 text-lg">{recipe.meal_name}</Text>
                    <Text className="text-gray-500 text-sm mt-1">
                        {recipe.ingredients?.length || 0} ingredient
                        {(recipe.ingredients?.length || 0) !== 1 ? 's' : ''}
                    </Text>
                </View>
                <View className="flex-row">
                    <TouchableOpacity
                        onPress={() => {
                            setSelectedRecipe(recipe);
                            setIsEditing(true);
                        }}
                        className="p-2"
                    >
                        <EditIcon size={18} color="#3b82f6" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteRecipe(recipe.id)} className="p-2">
                        <TrashIcon size={18} color="#ef4444" />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );

    /**
     * Ingredient row component for forms
     */
    const IngredientRow = ({ item, index }: { item: Ingredient; index: number }) => (
        <View className="flex-row items-center mb-2 gap-2">
            <TextInput
                value={item.name}
                onChangeText={(text) => handleUpdateIngredient(index, 'name', text)}
                placeholder="Ingredient name"
                className="flex-1 p-3 border border-gray-200 rounded-lg bg-white"
            />
            <TextInput
                value={item.quantity.toString()}
                onChangeText={(text) => handleUpdateIngredient(index, 'quantity', text)}
                keyboardType="numeric"
                className="w-16 p-3 border border-gray-200 rounded-lg bg-white text-center"
            />
            <TextInput
                value={item.unit}
                onChangeText={(text) => handleUpdateIngredient(index, 'unit', text)}
                placeholder="Unit"
                className="w-16 p-3 border border-gray-200 rounded-lg bg-white"
            />
            <TouchableOpacity onPress={() => handleRemoveIngredient(index)} className="p-2">
                <TrashIcon size={18} color="#ef4444" />
            </TouchableOpacity>
        </View>
    );

    // ========================================================================
    // LOADING STATE
    // ========================================================================
    if (loading) {
        return (
            <View className="flex-1 bg-gray-50">
                <AppHeader title="Recipe Manager" showBackButton />
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#f97316" />
                    <Text className="text-gray-500 mt-4">Loading recipes...</Text>
                </View>
            </View>
        );
    }

    // ========================================================================
    // ERROR STATE
    // ========================================================================
    if (error) {
        return (
            <View className="flex-1 bg-gray-50">
                <AppHeader title="Recipe Manager" showBackButton />
                <View className="flex-1 items-center justify-center p-6">
                    <AlertCircleIcon size={48} color="#ef4444" />
                    <Text className="text-gray-700 text-lg mt-4 text-center">{error}</Text>
                    <TouchableOpacity
                        onPress={loadData}
                        className="mt-6 bg-orange-500 px-6 py-3 rounded-xl"
                    >
                        <Text className="text-white font-medium">Try Again</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // ========================================================================
    // MAIN RENDER
    // ========================================================================
    return (
        <View className="flex-1 bg-gray-50">
            <AppHeader title="Recipe Manager" showBackButton />

            <ScrollView
                className="flex-1 p-4"
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
            >
                {/* Breadcrumb */}
                <View className="flex-row items-center mb-4">
                    <TouchableOpacity onPress={() => setCurrentFolder(null)} className="flex-row items-center">
                        <HomeIcon size={16} color="#6b7280" />
                        <Text className="text-gray-600 ml-1">Categories</Text>
                    </TouchableOpacity>
                    {currentFolder && (
                        <>
                            <ChevronRightIcon size={16} color="#9ca3af" />
                            <Text className="text-gray-800 font-medium ml-1">{currentFolder.name}</Text>
                        </>
                    )}
                </View>

                {/* Main Content */}
                {!showAddRecipe && !selectedRecipe ? (
                    !currentFolder ? (
                        // Folder View
                        <View>
                            <View className="flex-row justify-between items-center mb-4">
                                <Text className="text-xl font-bold text-gray-800">Recipe Categories</Text>
                                <TouchableOpacity
                                    onPress={() => {
                                        setNewFolderName('');
                                        setShowAddFolder(true);
                                    }}
                                    className="flex-row items-center bg-red-50 px-3 py-2 rounded-lg"
                                >
                                    <FolderPlusIcon size={16} color="#dc2626" />
                                    <Text className="text-red-600 ml-1 font-medium">New</Text>
                                </TouchableOpacity>
                            </View>

                            {folders.length === 0 ? (
                                <View className="bg-white rounded-xl p-6 items-center">
                                    <FolderIcon size={48} color="#d1d5db" />
                                    <Text className="text-gray-500 mt-4">No categories yet</Text>
                                    <Text className="text-gray-400 text-sm mt-1">
                                        Create a category to organize your recipes
                                    </Text>
                                </View>
                            ) : (
                                <FlatList
                                    data={folders}
                                    renderItem={renderFolderCard}
                                    keyExtractor={(item) => item.id}
                                    scrollEnabled={false}
                                />
                            )}
                        </View>
                    ) : (
                        // Recipe List View
                        <View>
                            {/* Search */}
                            <View className="relative mb-4">
                                <View className="absolute left-3 top-3 z-10">
                                    <SearchIcon size={18} color="#9ca3af" />
                                </View>
                                <TextInput
                                    placeholder="Search recipes..."
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-gray-200"
                                />
                            </View>

                            {/* Add Recipe Button */}
                            <TouchableOpacity
                                onPress={() => {
                                    setNewRecipe({ ...newRecipe, folder_id: currentFolder.id });
                                    setShowAddRecipe(true);
                                }}
                                className="flex-row items-center justify-center bg-white border border-gray-200 py-3 rounded-xl mb-4"
                            >
                                <PlusIcon size={18} color="#374151" />
                                <Text className="text-gray-700 font-medium ml-2">Add New Recipe</Text>
                            </TouchableOpacity>

                            {/* Recipes List */}
                            {filteredRecipes.length === 0 ? (
                                <View className="bg-white rounded-xl p-6 items-center">
                                    <Text className="text-gray-500">No recipes found</Text>
                                </View>
                            ) : (
                                <FlatList
                                    data={filteredRecipes}
                                    renderItem={renderRecipeCard}
                                    keyExtractor={(item) => item.id}
                                    scrollEnabled={false}
                                />
                            )}
                        </View>
                    )
                ) : selectedRecipe ? (
                    // Recipe Detail/Edit View
                    <View className="bg-white rounded-xl overflow-hidden">
                        <View className="p-4 border-b border-gray-100 bg-gray-50 flex-row justify-between items-center">
                            <Text className="font-semibold text-gray-800">
                                {isEditing ? 'Edit Recipe' : 'Recipe Details'}
                            </Text>
                            <TouchableOpacity
                                onPress={() => {
                                    setSelectedRecipe(null);
                                    setIsEditing(false);
                                }}
                            >
                                <XIcon size={20} color="#6b7280" />
                            </TouchableOpacity>
                        </View>

                        <View className="p-4">
                            {isEditing ? (
                                // Edit Form
                                <View>
                                    <Text className="text-gray-700 mb-2">Meal Name</Text>
                                    <TextInput
                                        value={selectedRecipe.meal_name}
                                        onChangeText={(text) =>
                                            setSelectedRecipe({ ...selectedRecipe, meal_name: text })
                                        }
                                        className="w-full p-3 border border-gray-200 rounded-xl mb-4 bg-white"
                                    />

                                    <View className="flex-row justify-between items-center mb-2">
                                        <Text className="text-gray-700 font-medium">Ingredients</Text>
                                        <TouchableOpacity
                                            onPress={handleAddIngredient}
                                            className="flex-row items-center"
                                        >
                                            <PlusIcon size={16} color="#dc2626" />
                                            <Text className="text-red-600 ml-1">Add</Text>
                                        </TouchableOpacity>
                                    </View>

                                    {(selectedRecipe.ingredients || []).map((item, index) => (
                                        <IngredientRow key={index} item={item} index={index} />
                                    ))}

                                    <View className="flex-row gap-2 mt-4">
                                        <TouchableOpacity
                                            onPress={() => {
                                                setSelectedRecipe(null);
                                                setIsEditing(false);
                                            }}
                                            className="flex-1 bg-gray-100 py-3 rounded-lg"
                                        >
                                            <Text className="text-gray-700 text-center font-medium">Cancel</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={handleSaveRecipe}
                                            disabled={saving}
                                            className={`flex-1 py-3 rounded-lg ${saving ? 'bg-gray-300' : 'bg-red-600'
                                                }`}
                                        >
                                            {saving ? (
                                                <ActivityIndicator color="white" />
                                            ) : (
                                                <Text className="text-white text-center font-medium">
                                                    Save Changes
                                                </Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : (
                                // View Details
                                <View>
                                    <Text className="font-bold text-xl text-gray-800 mb-4">
                                        {selectedRecipe.meal_name}
                                    </Text>

                                    {selectedRecipe.image && (
                                        <Image
                                            source={{ uri: selectedRecipe.image.url }}
                                            className="w-full h-40 rounded-xl mb-4"
                                        />
                                    )}

                                    <View className="border-t border-b border-gray-100 py-4">
                                        <Text className="font-medium text-gray-700 mb-2">Ingredients</Text>
                                        {(selectedRecipe.ingredients || []).map((item, index) => (
                                            <View key={index} className="flex-row justify-between py-2">
                                                <Text className="text-gray-800 capitalize">{item.name}</Text>
                                                <Text className="text-gray-500">
                                                    {item.quantity} {item.unit}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>

                                    <View className="flex-row gap-2 mt-4">
                                        <TouchableOpacity
                                            onPress={() => setIsEditing(true)}
                                            className="flex-1 bg-blue-50 py-3 rounded-lg flex-row items-center justify-center"
                                        >
                                            <EditIcon size={16} color="#3b82f6" />
                                            <Text className="text-blue-600 font-medium ml-1">Edit Recipe</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity className="flex-1 bg-green-50 py-3 rounded-lg flex-row items-center justify-center">
                                            <PackageIcon size={16} color="#16a34a" />
                                            <Text className="text-green-600 font-medium ml-1">Add to Pantry</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>
                ) : (
                    // Add New Recipe Form
                    <View className="bg-white rounded-xl overflow-hidden">
                        <View className="p-4 border-b border-gray-100 bg-gray-50 flex-row justify-between items-center">
                            <Text className="font-semibold text-gray-800">Add New Recipe</Text>
                            <TouchableOpacity onPress={() => setShowAddRecipe(false)}>
                                <XIcon size={20} color="#6b7280" />
                            </TouchableOpacity>
                        </View>

                        <View className="p-4">
                            {/* Meal Name */}
                            <Text className="text-gray-700 mb-2">Meal Name *</Text>
                            <TextInput
                                value={newRecipe.meal_name}
                                onChangeText={(text) => setNewRecipe({ ...newRecipe, meal_name: text })}
                                placeholder="Enter meal name"
                                className="w-full p-3 border border-gray-200 rounded-xl mb-4 bg-white"
                            />

                            {/* Recipe Image */}
                            <Text className="text-gray-700 mb-2">Recipe Image</Text>
                            {newRecipe.image?.url ? (
                                <View className="relative mb-4">
                                    <Image
                                        source={{ uri: newRecipe.image.url }}
                                        className="w-full h-48 rounded-xl"
                                        resizeMode="cover"
                                    />
                                    <TouchableOpacity
                                        onPress={removeImage}
                                        className="absolute top-2 right-2 bg-black/50 p-2 rounded-full"
                                    >
                                        <XIcon size={16} color="white" />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View className="flex-row gap-3 mb-4">
                                    <TouchableOpacity
                                        onPress={takePhoto}
                                        className="flex-1 flex-row items-center justify-center py-3 bg-gray-100 rounded-xl border border-dashed border-gray-300"
                                    >
                                        <CameraIcon size={20} color="#6b7280" />
                                        <Text className="text-gray-600 ml-2">Camera</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={pickImage}
                                        className="flex-1 flex-row items-center justify-center py-3 bg-gray-100 rounded-xl border border-dashed border-gray-300"
                                    >
                                        <ImageIcon size={20} color="#6b7280" />
                                        <Text className="text-gray-600 ml-2">Gallery</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* Ingredients */}
                            <View className="flex-row justify-between items-center mb-2">
                                <Text className="text-gray-700 font-medium">Ingredients *</Text>
                                <TouchableOpacity onPress={handleAddIngredient} className="flex-row items-center">
                                    <PlusIcon size={16} color="#dc2626" />
                                    <Text className="text-red-600 ml-1">Add</Text>
                                </TouchableOpacity>
                            </View>

                            {(newRecipe.ingredients || []).map((item, index) => (
                                <IngredientRow key={index} item={item} index={index} />
                            ))}

                            {/* Instructions */}
                            <Text className="text-gray-700 mb-2 mt-4">Instructions / Steps</Text>
                            <TextInput
                                value={getInstructionsText()}
                                onChangeText={handleInstructionsChange}
                                placeholder="Enter cooking instructions (one step per line)"
                                multiline
                                numberOfLines={6}
                                textAlignVertical="top"
                                className="w-full p-3 border border-gray-200 rounded-xl mb-4 bg-white min-h-[120px]"
                            />

                            {/* Save Button */}
                            <TouchableOpacity
                                onPress={handleSaveRecipe}
                                disabled={
                                    !newRecipe.meal_name?.trim() ||
                                    (newRecipe.ingredients || []).length === 0 ||
                                    saving
                                }
                                className={`w-full py-3 rounded-xl mt-2 ${newRecipe.meal_name?.trim() && (newRecipe.ingredients || []).length > 0 && !saving
                                    ? 'bg-red-600'
                                    : 'bg-gray-200'
                                    }`}
                            >
                                {saving ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text
                                        className={`text-center font-medium ${newRecipe.meal_name?.trim() && (newRecipe.ingredients || []).length > 0
                                            ? 'text-white'
                                            : 'text-gray-400'
                                            }`}
                                    >
                                        Save Recipe
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Add Folder Modal */}
            <Modal visible={showAddFolder} transparent animationType="fade">
                <View className="flex-1 bg-black/50 items-center justify-center p-4">
                    <View className="bg-white rounded-xl w-full max-w-sm">
                        <View className="p-4 border-b border-gray-100 flex-row justify-between items-center">
                            <Text className="font-medium text-gray-800">Create New Category</Text>
                            <TouchableOpacity onPress={() => setShowAddFolder(false)}>
                                <XIcon size={20} color="#6b7280" />
                            </TouchableOpacity>
                        </View>
                        <View className="p-6">
                            <Text className="text-gray-700 mb-2">Category Name</Text>
                            <TextInput
                                value={newFolderName}
                                onChangeText={setNewFolderName}
                                placeholder="Enter category name"
                                className="w-full p-3 border border-gray-200 rounded-xl mb-4 bg-white"
                            />
                            <View className="flex-row gap-2">
                                <TouchableOpacity
                                    onPress={() => setShowAddFolder(false)}
                                    className="flex-1 bg-gray-100 py-3 rounded-lg"
                                >
                                    <Text className="text-gray-700 text-center">Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={handleCreateFolder}
                                    disabled={!newFolderName.trim() || saving}
                                    className={`flex-1 py-3 rounded-lg ${newFolderName.trim() && !saving ? 'bg-red-600' : 'bg-gray-200'
                                        }`}
                                >
                                    {saving ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <Text
                                            className={`text-center ${newFolderName.trim() ? 'text-white' : 'text-gray-400'
                                                }`}
                                        >
                                            Create
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Edit Folder Modal */}
            <Modal visible={!!editingFolder} transparent animationType="fade">
                <View className="flex-1 bg-black/50 items-center justify-center p-4">
                    <View className="bg-white rounded-xl w-full max-w-sm">
                        <View className="p-4 border-b border-gray-100 flex-row justify-between items-center">
                            <Text className="font-medium text-gray-800">Rename Category</Text>
                            <TouchableOpacity onPress={() => setEditingFolder(null)}>
                                <XIcon size={20} color="#6b7280" />
                            </TouchableOpacity>
                        </View>
                        <View className="p-6">
                            <Text className="text-gray-700 mb-2">Category Name</Text>
                            <TextInput
                                value={newFolderName}
                                onChangeText={setNewFolderName}
                                placeholder="Enter category name"
                                className="w-full p-3 border border-gray-200 rounded-xl mb-4 bg-white"
                            />
                            <View className="flex-row gap-2">
                                <TouchableOpacity
                                    onPress={() => setEditingFolder(null)}
                                    className="flex-1 bg-gray-100 py-3 rounded-lg"
                                >
                                    <Text className="text-gray-700 text-center">Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={handleUpdateFolder}
                                    disabled={!newFolderName.trim() || saving}
                                    className={`flex-1 py-3 rounded-lg ${newFolderName.trim() && !saving ? 'bg-red-600' : 'bg-gray-200'
                                        }`}
                                >
                                    {saving ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <Text
                                            className={`text-center ${newFolderName.trim() ? 'text-white' : 'text-gray-400'
                                                }`}
                                        >
                                            Update
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Delete Folder Confirmation Modal */}
            <Modal visible={showDeleteConfirm} transparent animationType="fade">
                <View className="flex-1 bg-black/50 items-center justify-center p-4">
                    <View className="bg-white rounded-xl w-full max-w-sm">
                        <View className="p-6">
                            <View className="flex-row items-center mb-4">
                                <AlertCircleIcon size={24} color="#dc2626" />
                                <Text className="text-lg font-medium text-red-600 ml-2">Delete Category</Text>
                            </View>
                            <Text className="text-gray-600 mb-2">
                                Are you sure you want to delete "{folderToDelete?.name}"?
                            </Text>
                            <Text className="text-gray-500 text-sm mb-6">
                                All recipes in this category will be moved to "Uncategorized".
                            </Text>
                            <View className="flex-row justify-end gap-3">
                                <TouchableOpacity
                                    onPress={() => setShowDeleteConfirm(false)}
                                    className="px-4 py-2 bg-gray-100 rounded-lg"
                                >
                                    <Text className="text-gray-700">Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={handleDeleteFolder}
                                    disabled={saving}
                                    className="px-4 py-2 bg-red-600 rounded-lg"
                                >
                                    {saving ? (
                                        <ActivityIndicator color="white" size="small" />
                                    ) : (
                                        <Text className="text-white">Delete</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}