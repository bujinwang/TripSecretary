#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Define missing keys for each language
const missingKeys = {
  'countries.zh.json': {
    'thailand.entryFlow.categoriesTitle': '信息类别',
    'thailand.travelInfo.scan.ticketTitle': '扫描机票',
    'thailand.travelInfo.scan.ticketMessage': '请选择机票图片来源',
    'thailand.travelInfo.scan.hotelTitle': '扫描酒店预订',
    'thailand.travelInfo.scan.hotelMessage': '请选择酒店预订确认单图片来源',
    'thailand.travelInfo.scan.takePhoto': '拍照',
    'thailand.travelInfo.scan.fromLibrary': '从相册选择',
    'thailand.travelInfo.scan.permissionTitle': '需要权限',
    'thailand.travelInfo.scan.cameraPermissionMessage': '需要相机权限来拍照扫描文档',
    'thailand.travelInfo.scan.libraryPermissionMessage': '需要相册权限来选择照片',
    'thailand.travelInfo.scan.scanFailed': '扫描失败',
    'thailand.travelInfo.scan.scanFailedMessage': '文档扫描失败，请重试',
    'thailand.travelInfo.scan.processing': '正在处理...',
    'thailand.travelInfo.scan.processingMessage': '正在识别文档内容，请稍候',
    'progressiveEntryFlow.status.superseded': '需要重新提交'
  },
  'countries.en.json': {
    'thailand.entryFlow.categoriesTitle': 'Information Categories',
    'thailand.travelInfo.scan.ticketTitle': 'Scan Ticket',
    'thailand.travelInfo.scan.ticketMessage': 'Please select ticket image source',
    'thailand.travelInfo.scan.hotelTitle': 'Scan Hotel Booking',
    'thailand.travelInfo.scan.hotelMessage': 'Please select hotel booking confirmation image source',
    'thailand.travelInfo.scan.takePhoto': 'Take Photo',
    'thailand.travelInfo.scan.fromLibrary': 'From Library',
    'thailand.travelInfo.scan.permissionTitle': 'Permission Required',
    'thailand.travelInfo.scan.cameraPermissionMessage': 'Camera permission required to take photos for document scanning',
    'thailand.travelInfo.scan.libraryPermissionMessage': 'Photo library permission required to select photos',
    'thailand.travelInfo.scan.scanFailed': 'Scan Failed',
    'thailand.travelInfo.scan.scanFailedMessage': 'Document scanning failed, please try again',
    'thailand.travelInfo.scan.processing': 'Processing...',
    'thailand.travelInfo.scan.processingMessage': 'Recognizing document content, please wait',
    'progressiveEntryFlow.status.superseded': 'Needs Resubmission'
  },
  'countries.es.json': {
    'thailand.entryFlow.categoriesTitle': 'Categorías de Información',
    'thailand.travelInfo.scan.ticketTitle': 'Escanear Boleto',
    'thailand.travelInfo.scan.ticketMessage': 'Por favor seleccione la fuente de imagen del boleto',
    'thailand.travelInfo.scan.hotelTitle': 'Escanear Reserva de Hotel',
    'thailand.travelInfo.scan.hotelMessage': 'Por favor seleccione la fuente de imagen de confirmación de reserva de hotel',
    'thailand.travelInfo.scan.takePhoto': 'Tomar Foto',
    'thailand.travelInfo.scan.fromLibrary': 'De la Biblioteca',
    'thailand.travelInfo.scan.permissionTitle': 'Permiso Requerido',
    'thailand.travelInfo.scan.cameraPermissionMessage': 'Se requiere permiso de cámara para tomar fotos para escanear documentos',
    'thailand.travelInfo.scan.libraryPermissionMessage': 'Se requiere permiso de biblioteca de fotos para seleccionar fotos',
    'thailand.travelInfo.scan.scanFailed': 'Escaneo Fallido',
    'thailand.travelInfo.scan.scanFailedMessage': 'El escaneo del documento falló, por favor intente de nuevo',
    'thailand.travelInfo.scan.processing': 'Procesando...',
    'thailand.travelInfo.scan.processingMessage': 'Reconociendo el contenido del documento, por favor espere',
    'progressiveEntryFlow.status.superseded': 'Necesita Reenvío'
  },
  'countries.fr.json': {
    'thailand.entryFlow.categoriesTitle': 'Catégories d\'Information',
    'thailand.travelInfo.scan.ticketTitle': 'Scanner le Billet',
    'thailand.travelInfo.scan.ticketMessage': 'Veuillez sélectionner la source de l\'image du billet',
    'thailand.travelInfo.scan.hotelTitle': 'Scanner la Réservation d\'Hôtel',
    'thailand.travelInfo.scan.hotelMessage': 'Veuillez sélectionner la source de l\'image de confirmation de réservation d\'hôtel',
    'thailand.travelInfo.scan.takePhoto': 'Prendre une Photo',
    'thailand.travelInfo.scan.fromLibrary': 'De la Bibliothèque',
    'thailand.travelInfo.scan.permissionTitle': 'Permission Requise',
    'thailand.travelInfo.scan.cameraPermissionMessage': 'Permission de caméra requise pour prendre des photos pour scanner des documents',
    'thailand.travelInfo.scan.libraryPermissionMessage': 'Permission de bibliothèque de photos requise pour sélectionner des photos',
    'thailand.travelInfo.scan.scanFailed': 'Échec du Scan',
    'thailand.travelInfo.scan.scanFailedMessage': 'L\'analyse du document a échoué, veuillez réessayer',
    'thailand.travelInfo.scan.processing': 'Traitement en cours...',
    'thailand.travelInfo.scan.processingMessage': 'Reconnaissance du contenu du document, veuillez patienter',
    'progressiveEntryFlow.status.superseded': 'Nécessite une Nouvelle Soumission',
    'progressiveEntryFlow.immigrationOfficer.title': 'Montrer à l\'Agent',
    'thailand.entryFlow.title': 'Statut de Préparation d\'Entrée en Thaïlande',
    'thailand.entryFlow.preparationTitle': 'Statut de Préparation d\'Entrée en Thaïlande',
    'thailand.entryFlow.loading': 'Chargement du statut de préparation...',
    'thailand.entryFlow.noData.title': 'Commencer à Remplir les Informations d\'Entrée en Thaïlande',
    'thailand.entryFlow.noData.startButton': 'Commencer à Remplir',
    'common.error': 'Erreur',
    'common.locale': 'fr'
  },
  'countries.de.json': {
    'thailand.entryFlow.categoriesTitle': 'Informationskategorien',
    'thailand.travelInfo.scan.ticketTitle': 'Ticket Scannen',
    'thailand.travelInfo.scan.ticketMessage': 'Bitte wählen Sie die Ticket-Bildquelle',
    'thailand.travelInfo.scan.hotelTitle': 'Hotelbuchung Scannen',
    'thailand.travelInfo.scan.hotelMessage': 'Bitte wählen Sie die Bildquelle für die Hotelbuchungsbestätigung',
    'thailand.travelInfo.scan.takePhoto': 'Foto Aufnehmen',
    'thailand.travelInfo.scan.fromLibrary': 'Aus der Bibliothek',
    'thailand.travelInfo.scan.permissionTitle': 'Berechtigung Erforderlich',
    'thailand.travelInfo.scan.cameraPermissionMessage': 'Kameraberechtigung erforderlich, um Fotos für das Scannen von Dokumenten aufzunehmen',
    'thailand.travelInfo.scan.libraryPermissionMessage': 'Fotobibliotheksberechtigung erforderlich, um Fotos auszuwählen',
    'thailand.travelInfo.scan.scanFailed': 'Scan Fehlgeschlagen',
    'thailand.travelInfo.scan.scanFailedMessage': 'Dokumentenscan fehlgeschlagen, bitte versuchen Sie es erneut',
    'thailand.travelInfo.scan.processing': 'Verarbeitung...',
    'thailand.travelInfo.scan.processingMessage': 'Dokumentinhalt wird erkannt, bitte warten',
    'progressiveEntryFlow.status.superseded': 'Erneute Einreichung Erforderlich',
    'progressiveEntryFlow.immigrationOfficer.title': 'Dem Beamten Zeigen',
    'thailand.entryFlow.title': 'Thailand Einreise-Vorbereitungsstatus',
    'thailand.entryFlow.preparationTitle': 'Thailand Einreise-Vorbereitungsstatus',
    'thailand.entryFlow.loading': 'Lade Vorbereitungsstatus...',
    'thailand.entryFlow.noData.title': 'Thailand Einreiseinformationen Ausfüllen Beginnen',
    'thailand.entryFlow.noData.startButton': 'Ausfüllen Beginnen',
    'common.error': 'Fehler',
    'common.locale': 'de'
  }
};

function setNestedProperty(obj, path, value) {
  const keys = path.split('.');
  let current = obj;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  
  current[keys[keys.length - 1]] = value;
}

function addMissingKeys() {
  const translationsDir = path.join(__dirname, '..', 'app', 'i18n', 'translations');
  
  Object.entries(missingKeys).forEach(([filename, keys]) => {
    const filePath = path.join(translationsDir, filename);
    
    if (!fs.existsSync(filePath)) {
      console.log(`File ${filename} does not exist, skipping...`);
      return;
    }
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const translations = JSON.parse(content);
      
      let modified = false;
      Object.entries(keys).forEach(([keyPath, value]) => {
        // Check if key already exists
        const keyParts = keyPath.split('.');
        let current = translations;
        let exists = true;
        
        for (const part of keyParts) {
          if (!(part in current)) {
            exists = false;
            break;
          }
          current = current[part];
        }
        
        if (!exists) {
          setNestedProperty(translations, keyPath, value);
          modified = true;
          console.log(`Added ${keyPath} to ${filename}`);
        } else {
          console.log(`Key ${keyPath} already exists in ${filename}`);
        }
      });
      
      if (modified) {
        const updatedContent = JSON.stringify(translations, null, 2);
        fs.writeFileSync(filePath, updatedContent, 'utf8');
        console.log(`Updated ${filename}`);
      }
    } catch (error) {
      console.error(`Error processing ${filename}:`, error.message);
    }
  });
}

if (require.main === module) {
  addMissingKeys();
}

module.exports = { addMissingKeys, missingKeys };