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
    CameraIcon,
    ImageIcon,
} from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import AppHeader from '../components/AppHeader';
import AskAiEmptyCta from '../components/AskAiEmptyCta';
import { UnitSelect, QuantityLabel, preferredUnitForIngredient } from '../components/UnitSelect';
import type { MeasurementSystem } from '../utils/units';

// API imports
import { recipeApi } from '../api/recipe';
import { folderApi } from '../api/folder';
import { Recipe, Folder, ApiResponse } from '../types';
import { normalizeRecipe, usePantry } from '../contexts/pantryContext';
import { colors } from '../theme/tokens';

function unwrapListResponse<T>(data: T[] | Record<string, T[] | undefined>, key: string): T[] {
    if (Array.isArray(data)) return data;
    const list = data[key];
    return Array.isArray(list) ? list : [];
}

function serializeRecipePayload(recipe: Partial<Recipe>): Record<string, unknown> {
    const instructions = recipe.instructions;
    return {
        ...recipe,
        instructions: Array.isArray(instructions)
            ? instructions.filter(Boolean).join('\n')
            : instructions ?? '',
        image: recipe.image?.url ? recipe.image : null,
    };
}

// ============================================================================
// TYPES (Local interfaces for component state)
// ============================================================================
interface Ingredient {
    name: string;
    quantity: number;
    unit: string;
    unit_kind?: string;
    base_unit?: string;
    default_display_unit?: string;
}

// Default folders that always exist (created on backend if not present)
const DEFAULT_FOLDER_NAMES = ['Uncategorized', 'Favorites', 'Breakfast', 'Lunch', 'Dinner'];

export default function RecipeManagerScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const recipeIdParam = (route.params as { recipeId?: string } | undefined)?.recipeId;
    const { userSettings } = usePantry();
    const measurementSystem = (userSettings.measurement_unit === 'imperial' ? 'imperial' : 'metric') as MeasurementSystem;

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
                const data = response.data as Recipe[] | { recipes?: Recipe[] };
                setRecipes(
                    unwrapListResponse(data, 'recipes').map((recipe) =>
                        normalizeRecipe(recipe as unknown as Record<string, unknown>)
                    )
                );
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
                const response = await recipeApi.update(
                    selectedRecipe.id,
                    serializeRecipePayload({
                        meal_name: selectedRecipe.meal_name,
                        ingredients: selectedRecipe.ingredients,
                        folder_id: selectedRecipe.folder_id,
                        instructions: selectedRecipe.instructions,
                        image: selectedRecipe.image,
                    }) as Partial<Recipe>
                );

                if (response.success && response.data) {
                    const raw = response.data as unknown;
                    const payload = (raw && typeof raw === 'object' && 'recipe' in (raw as object)
                        ? (raw as { recipe: Record<string, unknown> }).recipe
                        : raw) as Record<string, unknown>;
                    const saved = normalizeRecipe(payload);
                    setRecipes(recipes.map((r) => (r.id === selectedRecipe.id ? saved : r)));
                    setSelectedRecipe(null);
                    setIsEditing(false);
                } else {
                    Alert.alert('Error', response.message || 'Failed to update recipe');
                }
            } else {
                // Create new recipe
                const recipeData = serializeRecipePayload({
                    meal_name: newRecipe.meal_name,
                    ingredients: newRecipe.ingredients,
                    folder_id: newRecipe.folder_id || currentFolder?.id,
                    instructions: newRecipe.instructions || [],
                    image: newRecipe.image || null,
                }) as Partial<Recipe>;

                const response = await recipeApi.create(recipeData);

                if (response.success && response.data) {
                    const raw = response.data as unknown;
                    const payload = (raw && typeof raw === 'object' && 'recipe' in (raw as object)
                        ? (raw as { recipe: Record<string, unknown> }).recipe
                        : raw) as Record<string, unknown>;
                    setRecipes([...recipes, normalizeRecipe(payload)]);
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
            className="bg-surface rounded-xl p-4 mb-3 border border-line"
        >
            <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                    <FolderIcon size={20} color={colors.herb} />
                    <Text className="font-medium text-ink ml-2">{folder.name}</Text>
                </View>
                <View className="flex-row items-center">
                    <Text className="text-muted text-sm mr-2">
                        {recipes.filter((r) => r.folder_id === folder.id).length} recipes
                    </Text>
                    <TouchableOpacity
                        onPress={() => setShowFolderActions(showFolderActions === folder.id ? null : folder.id)}
                        className="p-1"
                    >
                        <MoreVerticalIcon size={18} color={colors.muted} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Folder Actions Dropdown */}
            {showFolderActions === folder.id && (
                <View className="absolute right-2 top-12 bg-surface rounded-lg border border-line z-10 w-36">
                    <TouchableOpacity
                        onPress={() => {
                            setEditingFolder(folder);
                            setNewFolderName(folder.name);
                            setShowFolderActions(null);
                        }}
                        className="flex-row items-center p-3 border-b border-line"
                    >
                        <PencilIcon size={14} color={colors.ink} />
                        <Text className="text-ink ml-2">Rename</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => {
                            setNewRecipe({ ...newRecipe, folder_id: folder.id });
                            setShowAddRecipe(true);
                            setShowFolderActions(null);
                        }}
                        className="flex-row items-center p-3 border-b border-line"
                    >
                        <PlusIcon size={14} color={colors.ink} />
                        <Text className="text-ink ml-2">Add Recipe</Text>
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
                            <TrashIcon size={14} color={colors.danger} />
                            <Text className="ml-2" style={{ color: colors.danger }}>Delete</Text>
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
            className="bg-surface rounded-xl p-4 mb-3 border border-line"
        >
            <View className="flex-row justify-between items-start">
                <View className="flex-1">
                    <Text className="font-medium text-ink text-lg">{recipe.meal_name}</Text>
                    <Text className="text-muted text-sm mt-1">
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
                        <EditIcon size={18} color={colors.herb} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteRecipe(recipe.id)} className="p-2">
                        <TrashIcon size={18} color={colors.danger} />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );

    /**
     * Ingredient row component for forms
     */
    const IngredientRow = ({ item, index }: { item: Ingredient; index: number }) => (
        <View className="mb-2 gap-2">
            <View className="flex-row items-center gap-2">
                <TextInput
                    value={item.name}
                    onChangeText={(text) => handleUpdateIngredient(index, 'name', text)}
                    placeholder="Ingredient name"
                    className="flex-1 p-3 border border-line rounded-lg bg-linen text-ink"
                />
                <TextInput
                    value={item.quantity.toString()}
                    onChangeText={(text) => handleUpdateIngredient(index, 'quantity', text)}
                    keyboardType="numeric"
                    className="w-16 p-3 border border-line rounded-lg bg-linen text-ink text-center"
                />
                <TouchableOpacity onPress={() => handleRemoveIngredient(index)} className="p-2">
                    <TrashIcon size={18} color={colors.danger} />
                </TouchableOpacity>
            </View>
            <UnitSelect
                kind={preferredUnitForIngredient(item, measurementSystem).kind}
                value={item.unit}
                onChange={(unit) => handleUpdateIngredient(index, 'unit', unit)}
                measurementSystem={measurementSystem}
                preferSystemUnits
            />
        </View>
    );

    const handleNavigateBack = () => {
        if (showAddRecipe) {
            setShowAddRecipe(false);
            return;
        }
        if (selectedRecipe) {
            setSelectedRecipe(null);
            setIsEditing(false);
            return;
        }
        if (currentFolder) {
            setCurrentFolder(null);
            return;
        }
        navigation.goBack();
    };

    const renderFolderPicker = (
        selectedFolderId: string | undefined,
        onSelect: (folderId: string) => void
    ) => (
        <View className="mb-4">
            <Text className="text-ink mb-2">Folder</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {folders.map((folder) => {
                    const selected = (selectedFolderId || '') === folder.id;
                    return (
                        <TouchableOpacity
                            key={folder.id}
                            onPress={() => onSelect(folder.id)}
                            className={`mr-2 px-3 py-2 rounded-full border ${
                                selected ? 'bg-herb border-herb' : 'bg-surface border-line'
                            }`}
                        >
                            <Text className={selected ? 'text-white font-medium' : 'text-ink'}>
                                {folder.name}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );

    // ========================================================================
    // LOADING STATE
    // ========================================================================
    if (loading) {
        return (
            <View className="flex-1 bg-linen">
                <AppHeader title="Recipe Manager" showBackButton onBack={handleNavigateBack} />
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={colors.herb} />
                    <Text className="text-muted mt-4">Loading recipes...</Text>
                </View>
            </View>
        );
    }

    // ========================================================================
    // ERROR STATE
    // ========================================================================
    if (error) {
        return (
            <View className="flex-1 bg-linen">
                <AppHeader title="Recipe Manager" showBackButton onBack={handleNavigateBack} />
                <View className="flex-1 items-center justify-center p-6">
                    <AlertCircleIcon size={48} color={colors.danger} />
                    <Text className="text-ink text-lg mt-4 text-center">{error}</Text>
                    <TouchableOpacity
                        onPress={loadData}
                        className="mt-6 bg-herb px-6 py-3 rounded-xl"
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
        <View className="flex-1 bg-linen">
            <AppHeader title="Recipe Manager" showBackButton onBack={handleNavigateBack} />

            <ScrollView
                className="flex-1 p-4"
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.herb} colors={[colors.herb]} />
                }
            >
                {/* Breadcrumb */}
                <View className="flex-row items-center mb-4">
                    {currentFolder && (
                        <TouchableOpacity
                            onPress={() => setCurrentFolder(null)}
                            className="mr-2 p-1"
                            accessibilityLabel="Back to categories"
                        >
                            <ChevronRightIcon
                                size={18}
                                color={colors.muted}
                                style={{ transform: [{ rotate: '180deg' }] }}
                            />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={() => setCurrentFolder(null)} className="flex-row items-center">
                        <HomeIcon size={16} color={colors.muted} />
                        <Text className="text-muted ml-1">Categories</Text>
                    </TouchableOpacity>
                    {currentFolder && (
                        <>
                            <ChevronRightIcon size={16} color={colors.muted} />
                            <Text className="text-ink font-medium ml-1">{currentFolder.name}</Text>
                        </>
                    )}
                </View>

                {/* Main Content */}
                {!showAddRecipe && !selectedRecipe ? (
                    !currentFolder ? (
                        // Folder View
                        <View>
                            <View className="flex-row justify-between items-center mb-4">
                                <Text className="text-xl font-bold text-ink">Recipe Categories</Text>
                                <TouchableOpacity
                                    onPress={() => {
                                        setNewFolderName('');
                                        setShowAddFolder(true);
                                    }}
                                    className="flex-row items-center bg-sage px-3 py-2 rounded-lg border border-line"
                                >
                                    <FolderPlusIcon size={16} color={colors.danger} />
                                    <Text className="text-herb-deep ml-1 font-medium">New</Text>
                                </TouchableOpacity>
                            </View>

                            {folders.length === 0 ? (
                                <View className="bg-surface rounded-xl p-6 items-center border border-line">
                                    <FolderIcon size={48} color={colors.line} />
                                    <Text className="text-muted mt-4">No categories yet</Text>
                                    <Text className="text-muted text-sm mt-1">
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
                                    <SearchIcon size={18} color={colors.muted} />
                                </View>
                                <TextInput
                                    placeholder="Search recipes..."
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    className="w-full pl-10 pr-4 py-3 bg-surface rounded-xl border border-line text-ink"
                                />
                            </View>

                            {/* Add Recipe Button */}
                            <TouchableOpacity
                                onPress={() => {
                                    setNewRecipe({ ...newRecipe, folder_id: currentFolder.id });
                                    setShowAddRecipe(true);
                                }}
                                className="flex-row items-center justify-center bg-surface border border-line py-3 rounded-xl mb-4"
                            >
                                <PlusIcon size={18} color={colors.ink} />
                                <Text className="text-ink font-medium ml-2">Add New Recipe</Text>
                            </TouchableOpacity>

                            {/* Recipes List */}
                            {filteredRecipes.length === 0 ? (
                                <View className="bg-surface rounded-xl p-6 items-center border border-line">
                                    <Text className="text-muted">No recipes found</Text>
                                    {!searchQuery && (
                                        <AskAiEmptyCta
                                            hint="Skip the forms — just tell the AI what you need."
                                            label="Ask AI to import a recipe"
                                            onPress={() =>
                                                navigation.navigate(
                                                    'AICookingAssistant' as never,
                                                    { initialPrompt: 'Import a recipe from a URL' } as never,
                                                )
                                            }
                                        />
                                    )}
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
                    <View className="bg-surface rounded-xl overflow-hidden border border-line">
                        <View className="p-4 border-b border-line bg-linen flex-row justify-between items-center">
                            <Text className="font-semibold text-ink">
                                {isEditing ? 'Edit Recipe' : 'Recipe Details'}
                            </Text>
                            <TouchableOpacity
                                onPress={() => {
                                    setSelectedRecipe(null);
                                    setIsEditing(false);
                                }}
                            >
                                <XIcon size={20} color={colors.muted} />
                            </TouchableOpacity>
                        </View>

                        <View className="p-4">
                            {isEditing ? (
                                // Edit Form
                                <View>
                                    <Text className="text-ink mb-2">Meal Name</Text>
                                    <TextInput
                                        value={selectedRecipe.meal_name}
                                        onChangeText={(text) =>
                                            setSelectedRecipe({ ...selectedRecipe, meal_name: text })
                                        }
                                        className="w-full p-3 border border-line rounded-xl mb-4 bg-linen text-ink"
                                    />

                                    {renderFolderPicker(selectedRecipe.folder_id, (folderId) =>
                                        setSelectedRecipe({ ...selectedRecipe, folder_id: folderId })
                                    )}

                                    <Text className="text-ink mb-2">Instructions / Steps</Text>
                                    <TextInput
                                        value={getInstructionsText()}
                                        onChangeText={handleInstructionsChange}
                                        placeholder="Enter cooking instructions (one step per line)"
                                        multiline
                                        numberOfLines={6}
                                        textAlignVertical="top"
                                        className="w-full p-3 border border-line rounded-xl mb-4 bg-linen text-ink min-h-[120px]"
                                    />

                                    <View className="flex-row justify-between items-center mb-2">
                                        <Text className="text-ink font-medium">Ingredients</Text>
                                        <TouchableOpacity
                                            onPress={handleAddIngredient}
                                            className="flex-row items-center"
                                        >
                                            <PlusIcon size={16} color={colors.danger} />
                                            <Text className="text-herb ml-1">Add</Text>
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
                                            className="flex-1 bg-linen border border-line py-3 rounded-lg"
                                        >
                                            <Text className="text-ink text-center font-medium">Cancel</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={handleSaveRecipe}
                                            disabled={saving}
                                            className={`flex-1 py-3 rounded-lg ${saving ? 'bg-sage' : 'bg-herb'
                                                }`}
                                        >
                                            {saving ? (
                                                <ActivityIndicator color={colors.onHerb} />
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
                                    <Text className="font-bold text-xl text-ink mb-4">
                                        {selectedRecipe.meal_name}
                                    </Text>

                                    {selectedRecipe.image?.url ? (
                                        <Image
                                            source={{ uri: selectedRecipe.image.url }}
                                            className="w-full h-40 rounded-xl mb-4"
                                        />
                                    ) : null}

                                    <View className="border-t border-b border-line py-4">
                                        <Text className="font-medium text-ink mb-2">Ingredients</Text>
                                        {(selectedRecipe.ingredients || []).map((item, index) => (
                                            <View key={index} className="flex-row justify-between py-2">
                                                <Text className="text-ink capitalize">{item.name}</Text>
                                                {Number(item.quantity) > 0 ? (
                                                <QuantityLabel
                                                    quantity={Number(item.quantity)}
                                                    unit={item.unit}
                                                    unitKind={item.unit_kind}
                                                    baseUnit={item.base_unit}
                                                    defaultDisplayUnit={item.default_display_unit}
                                                    measurementSystem={measurementSystem}
                                                    style={{ color: colors.muted }}
                                                />
                                                ) : null}
                                            </View>
                                        ))}
                                    </View>

                                    {(selectedRecipe.instructions?.length ?? 0) > 0 && (
                                        <View className="border-b border-line py-4">
                                            <Text className="font-medium text-ink mb-2">Instructions</Text>
                                            {selectedRecipe.instructions.map((step, index) => (
                                                <View key={index} className="flex-row mb-3">
                                                    <View className="w-6 h-6 rounded-full bg-sage items-center justify-center mr-3 mt-0.5">
                                                        <Text className="text-xs font-medium text-herb-deep">{index + 1}</Text>
                                                    </View>
                                                    <Text className="flex-1 text-ink leading-5">{step}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    )}

                                    <View className="flex-row gap-2 mt-4">
                                        <TouchableOpacity
                                            onPress={() => setIsEditing(true)}
                                            className="flex-1 bg-sage py-3 rounded-lg flex-row items-center justify-center border border-line"
                                        >
                                            <EditIcon size={16} color={colors.herb} />
                                            <Text className="text-herb-deep font-medium ml-1">Edit Recipe</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>
                ) : (
                    // Add New Recipe Form
                    <View className="bg-surface rounded-xl overflow-hidden border border-line">
                        <View className="p-4 border-b border-line bg-linen flex-row justify-between items-center">
                            <Text className="font-semibold text-ink">Add New Recipe</Text>
                            <TouchableOpacity onPress={() => setShowAddRecipe(false)}>
                                <XIcon size={20} color={colors.muted} />
                            </TouchableOpacity>
                        </View>

                        <View className="p-4">
                            {/* Meal Name */}
                            <Text className="text-ink mb-2">Meal Name *</Text>
                            <TextInput
                                value={newRecipe.meal_name}
                                onChangeText={(text) => setNewRecipe({ ...newRecipe, meal_name: text })}
                                placeholder="Enter meal name"
                                className="w-full p-3 border border-line rounded-xl mb-4 bg-linen text-ink"
                            />

                            {renderFolderPicker(newRecipe.folder_id, (folderId) =>
                                setNewRecipe({ ...newRecipe, folder_id: folderId })
                            )}

                            {/* Recipe Image */}
                            <Text className="text-ink mb-2">Recipe Image</Text>
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
                                        <XIcon size={16} color={colors.onHerb} />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View className="flex-row gap-3 mb-4">
                                    <TouchableOpacity
                                        onPress={takePhoto}
                                        className="flex-1 flex-row items-center justify-center py-3 bg-linen rounded-xl border border-dashed border-line"
                                    >
                                        <CameraIcon size={20} color={colors.muted} />
                                        <Text className="text-muted ml-2">Camera</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={pickImage}
                                        className="flex-1 flex-row items-center justify-center py-3 bg-linen rounded-xl border border-dashed border-line"
                                    >
                                        <ImageIcon size={20} color={colors.muted} />
                                        <Text className="text-muted ml-2">Gallery</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* Ingredients */}
                            <View className="flex-row justify-between items-center mb-2">
                                <Text className="text-ink font-medium">Ingredients *</Text>
                                <TouchableOpacity onPress={handleAddIngredient} className="flex-row items-center">
                                    <PlusIcon size={16} color={colors.danger} />
                                    <Text className="text-herb ml-1">Add</Text>
                                </TouchableOpacity>
                            </View>

                            {(newRecipe.ingredients || []).map((item, index) => (
                                <IngredientRow key={index} item={item} index={index} />
                            ))}

                            {/* Instructions */}
                            <Text className="text-ink mb-2 mt-4">Instructions / Steps</Text>
                            <TextInput
                                value={getInstructionsText()}
                                onChangeText={handleInstructionsChange}
                                placeholder="Enter cooking instructions (one step per line)"
                                multiline
                                numberOfLines={6}
                                textAlignVertical="top"
                                className="w-full p-3 border border-line rounded-xl mb-4 bg-linen text-ink min-h-[120px]"
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
                                    ? 'bg-herb'
                                    : 'bg-sage'
                                    }`}
                            >
                                {saving ? (
                                    <ActivityIndicator color={colors.onHerb} />
                                ) : (
                                    <Text
                                        className={`text-center font-medium ${newRecipe.meal_name?.trim() && (newRecipe.ingredients || []).length > 0
                                            ? 'text-white'
                                            : 'text-muted'
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
                    <View className="bg-surface rounded-xl w-full max-w-sm border border-line">
                        <View className="p-4 border-b border-line flex-row justify-between items-center">
                            <Text className="font-medium text-ink">Create New Category</Text>
                            <TouchableOpacity onPress={() => setShowAddFolder(false)}>
                                <XIcon size={20} color={colors.muted} />
                            </TouchableOpacity>
                        </View>
                        <View className="p-6">
                            <Text className="text-ink mb-2">Category Name</Text>
                            <TextInput
                                value={newFolderName}
                                onChangeText={setNewFolderName}
                                placeholder="Enter category name"
                                className="w-full p-3 border border-line rounded-xl mb-4 bg-linen text-ink"
                            />
                            <View className="flex-row gap-2">
                                <TouchableOpacity
                                    onPress={() => setShowAddFolder(false)}
                                    className="flex-1 bg-linen border border-line py-3 rounded-lg"
                                >
                                    <Text className="text-ink text-center">Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={handleCreateFolder}
                                    disabled={!newFolderName.trim() || saving}
                                    className={`flex-1 py-3 rounded-lg ${newFolderName.trim() && !saving ? 'bg-herb' : 'bg-sage'
                                        }`}
                                >
                                    {saving ? (
                                        <ActivityIndicator color={colors.onHerb} />
                                    ) : (
                                        <Text
                                            className={`text-center ${newFolderName.trim() ? 'text-white' : 'text-muted'
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
                    <View className="bg-surface rounded-xl w-full max-w-sm border border-line">
                        <View className="p-4 border-b border-line flex-row justify-between items-center">
                            <Text className="font-medium text-ink">Rename Category</Text>
                            <TouchableOpacity onPress={() => setEditingFolder(null)}>
                                <XIcon size={20} color={colors.muted} />
                            </TouchableOpacity>
                        </View>
                        <View className="p-6">
                            <Text className="text-ink mb-2">Category Name</Text>
                            <TextInput
                                value={newFolderName}
                                onChangeText={setNewFolderName}
                                placeholder="Enter category name"
                                className="w-full p-3 border border-line rounded-xl mb-4 bg-linen text-ink"
                            />
                            <View className="flex-row gap-2">
                                <TouchableOpacity
                                    onPress={() => setEditingFolder(null)}
                                    className="flex-1 bg-linen border border-line py-3 rounded-lg"
                                >
                                    <Text className="text-ink text-center">Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={handleUpdateFolder}
                                    disabled={!newFolderName.trim() || saving}
                                    className={`flex-1 py-3 rounded-lg ${newFolderName.trim() && !saving ? 'bg-herb' : 'bg-sage'
                                        }`}
                                >
                                    {saving ? (
                                        <ActivityIndicator color={colors.onHerb} />
                                    ) : (
                                        <Text
                                            className={`text-center ${newFolderName.trim() ? 'text-white' : 'text-muted'
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
                    <View className="bg-surface rounded-xl w-full max-w-sm border border-line">
                        <View className="p-6">
                            <View className="flex-row items-center mb-4">
                                <AlertCircleIcon size={24} color={colors.danger} />
                                <Text className="text-lg font-medium ml-2" style={{ color: colors.danger }}>Delete Category</Text>
                            </View>
                            <Text className="text-muted mb-2">
                                Are you sure you want to delete "{folderToDelete?.name}"?
                            </Text>
                            <Text className="text-muted text-sm mb-6">
                                All recipes in this category will be moved to "Uncategorized".
                            </Text>
                            <View className="flex-row justify-end gap-3">
                                <TouchableOpacity
                                    onPress={() => setShowDeleteConfirm(false)}
                                    className="px-4 py-2 bg-linen border border-line rounded-lg"
                                >
                                    <Text className="text-ink">Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={handleDeleteFolder}
                                    disabled={saving}
                                    className="px-4 py-2 bg-herb-deep rounded-lg"
                                >
                                    {saving ? (
                                        <ActivityIndicator color={colors.onHerb} size="small" />
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