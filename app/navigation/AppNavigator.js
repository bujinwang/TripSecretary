// 入境通 - App Navigator
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
  JapanTravelInfoScreen,
  InteractiveImmigrationGuide,
  // Thailand screens
  ThailandInfoScreen,
  ThailandRequirementsScreen,
  PIKGuideScreen,
  TDACWebViewScreen,
  TDACAPIScreen,
  TDACSelectionScreen,
  TDACHybridScreen,
  ThailandTravelInfoScreen,
  // Malaysia screens
  MalaysiaInfoScreen,
  MalaysiaRequirementsScreen,
  MDACSelectionScreen,
  MDACGuideScreen,
  MDACWebViewScreen,
  MalaysiaTravelInfoScreen,
  // Singapore screens
  SingaporeInfoScreen,
  SingaporeRequirementsScreen,
  SGArrivalSelectionScreen,
  SGArrivalGuideScreen,
  SGArrivalWebViewScreen,
  SingaporeTravelInfoScreen,
  // Taiwan screens
  TaiwanInfoScreen,
  TaiwanRequirementsScreen,
  TWArrivalSelectionScreen,
  TWArrivalGuideScreen,
  TWArrivalWebViewScreen,
  TaiwanTravelInfoScreen,
  // Hong Kong screens
  HongKongInfoScreen,
  HongKongRequirementsScreen,
  HongkongTravelInfoScreen,
  // Korea screens
  KoreaInfoScreen,
  KoreaRequirementsScreen,
  // USA screens
  USAInfoScreen,
  USARequirementsScreen,
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
          name="SingaporeInfo"
          component={SingaporeInfoScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="SingaporeRequirements"
          component={SingaporeRequirementsScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="MalaysiaInfo"
          component={MalaysiaInfoScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="MalaysiaRequirements"
          component={MalaysiaRequirementsScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="MDACSelection"
          component={MDACSelectionScreen}
          options={{
            headerShown: false,
            presentation: 'fullScreenModal',
          }}
        />
        <Stack.Screen
          name="MDACGuide"
          component={MDACGuideScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="MDACWebView"
          component={MDACWebViewScreen}
          options={{
            headerShown: false,
            presentation: 'fullScreenModal',
          }}
        />
        <Stack.Screen
          name="TaiwanInfo"
          component={TaiwanInfoScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="TaiwanRequirements"
          component={TaiwanRequirementsScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="TWArrivalSelection"
          component={TWArrivalSelectionScreen}
          options={{
            headerShown: false,
            presentation: 'fullScreenModal',
          }}
        />
        <Stack.Screen
          name="TWArrivalGuide"
          component={TWArrivalGuideScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="TWArrivalWebView"
          component={TWArrivalWebViewScreen}
          options={{
            headerShown: false,
            presentation: 'fullScreenModal',
          }}
        />
        <Stack.Screen
          name="HongKongInfo"
          component={HongKongInfoScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="HongKongRequirements"
          component={HongKongRequirementsScreen}
          options={{
            headerShown: false,
          }}
        />

        {/* Korea Screens */}
        <Stack.Screen
          name="KoreaInfo"
          component={KoreaInfoScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="KoreaRequirements"
          component={KoreaRequirementsScreen}
          options={{
            headerShown: false,
          }}
        />

        {/* USA Screens */}
        <Stack.Screen
          name="USAInfo"
          component={USAInfoScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="USARequirements"
          component={USARequirementsScreen}
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="SGArrivalSelection"
          component={SGArrivalSelectionScreen}
          options={{
            headerShown: false,
            presentation: 'fullScreenModal',
          }}
        />
        <Stack.Screen
          name="SGArrivalGuide"
          component={SGArrivalGuideScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="SGArrivalWebView"
          component={SGArrivalWebViewScreen}
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
        <Stack.Screen
          name="JapanTravelInfo"
          component={JapanTravelInfoScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="ThailandInfo"
          component={ThailandInfoScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="ThailandRequirements"
          component={ThailandRequirementsScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="ThailandTravelInfo"
          component={ThailandTravelInfoScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="HongkongTravelInfo"
          component={HongkongTravelInfoScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="TaiwanTravelInfo"
          component={TaiwanTravelInfoScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="MalaysiaTravelInfo"
          component={MalaysiaTravelInfoScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="SingaporeTravelInfo"
          component={SingaporeTravelInfoScreen}
          options={{
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
