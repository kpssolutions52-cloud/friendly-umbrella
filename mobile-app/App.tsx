/**
 * Construction Guru Mobile — Root component.
 * Renders AuthProvider and root navigator (auth stack vs main app).
 */
import React, { useCallback, useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from '@/store/AuthContext';
import { LoginScreen } from '@/screens/LoginScreen';
import { HomeScreen } from '@/screens/HomeScreen';

const Stack = createNativeStackNavigator();

function RootNavigator() {
  const { isAuthenticated, isLoading, restoreSession } = useAuth();
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    let cancelled = false;
    restoreSession().then(() => {
      if (!cancelled) setRestored(true);
    });
    return () => { cancelled = true; };
  }, [restoreSession]);

  const renderContent = useCallback(() => {
    if (!restored || isLoading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      );
    }
    return (
      <Stack.Navigator
        screenOptions={{ headerShown: true, contentStyle: { backgroundColor: '#f8fafc' } }}
      >
        {!isAuthenticated ? (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ title: 'Construction Guru', headerShown: true }}
          />
        ) : (
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: 'Home', headerRight: undefined }}
          />
        )}
      </Stack.Navigator>
    );
  }, [restored, isLoading, isAuthenticated]);

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      {renderContent()}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
});
