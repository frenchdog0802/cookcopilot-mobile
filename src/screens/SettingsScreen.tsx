import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useAuth } from '../contexts/authContext';
import { useAuth0Context } from '../contexts/auth0Context';
import { useNavigation } from '@react-navigation/native';
import { UserIcon, SettingsIcon, PaletteIcon, SaveIcon, CheckIcon } from 'lucide-react-native';
import AppHeader from '../components/AppHeader';

export default function SettingsScreen() {
    const { logout, user } = useAuth();
    const { logout: auth0Logout, isAuthenticated: isAuth0Authenticated } = useAuth0Context();
    const navigation = useNavigation();

    const [activeTab, setActiveTab] = useState('profile');
    const [theme, setTheme] = useState('light');
    const [units, setUnits] = useState('imperial');
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [showSaveMessage, setShowSaveMessage] = useState(false);

    const handleLogout = async () => {
        // Clear both local auth and Auth0 session
        if (isAuth0Authenticated) {
            try {
                await auth0Logout();
            } catch (err) {
                console.error('Auth0 logout error:', err);
            }
        }
        await logout();
        navigation.reset({
            index: 0,
            routes: [{ name: 'Auth' as never }],
        });
    };

    const handleSave = () => {
        // In a real app, this would save to backend
        setShowSaveMessage(true);
        setTimeout(() => {
            setShowSaveMessage(false);
        }, 3000);
    };

    const RadioButton = ({ selected, onPress, label }: { selected: boolean; onPress: () => void; label: string }) => (
        <TouchableOpacity onPress={onPress} className="flex-row items-center py-2">
            <View className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${selected ? 'border-orange-500' : 'border-gray-300'}`}>
                {selected && <View className="w-2.5 h-2.5 rounded-full bg-orange-500" />}
            </View>
            <Text className="text-gray-700">{label}</Text>
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-gray-50">
            <AppHeader title="Settings" showBackButton />
            <ScrollView className="flex-1">

                {/* Main Content */}
                <View className="p-4">
                    <View className="bg-white rounded-xl shadow-sm overflow-hidden">
                        {/* Tabs */}
                        <View className="flex-row border-b border-gray-200">
                            <TouchableOpacity
                                className={`flex-1 flex-row items-center justify-center py-4 ${activeTab === 'profile' ? 'border-b-2 border-orange-500' : ''}`}
                                onPress={() => setActiveTab('profile')}
                            >
                                <UserIcon size={16} color={activeTab === 'profile' ? '#f97316' : '#6b7280'} />
                                <Text className={`ml-1 text-sm font-medium ${activeTab === 'profile' ? 'text-orange-600' : 'text-gray-600'}`}>
                                    Profile
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className={`flex-1 flex-row items-center justify-center py-4 ${activeTab === 'preferences' ? 'border-b-2 border-orange-500' : ''}`}
                                onPress={() => setActiveTab('preferences')}
                            >
                                <SettingsIcon size={16} color={activeTab === 'preferences' ? '#f97316' : '#6b7280'} />
                                <Text className={`ml-1 text-sm font-medium ${activeTab === 'preferences' ? 'text-orange-600' : 'text-gray-600'}`}>
                                    Units
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className={`flex-1 flex-row items-center justify-center py-4 ${activeTab === 'appearance' ? 'border-b-2 border-orange-500' : ''}`}
                                onPress={() => setActiveTab('appearance')}
                            >
                                <PaletteIcon size={16} color={activeTab === 'appearance' ? '#f97316' : '#6b7280'} />
                                <Text className={`ml-1 text-sm font-medium ${activeTab === 'appearance' ? 'text-orange-600' : 'text-gray-600'}`}>
                                    Theme
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className={`flex-1 flex-row items-center justify-center py-4 ${activeTab === 'appearance' ? 'border-b-2 border-orange-500' : ''}`}
                                onPress={() => setActiveTab('appearance')}
                            >
                                <PaletteIcon size={16} color={activeTab === 'appearance' ? '#f97316' : '#6b7280'} />
                                <Text className={`ml-1 text-sm font-medium ${activeTab === 'appearance' ? 'text-orange-600' : 'text-gray-600'}`}>
                                    Theme
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className={`flex-1 flex-row items-center justify-center py-4`}
                                onPress={() => navigation.navigate('Subscription' as never)}
                            >
                                <Text className="ml-1 text-sm font-medium text-orange-600">
                                    Upgrade
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Tab Content */}
                        <View className="p-4">
                            {activeTab === 'profile' && (
                                <View>
                                    <Text className="text-lg font-semibold text-gray-800 mb-4">
                                        Profile Information
                                    </Text>
                                    <View className="mb-4">
                                        <Text className="text-sm font-medium text-gray-700 mb-1">Name</Text>
                                        <TextInput
                                            value={name}
                                            onChangeText={setName}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white"
                                            placeholder="Your name"
                                        />
                                    </View>
                                    <View className="mb-4">
                                        <Text className="text-sm font-medium text-gray-700 mb-1">Email</Text>
                                        <TextInput
                                            value={email}
                                            onChangeText={setEmail}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white"
                                            placeholder="your@email.com"
                                        />
                                    </View>
                                    <TouchableOpacity
                                        onPress={handleSave}
                                        className="bg-orange-500 py-3 px-4 rounded-lg flex-row items-center justify-center"
                                    >
                                        <SaveIcon size={18} color="white" />
                                        <Text className="text-white font-medium ml-2">Save Changes</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {activeTab === 'preferences' && (
                                <View>
                                    <Text className="text-lg font-semibold text-gray-800 mb-4">
                                        Measurement Units
                                    </Text>
                                    <View className="space-y-2">
                                        <RadioButton
                                            selected={units === 'imperial'}
                                            onPress={() => setUnits('imperial')}
                                            label="Imperial (oz, lb, cups)"
                                        />
                                        <RadioButton
                                            selected={units === 'metric'}
                                            onPress={() => setUnits('metric')}
                                            label="Metric (g, kg, ml)"
                                        />
                                    </View>
                                    <TouchableOpacity
                                        onPress={handleSave}
                                        className="bg-orange-500 py-3 px-4 rounded-lg flex-row items-center justify-center mt-4"
                                    >
                                        <SaveIcon size={18} color="white" />
                                        <Text className="text-white font-medium ml-2">Save Changes</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {activeTab === 'appearance' && (
                                <View>
                                    <Text className="text-lg font-semibold text-gray-800 mb-4">
                                        Theme Settings
                                    </Text>
                                    <View className="space-y-2">
                                        <RadioButton
                                            selected={theme === 'light'}
                                            onPress={() => setTheme('light')}
                                            label="Light Mode"
                                        />
                                        <RadioButton
                                            selected={theme === 'dark'}
                                            onPress={() => setTheme('dark')}
                                            label="Dark Mode"
                                        />
                                        <RadioButton
                                            selected={theme === 'system'}
                                            onPress={() => setTheme('system')}
                                            label="System Default"
                                        />
                                    </View>
                                    <TouchableOpacity
                                        onPress={handleSave}
                                        className="bg-orange-500 py-3 px-4 rounded-lg flex-row items-center justify-center mt-4"
                                    >
                                        <SaveIcon size={18} color="white" />
                                        <Text className="text-white font-medium ml-2">Save Changes</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Sign Out Button */}
                    <TouchableOpacity
                        onPress={handleLogout}
                        className="bg-gray-200 py-4 rounded-lg mt-6"
                    >
                        <Text className="text-gray-700 text-center font-medium">Sign Out</Text>
                    </TouchableOpacity>

                    {/* Save Message Toast */}
                    {showSaveMessage && (
                        <View className="absolute bottom-4 left-4 right-4 bg-green-100 p-4 rounded-lg flex-row items-center">
                            <CheckIcon size={20} color="#166534" />
                            <Text className="text-green-800 ml-2">Changes saved successfully!</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}