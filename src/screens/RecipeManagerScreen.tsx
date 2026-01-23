import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, ScrollView, Image, Modal } from 'react-native';
import { PlusIcon, TrashIcon, SearchIcon, EditIcon, XIcon, ImageIcon, FolderIcon, ChevronRightIcon, HomeIcon, MoreVerticalIcon, FolderPlusIcon, PencilIcon, AlertCircleIcon, PackageIcon } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import AppHeader from '../components/AppHeader';

// Types
interface Ingredient {
    name: string;
    quantity: number;
    unit: string;
}

interface Recipe {
    id: string;
    meal_name: string;
    ingredients: Ingredient[];
    image?: { url: string; public_id: string } | null;
    folder_id: string;
    instructions?: string[];
}

interface Folder {
    id: string;
    name: string;
    icon: string;
}

// Mock data - replace with context/API later
const defaultFolders: Folder[] = [
    { id: 'uncategorized', name: 'Uncategorized', icon: 'FolderIcon' },
    { id: 'favorites', name: 'Favorites', icon: 'FolderIcon' },
    { id: 'breakfast', name: 'Breakfast', icon: 'FolderIcon' },
    { id: 'lunch', name: 'Lunch', icon: 'FolderIcon' },
    { id: 'dinner', name: 'Dinner', icon: 'FolderIcon' },
];

const mockRecipes: Recipe[] = [
    {
        id: '1',
        meal_name: 'Pasta Carbonara',
        ingredients: [
            { name: 'Pasta', quantity: 200, unit: 'g' },
            { name: 'Eggs', quantity: 3, unit: '' },
            { name: 'Bacon', quantity: 100, unit: 'g' },
        ],
        image: null,
        folder_id: 'dinner',
    },
];

export default function RecipeManagerScreen() {
    const navigation = useNavigation();

    // State
    const [folders, setFolders] = useState<Folder[]>(defaultFolders);
    const [recipes, setRecipes] = useState<Recipe[]>(mockRecipes);
    const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [showAddRecipe, setShowAddRecipe] = useState(false);

    // Folder modals
    const [showAddFolder, setShowAddFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
    const [showFolderActions, setShowFolderActions] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [folderToDelete, setFolderToDelete] = useState<Folder | null>(null);

    // New recipe state
    const [newRecipe, setNewRecipe] = useState<Recipe>({
        id: '',
        meal_name: '',
        ingredients: [{ name: '', quantity: 1, unit: '' }],
        image: null,
        folder_id: 'uncategorized',
    });

    // Filter recipes
    const filteredRecipes = recipes.filter(recipe => {
        if (currentFolder && recipe.folder_id !== currentFolder.id) return false;
        const matchesSearch = recipe.meal_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            recipe.ingredients.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesSearch;
    });

    // Folder handlers
    const handleCreateFolder = () => {
        if (!newFolderName.trim()) return;
        const newFolder: Folder = {
            id: `folder-${Date.now()}`,
            name: newFolderName.trim(),
            icon: 'FolderIcon',
        };
        setFolders([...folders, newFolder]);
        setNewFolderName('');
        setShowAddFolder(false);
    };

    const handleUpdateFolder = () => {
        if (!editingFolder || !newFolderName.trim()) return;
        setFolders(folders.map(f => f.id === editingFolder.id ? { ...f, name: newFolderName.trim() } : f));
        setEditingFolder(null);
        setNewFolderName('');
    };

    const handleDeleteFolder = () => {
        if (!folderToDelete) return;
        // Move recipes to uncategorized
        setRecipes(recipes.map(r => r.folder_id === folderToDelete.id ? { ...r, folder_id: 'uncategorized' } : r));
        setFolders(folders.filter(f => f.id !== folderToDelete.id));
        setFolderToDelete(null);
        setShowDeleteConfirm(false);
        if (currentFolder?.id === folderToDelete.id) setCurrentFolder(null);
    };

    // Recipe handlers
    const handleAddIngredient = () => {
        if (isEditing && selectedRecipe) {
            setSelectedRecipe({
                ...selectedRecipe,
                ingredients: [...selectedRecipe.ingredients, { name: '', quantity: 1, unit: '' }],
            });
        } else {
            setNewRecipe({
                ...newRecipe,
                ingredients: [...newRecipe.ingredients, { name: '', quantity: 1, unit: '' }],
            });
        }
    };

    const handleUpdateIngredient = (index: number, field: string, value: any) => {
        if (isEditing && selectedRecipe) {
            const updated = [...selectedRecipe.ingredients];
            updated[index] = { ...updated[index], [field]: field === 'quantity' ? parseFloat(value) || 0 : value };
            setSelectedRecipe({ ...selectedRecipe, ingredients: updated });
        } else {
            const updated = [...newRecipe.ingredients];
            updated[index] = { ...updated[index], [field]: field === 'quantity' ? parseFloat(value) || 0 : value };
            setNewRecipe({ ...newRecipe, ingredients: updated });
        }
    };

    const handleRemoveIngredient = (index: number) => {
        if (isEditing && selectedRecipe) {
            setSelectedRecipe({
                ...selectedRecipe,
                ingredients: selectedRecipe.ingredients.filter((_, i) => i !== index),
            });
        } else {
            setNewRecipe({
                ...newRecipe,
                ingredients: newRecipe.ingredients.filter((_, i) => i !== index),
            });
        }
    };

    const handleSaveRecipe = () => {
        if (isEditing && selectedRecipe) {
            setRecipes(recipes.map(r => r.id === selectedRecipe.id ? selectedRecipe : r));
            setSelectedRecipe(null);
            setIsEditing(false);
        } else {
            const recipeToAdd = {
                ...newRecipe,
                id: `recipe-${Date.now()}`,
                folder_id: currentFolder?.id || 'uncategorized',
            };
            setRecipes([...recipes, recipeToAdd]);
            setNewRecipe({
                id: '',
                meal_name: '',
                ingredients: [{ name: '', quantity: 1, unit: '' }],
                image: null,
                folder_id: 'uncategorized',
            });
            setShowAddRecipe(false);
        }
    };

    const handleDeleteRecipe = (recipeId: string) => {
        setRecipes(recipes.filter(r => r.id !== recipeId));
    };

    // Render folder card
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
                        {recipes.filter(r => r.folder_id === folder.id).length} recipes
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
                    {folder.id !== 'uncategorized' && (
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

    // Render recipe card
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
                        {recipe.ingredients.length} ingredient{recipe.ingredients.length !== 1 ? 's' : ''}
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
                    <TouchableOpacity
                        onPress={() => handleDeleteRecipe(recipe.id)}
                        className="p-2"
                    >
                        <TrashIcon size={18} color="#ef4444" />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );

    // Ingredient row component
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

    return (
        <View className="flex-1 bg-gray-50">
            <AppHeader title="Recipe Manager" showBackButton />

            <ScrollView className="flex-1 p-4">
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
                            <FlatList
                                data={folders}
                                renderItem={renderFolderCard}
                                keyExtractor={(item) => item.id}
                                scrollEnabled={false}
                            />
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
                            <TouchableOpacity onPress={() => { setSelectedRecipe(null); setIsEditing(false); }}>
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
                                        onChangeText={(text) => setSelectedRecipe({ ...selectedRecipe, meal_name: text })}
                                        className="w-full p-3 border border-gray-200 rounded-xl mb-4 bg-white"
                                    />

                                    <View className="flex-row justify-between items-center mb-2">
                                        <Text className="text-gray-700 font-medium">Ingredients</Text>
                                        <TouchableOpacity onPress={handleAddIngredient} className="flex-row items-center">
                                            <PlusIcon size={16} color="#dc2626" />
                                            <Text className="text-red-600 ml-1">Add</Text>
                                        </TouchableOpacity>
                                    </View>

                                    {selectedRecipe.ingredients.map((item, index) => (
                                        <IngredientRow key={index} item={item} index={index} />
                                    ))}

                                    <View className="flex-row gap-2 mt-4">
                                        <TouchableOpacity
                                            onPress={() => { setSelectedRecipe(null); setIsEditing(false); }}
                                            className="flex-1 bg-gray-100 py-3 rounded-lg"
                                        >
                                            <Text className="text-gray-700 text-center font-medium">Cancel</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={handleSaveRecipe} className="flex-1 bg-red-600 py-3 rounded-lg">
                                            <Text className="text-white text-center font-medium">Save Changes</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : (
                                // View Details
                                <View>
                                    <Text className="font-bold text-xl text-gray-800 mb-4">{selectedRecipe.meal_name}</Text>

                                    {selectedRecipe.image && (
                                        <Image
                                            source={{ uri: selectedRecipe.image.url }}
                                            className="w-full h-40 rounded-xl mb-4"
                                        />
                                    )}

                                    <View className="border-t border-b border-gray-100 py-4">
                                        <Text className="font-medium text-gray-700 mb-2">Ingredients</Text>
                                        {selectedRecipe.ingredients.map((item, index) => (
                                            <View key={index} className="flex-row justify-between py-2">
                                                <Text className="text-gray-800 capitalize">{item.name}</Text>
                                                <Text className="text-gray-500">{item.quantity} {item.unit}</Text>
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
                            <Text className="text-gray-700 mb-2">Meal Name</Text>
                            <TextInput
                                value={newRecipe.meal_name}
                                onChangeText={(text) => setNewRecipe({ ...newRecipe, meal_name: text })}
                                placeholder="Enter meal name"
                                className="w-full p-3 border border-gray-200 rounded-xl mb-4 bg-white"
                            />

                            <View className="flex-row justify-between items-center mb-2">
                                <Text className="text-gray-700 font-medium">Ingredients</Text>
                                <TouchableOpacity onPress={handleAddIngredient} className="flex-row items-center">
                                    <PlusIcon size={16} color="#dc2626" />
                                    <Text className="text-red-600 ml-1">Add</Text>
                                </TouchableOpacity>
                            </View>

                            {newRecipe.ingredients.map((item, index) => (
                                <IngredientRow key={index} item={item} index={index} />
                            ))}

                            <TouchableOpacity
                                onPress={handleSaveRecipe}
                                disabled={!newRecipe.meal_name.trim() || newRecipe.ingredients.length === 0}
                                className={`w-full py-3 rounded-xl mt-4 ${newRecipe.meal_name.trim() && newRecipe.ingredients.length > 0
                                    ? 'bg-red-600'
                                    : 'bg-gray-200'
                                    }`}
                            >
                                <Text className={`text-center font-medium ${newRecipe.meal_name.trim() && newRecipe.ingredients.length > 0
                                    ? 'text-white'
                                    : 'text-gray-400'
                                    }`}>
                                    Save Recipe
                                </Text>
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
                                <TouchableOpacity onPress={() => setShowAddFolder(false)} className="flex-1 bg-gray-100 py-3 rounded-lg">
                                    <Text className="text-gray-700 text-center">Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={handleCreateFolder}
                                    disabled={!newFolderName.trim()}
                                    className={`flex-1 py-3 rounded-lg ${newFolderName.trim() ? 'bg-red-600' : 'bg-gray-200'}`}
                                >
                                    <Text className={`text-center ${newFolderName.trim() ? 'text-white' : 'text-gray-400'}`}>Create</Text>
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
                                <TouchableOpacity onPress={() => setEditingFolder(null)} className="flex-1 bg-gray-100 py-3 rounded-lg">
                                    <Text className="text-gray-700 text-center">Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={handleUpdateFolder}
                                    disabled={!newFolderName.trim()}
                                    className={`flex-1 py-3 rounded-lg ${newFolderName.trim() ? 'bg-red-600' : 'bg-gray-200'}`}
                                >
                                    <Text className={`text-center ${newFolderName.trim() ? 'text-white' : 'text-gray-400'}`}>Update</Text>
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
                                <TouchableOpacity onPress={() => setShowDeleteConfirm(false)} className="px-4 py-2 bg-gray-100 rounded-lg">
                                    <Text className="text-gray-700">Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleDeleteFolder} className="px-4 py-2 bg-red-600 rounded-lg">
                                    <Text className="text-white">Delete</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}