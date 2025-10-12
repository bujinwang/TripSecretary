// 出国啰 - App Navigator
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { useTranslation } from '../i18n/LocaleContext';

import {
  LoginScreen,
  HomeScreen,
  ScanPassportScreen,
  SelectDestinationScreen,
  TravelInfoScreen,
  GeneratingScreen,
  ResultScreen,
  HistoryScreen,
  ProfileScreen,
  PresentToCustomsScreen,
  CopyWriteModeScreen,
  AirportArrivalScreen,
  // Japan screens
  JapanInfoScreen,
  JapanRequirementsScreen,
  JapanProceduresScreen,
  InteractiveImmigrationGuide,
  // Thailand screens
  PIKGuideScreen,
  TDACWebViewScreen,
  TDACAPIScreen,
  TDACSelectionScreen,
  TDACHybridScreen,
} from '../screens';

import { colors } from '../theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Bar Icon Component
const TabBarIcon = ({ emoji, focused }) => (
  <Text style={{ fontSize: 24, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
);

// Main Tab Navigator
const MainTabs = () => {
  const { t } = useTranslation();
  
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        tabBarStyle: {
          borderTopColor: colors.border,
          borderTopWidth: 1,
          backgroundColor: colors.white,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: t('tabs.home'),
          tabBarIcon: ({ focused }) => (
            <TabBarIcon emoji="🏠" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarLabel: t('tabs.history'),
          tabBarIcon: ({ focused }) => (
            <TabBarIcon emoji="📋" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: t('tabs.profile'),
          tabBarIcon: ({ focused }) => (
            <TabBarIcon emoji="👤" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Root Stack Navigator
const AppNavigator = () => {
  const { t } = useTranslation();
  
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          headerBackTitle: '',
          headerBackTitleVisible: false,
        }}
      >
        {/* Auth Stack */}
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{
            headerShown: false,
          }}
        />

        {/* Main App Stack */}
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{
            headerShown: false,
          }}
        />

        {/* Flow Screens */}
        <Stack.Screen
          name="ScanPassport"
          component={ScanPassportScreen}
          options={{
            headerShown: true,
            title: t('screenTitles.scanPassport'),
            headerTintColor: colors.text,
            headerStyle: {
              backgroundColor: colors.white,
            },
          }}
        />
        <Stack.Screen
          name="SelectDestination"
          component={SelectDestinationScreen}
          options={{
            headerShown: true,
            title: t('screenTitles.selectDestination'),
            headerTintColor: colors.text,
            headerStyle: {
              backgroundColor: colors.white,
            },
          }}
        />
        <Stack.Screen
          name="TravelInfo"
          component={TravelInfoScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Generating"
          component={GeneratingScreen}
          options={{
            headerShown: false,
            gestureEnabled: false, // Prevent back gesture during generation
          }}
        />
        <Stack.Screen
          name="Result"
          component={ResultScreen}
          options={{
            headerShown: true,
            title: t('screenTitles.result'),
            headerTintColor: colors.text,
            headerStyle: {
              backgroundColor: colors.white,
            },
            gestureEnabled: false, // Prevent accidental back
          }}
        />
        <Stack.Screen
          name="PresentToCustoms"
          component={PresentToCustomsScreen}
          options={{
            headerShown: false,
            presentation: 'fullScreenModal',
          }}
        />
        <Stack.Screen
          name="PIKGuide"
          component={PIKGuideScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="CopyWrite"
          component={CopyWriteModeScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="TDACSelection"
          component={TDACSelectionScreen}
          options={{
            headerShown: false,
            presentation: 'fullScreenModal',
          }}
        />
        <Stack.Screen
          name="TDACWebView"
          component={TDACWebViewScreen}
          options={{
            headerShown: false,
            presentation: 'fullScreenModal',
          }}
        />
        <Stack.Screen
          name="TDACAPI"
          component={TDACAPIScreen}
          options={{
            headerShown: false,
            presentation: 'fullScreenModal',
          }}
        />
        <Stack.Screen
          name="TDACHybrid"
          component={TDACHybridScreen}
          options={{
            headerShown: false,
            presentation: 'fullScreenModal',
          }}
        />
        <Stack.Screen
          name="AirportArrival"
          component={AirportArrivalScreen}
          options={{
            headerShown: false,
            gestureEnabled: false, // Prevent accidental back during immigration
          }}
        />
        <Stack.Screen
          name="ImmigrationGuide"
          component={InteractiveImmigrationGuide}
          options={{
            headerShown: false,
            gestureEnabled: false, // Prevent accidental back during immigration
          }}
        />
        <Stack.Screen
          name="JapanInfo"
          component={JapanInfoScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="JapanRequirements"
          component={JapanRequirementsScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="JapanProcedures"
          component={JapanProceduresScreen}
          options={{
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
