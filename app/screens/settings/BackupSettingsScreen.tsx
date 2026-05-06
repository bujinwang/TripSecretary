/**
 * BackupSettingsScreen - Manage backup and restore settings
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useTranslation } from '../../i18n/LocaleContext';
import backupService from '../../services/backup/BackupService';

type ProgressInfo = {
    current: number;
    total: number;
    status: string;
    currentEntryInfo?: string;
};

type BackupInfo = {
    backupId: string;
    filename: string;
    createdAt: number;
    type: 'manual' | 'automatic' | 'cloud';
    entryPackCount?: number;
    fileSize: number;
};

type BackupSettings = {
    automaticBackup: boolean;
    backupInterval: 'daily' | 'weekly' | 'monthly';
    includePhotos: boolean;
    maxBackups: number;
};

const BackupSettingsScreen: React.FC = () => {
    const navigation = useNavigation();
    const { t } = useTranslation();

    const [isLoading, setIsLoading] = useState(true);
    const [isBackingUp, setIsBackingUp] = useState(false);
    const [backups, setBackups] = useState<BackupInfo[]>([]);
    const [settings, setSettings] = useState<BackupSettings>({
        automaticBackup: true,
        backupInterval: 'weekly',
        includePhotos: true,
        maxBackups: 10,
    });

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            await backupService.initialize();
            const [loadedSettings, loadedBackups] = await Promise.all([
                backupService.getBackupSettings(),
                backupService.listBackups(),
            ]);
            setSettings(loadedSettings);
            setBackups(loadedBackups);
        } catch (error) {
            console.error('Failed to load backup data:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleCreateBackup = async () => {
        setIsBackingUp(true);
        try {
            const result = await backupService.createManualBackup({
                userId: 'user_001',
                includePhotos: settings.includePhotos,
                onProgress: (progress: ProgressInfo) => {
                    console.log(`Backup progress: ${progress.current}/${progress.total}`);
                },
            });

            if (result.success) {
                Alert.alert(
                    t('backup.success.title', { defaultValue: 'Backup Complete' }),
                    t('backup.success.message', {
                        defaultValue: `Backup created successfully.\nFile: ${result.filename}\nSize: ${Math.round((result.fileSize || 0) / 1024)} KB`,
                    })
                );
                loadData(); // Refresh backup list
            } else {
                Alert.alert(
                    t('backup.error.title', { defaultValue: 'Backup Failed' }),
                    result.message || t('backup.error.message', { defaultValue: 'Could not create backup.' })
                );
            }
        } catch (error) {
            console.error('Backup failed:', error);
            Alert.alert(
                t('backup.error.title', { defaultValue: 'Backup Failed' }),
                String(error)
            );
        } finally {
            setIsBackingUp(false);
        }
    };

    const handleRestore = async (backup: BackupInfo) => {
        Alert.alert(
            t('backup.restore.confirmTitle', { defaultValue: 'Restore Data?' }),
            t('backup.restore.confirmMessage', {
                defaultValue: `This will restore your data from ${new Date(backup.createdAt).toLocaleDateString()}. Current data will be replaced.`,
            }),
            [
                { text: t('common.cancel', { defaultValue: 'Cancel' }), style: 'cancel' },
                {
                    text: t('common.restore', { defaultValue: 'Restore' }),
                    style: 'destructive',
                    onPress: async () => {
                        setIsLoading(true);
                        try {
                            const result = await backupService.performFullRecovery(backup.backupId, 'local', {});
                            if (result.success) {
                                Alert.alert(
                                    t('backup.restore.successTitle', { defaultValue: 'Restore Complete' }),
                                    t('backup.restore.successMessage', {
                                        defaultValue: `Restored ${result.recoveredCount} items successfully.`,
                                    })
                                );
                            } else {
                                throw new Error(result.error);
                            }
                        } catch (error) {
                            console.error('Restore failed:', error);
                            Alert.alert(
                                t('backup.restore.errorTitle', { defaultValue: 'Restore Failed' }),
                                String(error)
                            );
                        } finally {
                            setIsLoading(false);
                        }
                    },
                },
            ]
        );
    };

    const handleDeleteBackup = async (backup: BackupInfo) => {
        Alert.alert(
            t('backup.delete.confirmTitle', { defaultValue: 'Delete Backup?' }),
            t('backup.delete.confirmMessage', { defaultValue: 'This backup will be permanently removed.' }),
            [
                { text: t('common.cancel', { defaultValue: 'Cancel' }), style: 'cancel' },
                {
                    text: t('common.delete', { defaultValue: 'Delete' }),
                    style: 'destructive',
                    onPress: async () => {
                        const success = await backupService.deleteBackup(backup.backupId);
                        if (success) {
                            loadData();
                        } else {
                            Alert.alert(
                                t('backup.delete.errorTitle', { defaultValue: 'Delete Failed' }),
                                t('backup.delete.errorMessage', { defaultValue: 'Could not delete backup.' })
                            );
                        }
                    },
                },
            ]
        );
    };

    const handleToggleAutomaticBackup = async (value: boolean) => {
        const newSettings = { ...settings, automaticBackup: value };
        setSettings(newSettings);
        await backupService.updateBackupSettings(newSettings);
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>
                        {t('backup.loading', { defaultValue: 'Loading backups...' })}
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {t('backup.title', { defaultValue: 'Backup & Restore' })}
                </Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                {/* Manual Backup Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        {t('backup.manualBackup.title', { defaultValue: 'Manual Backup' })}
                    </Text>
                    <TouchableOpacity
                        style={[styles.primaryButton, isBackingUp && styles.primaryButtonDisabled]}
                        onPress={handleCreateBackup}
                        disabled={isBackingUp}
                    >
                        {isBackingUp ? (
                            <ActivityIndicator color={colors.white} />
                        ) : (
                            <Text style={styles.primaryButtonText}>
                                {t('backup.manualBackup.button', { defaultValue: '💾 Backup Now' })}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Settings Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        {t('backup.settings.title', { defaultValue: 'Settings' })}
                    </Text>
                    <View style={styles.settingRow}>
                        <View style={styles.settingLabelContainer}>
                            <Text style={styles.settingLabel}>
                                {t('backup.settings.automatic', { defaultValue: 'Automatic Backup' })}
                            </Text>
                            <Text style={styles.settingDescription}>
                                {t('backup.settings.automaticDescription', {
                                    defaultValue: `Weekly backup (keeps last ${settings.maxBackups})`,
                                })}
                            </Text>
                        </View>
                        <Switch
                            value={settings.automaticBackup}
                            onValueChange={handleToggleAutomaticBackup}
                            trackColor={{ false: colors.border, true: colors.primaryLight }}
                            thumbColor={settings.automaticBackup ? colors.primary : colors.textSecondary}
                        />
                    </View>
                </View>

                {/* Backup History Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        {t('backup.history.title', { defaultValue: 'Backup History' })}
                        {backups.length > 0 && ` (${backups.length})`}
                    </Text>
                    {backups.length === 0 ? (
                        <Text style={styles.emptyText}>
                            {t('backup.history.empty', { defaultValue: 'No backups yet. Create one above.' })}
                        </Text>
                    ) : (
                        backups.map((backup) => (
                            <View key={backup.backupId} style={styles.backupItem}>
                                <View style={styles.backupInfo}>
                                    <Text style={styles.backupDate}>
                                        {new Date(backup.createdAt).toLocaleString()}
                                    </Text>
                                    <Text style={styles.backupMeta}>
                                        {backup.type === 'automatic' ? '🔄 Auto' : '👆 Manual'} •{' '}
                                        {formatFileSize(backup.fileSize)}
                                    </Text>
                                </View>
                                <View style={styles.backupActions}>
                                    <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={() => handleRestore(backup)}
                                    >
                                        <Text style={styles.actionButtonText}>
                                            {t('backup.history.restore', { defaultValue: 'Restore' })}
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.actionButtonDanger]}
                                        onPress={() => handleDeleteBackup(backup)}
                                    >
                                        <Text style={[styles.actionButtonText, styles.actionButtonTextDanger]}>
                                            {t('backup.history.delete', { defaultValue: 'Delete' })}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: spacing.md,
        color: colors.textSecondary,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.white,
    },
    backButton: {
        padding: spacing.sm,
    },
    backButtonText: {
        fontSize: 24,
        color: colors.primary,
    },
    headerTitle: {
        ...typography.h3,
        color: colors.text,
    },
    headerSpacer: {
        width: 40,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: spacing.md,
        paddingBottom: spacing.xl,
    },
    section: {
        marginBottom: spacing.lg,
        backgroundColor: colors.white,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    sectionTitle: {
        ...typography.h4,
        color: colors.text,
        marginBottom: spacing.md,
    },
    primaryButton: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        alignItems: 'center',
    },
    primaryButtonDisabled: {
        opacity: 0.6,
    },
    primaryButtonText: {
        color: colors.white,
        fontWeight: '600',
        fontSize: 16,
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.sm,
    },
    settingLabelContainer: {
        flex: 1,
        marginRight: spacing.md,
    },
    settingLabel: {
        ...typography.body,
        color: colors.text,
    },
    settingDescription: {
        ...typography.caption,
        color: colors.textSecondary,
        marginTop: 2,
    },
    emptyText: {
        color: colors.textSecondary,
        textAlign: 'center',
        paddingVertical: spacing.lg,
    },
    backupItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backupInfo: {
        flex: 1,
    },
    backupDate: {
        ...typography.body,
        color: colors.text,
    },
    backupMeta: {
        ...typography.caption,
        color: colors.textSecondary,
        marginTop: 2,
    },
    backupActions: {
        flexDirection: 'row',
        gap: spacing.xs,
    },
    actionButton: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
        borderWidth: 1,
        borderColor: colors.primary,
    },
    actionButtonText: {
        color: colors.primary,
        fontSize: 12,
        fontWeight: '500',
    },
    actionButtonDanger: {
        borderColor: colors.error,
    },
    actionButtonTextDanger: {
        color: colors.error,
    },
});

export default BackupSettingsScreen;
