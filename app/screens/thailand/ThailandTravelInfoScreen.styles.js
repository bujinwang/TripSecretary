/**
 * Styles for ThailandTravelInfoScreen
 *
 * Extracted to separate file for better organization and maintainability
 */

import { StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../../theme';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginLeft: -spacing.sm,
  },
  headerTitle: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
  },
  headerRight: {
    width: 40,
  },
  scrollContainer: {
    paddingBottom: spacing.lg,
  },
  titleSection: {
    padding: spacing.md,
    backgroundColor: colors.white,
  },
  title: {
    ...typography.h2,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: spacing.md,
    backgroundColor: colors.white,
    borderRadius: 8,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.white,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    flex: 1,
  },
  sectionContent: {
    padding: spacing.md,
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  input: {
    ...typography.body1,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    backgroundColor: colors.white,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs,
  },
  warningText: {
    ...typography.caption,
    color: '#856404',
    marginTop: spacing.xs,
  },
  heroSection: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  heroContent: {
    alignItems: 'center',
  },
  heroFlag: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  heroHeading: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  heroDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  heroFeatures: {
    width: '100%',
    gap: spacing.sm,
  },
  heroFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: spacing.md,
    borderRadius: 8,
  },
  heroFeatureIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  heroFeatureText: {
    flex: 1,
    fontSize: 14,
    color: colors.white,
  },
  heroTip: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  heroTipTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: spacing.xs,
  },
  heroTipText: {
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  privacyNotice: {
    padding: spacing.md,
    backgroundColor: '#e7f3ff',
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    marginBottom: spacing.md,
  },
  privacyText: {
    ...typography.caption,
    color: colors.primary,
  },
  sectionIntro: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: spacing.md,
    alignItems: 'flex-start',
  },
  sectionIntroIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  sectionIntroText: {
    flex: 1,
    ...typography.body2,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  fieldContainer: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.white,
    minWidth: 100,
  },
  optionButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionIcon: {
    fontSize: 20,
    marginRight: spacing.xs,
  },
  optionText: {
    ...typography.body2,
    color: colors.text,
  },
  optionTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  inputWithValidationContainer: {
    marginBottom: spacing.md,
  },
  inputLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  inputLabel: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
  },
  fundActions: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  fundButton: {
    flex: 1,
  },
  fundEmptyState: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  fundEmptyText: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  fundList: {
    gap: 0,
  },
  fundListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.white,
  },
  fundListItemDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  fundListItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fundItemIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  fundItemDetails: {
    flex: 1,
  },
  fundItemTitle: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  fundItemSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  fundListItemArrow: {
    fontSize: 24,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  phoneCodeInput: {
    flex: 1,
  },
  phoneInput: {
    flex: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  saveStatusText: {
    ...typography.caption,
    marginLeft: spacing.xs,
  },
  retryButton: {
    marginLeft: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  retryButtonText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '600',
  },
  collapsibleSectionContainer: {
    marginBottom: spacing.md,
    backgroundColor: colors.white,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  collapsibleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  collapsibleHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  collapsibleTitle: {
    ...typography.h3,
    color: colors.text,
  },
  chevronIcon: {
    fontSize: 20,
    color: colors.textSecondary,
  },
  fieldCount: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    marginRight: spacing.sm,
  },
  fieldCountComplete: {
    backgroundColor: '#d4edda', // Light green
  },
  fieldCountIncomplete: {
    backgroundColor: '#fff3cd', // Light yellow
  },
  fieldCountText: {
    ...typography.caption,
    fontWeight: '600',
  },
  fieldCountTextComplete: {
    color: '#155724', // Dark green
  },
  fieldCountTextIncomplete: {
    color: '#856404', // Dark yellow/orange
  },
  sectionIcon: {
    ...typography.h3,
    color: colors.textSecondary,
    marginLeft: spacing.md,
  },
  sectionSubtitle: {
    ...typography.caption,
    color: colors.primary,
    fontSize: 12,
    marginTop: 2,
    fontStyle: 'italic',
  },
  sectionContent: {
    padding: spacing.md,
    paddingTop: 0,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: 0,
  },
  dateTimeField: {
    flex: 1,
  },
  placeholderText: {
    ...typography.body1,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  buttonContainer: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  progressContainer: {
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressBarEnhanced: {
    height: '100%',
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    ...typography.body2,
    color: colors.text,
    marginTop: spacing.md,
  },
  photoUploadContainer: {
    marginBottom: spacing.md,
  },
  photoUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    borderStyle: 'dashed',
    backgroundColor: '#f8f9fa',
  },
  photoUploadIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
    color: colors.primary,
  },
  photoUploadText: {
    ...typography.body2,
    color: colors.primary,
  },
  photoPreview: {
    marginTop: spacing.sm,
    borderRadius: 8,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: 200,
  },


 });

export default styles;
