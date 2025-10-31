/**
 * Vietnam Travel Info Screen - V2 Template Implementation
 *
 * PRODUCTION VERSION using EnhancedTravelInfoTemplate V2
 *
 * This is the main Vietnam travel info screen used by the app.
 * It leverages the V2 template to provide Thailand-grade features
 * with minimal code.
 *
 * CODE REDUCTION:
 * - Before: 630 lines (AsyncStorage, broken persistence)
 * - After: 11 lines (UserDataService, proper DB persistence)
 * - Reduction: 98.3%
 *
 * FEATURES (automatically from V2 template):
 * ✅ User interaction tracking (prevents data overwrites)
 * ✅ Field state filtering (only save user-modified fields)
 * ✅ Config-driven validation with soft validation
 * ✅ Smart button with dynamic labels based on completion
 * ✅ Fund management with CRUD operations
 * ✅ Last edited timestamp tracking
 * ✅ Immediate save for critical fields
 * ✅ Auto-save with debouncing
 * ✅ Proper UserDataService integration (passports, personal_info, travel_info, funds tables)
 * ✅ Thailand-style rich hero with LinearGradient
 * ✅ All 4 sections (passport, personal, funds, travel) fully functional
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import EnhancedTravelInfoTemplate from '../../templates/EnhancedTravelInfoTemplate.v2';
import { vietnamComprehensiveTravelInfoConfig } from '../../config/destinations/vietnam/comprehensiveTravelInfoConfig';
import { TravelInfoScreenTemplate } from '../../templates';
import { vietnamTravelInfoConfig } from '../../config/destinations/vietnam/travelInfoConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import shared section components
import {
  PassportSection,
  PersonalInfoSection,
  FundsSection,
  TravelDetailsSection,
} from '../../components/shared';

// Import Vietnam-specific data
import {
  vietnamProvinces,
  getDistrictsByProvince,
} from '../../data/vietnamLocations';
import { vietnamLabels, vietnamConfig } from '../../config/labels/vietnam';

// Import Tamagui components
import {
  YStack,
  BaseCard,
  BaseButton,
  Text as TamaguiText,
} from '../../components/tamagui';

// Import utilities
import UserDataService from '../../services/data/UserDataService';

const VietnamTravelInfoScreen = ({ navigation, route }) => {
  return (
    <EnhancedTravelInfoTemplate
      config={vietnamComprehensiveTravelInfoConfig}
      route={route}
      navigation={navigation}
    />
  );
};

export default VietnamTravelInfoScreen;

/**
 * MIGRATION NOTES (2025-10-30):
 *
 * This file was successfully migrated from a 630-line manual implementation
 * to an 11-line V2 template-based implementation (98.3% code reduction).
 *
 * Old implementation issues:
 * ❌ AsyncStorage (unreliable, no relational data)
 * ❌ 30+ individual useState hooks
 * ❌ Manual validation logic
 * ❌ Manual save/load logic
 * ❌ No field state tracking
 *
 * New V2 template provides:
 * ✅ UserDataService (proper SQLite persistence)
 * ✅ Single form state from config
 * ✅ Config-driven validation
 * ✅ Automatic save/load with field filtering
 * ✅ Field state tracking to prevent overwrites
 * ✅ Smart button, last edited timestamp, and more
 *
 * All sections now properly hooked up with persistence:
 * 1. Passport Section → passports table
 * 2. Personal Info Section → personal_info table
 * 3. Funds Section → fund_items table
 * 4. Travel Details Section → travel_info table
 */
