
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { POSScreen } from './src/screens/POSScreen';
import { InventoryScreen } from './src/screens/InventoryScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { ReportsScreen } from './src/screens/ReportsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { EditProfileScreen } from './src/screens/EditProfileScreen';
import { UsersScreen } from './src/screens/UsersScreen';
import { SplashScreen } from './src/screens/SplashScreen';
import { EditStoreScreen } from './src/screens/EditStoreScreen';
import { colors } from './src/theme';
import * as db from './src/services/db';

const Stack = createNativeStackNavigator();

export default function App() {
    return (
        <SafeAreaProvider>
            <NavigationContainer>
                <StatusBar style="dark" />
                <Stack.Navigator
                    initialRouteName="Splash"
                    screenOptions={{
                        headerShown: false,
                        contentStyle: { backgroundColor: colors.background }
                    }}
                >
                    <Stack.Screen name="Splash" component={SplashScreen} options={{ animation: 'none' }} />
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="Register" component={RegisterScreen} />
                    <Stack.Screen name="Dashboard" component={DashboardScreen} />
                    <Stack.Screen name="POS" component={POSScreen} />
                    <Stack.Screen name="Inventory" component={InventoryScreen} />
                    <Stack.Screen name="History" component={HistoryScreen} />
                    <Stack.Screen name="Reports" component={ReportsScreen} />
                    <Stack.Screen name="Settings" component={SettingsScreen} />
                    <Stack.Screen name="EditProfile" component={EditProfileScreen} />
                    <Stack.Screen name="Users" component={UsersScreen} />
                    <Stack.Screen name="EditStore" component={EditStoreScreen} />
                </Stack.Navigator>
            </NavigationContainer>
        </SafeAreaProvider>
    );
}
