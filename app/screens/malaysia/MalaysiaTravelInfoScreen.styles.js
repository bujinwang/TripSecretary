// MalaysiaTravelInfoScreen.styles.js
// Styles for Malaysia Travel Info Screen
import { StyleSheet } from 'react-native';
import { colors, spacing } from '../../theme';

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
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  saveStatus: {
    fontSize: 16,
  },
  saveStatusSuccess: {
    color: colors.success,
  },
  saveStatusError: {
    color: colors.error,
  },
  scrollContainer: {
    paddingBottom: spacing.xl,
  },
  bottomActions: {
    padding: spacing.md,
  },
  continueButton: {
    marginBottom: spacing.sm,
  },
});

export default styles;
