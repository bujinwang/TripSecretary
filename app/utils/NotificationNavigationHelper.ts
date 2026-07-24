/**
 * NotificationNavigationHelper - Utility functions for handling navigation from notifications
 * 
 * Features:
 * - Parse notification parameters from route params
 * - Handle notification-specific UI states
 * - Provide feedback for notification actions
 * 
 * Requirements: 16.1-16.5
 */

import { Alert } from 'react-native';
import { getTranslationWithFallback } from '../i18n/locales';

interface RouteParams {
  fromNotification?: boolean;
  notificationData?: Record<string, unknown>;
  expandSection?: string;
  entryPackId?: string;
  userId?: string;
  destinationId?: string;
  [key: string]: unknown;
}

interface Route {
  params?: RouteParams;
}

interface NavigationParams {
  setParams: (params: Record<string, unknown>) => void;
}

interface NotificationContext {
  action: string | null;
  data: Record<string, unknown> | null;
  entryPackId: string | null;
  userId: string | null;
  destinationId: string | null;
  shouldAutoSubmit: boolean;
  isResubmissionMode: boolean;
  expandSection: string | null;
  shouldShowGuide: boolean;
}

export function isFromNotification(route: Route): boolean {
  return route.params?.fromNotification === true;
}

export function getNotificationData(route: Route): Record<string, unknown> | null {
  if (!isFromNotification(route)) {
    return null;
  }
  
  return (route.params?.notificationData as Record<string, unknown>) || {};
}

export function getNotificationAction(route: Route): string | null {
  const notificationData = getNotificationData(route);
  return (notificationData?.fromAction as string) || null;
}

export function shouldAutoSubmit(route: Route): boolean {
  const notificationData = getNotificationData(route);
  return notificationData?.autoSubmit === true;
}

export function isResubmissionMode(route: Route): boolean {
  const notificationData = getNotificationData(route);
  return notificationData?.resubmissionMode === true;
}

export function getExpandSection(route: Route): string | null {
  const notificationData = getNotificationData(route);
  return (notificationData?.expandSection as string) || (route.params?.expandSection as string) || null;
}

export function shouldShowGuide(route: Route): boolean {
  const notificationData = getNotificationData(route);
  return notificationData?.showGuide === true;
}

export function getEntryPackId(route: Route): string | null {
  const notificationData = getNotificationData(route);
  return (notificationData?.entryPackId as string) || (route.params?.entryPackId as string) || null;
}

export function getUserId(route: Route): string | null {
  const notificationData = getNotificationData(route);
  return (notificationData?.userId as string) || (route.params?.userId as string) || null;
}

export function getDestinationId(route: Route): string | null {
  const notificationData = getNotificationData(route);
  return (notificationData?.destinationId as string) || (route.params?.destinationId as string) || null;
}

export function showNotificationActionFeedback(action: string, locale = 'en'): void {
  const feedbackMessages: Record<string, { title: string; message: string }> = {
    submit: {
      title: getTranslationWithFallback('progressiveEntryFlow.notifications.feedback.submitTitle', locale),
      message: getTranslationWithFallback('progressiveEntryFlow.notifications.feedback.submitMessage', locale)
    },
    resubmit: {
      title: getTranslationWithFallback('progressiveEntryFlow.notifications.feedback.resubmitTitle', locale),
      message: getTranslationWithFallback('progressiveEntryFlow.notifications.feedback.resubmitMessage', locale)
    },
    continue: {
      title: getTranslationWithFallback('progressiveEntryFlow.notifications.feedback.continueTitle', locale),
      message: getTranslationWithFallback('progressiveEntryFlow.notifications.feedback.continueMessage', locale)
    },
    view: {
      title: getTranslationWithFallback('progressiveEntryFlow.notifications.feedback.viewTitle', locale),
      message: getTranslationWithFallback('progressiveEntryFlow.notifications.feedback.viewMessage', locale)
    }
  };

  const feedback = feedbackMessages[action];
  if (feedback) {
    Alert.alert(feedback.title, feedback.message, [
      {
        text: getTranslationWithFallback('common.ok', locale),
        style: 'default'
      }
    ]);
  }
}

export function handleNotificationScreenInit(route: Route, callback: ((context: NotificationContext) => void) | null): void {
  if (!isFromNotification(route)) {
    return;
  }

  const notificationData = getNotificationData(route);
  const action = getNotificationAction(route);

  if (typeof callback === 'function') {
    callback({
      action,
      data: notificationData,
      entryPackId: getEntryPackId(route),
      userId: getUserId(route),
      destinationId: getDestinationId(route),
      shouldAutoSubmit: shouldAutoSubmit(route),
      isResubmissionMode: isResubmissionMode(route),
      expandSection: getExpandSection(route),
      shouldShowGuide: shouldShowGuide(route)
    });
  }
}

export function createNotificationAwareParams(baseParams: Record<string, unknown> = {}, notificationContext: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    ...baseParams,
    fromNotification: true,
    notificationData: {
      timestamp: new Date().toISOString(),
      ...notificationContext
    }
  };
}

export function logNotificationNavigation(screenName: string, route: Route): void {
  if (!isFromNotification(route)) {
    return;
  }

  const notificationData = getNotificationData(route);
  const action = getNotificationAction(route);

  console.log('Notification navigation event:', {
    screenName,
    action,
    notificationType: notificationData?.type,
    entryPackId: getEntryPackId(route),
    timestamp: new Date().toISOString()
  });
}

export function clearNotificationParams(navigation: NavigationParams): void {
  navigation.setParams({
    fromNotification: undefined,
    notificationData: undefined
  });
}

export function isNotificationRelevant(route: Route, maxAgeMinutes = 30): boolean {
  const notificationData = getNotificationData(route);
  
  if (!notificationData || !notificationData.timestamp) {
    return true;
  }

  const notificationTime = new Date(notificationData.timestamp as string);
  const now = new Date();
  const ageMinutes = (now.getTime() - notificationTime.getTime()) / (1000 * 60);

  return ageMinutes <= maxAgeMinutes;
}

export default {
  isFromNotification,
  getNotificationData,
  getNotificationAction,
  shouldAutoSubmit,
  isResubmissionMode,
  getExpandSection,
  shouldShowGuide,
  getEntryPackId,
  getUserId,
  getDestinationId,
  showNotificationActionFeedback,
  handleNotificationScreenInit,
  createNotificationAwareParams,
  logNotificationNavigation,
  clearNotificationParams,
  isNotificationRelevant
};
