import { StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../../theme';

export const styles = StyleSheet.create({
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
    alignItems: 'flex-end',
  },
  saveStatus: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundLight,
  },
  saveStatusSuccess: {
    backgroundColor: '#d4edda',
  },
  saveStatusError: {
    backgroundColor: '#f8d7da',
  },
  scrollContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  titleSection: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  flag: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body1,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: colors.backgroundLight,
    marginBottom: spacing.sm,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text,
  },
  completionHint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  sectionContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionContent: {
    padding: spacing.md,
    paddingTop: 0,
  },
  fieldContainer: {
    marginTop: spacing.md,
  },
  fieldLabel: {
    ...typography.body2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  warningText: {
    ...typography.caption,
    color: '#FF9500',
    marginTop: spacing.xs,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  genderButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    alignItems: 'center',
  },
  genderButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  genderButtonText: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  genderButtonTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  optionButtonsContainer: {
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
    borderRadius: 12,
    backgroundColor: colors.white,
  },
  optionButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  optionIcon: {
    marginRight: spacing.xs,
    fontSize: 18,
  },
  optionButtonText: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  optionButtonTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  customInputContainer: {
    marginTop: spacing.sm,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  helperText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  phoneCodeContainer: {
    width: 140,
    maxWidth: 180,
  },
  phoneCodeInput: {
    textAlign: 'center',
  },
  phoneNumberContainer: {
    flex: 1,
  },
  fundsList: {
    marginTop: spacing.sm,
  },
  fundItem: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  fundItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  fundItemType: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text,
  },
  fundItemAmount: {
    ...typography.body2,
    color: colors.primary,
  },
  fundItemDetails: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  fundItemPhoto: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  addFundContainer: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  addFundTitle: {
    ...typography.body2,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  fundTypeButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  fundTypeButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  fundTypeButtonText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text,
  },
  helperTextContainer: {
    marginTop: spacing.sm,
  },
  helperTextHighlight: {
    ...typography.caption,
    color: colors.primary,
  },
  buttonContainer: {
    marginTop: spacing.lg,
  },
  continueButton: {
    marginTop: spacing.sm,
  },
});
