export class NationalityContentResolver {
  constructor(userNationality, destinationId) {
    this.userNationality = userNationality;
    this.destinationId = destinationId;
  }

  getRequirements() {
    const requirements = nationalityRequirements[this.destinationId]?.[this.userNationality] 
      || nationalityRequirements[this.destinationId]?.['default']
      || this.getGenericRequirements();
    
    return requirements;
  }

  getTranslationKey(baseKey) {
    // Try nationality-specific first, fall back to default
    const translations = getTranslations();
    const nationalitySpecific = `${baseKey}.${this.userNationality}`;
    const defaultKey = `${baseKey}.default`;
    
    if (translations[nationalitySpecific]) {
      return nationalitySpecific;
    } else if (translations[defaultKey]) {
      return defaultKey;
    }
    return baseKey;
  }

  resolveContent(translationPath) {
    const translations = getTranslations();
    const pathParts = translationPath.split('.');
    
    // Try to find nationality-specific content
    let content = this.getNestedValue(translations, pathParts, this.userNationality);
    
    // Fall back to default if not found
    if (!content) {
      content = this.getNestedValue(translations, pathParts, 'default');
    }
    
    // Final fallback to base content
    if (!content) {
      content = this.getNestedValue(translations, pathParts);
    }
    
    return content;
  }
}