import { StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../../theme';

const styles = StyleSheet.create({
  // ============================================================
  // CONTAINER & LAYOUT
  // ============================================================
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
    paddingBottom: spacing.xl,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    ...typography.body1,
    color: colors.textSecondary,
  },

  // ============================================================
  // HERO SECTION
  // ============================================================
  heroSection: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },

  heroContent: {
    alignItems: 'center',
  },

  heroFlag: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },

  heroHeading: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },

  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },

  valueProposition: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: spacing.md,
  },

  valueItem: {
    alignItems: 'center',
  },

  valueIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },

  valueText: {
    fontSize: 12,
    color: colors.white,
    textAlign: 'center',
  },

  beginnerTip: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
  },

  tipIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },

  tipText: {
    flex: 1,
    fontSize: 13,
    color: colors.white,
    lineHeight: 18,
  },

  // ============================================================
  // PROGRESS OVERVIEW CARD
  // ============================================================
  progressOverviewCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.lg,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },

  progressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
  },

  progressSteps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },

  progressStep: {
    flex: 1,
    alignItems: 'center',
    opacity: 0.5,
  },

  progressStepActive: {
    opacity: 1,
  },

  stepIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },

  stepText: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  stepTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },

  progressBarContainer: {
    marginTop: spacing.sm,
  },

  progressBarEnhanced: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: 4,
  },

  progressText: {
    fontSize: 13,
    marginTop: spacing.sm,
    textAlign: 'center',
    fontWeight: '600',
  },

  // ============================================================
  // PRIMARY ACTION BUTTON
  // ============================================================
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  primaryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },

  primaryButtonIcon: {
    fontSize: 28,
    marginRight: spacing.md,
  },

  primaryButtonTextContainer: {
    flex: 1,
  },

  primaryButtonTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 2,
  },

  primaryButtonSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
  },

  primaryButtonArrow: {
    fontSize: 24,
    color: colors.white,
    fontWeight: '400',
    marginLeft: spacing.md,
  },

  // ============================================================
  // PRIVACY BOX
  // ============================================================
  privacyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },

  privacyIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },

  privacyText: {
    flex: 1,
    fontSize: 13,
    color: '#1e40af',
  },

  // ============================================================
  // SAVE STATUS INDICATOR
  // ============================================================
  saveStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 8,
  },

  saveStatusPending: {
    backgroundColor: '#fef3c7',
  },

  saveStatusSaving: {
    backgroundColor: '#dbeafe',
  },

  saveStatusSaved: {
    backgroundColor: '#d1fae5',
  },

  saveStatusError: {
    backgroundColor: '#fee2e2',
  },

  saveStatusIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },

  saveStatusText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },

  retryButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 6,
  },

  retryButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },

  lastEditedText: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },

  // ============================================================
  // SECTION CARDS
  // ============================================================
  sectionCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.white,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },

  sectionHeader: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },

  sectionContent: {
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },

  // ============================================================
  // GENDER SELECTOR
  // ============================================================
  genderContainer: {
    marginTop: spacing.md,
  },

  genderLabel: {
    ...typography.body2,
    color: colors.text,
    marginBottom: spacing.sm,
    fontWeight: '500',
  },

  genderButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  genderButton: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
  },

  genderButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  genderButtonText: {
    ...typography.body2,
    color: colors.text,
  },

  genderButtonTextSelected: {
    color: colors.white,
    fontWeight: '600',
  },

  // ============================================================
  // PHONE INPUT
  // ============================================================
  phoneRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  phoneCodeContainer: {
    flex: 1,
  },

  phoneNumberContainer: {
    flex: 2,
  },

  phoneCodeInput: {
    minWidth: 80,
  },

  // ============================================================
  // CHECKBOX
  // ============================================================
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
  },

  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.white,
    marginRight: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
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

  checkboxLabel: {
    ...typography.body1,
    color: colors.text,
    flex: 1,
  },

  // ============================================================
  // FUNDS SECTION
  // ============================================================
  fundsInfoBox: {
    flexDirection: 'row',
    backgroundColor: '#fffbeb',
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
  },

  fundsInfoIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },

  fundsInfoText: {
    flex: 1,
    fontSize: 13,
    color: '#92400e',
    lineHeight: 18,
  },

  emptyFundsText: {
    ...typography.body2,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },

  fundsList: {
    marginBottom: spacing.md,
  },

  fundItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },

  fundItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  fundItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  fundItemIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },

  fundItemDetails: {
    flex: 1,
  },

  fundItemType: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },

  fundItemValue: {
    ...typography.caption,
    color: colors.textSecondary,
  },

  rowArrow: {
    ...typography.h3,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },

  addFundItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    marginTop: spacing.md,
  },

  addFundItemIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },

  addFundItemText: {
    ...typography.body2,
    color: colors.primary,
    fontWeight: '600',
  },

  // ============================================================
  // ERROR TEXT
  // ============================================================
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs,
  },
});

export default styles;
