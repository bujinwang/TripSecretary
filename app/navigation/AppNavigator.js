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
  EntryInfoHistoryScreen,
  PresentToCustomsScreen,
  CopyWriteModeScreen,
  AirportArrivalScreen,
  // Japan screens
  JapanInfoScreen,
  JapanRequirementsScreen,
  JapanProceduresScreen,
  JapanTravelInfoScreen,
  JapanEntryFlowScreen,
  InteractiveImmigrationGuide,
  JapanInteractiveImmigrationGuide,
  // Thailand screens
  ImmigrationOfficerViewScreen,
  ThailandInfoScreen,
  ThailandRequirementsScreen,
  PIKGuideScreen,
  TDACWebViewScreen,
  TDACAPIScreen,
  TDACSelectionScreen,
  TDACHybridScreen,
  ThailandEntryFlowScreen,
  ThailandTravelInfoScreen,
  ThailandEntryGuideScreen,
  // Malaysia screens
  MalaysiaInfoScreen,
  MalaysiaRequirementsScreen,
  MDACSelectionScreen,
  MDACGuideScreen,
  MDACWebViewScreen,
  MalaysiaTravelInfoScreen,
  MalaysiaEntryFlowScreen,
  MalaysiaEntryPackPreviewScreen,
  // Singapore screens
  SingaporeInfoScreen,
  SingaporeRequirementsScreen,
  SGArrivalSelectionScreen,
  SGArrivalGuideScreen,
  SGArrivalWebViewScreen,
  SingaporeTravelInfoScreen,
  SingaporeEntryFlowScreen,
  SingaporeEntryPackPreviewScreen,
  // Vietnam screens
  VietnamInfoScreen,
  VietnamRequirementsScreen,
  VietnamTravelInfoScreen,
  VietnamEntryFlowScreen,
  VietnamEntryPackPreviewScreen,
  // Taiwan screens
  TaiwanInfoScreen,
  TaiwanRequirementsScreen,
  TaiwanTravelInfoScreen,
  TaiwanEntryFlowScreen,
  TaiwanEntryPackPreviewScreen,
  TWArrivalSelectionScreen,
  TWArrivalGuideScreen,
  TWArrivalWebViewScreen,
  // Hong Kong screens
  HongKongInfoScreen,
  HongKongRequirementsScreen,
  HDACSelectionScreen,
  HDACGuideScreen,
  HDACWebViewScreen,
  HongkongTravelInfoScreen,
  HongKongEntryFlowScreen,
  HongKongEntryPackPreviewScreen,
  // Korea screens
  KoreaInfoScreen,
  KoreaRequirementsScreen,
  KoreaTravelInfoScreen,
  KoreaEntryFlowScreen,
  // USA screens
  USAInfoScreen,
  USARequirementsScreen,
  USTravelInfoScreen,
} from '../screens';

// Import NotificationSettingsScreen directly since it's not in the screens index yet
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';
import NotificationTestScreen from '../screens/NotificationTestScreen';
import NotificationLogScreen from '../screens/NotificationLogScreen';
import EntryInfoDetailScreen from '../screens/thailand/EntryInfoDetailScreen';
import TDACFilesScreen from '../screens/thailand/TDACFilesScreen';
import SingaporeEntryGuideScreen from '../screens/entryGuide/SingaporeEntryGuideScreen';
import KoreaEntryGuideScreen from '../screens/entryGuide/KoreaEntryGuideScreen.js';
import MalaysiaEntryGuideScreen from '../screens/entryGuide/MalaysiaEntryGuideScreen';
import HongKongEntryGuideScreen from '../screens/entryGuide/HongKongEntryGuideScreen';
import VietnamEntryGuideScreen from '../screens/entryGuide/VietnamEntryGuideScreen';
import KoreaEntryPackPreviewScreen from '../screens/korea/KoreaEntryPackPreviewScreen';

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
const AppNavigator = React.forwardRef((props, ref) => {
  const { t } = useTranslation();
  
  return (
    <NavigationContainer ref={ref} onReady={props.onReady}>
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
          name="TDACFiles"
          component={TDACFilesScreen}
          options={{
            headerShown: true,
            title: 'Saved TDAC Files',
            headerTintColor: colors.text,
            headerStyle: {
              backgroundColor: colors.white,
            },
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
          name="TaiwanEntryFlow"
          component={TaiwanEntryFlowScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="TaiwanEntryPackPreview"
          component={TaiwanEntryPackPreviewScreen}
          options={{
            headerShown: false,
            presentation: 'modal',
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
        <Stack.Screen
          name="KoreaTravelInfo"
          component={KoreaTravelInfoScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="KoreaEntryFlow"
          component={KoreaEntryFlowScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="KoreaEntryGuide"
          component={KoreaEntryGuideScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="KoreaEntryPackPreview"
          component={KoreaEntryPackPreviewScreen}
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
          name="USTravelInfo"
          component={USTravelInfoScreen}
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
          name="ThailandInteractiveImmigrationGuide"
          component={require('../screens/thailand/ThailandInteractiveImmigrationGuide').default}
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
          name="JapanEntryFlow"
          component={JapanEntryFlowScreen}
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
          name="ThailandEntryFlow"
          component={ThailandEntryFlowScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="ImmigrationOfficerView"
          component={ImmigrationOfficerViewScreen}
          options={{
            headerShown: false,
            presentation: 'fullScreenModal',
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="ThailandEntryQuestions"
          component={require('../screens/thailand/ThailandEntryQuestionsScreen').default}
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
          name="ThailandEntryGuide"
          component={ThailandEntryGuideScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="VietnamInfo"
          component={VietnamInfoScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="VietnamRequirements"
          component={VietnamRequirementsScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="VietnamTravelInfo"
          component={VietnamTravelInfoScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="VietnamEntryFlow"
          component={VietnamEntryFlowScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="VietnamEntryGuide"
          component={VietnamEntryGuideScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="VietnamEntryPackPreview"
          component={VietnamEntryPackPreviewScreen}
          options={{
            headerShown: false,
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="JapanInteractiveImmigrationGuide"
          component={JapanInteractiveImmigrationGuide}
          options={{
            headerShown: false,
            gestureEnabled: false, // Prevent accidental back during immigration
          }}
        />
        <Stack.Screen
          name="EntryInfoDetail"
          component={EntryInfoDetailScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="EntryPackPreview"
          component={require('../screens/thailand/EntryPackPreviewScreen').default}
          options={{
            headerShown: false,
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="EntryInfoHistory"
          component={EntryInfoHistoryScreen}
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
          name="HDACSelection"
          component={HDACSelectionScreen}
          options={{
            headerShown: false,
            presentation: 'fullScreenModal',
          }}
        />
        <Stack.Screen
          name="HDACGuide"
          component={HDACGuideScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="HDACWebView"
          component={HDACWebViewScreen}
          options={{
            headerShown: false,
            presentation: 'fullScreenModal',
          }}
        />
        <Stack.Screen
          name="HongKongEntryFlow"
          component={HongKongEntryFlowScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="HongKongEntryPackPreview"
          component={HongKongEntryPackPreviewScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="HongKongEntryGuide"
          component={HongKongEntryGuideScreen}
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
          name="MalaysiaEntryFlow"
          component={MalaysiaEntryFlowScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="MalaysiaEntryGuide"
          component={MalaysiaEntryGuideScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="MalaysiaEntryPackPreview"
          component={MalaysiaEntryPackPreviewScreen}
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
        <Stack.Screen
          name="SingaporeEntryFlow"
          component={SingaporeEntryFlowScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="SingaporeEntryGuide"
          component={SingaporeEntryGuideScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="SingaporeEntryPackPreview"
          component={SingaporeEntryPackPreviewScreen}
          options={{
            headerShown: false,
            presentation: 'modal',
          }}
        />

        {/* Settings Screens */}
        <Stack.Screen
          name="NotificationSettings"
          component={NotificationSettingsScreen}
          options={{
            headerShown: true,
            title: t('screenTitles.notificationSettings'),
            headerTintColor: colors.text,
            headerStyle: {
              backgroundColor: colors.white,
            },
          }}
        />
        
        <Stack.Screen
          name="NotificationLog"
          component={NotificationLogScreen}
          options={{
            headerShown: false, // Using custom header in the screen
          }}
        />
        
        {/* Development Tools (only in development mode) */}
        {__DEV__ && (
          <>
            <Stack.Screen
              name="NotificationTest"
              component={require('../screens/NotificationTestScreen').default}
              options={{
                headerShown: true,
                title: 'Notification Testing',
                headerTintColor: colors.text,
                headerStyle: {
                  backgroundColor: colors.white,
                },
              }}
            />
            <Stack.Screen
              name="TDACDebug"
              component={require('../screens/debug/TDACDebugScreen').default}
              options={{
                headerShown: true,
                title: 'TDAC Debug & Connectivity',
                headerTintColor: colors.text,
                headerStyle: {
                  backgroundColor: colors.white,
                },
              }}
            />
            <Stack.Screen
              name="TamaguiTest"
              component={require('../tamagui/TamaguiTestScreen').default}
              options={{
                headerShown: true,
                title: 'Tamagui Test',
                headerTintColor: colors.text,
                headerStyle: {
                  backgroundColor: colors.white,
                },
              }}
            />
            <Stack.Screen
              name="ComponentShowcase"
              component={require('../components/tamagui/ComponentShowcase').default}
              options={{
                headerShown: true,
                title: 'Component Library',
                headerTintColor: colors.text,
                headerStyle: {
                  backgroundColor: colors.white,
                },
              }}
            />
          </>
        )}
        
      </Stack.Navigator>
    </NavigationContainer>
  );
});

export default AppNavigator;
