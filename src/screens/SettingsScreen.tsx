import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useAuth } from '../contexts/authContext';
import { usePantry } from '../contexts/pantryContext';
import { useNavigation } from '@react-navigation/native';
import { UserIcon, SettingsIcon, SaveIcon, CheckIcon } from 'lucide-react-native';
import AppHeader from '../components/AppHeader';
import { userPreferencesApi } from '../api/userPreferences';
import { colors } from '../theme/tokens';

export default function SettingsScreen() {
    const { logout, user } = useAuth();
    const { userSettings, updateUserSettings } = usePantry();
    const navigation = useNavigation();

    const [activeTab, setActiveTab] = useState('profile');
    const [units, setUnits] = useState(userSettings.measurement_unit === 'imperial' ? 'imperial' : 'metric');
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [showSaveMessage, setShowSaveMessage] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const prefs = await userPreferencesApi.get();
                if (!cancelled && prefs?.measurementUnit) {
                    setUnits(prefs.measurementUnit);
                    updateUserSettings({
                        ...userSettings,
                        measurement_unit: prefs.measurementUnit,
                    });
                }
            } catch {
                // ignore load errors on settings open
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const handleLogout = async () => {
        await logout();
        navigation.reset({
            index: 0,
            routes: [{ name: 'Auth' as never }],
        });
    };

    const handleSave = async () => {
        setErrorMessage('');
        try {
            const measurementUnit = units === 'imperial' ? 'imperial' : 'metric';
            const saved = await userPreferencesApi.update({ measurementUnit });
            if (!saved) {
                setErrorMessage('Could not save preferences.');
                return;
            }
            updateUserSettings({
                ...userSettings,
                measurement_unit: saved.measurementUnit,
            });
            setShowSaveMessage(true);
            setTimeout(() => {
                setShowSaveMessage(false);
            }, 3000);
        } catch {
            setErrorMessage('Could not save preferences.');
        }
    };

    const RadioButton = ({ selected, onPress, label }: { selected: boolean; onPress: () => void; label: string }) => (
        <TouchableOpacity onPress={onPress} className="flex-row items-center py-2">
            <View className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${selected ? 'border-herb' : 'border-line'}`}>
                {selected && <View className="w-2.5 h-2.5 rounded-full bg-herb" />}
            </View>
            <Text className="text-ink">{label}</Text>
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-linen">
            <AppHeader title="Settings" showBackButton />
            <ScrollView className="flex-1">

                {/* Main Content */}
                <View className="p-4">
                    <View className="bg-surface rounded-xl overflow-hidden border border-line">
                        {/* Tabs */}
                        <View className="flex-row border-b border-line">
                            <TouchableOpacity
                                className={`flex-1 flex-row items-center justify-center py-4 ${activeTab === 'profile' ? 'border-b-2 border-herb' : ''}`}
                                onPress={() => setActiveTab('profile')}
                            >
                                <UserIcon size={16} color={activeTab === 'profile' ? colors.herb : colors.muted} />
                                <Text className={`ml-1 text-sm font-medium ${activeTab === 'profile' ? 'text-herb' : 'text-muted'}`}>
                                    Profile
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className={`flex-1 flex-row items-center justify-center py-4 ${activeTab === 'preferences' ? 'border-b-2 border-herb' : ''}`}
                                onPress={() => setActiveTab('preferences')}
                            >
                                <SettingsIcon size={16} color={activeTab === 'preferences' ? colors.herb : colors.muted} />
                                <Text className={`ml-1 text-sm font-medium ${activeTab === 'preferences' ? 'text-herb' : 'text-muted'}`}>
                                    Units
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className={`flex-1 flex-row items-center justify-center py-4`}
                                onPress={() => navigation.navigate('Subscription' as never)}
                            >
                                <Text className="ml-1 text-sm font-medium text-herb">
                                    Upgrade
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Tab Content */}
                        <View className="p-4">
                            {activeTab === 'profile' && (
                                <View>
                                    <Text className="text-lg font-semibold text-ink mb-4">
                                        Profile Information
                                    </Text>
                                    <View className="mb-4">
                                        <Text className="text-sm font-medium text-ink mb-1">Name</Text>
                                        <TextInput
                                            value={name}
                                            onChangeText={setName}
                                            className="w-full px-4 py-3 border border-line rounded-lg bg-linen text-ink"
                                            placeholder="Your name"
                                        />
                                    </View>
                                    <View className="mb-4">
                                        <Text className="text-sm font-medium text-ink mb-1">Email</Text>
                                        <TextInput
                                            value={email}
                                            onChangeText={setEmail}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            className="w-full px-4 py-3 border border-line rounded-lg bg-linen text-ink"
                                            placeholder="your@email.com"
                                        />
                                    </View>
                                    <TouchableOpacity
                                        onPress={handleSave}
                                        className="bg-herb py-3 px-4 rounded-lg flex-row items-center justify-center"
                                    >
                                        <SaveIcon size={18} color={colors.onHerb} />
                                        <Text className="text-white font-medium ml-2">Save Changes</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {activeTab === 'preferences' && (
                                <View>
                                    <Text className="text-lg font-semibold text-ink mb-4">
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
                                        className="bg-herb py-3 px-4 rounded-lg flex-row items-center justify-center mt-4"
                                    >
                                        <SaveIcon size={18} color={colors.onHerb} />
                                        <Text className="text-white font-medium ml-2">Save Changes</Text>
                                    </TouchableOpacity>
                                    {errorMessage ? (
                                        <Text className="text-sm mt-2" style={{ color: colors.danger }}>{errorMessage}</Text>
                                    ) : null}
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Sign Out Button */}
                    <TouchableOpacity
                        onPress={handleLogout}
                        className="bg-linen border border-line py-4 rounded-lg mt-6"
                    >
                        <Text className="text-ink text-center font-medium">Sign Out</Text>
                    </TouchableOpacity>

                    {/* Save Message Toast */}
                    {showSaveMessage && (
                        <View className="absolute bottom-4 left-4 right-4 bg-sage border border-line p-4 rounded-lg flex-row items-center">
                            <CheckIcon size={20} color={colors.herbDeep} />
                            <Text className="text-herb-deep ml-2">Changes saved successfully!</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}