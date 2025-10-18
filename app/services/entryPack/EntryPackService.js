/**
 * EntryPackService - Service for managing entry pack lifecycle
 * Handles creation, updates, status management, and archival of entry packs
 * 
 * Requirements: 10.1-10.6, 13.1-13.6, 14.1-14.5
 */

import EntryPack from '../../models/EntryPack';
import EntryInfo from '../../models/EntryInfo';
import EntryCompletionCalculator from '../../utils/EntryCompletionCalculator';
import ArrivalWindowCalculator from '../../utils/thailand/ArrivalWindowCalculator';

class EntryPackService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    
    // State machine definition for entry pack lifecycle
    this.stateTransitions = {
      'in_progress': ['submitted', 'archived'],
      'submitted': ['superseded', 'completed', 'expired', 'archived'],
      'superseded': ['submitted', 'archived'],
      'completed': ['archived'],
      'expired': ['archived'],
      'archived': [] // Terminal state
    };
    
    // State change history for audit trail
    this.stateChangeHistory = new Map();
  }

  /**
   * Create or update entry pack
   * @param {string} entryInfoId - Entry info ID
   * @param {Object} tdacSubmission - TDAC submission data
   * @param {Object} options - Additional options
   * @returns {Promise<EntryPack>} - Created or updated entry pack
   */
  async createOrUpdatePack(entryInfoId, tdacSubmission = null, options = {}) {
    try {
      console.log('Creating/updating entry pack:', {
        entryInfoId,
        hasTDAC: !!tdacSubmission,
        options
      });

      // Load entry info to get context
      const entryInfo = await EntryInfo.load(entryInfoId);
      if (!entryInfo) {
        throw new Error(`Entry info not found: ${entryInfoId}`);
      }

      // Handle TDAC submission success
      let shouldTransitionToSubmitted = false;
      if (tdacSubmission && tdacSubmission.arrCardNo) {
        console.log('TDAC submission successful, will transition to submitted state');
        shouldTransitionToSubmitted = true;
      }

      // Check if entry pack already exists
      let entryPack = await this.getByEntryInfoId(entryInfoId);
      
      if (entryPack) {
        // Update existing pack
        if (shouldTransitionToSubmitted && entryPack.status !== 'submitted') {
          // Use state transition system for submission
          entryPack = await this.transitionState(entryPack.id, 'submitted', {
            reason: 'TDAC submission successful',
            tdacSubmission: tdacSubmission,
            submissionMethod: options.submissionMethod || 'api',
            metadata: {
              arrCardNo: tdacSubmission.arrCardNo,
              submissionMethod: options.submissionMethod || 'api'
            }
          });
        } else if (tdacSubmission) {
          // Update TDAC data without state change
          entryPack.updateTDACSubmission(tdacSubmission, options.submissionMethod || 'api');
          await entryPack.save();
        }
        
        // Update display status
        const summary = await this.calculateSummary(entryInfo);
        entryPack.updateDisplayStatus(summary.displayStatus);
        await entryPack.save();
        
        console.log('Entry pack updated:', {
          id: entryPack.id,
          status: entryPack.status,
          hasSubmission: entryPack.hasValidTDACSubmission()
        });
      } else {
        // Create new pack
        const summary = await this.calculateSummary(entryInfo);
        
        entryPack = new EntryPack({
          entryInfoId: entryInfoId,
          userId: entryInfo.userId,
          destinationId: entryInfo.destinationId,
          tripId: entryInfo.tripId,
          displayStatus: summary.displayStatus,
          status: 'in_progress' // Always start as in_progress
        });

        await entryPack.save();
        
        // Transition to submitted if TDAC submission provided
        if (shouldTransitionToSubmitted) {
          entryPack = await this.transitionState(entryPack.id, 'submitted', {
            reason: 'TDAC submission successful during creation',
            tdacSubmission: tdacSubmission,
            submissionMethod: options.submissionMethod || 'api',
            metadata: {
              arrCardNo: tdacSubmission.arrCardNo,
              submissionMethod: options.submissionMethod || 'api'
            }
          });
        }
        
        console.log('Entry pack created:', {
          id: entryPack.id,
          status: entryPack.status,
          hasSubmission: entryPack.hasValidTDACSubmission()
        });
      }

      // Auto-cancel window open notification if TDAC was successfully submitted
      if (shouldTransitionToSubmitted && tdacSubmission) {
        await this.autoCancelWindowOpenNotification(entryPack.id, tdacSubmission);
      } else {
        // Schedule notifications for new entry packs or when not yet submitted
        await this.scheduleNotificationsForEntryPack(entryPack, entryInfo);
      }

      // Clear cache
      this.clearCacheForUser(entryInfo.userId);

      return entryPack;
    } catch (error) {
      console.error('Failed to create/update entry pack:', error);
      throw error;
    }
  }

  /**
   * Get preparation status summary
   * @param {string} destinationId - Destination ID
   * @param {string} tripId - Trip ID (optional)
   * @returns {Promise<Object>} - Preparation status summary
   */
  async getSummary(destinationId, tripId = null) {
    try {
      // Find entry info by destination and trip
      const entryInfo = await this.findEntryInfo(destinationId, tripId);
      if (!entryInfo) {
        return this.getEmptySummary(destinationId);
      }

      return await this.calculateSummary(entryInfo);
    } catch (error) {
      console.error('Failed to get preparation summary:', error);
      throw error;
    }
  }

  /**
   * Calculate summary for entry info
   * @param {EntryInfo} entryInfo - Entry info instance
   * @returns {Promise<Object>} - Calculated summary
   */
  async calculateSummary(entryInfo) {
    try {
      // Load all related data
      const completeData = await entryInfo.getCompleteData();
      
      // Calculate completion metrics
      const completionSummary = EntryCompletionCalculator.getCompletionSummary({
        passport: completeData.passport,
        personalInfo: completeData.personalInfo,
        funds: completeData.funds || [],
        travel: completeData.travel || entryInfo
      });

      // Calculate arrival window
      const arrivalDate = completeData.travel?.arrivalDate || entryInfo.arrivalDate;
      const arrivalWindow = ArrivalWindowCalculator.getSubmissionWindow(arrivalDate);

      // Determine CTA state
      let ctaState = 'disabled';
      if (completionSummary.isReady && arrivalWindow.canSubmit) {
        ctaState = 'enabled';
      } else if (entryInfo.requiresResubmission()) {
        ctaState = 'resubmit';
      }

      // Build display status
      const displayStatus = {
        completionPercent: completionSummary.totalPercent,
        categoryStates: {
          passport: completionSummary.categorySummary.passport.state,
          personalInfo: completionSummary.categorySummary.personalInfo.state,
          funds: completionSummary.categorySummary.funds.state,
          travel: completionSummary.categorySummary.travel.state
        },
        countdownMessage: arrivalWindow.message,
        ctaState: ctaState,
        showQR: entryInfo.status === 'submitted' && !entryInfo.requiresResubmission(),
        showGuide: entryInfo.status === 'submitted' && !entryInfo.requiresResubmission(),
        lastUpdated: new Date().toISOString()
      };

      return {
        entryInfo: entryInfo.getSummary(),
        completion: completionSummary,
        arrivalWindow: arrivalWindow,
        displayStatus: displayStatus,
        missingFields: completionSummary.missingFields,
        canSubmit: completionSummary.isReady && arrivalWindow.canSubmit,
        requiresResubmission: entryInfo.requiresResubmission()
      };
    } catch (error) {
      console.error('Failed to calculate summary:', error);
      throw error;
    }
  }

  /**
   * Get empty summary for new destinations
   * @param {string} destinationId - Destination ID
   * @returns {Object} - Empty summary
   */
  getEmptySummary(destinationId) {
    return {
      entryInfo: null,
      completion: {
        totalPercent: 0,
        isReady: false,
        categorySummary: {
          passport: { state: 'missing', percentage: 0 },
          personalInfo: { state: 'missing', percentage: 0 },
          funds: { state: 'missing', percentage: 0 },
          travel: { state: 'missing', percentage: 0 }
        }
      },
      arrivalWindow: {
        state: 'no-date',
        message: 'No arrival date set',
        canSubmit: false
      },
      displayStatus: {
        completionPercent: 0,
        categoryStates: {
          passport: 'missing',
          personalInfo: 'missing',
          funds: 'missing',
          travel: 'missing'
        },
        countdownMessage: 'No arrival date set',
        ctaState: 'disabled',
        showQR: false,
        showGuide: false
      },
      missingFields: {
        passport: ['All passport fields'],
        personalInfo: ['All personal info fields'],
        funds: ['At least one fund item'],
        travel: ['All travel fields']
      },
      canSubmit: false,
      requiresResubmission: false
    };
  }

  /**
   * Mark entry pack as superseded
   * @param {string} entryPackId - Entry pack ID
   * @param {Object} options - Supersede options
   * @returns {Promise<EntryPack>} - Updated entry pack
   */
  async markAsSuperseded(entryPackId, options = {}) {
    try {
      return await this.transitionState(entryPackId, 'superseded', {
        reason: options.reason || 'Entry pack marked as superseded due to data changes',
        metadata: {
          triggeredBy: options.triggeredBy || 'user_edit',
          changedFields: options.changedFields || [],
          ...options.metadata
        }
      });
    } catch (error) {
      console.error('Failed to mark entry pack as superseded:', error);
      throw error;
    }
  }

  /**
   * Archive entry pack
   * @param {string} entryPackId - Entry pack ID
   * @param {string} reason - Archive reason
   * @param {Object} options - Archive options
   * @returns {Promise<EntryPack>} - Archived entry pack
   */
  async archive(entryPackId, reason = 'manual', options = {}) {
    try {
      return await this.transitionState(entryPackId, 'archived', {
        reason: `Entry pack archived: ${reason}`,
        metadata: {
          archiveReason: reason,
          triggeredBy: options.triggeredBy || 'user',
          autoArchive: reason === 'auto',
          ...options.metadata
        }
      });
    } catch (error) {
      console.error('Failed to archive entry pack:', error);
      throw error;
    }
  }

  /**
   * Get entry pack by entry info ID
   * @param {string} entryInfoId - Entry info ID
   * @returns {Promise<EntryPack|null>} - Entry pack or null
   */
  async getByEntryInfoId(entryInfoId) {
    try {
      // Check cache first
      const cacheKey = `entryPack_${entryInfoId}`;
      const cached = this.getCachedResult(cacheKey);
      if (cached) {
        return cached;
      }

      // Load from storage
      const SecureStorageService = require('../security/SecureStorageService').default;
      const packs = await SecureStorageService.getEntryPacksByEntryInfoId(entryInfoId);
      
      const entryPack = packs && packs.length > 0 ? new EntryPack(packs[0]) : null;

      // Cache result
      if (entryPack) {
        this.setCachedResult(cacheKey, entryPack);
      }

      return entryPack;
    } catch (error) {
      console.error('Failed to get entry pack by entry info ID:', error);
      return null;
    }
  }

  /**
   * Get active entry packs for user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Array of active entry packs
   */
  async getActivePacksForUser(userId) {
    try {
      const packs = await EntryPack.loadByUserId(userId, { active: true });
      return packs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      console.error('Failed to get active packs for user:', error);
      return [];
    }
  }

  /**
   * Get historical entry packs for user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Array of historical entry packs
   */
  async getHistoricalPacksForUser(userId) {
    try {
      const packs = await EntryPack.loadByUserId(userId, { historical: true });
      return packs.sort((a, b) => new Date(b.archivedAt || b.updatedAt) - new Date(a.archivedAt || a.updatedAt));
    } catch (error) {
      console.error('Failed to get historical packs for user:', error);
      return [];
    }
  }

  /**
   * Find entry info by destination and trip
   * @param {string} destinationId - Destination ID
   * @param {string} tripId - Trip ID (optional)
   * @returns {Promise<EntryInfo|null>} - Entry info or null
   */
  async findEntryInfo(destinationId, tripId = null) {
    try {
      // This is a placeholder - in real implementation, you'd query the storage
      // For now, we'll assume we need to implement this in PassportDataService
      const PassportDataService = require('../data/PassportDataService').default;
      return await PassportDataService.getEntryInfoByDestination(destinationId, tripId);
    } catch (error) {
      console.error('Failed to find entry info:', error);
      return null;
    }
  }

  /**
   * Record failed TDAC submission
   * @param {string} entryPackId - Entry pack ID
   * @param {Object} error - Error details
   * @param {string} method - Submission method
   * @returns {Promise<EntryPack>} - Updated entry pack
   */
  async recordFailedSubmission(entryPackId, error, method = 'api') {
    try {
      const entryPack = await EntryPack.load(entryPackId);
      if (!entryPack) {
        throw new Error(`Entry pack not found: ${entryPackId}`);
      }

      entryPack.recordFailedSubmission(error, method);
      await entryPack.save();

      console.log('Failed submission recorded:', {
        entryPackId,
        error: error.message,
        method,
        attemptCount: entryPack.getSubmissionAttemptCount()
      });

      return entryPack;
    } catch (error) {
      console.error('Failed to record failed submission:', error);
      throw error;
    }
  }

  /**
   * Check for expired entry packs and mark them
   * @param {string} userId - User ID (optional, if not provided checks all)
   * @returns {Promise<Array>} - Array of expired entry pack IDs
   */
  async checkAndMarkExpired(userId = null) {
    try {
      const expiredPacks = [];
      let packs;

      if (userId) {
        packs = await this.getActivePacksForUser(userId);
      } else {
        // Get all active packs - this would need to be implemented in storage
        packs = []; // Placeholder
      }

      const now = new Date();

      for (const pack of packs) {
        // Check if pack should be expired (arrival date + 24 hours has passed)
        if (pack.status === 'submitted') {
          const entryInfo = await EntryInfo.load(pack.entryInfoId);
          if (entryInfo) {
            const arrivalDate = new Date(entryInfo.arrivalDate);
            const expiryTime = new Date(arrivalDate.getTime() + (24 * 60 * 60 * 1000));
            
            if (now > expiryTime) {
              // Use state transition system to mark as expired
              await this.transitionState(pack.id, 'expired', {
                reason: 'Entry pack expired (arrival date + 24h passed)',
                metadata: {
                  arrivalDate: arrivalDate.toISOString(),
                  expiryTime: expiryTime.toISOString(),
                  autoExpired: true
                }
              });
              
              expiredPacks.push(pack.id);
              
              console.log('Entry pack marked as expired:', {
                entryPackId: pack.id,
                arrivalDate: arrivalDate.toISOString(),
                expiryTime: expiryTime.toISOString()
              });
            }
          }
        }
      }

      return expiredPacks;
    } catch (error) {
      console.error('Failed to check and mark expired packs:', error);
      return [];
    }
  }

  /**
   * Get cache key for results
   * @param {string} key - Base key
   * @returns {string} - Cache key
   */
  getCacheKey(key) {
    return `entryPackService_${key}`;
  }

  /**
   * Get cached result
   * @param {string} cacheKey - Cache key
   * @returns {*} - Cached result or null
   */
  getCachedResult(cacheKey) {
    const cached = this.cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.result;
    }

    if (cached) {
      this.cache.delete(cacheKey);
    }

    return null;
  }

  /**
   * Set cached result
   * @param {string} cacheKey - Cache key
   * @param {*} result - Result to cache
   */
  setCachedResult(cacheKey, result) {
    // Limit cache size
    if (this.cache.size > 50) {
      const entries = Array.from(this.cache.entries());
      entries.slice(0, 25).forEach(([key]) => this.cache.delete(key));
    }

    this.cache.set(cacheKey, {
      result: result,
      timestamp: Date.now()
    });
  }

  /**
   * Clear cache for user
   * @param {string} userId - User ID
   */
  clearCacheForUser(userId) {
    const keysToDelete = [];
    
    for (const [key] of this.cache.entries()) {
      if (key.includes(userId)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Clear all cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Validate state transition
   * @param {string} currentState - Current state
   * @param {string} newState - New state to transition to
   * @returns {boolean} - Whether transition is valid
   */
  isValidStateTransition(currentState, newState) {
    const allowedTransitions = this.stateTransitions[currentState] || [];
    return allowedTransitions.includes(newState);
  }

  /**
   * Transition entry pack state with validation and history recording
   * @param {string} entryPackId - Entry pack ID
   * @param {string} newState - New state to transition to
   * @param {Object} options - Transition options
   * @returns {Promise<EntryPack>} - Updated entry pack
   */
  async transitionState(entryPackId, newState, options = {}) {
    try {
      const entryPack = await EntryPack.load(entryPackId);
      if (!entryPack) {
        throw new Error(`Entry pack not found: ${entryPackId}`);
      }

      const currentState = entryPack.status;
      
      // Validate state transition
      if (!this.isValidStateTransition(currentState, newState)) {
        throw new Error(`Invalid state transition from ${currentState} to ${newState}`);
      }

      // Record state change in history
      const stateChange = {
        id: `state_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        entryPackId: entryPackId,
        fromState: currentState,
        toState: newState,
        reason: options.reason || 'Manual state change',
        metadata: options.metadata || {},
        timestamp: new Date().toISOString(),
        userId: entryPack.userId
      };

      // Update entry pack state
      entryPack.status = newState;
      entryPack.updatedAt = new Date().toISOString();

      // Handle state-specific logic
      switch (newState) {
        case 'submitted':
          if (options.tdacSubmission) {
            entryPack.updateTDACSubmission(options.tdacSubmission, options.submissionMethod);
          }
          // Create snapshot on TDAC submission
          await this.createSnapshotOnSubmission(entryPack, options);
          break;
          
        case 'superseded':
          entryPack.displayStatus.ctaState = 'resubmit';
          entryPack.displayStatus.showQR = false;
          entryPack.displayStatus.showGuide = false;
          // Schedule superseded notification
          await this.scheduleSupersededNotification(entryPack, options);
          break;
          
        case 'completed':
          // Entry pack completed - create snapshot
          await this.createSnapshotOnCompletion(entryPack, options);
          break;
          
        case 'expired':
          // Entry pack expired - create snapshot before archival
          await this.createSnapshotOnExpiry(entryPack, options);
          break;
          
        case 'archived':
          entryPack.archivedAt = new Date().toISOString();
          // Create snapshot on archival if not already created
          await this.createSnapshotOnArchival(entryPack, options);
          break;
      }

      // Save entry pack
      await entryPack.save();

      // Record state change history
      this.recordStateChange(stateChange);

      // Update related EntryInfo status
      await this.updateEntryInfoStatus(entryPack.entryInfoId, newState, options);

      // Clear cache
      this.clearCacheForUser(entryPack.userId);

      console.log('Entry pack state transitioned:', {
        entryPackId,
        fromState: currentState,
        toState: newState,
        reason: options.reason
      });

      return entryPack;
    } catch (error) {
      console.error('Failed to transition entry pack state:', error);
      throw error;
    }
  }

  /**
   * Record state change in history
   * @param {Object} stateChange - State change record
   */
  recordStateChange(stateChange) {
    try {
      const entryPackId = stateChange.entryPackId;
      
      if (!this.stateChangeHistory.has(entryPackId)) {
        this.stateChangeHistory.set(entryPackId, []);
      }
      
      const history = this.stateChangeHistory.get(entryPackId);
      history.push(stateChange);
      
      // Keep only last 50 state changes per entry pack
      if (history.length > 50) {
        history.splice(0, history.length - 50);
      }
      
      console.log('State change recorded:', {
        entryPackId,
        changeId: stateChange.id,
        transition: `${stateChange.fromState} → ${stateChange.toState}`
      });
    } catch (error) {
      console.error('Failed to record state change:', error);
    }
  }

  /**
   * Get state change history for entry pack
   * @param {string} entryPackId - Entry pack ID
   * @returns {Array} - Array of state changes
   */
  getStateChangeHistory(entryPackId) {
    return this.stateChangeHistory.get(entryPackId) || [];
  }

  /**
   * Update related EntryInfo status
   * @param {string} entryInfoId - Entry info ID
   * @param {string} newState - New state
   * @param {Object} options - Update options
   */
  async updateEntryInfoStatus(entryInfoId, newState, options = {}) {
    try {
      const PassportDataService = require('../data/PassportDataService').default;
      
      // Map entry pack states to entry info states
      const stateMapping = {
        'in_progress': 'incomplete',
        'submitted': 'submitted',
        'superseded': 'superseded',
        'completed': 'ready', // Keep as ready for potential reuse
        'expired': 'expired',
        'archived': 'archived'
      };
      
      const entryInfoStatus = stateMapping[newState] || newState;
      
      await PassportDataService.updateEntryInfoStatus(
        entryInfoId, 
        entryInfoStatus, 
        {
          reason: options.reason || `Entry pack transitioned to ${newState}`,
          metadata: options.metadata
        }
      );
      
      console.log('EntryInfo status updated:', {
        entryInfoId,
        newStatus: entryInfoStatus,
        reason: options.reason
      });
    } catch (error) {
      console.error('Failed to update EntryInfo status:', error);
      // Don't throw - this is a secondary operation
    }
  }

  /**
   * Validate entry pack state consistency
   * @param {string} entryPackId - Entry pack ID
   * @returns {Promise<Object>} - Validation result
   */
  async validateStateConsistency(entryPackId) {
    try {
      const entryPack = await EntryPack.load(entryPackId);
      if (!entryPack) {
        return { isValid: false, errors: ['Entry pack not found'] };
      }

      const errors = [];
      const warnings = [];

      // Check if state is valid
      if (!Object.keys(this.stateTransitions).includes(entryPack.status)) {
        errors.push(`Invalid state: ${entryPack.status}`);
      }

      // Check state-specific requirements
      switch (entryPack.status) {
        case 'submitted':
          if (!entryPack.hasValidTDACSubmission()) {
            errors.push('Submitted entry pack must have valid TDAC submission');
          }
          break;
          
        case 'superseded':
          if (!entryPack.hasValidTDACSubmission()) {
            warnings.push('Superseded entry pack should have previous TDAC submission');
          }
          break;
          
        case 'archived':
          if (!entryPack.archivedAt) {
            errors.push('Archived entry pack must have archivedAt timestamp');
          }
          break;
      }

      // Check timestamps consistency
      if (entryPack.archivedAt && entryPack.archivedAt < entryPack.createdAt) {
        errors.push('Archived timestamp cannot be before created timestamp');
      }

      if (entryPack.updatedAt < entryPack.createdAt) {
        errors.push('Updated timestamp cannot be before created timestamp');
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        entryPackId,
        currentState: entryPack.status,
        validatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to validate state consistency:', error);
      return {
        isValid: false,
        errors: [`Validation failed: ${error.message}`],
        warnings: [],
        entryPackId,
        validatedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Get all possible next states for current state
   * @param {string} currentState - Current state
   * @returns {Array} - Array of possible next states
   */
  getPossibleNextStates(currentState) {
    return this.stateTransitions[currentState] || [];
  }

  /**
   * Check if entry pack can transition to specific state
   * @param {string} entryPackId - Entry pack ID
   * @param {string} targetState - Target state
   * @returns {Promise<Object>} - Transition check result
   */
  async canTransitionTo(entryPackId, targetState) {
    try {
      const entryPack = await EntryPack.load(entryPackId);
      if (!entryPack) {
        return { canTransition: false, reason: 'Entry pack not found' };
      }

      const currentState = entryPack.status;
      const isValidTransition = this.isValidStateTransition(currentState, targetState);
      
      if (!isValidTransition) {
        return {
          canTransition: false,
          reason: `Invalid transition from ${currentState} to ${targetState}`,
          currentState,
          targetState,
          allowedTransitions: this.getPossibleNextStates(currentState)
        };
      }

      // Additional business logic checks
      switch (targetState) {
        case 'submitted':
          if (currentState === 'superseded' && !entryPack.canBeEdited()) {
            return {
              canTransition: false,
              reason: 'Entry pack cannot be edited in current state',
              currentState,
              targetState
            };
          }
          break;
          
        case 'completed':
          if (!entryPack.hasValidTDACSubmission()) {
            return {
              canTransition: false,
              reason: 'Entry pack must have valid TDAC submission to be completed',
              currentState,
              targetState
            };
          }
          break;
      }

      return {
        canTransition: true,
        currentState,
        targetState,
        reason: 'Transition is allowed'
      };
    } catch (error) {
      console.error('Failed to check transition possibility:', error);
      return {
        canTransition: false,
        reason: `Check failed: ${error.message}`,
        targetState
      };
    }
  }

  /**
   * Mark entry pack as completed (user finished immigration process)
   * @param {string} entryPackId - Entry pack ID
   * @param {Object} options - Completion options
   * @returns {Promise<EntryPack>} - Updated entry pack
   */
  async markAsCompleted(entryPackId, options = {}) {
    try {
      return await this.transitionState(entryPackId, 'completed', {
        reason: options.reason || 'Entry pack marked as completed by user',
        metadata: {
          completedBy: options.completedBy || 'user',
          completionLocation: options.location || null,
          completionMethod: options.method || 'manual',
          ...options.metadata
        }
      });
    } catch (error) {
      console.error('Failed to mark entry pack as completed:', error);
      throw error;
    }
  }

  /**
   * Mark entry pack as immigration completed (from immigration guide)
   * @param {string} entryPackId - Entry pack ID
   * @param {Object} options - Completion options
   * @returns {Promise<EntryPack>} - Updated entry pack
   */
  async markImmigrationCompleted(entryPackId, options = {}) {
    try {
      return await this.transitionState(entryPackId, 'completed', {
        reason: 'Immigration process completed via interactive guide',
        metadata: {
          completedBy: 'immigration_guide',
          completionLocation: options.location || 'airport_immigration',
          completionMethod: 'interactive_guide',
          completedAt: new Date().toISOString(),
          ...options.metadata
        }
      });
    } catch (error) {
      console.error('Failed to mark immigration as completed:', error);
      throw error;
    }
  }

  /**
   * Resubmit entry pack (transition from superseded back to submitted)
   * @param {string} entryPackId - Entry pack ID
   * @param {Object} tdacSubmission - New TDAC submission data
   * @param {Object} options - Resubmission options
   * @returns {Promise<EntryPack>} - Updated entry pack
   */
  async resubmit(entryPackId, tdacSubmission, options = {}) {
    try {
      return await this.transitionState(entryPackId, 'submitted', {
        reason: 'Entry pack resubmitted with updated data',
        tdacSubmission: tdacSubmission,
        submissionMethod: options.submissionMethod || 'api',
        metadata: {
          resubmission: true,
          previousSubmissionCount: options.previousSubmissionCount || 0,
          changedFields: options.changedFields || [],
          arrCardNo: tdacSubmission.arrCardNo,
          submissionMethod: options.submissionMethod || 'api'
        }
      });
    } catch (error) {
      console.error('Failed to resubmit entry pack:', error);
      throw error;
    }
  }

  /**
   * Get entry packs by state
   * @param {string} userId - User ID
   * @param {string} state - Entry pack state
   * @returns {Promise<Array>} - Array of entry packs in specified state
   */
  async getEntryPacksByState(userId, state) {
    try {
      const packs = await EntryPack.loadByUserId(userId, { status: state });
      return packs;
    } catch (error) {
      console.error('Failed to get entry packs by state:', error);
      return [];
    }
  }

  /**
   * Get state transition statistics for user
   * @param {string} userId - User ID
   * @returns {Object} - State transition statistics
   */
  getStateTransitionStats(userId) {
    const userStateChanges = [];
    
    for (const [entryPackId, history] of this.stateChangeHistory.entries()) {
      const userChanges = history.filter(change => change.userId === userId);
      userStateChanges.push(...userChanges);
    }

    const stats = {
      totalTransitions: userStateChanges.length,
      transitionsByState: {},
      recentTransitions: userStateChanges
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 10)
    };

    // Count transitions by state
    userStateChanges.forEach(change => {
      const key = `${change.fromState}_to_${change.toState}`;
      stats.transitionsByState[key] = (stats.transitionsByState[key] || 0) + 1;
    });

    return stats;
  }

  /**
   * Validate all entry packs for user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Validation summary
   */
  async validateAllEntryPacks(userId) {
    try {
      const packs = await EntryPack.loadByUserId(userId);
      const validationResults = [];
      
      for (const pack of packs) {
        const result = await this.validateStateConsistency(pack.id);
        validationResults.push(result);
      }
      
      const summary = {
        totalPacks: packs.length,
        validPacks: validationResults.filter(r => r.isValid).length,
        invalidPacks: validationResults.filter(r => !r.isValid).length,
        packsWithWarnings: validationResults.filter(r => r.warnings && r.warnings.length > 0).length,
        validationResults: validationResults,
        validatedAt: new Date().toISOString()
      };
      
      return summary;
    } catch (error) {
      console.error('Failed to validate all entry packs:', error);
      throw error;
    }
  }

  /**
   * Auto-cancel notifications when TDAC is submitted
   * @param {string} entryPackId - Entry pack ID
   * @param {Object} tdacSubmission - TDAC submission data
   */
  async autoCancelWindowOpenNotification(entryPackId, tdacSubmission) {
    try {
      // Import NotificationCoordinator dynamically to avoid circular dependencies
      const NotificationCoordinator = require('../notification/NotificationCoordinator').default;
      
      // Cancel window open notification
      await NotificationCoordinator.autoCancelIfSubmitted(entryPackId, tdacSubmission);
      
      // Cancel urgent reminder notification
      await NotificationCoordinator.autoCancelUrgentReminderIfSubmitted(entryPackId, tdacSubmission);
      
      // Cancel deadline notifications
      await NotificationCoordinator.autoCancelDeadlineIfSubmitted(entryPackId, tdacSubmission);
      
      console.log('Notifications auto-cancel attempted for entry pack:', entryPackId);
    } catch (error) {
      console.error('Failed to auto-cancel notifications:', error);
      // Don't throw - this is a secondary operation that shouldn't break the main flow
    }
  }

  /**
   * Schedule notifications for entry pack
   * @param {EntryPack} entryPack - Entry pack instance
   * @param {EntryInfo} entryInfo - Entry info instance
   */
  async scheduleNotificationsForEntryPack(entryPack, entryInfo) {
    try {
      // Import NotificationCoordinator and preferences dynamically to avoid circular dependencies
      const NotificationCoordinator = require('../notification/NotificationCoordinator').default;
      const NotificationPreferencesService = require('../notification/NotificationPreferencesService').default;
      
      // Check if notifications are globally enabled
      const notificationsEnabled = await NotificationPreferencesService.getPreference('enabled', true);
      if (!notificationsEnabled) {
        console.log('Notifications disabled in user preferences, skipping scheduling');
        return;
      }
      
      // Only schedule notifications if we have an arrival date and the pack is not submitted
      if (!entryInfo.arrivalDate || entryPack.hasValidTDACSubmission()) {
        return;
      }

      const arrivalDate = new Date(entryInfo.arrivalDate);
      const destination = entryInfo.destinationId === 'thailand' ? 'Thailand' : entryInfo.destinationId;

      // Schedule window open notification (7 days before arrival) if enabled
      const windowNotificationsEnabled = await NotificationPreferencesService.isNotificationTypeEnabled('submissionWindow');
      if (windowNotificationsEnabled) {
        await NotificationCoordinator.scheduleWindowOpenNotification(
          entryPack.userId,
          entryPack.id,
          arrivalDate,
          destination
        );
      }

      // Schedule urgent reminder notification (24 hours before arrival) if enabled
      const urgentRemindersEnabled = await NotificationPreferencesService.isNotificationTypeEnabled('urgentReminder');
      if (urgentRemindersEnabled) {
        await NotificationCoordinator.scheduleUrgentReminderNotification(
          entryPack.userId,
          entryPack.id,
          arrivalDate,
          destination
        );
      }

      // Schedule deadline notifications (on arrival day, repeat every 4 hours) if enabled
      const deadlineNotificationsEnabled = await NotificationPreferencesService.isNotificationTypeEnabled('deadline');
      if (deadlineNotificationsEnabled) {
        await NotificationCoordinator.scheduleDeadlineNotification(
          entryPack.userId,
          entryPack.id,
          arrivalDate,
          destination
        );
      }

      // Schedule expiry warning notifications (1 day before expiry and on expiry) if enabled
      const expiryWarningEnabled = await NotificationPreferencesService.isNotificationTypeEnabled('expiryWarning');
      if (expiryWarningEnabled) {
        await NotificationCoordinator.scheduleExpiryWarningNotifications(
          entryPack.userId,
          entryPack.id,
          arrivalDate,
          destination
        );
      }

      console.log('Notifications scheduled for entry pack:', entryPack.id, {
        windowEnabled: windowNotificationsEnabled,
        urgentEnabled: urgentRemindersEnabled,
        deadlineEnabled: deadlineNotificationsEnabled
      });
      
    } catch (error) {
      console.error('Failed to schedule notifications for entry pack:', error);
      // Don't throw - this is a secondary operation that shouldn't break the main flow
    }
  }

  /**
   * Create snapshot on TDAC submission
   * @param {EntryPack} entryPack - Entry pack instance
   * @param {Object} options - Transition options
   */
  async createSnapshotOnSubmission(entryPack, options = {}) {
    try {
      console.log('Creating snapshot on TDAC submission:', entryPack.id);
      
      const SnapshotService = require('../snapshot/SnapshotService').default;
      
      const snapshot = await SnapshotService.createSnapshot(
        entryPack.id,
        'submitted',
        {
          appVersion: options.metadata?.appVersion || '1.0.0',
          deviceInfo: options.metadata?.deviceInfo || 'unknown',
          creationMethod: 'auto',
          submissionMethod: options.submissionMethod || 'api',
          arrCardNo: options.tdacSubmission?.arrCardNo
        }
      );
      
      console.log('Snapshot created on submission:', {
        entryPackId: entryPack.id,
        snapshotId: snapshot.snapshotId,
        reason: 'submitted'
      });
      
      return snapshot;
    } catch (error) {
      console.error('Failed to create snapshot on submission:', error);
      // Don't throw - snapshot creation failure shouldn't break the main flow
      return null;
    }
  }

  /**
   * Create snapshot on manual completion
   * @param {EntryPack} entryPack - Entry pack instance
   * @param {Object} options - Transition options
   */
  async createSnapshotOnCompletion(entryPack, options = {}) {
    try {
      console.log('Creating snapshot on completion:', entryPack.id);
      
      const SnapshotService = require('../snapshot/SnapshotService').default;
      
      const snapshot = await SnapshotService.createSnapshot(
        entryPack.id,
        'completed',
        {
          appVersion: options.metadata?.appVersion || '1.0.0',
          deviceInfo: options.metadata?.deviceInfo || 'unknown',
          creationMethod: options.metadata?.completedBy === 'user' ? 'manual' : 'auto',
          completionLocation: options.metadata?.completionLocation,
          completionMethod: options.metadata?.completionMethod || 'manual'
        }
      );
      
      console.log('Snapshot created on completion:', {
        entryPackId: entryPack.id,
        snapshotId: snapshot.snapshotId,
        reason: 'completed'
      });
      
      return snapshot;
    } catch (error) {
      console.error('Failed to create snapshot on completion:', error);
      // Don't throw - snapshot creation failure shouldn't break the main flow
      return null;
    }
  }

  /**
   * Create snapshot on expiry
   * @param {EntryPack} entryPack - Entry pack instance
   * @param {Object} options - Transition options
   */
  async createSnapshotOnExpiry(entryPack, options = {}) {
    try {
      console.log('Creating snapshot on expiry:', entryPack.id);
      
      const SnapshotService = require('../snapshot/SnapshotService').default;
      
      const snapshot = await SnapshotService.createSnapshot(
        entryPack.id,
        'expired',
        {
          appVersion: options.metadata?.appVersion || '1.0.0',
          deviceInfo: options.metadata?.deviceInfo || 'unknown',
          creationMethod: 'auto',
          autoExpired: options.metadata?.autoExpired || true,
          arrivalDate: options.metadata?.arrivalDate,
          expiryTime: options.metadata?.expiryTime
        }
      );
      
      console.log('Snapshot created on expiry:', {
        entryPackId: entryPack.id,
        snapshotId: snapshot.snapshotId,
        reason: 'expired'
      });
      
      return snapshot;
    } catch (error) {
      console.error('Failed to create snapshot on expiry:', error);
      // Don't throw - snapshot creation failure shouldn't break the main flow
      return null;
    }
  }

  /**
   * Create snapshot on archival
   * @param {EntryPack} entryPack - Entry pack instance
   * @param {Object} options - Transition options
   */
  async createSnapshotOnArchival(entryPack, options = {}) {
    try {
      console.log('Creating snapshot on archival:', entryPack.id);
      
      const SnapshotService = require('../snapshot/SnapshotService').default;
      
      // Check if snapshot already exists for this entry pack
      const existingSnapshots = await SnapshotService.list(entryPack.userId, {
        entryPackId: entryPack.id
      });
      
      if (existingSnapshots.length > 0) {
        console.log('Snapshot already exists for entry pack, skipping creation:', {
          entryPackId: entryPack.id,
          existingSnapshots: existingSnapshots.length
        });
        return existingSnapshots[0];
      }
      
      const snapshot = await SnapshotService.createSnapshot(
        entryPack.id,
        'archived',
        {
          appVersion: options.metadata?.appVersion || '1.0.0',
          deviceInfo: options.metadata?.deviceInfo || 'unknown',
          creationMethod: 'auto',
          archiveReason: options.metadata?.archiveReason || 'manual',
          triggeredBy: options.metadata?.triggeredBy || 'user',
          autoArchive: options.metadata?.autoArchive || false
        }
      );
      
      console.log('Snapshot created on archival:', {
        entryPackId: entryPack.id,
        snapshotId: snapshot.snapshotId,
        reason: 'archived'
      });
      
      return snapshot;
    } catch (error) {
      console.error('Failed to create snapshot on archival:', error);
      // Don't throw - snapshot creation failure shouldn't break the main flow
      return null;
    }
  }

  /**
   * Handle snapshot deletion when entry pack is deleted
   * @param {string} entryPackId - Entry pack ID
   * @param {string} userId - User ID
   */
  async handleSnapshotCleanupOnDeletion(entryPackId, userId) {
    try {
      console.log('Cleaning up snapshots for deleted entry pack:', entryPackId);
      
      const SnapshotService = require('../snapshot/SnapshotService').default;
      
      // Find all snapshots for this entry pack
      const snapshots = await SnapshotService.list(userId, {
        entryPackId: entryPackId
      });
      
      let deletedCount = 0;
      for (const snapshot of snapshots) {
        try {
          await SnapshotService.delete(snapshot.snapshotId);
          deletedCount++;
          console.log('Snapshot deleted during entry pack cleanup:', {
            snapshotId: snapshot.snapshotId,
            entryPackId: entryPackId
          });
        } catch (deleteError) {
          console.error('Failed to delete snapshot during cleanup:', {
            snapshotId: snapshot.snapshotId,
            error: deleteError.message
          });
        }
      }
      
      console.log('Snapshot cleanup completed:', {
        entryPackId,
        totalSnapshots: snapshots.length,
        deletedSnapshots: deletedCount
      });
      
      return { totalSnapshots: snapshots.length, deletedSnapshots: deletedCount };
    } catch (error) {
      console.error('Failed to cleanup snapshots on entry pack deletion:', error);
      return { totalSnapshots: 0, deletedSnapshots: 0 };
    }
  }

  /**
   * Get snapshots for entry pack
   * @param {string} entryPackId - Entry pack ID
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Array of snapshots
   */
  async getSnapshotsForEntryPack(entryPackId, userId) {
    try {
      const SnapshotService = require('../snapshot/SnapshotService').default;
      
      const snapshots = await SnapshotService.list(userId, {
        entryPackId: entryPackId
      });
      
      return snapshots;
    } catch (error) {
      console.error('Failed to get snapshots for entry pack:', error);
      return [];
    }
  }

  /**
   * Check if entry pack has snapshots
   * @param {string} entryPackId - Entry pack ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} - Has snapshots
   */
  async hasSnapshots(entryPackId, userId) {
    try {
      const snapshots = await this.getSnapshotsForEntryPack(entryPackId, userId);
      return snapshots.length > 0;
    } catch (error) {
      console.error('Failed to check if entry pack has snapshots:', error);
      return false;
    }
  }

  /**
   * Get service statistics
   * @returns {Object} - Service statistics
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      cacheTimeout: this.cacheTimeout,
      stateTransitions: this.stateTransitions,
      stateChangeHistorySize: this.stateChangeHistory.size,
      totalStateChanges: Array.from(this.stateChangeHistory.values())
        .reduce((total, history) => total + history.length, 0)
    };
  }

  /**
   * Get multi-destination summary for user
   * @param {string} userId - User ID
   * @param {Array} destinationIds - Array of destination IDs to check
   * @returns {Promise<Object>} - Multi-destination summary
   */
  async getMultiDestinationSummary(userId, destinationIds = ['th', 'jp', 'sg', 'my', 'hk', 'tw', 'kr', 'us']) {
    try {
      console.log(`Getting multi-destination summary for user ${userId}:`, destinationIds);
      
      const destinationSummaries = {};
      const activeEntryPacks = await this.getActivePacksForUser(userId);
      
      // Get summary for each destination
      for (const destinationId of destinationIds) {
        try {
          const summary = await this.getSummary(destinationId);
          
          // Check if there's an active entry pack for this destination
          const activePackForDestination = activeEntryPacks.find(pack => pack.destinationId === destinationId);
          
          destinationSummaries[destinationId] = {
            ...summary,
            hasActiveEntryPack: !!activePackForDestination,
            activeEntryPackId: activePackForDestination?.id || null,
            activeEntryPackStatus: activePackForDestination?.status || null
          };
        } catch (error) {
          console.log(`Failed to get summary for destination ${destinationId}:`, error.message);
          destinationSummaries[destinationId] = this.getEmptySummary(destinationId);
        }
      }
      
      // Calculate overall statistics
      const destinationsWithProgress = Object.values(destinationSummaries)
        .filter(summary => summary.completion.totalPercent > 0);
      
      const readyDestinations = Object.values(destinationSummaries)
        .filter(summary => summary.canSubmit);
      
      const overallStats = {
        totalDestinations: destinationIds.length,
        destinationsWithProgress: destinationsWithProgress.length,
        readyDestinations: readyDestinations.length,
        activeEntryPacks: activeEntryPacks.length,
        overallCompletionPercent: destinationsWithProgress.length > 0
          ? Math.round(destinationsWithProgress.reduce((sum, d) => sum + d.completion.totalPercent, 0) / destinationsWithProgress.length)
          : 0
      };
      
      console.log('Multi-destination summary calculated:', {
        userId,
        totalDestinations: overallStats.totalDestinations,
        withProgress: overallStats.destinationsWithProgress,
        ready: overallStats.readyDestinations,
        activePacks: overallStats.activeEntryPacks
      });
      
      return {
        destinations: destinationSummaries,
        overallStats,
        calculatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to get multi-destination summary:', error);
      throw error;
    }
  }

  /**
   * Switch destination context for user
   * @param {string} userId - User ID
   * @param {string} fromDestinationId - Current destination ID
   * @param {string} toDestinationId - Target destination ID
   * @returns {Promise<Object>} - Switch context result
   */
  async switchDestinationContext(userId, fromDestinationId, toDestinationId) {
    try {
      console.log(`Switching destination context for user ${userId}: ${fromDestinationId} → ${toDestinationId}`);
      
      // Get summaries for both destinations
      const [fromSummary, toSummary] = await Promise.all([
        this.getSummary(fromDestinationId),
        this.getSummary(toDestinationId)
      ]);
      
      // Check for active entry packs
      const activeEntryPacks = await this.getActivePacksForUser(userId);
      const fromEntryPack = activeEntryPacks.find(pack => pack.destinationId === fromDestinationId);
      const toEntryPack = activeEntryPacks.find(pack => pack.destinationId === toDestinationId);
      
      const switchResult = {
        fromDestination: {
          destinationId: fromDestinationId,
          summary: fromSummary,
          hasActiveEntryPack: !!fromEntryPack,
          entryPackId: fromEntryPack?.id || null,
          entryPackStatus: fromEntryPack?.status || null
        },
        toDestination: {
          destinationId: toDestinationId,
          summary: toSummary,
          hasActiveEntryPack: !!toEntryPack,
          entryPackId: toEntryPack?.id || null,
          entryPackStatus: toEntryPack?.status || null
        },
        switchedAt: new Date().toISOString(),
        progressPreserved: true
      };
      
      console.log('Destination context switched successfully:', {
        from: fromDestinationId,
        to: toDestinationId,
        fromProgress: fromSummary.completion.totalPercent,
        toProgress: toSummary.completion.totalPercent
      });
      
      return switchResult;
    } catch (error) {
      console.error('Failed to switch destination context:', error);
      return {
        fromDestination: {
          destinationId: fromDestinationId,
          summary: this.getEmptySummary(fromDestinationId),
          hasActiveEntryPack: false,
          entryPackId: null,
          entryPackStatus: null
        },
        toDestination: {
          destinationId: toDestinationId,
          summary: this.getEmptySummary(toDestinationId),
          hasActiveEntryPack: false,
          entryPackId: null,
          entryPackStatus: null
        },
        switchedAt: new Date().toISOString(),
        progressPreserved: false,
        error: error.message
      };
    }
  }

  /**
   * Get destinations with progress for user (for home screen display)
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Array of destinations with progress info
   */
  async getDestinationsWithProgress(userId) {
    try {
      console.log(`Getting destinations with progress for user: ${userId}`);
      
      // Get all entry infos for the user
      const PassportDataService = require('../data/PassportDataService').default;
      const allEntryInfos = await PassportDataService.getAllEntryInfosForUser(userId);
      
      const destinationsWithProgress = [];
      
      for (const entryInfo of allEntryInfos) {
        if (entryInfo.destinationId) {
          try {
            const summary = await this.calculateSummary(entryInfo);
            
            if (summary.completion.totalPercent > 0) {
              destinationsWithProgress.push({
                destinationId: entryInfo.destinationId,
                completionPercent: summary.completion.totalPercent,
                isReady: summary.canSubmit,
                requiresResubmission: summary.requiresResubmission,
                lastUpdated: entryInfo.lastUpdatedAt || entryInfo.updatedAt,
                entryInfoId: entryInfo.id,
                status: entryInfo.status
              });
            }
          } catch (error) {
            console.log(`Failed to calculate summary for destination ${entryInfo.destinationId}:`, error.message);
          }
        }
      }
      
      // Sort by completion percentage (highest first) and then by last updated
      destinationsWithProgress.sort((a, b) => {
        if (a.completionPercent !== b.completionPercent) {
          return b.completionPercent - a.completionPercent;
        }
        return new Date(b.lastUpdated || 0) - new Date(a.lastUpdated || 0);
      });
      
      console.log(`Found ${destinationsWithProgress.length} destinations with progress for user ${userId}`);
      
      return destinationsWithProgress;
    } catch (error) {
      console.error('Failed to get destinations with progress:', error);
      return [];
    }
  }

  /**
   * Get home screen data for multi-destination display
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Home screen data with multi-destination info
   */
  async getHomeScreenData(userId) {
    try {
      console.log(`Getting home screen data for user: ${userId}`);
      
      // Get active entry packs and destinations with progress
      const [activeEntryPacks, destinationsWithProgress] = await Promise.all([
        this.getActivePacksForUser(userId),
        this.getDestinationsWithProgress(userId)
      ]);
      
      // Separate submitted entry packs (for "upcoming trips" section)
      // Exclude archived and expired packs from active display
      const submittedEntryPacks = activeEntryPacks.filter(pack => 
        pack.status === 'submitted' && 
        pack.status !== 'archived' && 
        pack.status !== 'expired'
      );
      
      // Get in-progress destinations (not yet submitted)
      const inProgressDestinations = destinationsWithProgress.filter(dest => 
        !submittedEntryPacks.some(pack => pack.destinationId === dest.destinationId)
      );
      
      // Load arrival dates for submitted entry packs
      const submittedPacksWithDates = await Promise.all(
        submittedEntryPacks.map(async (pack) => {
          try {
            const EntryInfo = require('../../models/EntryInfo').default;
            const entryInfo = await EntryInfo.load(pack.entryInfoId);
            
            return {
              ...pack,
              arrivalDate: entryInfo?.arrivalDate || null,
              destinationName: this.getDestinationDisplayName(pack.destinationId)
            };
          } catch (error) {
            console.log('Failed to load arrival date for pack:', pack.id, error.message);
            return {
              ...pack,
              arrivalDate: null,
              destinationName: this.getDestinationDisplayName(pack.destinationId)
            };
          }
        })
      );
      
      // Sort submitted packs by arrival date (nearest first)
      submittedPacksWithDates.sort((a, b) => {
        if (!a.arrivalDate && !b.arrivalDate) return 0;
        if (!a.arrivalDate) return 1;
        if (!b.arrivalDate) return -1;
        return new Date(a.arrivalDate) - new Date(b.arrivalDate);
      });
      
      const homeScreenData = {
        submittedEntryPacks: submittedPacksWithDates,
        inProgressDestinations: inProgressDestinations.map(dest => ({
          ...dest,
          destinationName: this.getDestinationDisplayName(dest.destinationId)
        })),
        summary: {
          totalActiveEntryPacks: activeEntryPacks.length,
          submittedEntryPacks: submittedEntryPacks.length,
          inProgressDestinations: inProgressDestinations.length,
          hasAnyProgress: destinationsWithProgress.length > 0,
          overallCompletionPercent: destinationsWithProgress.length > 0
            ? Math.round(destinationsWithProgress.reduce((sum, d) => sum + d.completionPercent, 0) / destinationsWithProgress.length)
            : 0
        },
        calculatedAt: new Date().toISOString()
      };
      
      console.log('Home screen data calculated:', {
        submittedPacks: homeScreenData.submittedEntryPacks.length,
        inProgressDestinations: homeScreenData.inProgressDestinations.length,
        overallCompletion: homeScreenData.summary.overallCompletionPercent
      });
      
      return homeScreenData;
    } catch (error) {
      console.error('Failed to get home screen data:', error);
      return {
        submittedEntryPacks: [],
        inProgressDestinations: [],
        summary: {
          totalActiveEntryPacks: 0,
          submittedEntryPacks: 0,
          inProgressDestinations: 0,
          hasAnyProgress: false,
          overallCompletionPercent: 0
        },
        calculatedAt: new Date().toISOString(),
        error: error.message
      };
    }
  }

  /**
   * Get display name for destination
   * @param {string} destinationId - Destination ID
   * @returns {string} - Display name
   */
  getDestinationDisplayName(destinationId) {
    const displayNames = {
      'th': 'Thailand',
      'jp': 'Japan',
      'sg': 'Singapore',
      'my': 'Malaysia',
      'hk': 'Hong Kong',
      'tw': 'Taiwan',
      'kr': 'South Korea',
      'us': 'United States'
    };
    
    return displayNames[destinationId] || destinationId;
  }

  /**
   * Clear cache for specific destination
   * @param {string} destinationId - Destination ID
   */
  clearCacheForDestination(destinationId) {
    const keysToDelete = [];
    
    for (const [key] of this.cache.entries()) {
      if (key.includes(destinationId)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    
    console.log(`Cache cleared for destination ${destinationId}: ${keysToDelete.length} entries removed`);
  }

  /**
   * Schedule superseded notification for entry pack
   * @param {EntryPack} entryPack - Entry pack instance
   * @param {Object} options - Superseded options
   */
  async scheduleSupersededNotification(entryPack, options = {}) {
    try {
      // Import NotificationCoordinator dynamically to avoid circular dependencies
      const NotificationCoordinator = require('../notification/NotificationCoordinator').default;
      const NotificationPreferencesService = require('../notification/NotificationPreferencesService').default;
      
      // Check if notifications are globally enabled
      const notificationsEnabled = await NotificationPreferencesService.getPreference('enabled', true);
      if (!notificationsEnabled) {
        console.log('Notifications disabled in user preferences, skipping superseded notification');
        return;
      }

      // Check if superseded notifications are enabled
      const supersededNotificationsEnabled = await NotificationPreferencesService.isNotificationTypeEnabled('entryPackSuperseded');
      if (!supersededNotificationsEnabled) {
        console.log('Superseded notifications disabled in user preferences');
        return;
      }

      // Get destination name for notification
      const destination = this.getDestinationDisplayName(entryPack.destinationId);
      
      // Schedule superseded notification
      const notificationId = await NotificationCoordinator.scheduleSupersededNotification(
        entryPack.userId,
        entryPack.id,
        destination,
        {
          reason: options.reason || 'Entry pack marked as superseded',
          triggeredBy: options.metadata?.triggeredBy || 'user_edit',
          changedFields: options.metadata?.changedFields || [],
          timestamp: new Date().toISOString()
        }
      );
      
      console.log('Superseded notification scheduled:', {
        entryPackId: entryPack.id,
        userId: entryPack.userId,
        notificationId: notificationId,
        reason: options.reason
      });
      
    } catch (error) {
      console.error('Failed to schedule superseded notification:', error);
      // Don't throw - this is a secondary operation that shouldn't break the main flow
    }
  }

  /**
   * Cancel expiry warning notifications for entry pack
   * @param {string} entryPackId - Entry pack ID
   */
  async cancelExpiryWarningNotifications(entryPackId) {
    try {
      // Import NotificationCoordinator dynamically to avoid circular dependencies
      const NotificationCoordinator = require('../notification/NotificationCoordinator').default;
      
      await NotificationCoordinator.cancelExpiryWarningNotifications(entryPackId);
      
      console.log('Expiry warning notifications cancelled for entry pack:', entryPackId);
    } catch (error) {
      console.error('Failed to cancel expiry warning notifications:', error);
      // Don't throw - this is a secondary operation that shouldn't break the main flow
    }
  }

  /**
   * Get destination name for notifications
   * @param {string} destinationId - Destination ID
   * @returns {string} - Destination name
   */
  getDestinationName(destinationId) {
    return this.getDestinationDisplayName(destinationId);
  }
}

// Export singleton instance
const entryPackService = new EntryPackService();

export default entryPackService;