import { 
  MemoriaProfile, 
  GameEntry, 
  DigitalPresenceEntry, 
  MemoirIntegrationStatus 
} from './memoir-integrations';

/**
 * Validates and normalizes personal preferences data
 */
export interface PersonalPreferences {
  favorite_songs: string[];
  favorite_locations: string[];
  favorite_movies: string[];
  favorite_books: string[];
  favorite_quotes: string[];
  favorite_foods: string[];
  favorite_signature_dishes: string[];
  digital_presence: DigitalPresenceEntry[];
  gaming_preferences: GameEntry[];
  last_updated?: string;
}

/**
 * Validates and normalizes narrative data
 */
export interface NarrativeItem {
  title: string;
  content: string;
  timestamp: string;
  aiEnhanced?: boolean;
  documentUrl?: string;
  documentType?: string;
  documentName?: string;
}

export interface DocumentItem {
  title: string;
  documentUrl: string;
  documentType: string;
  documentName: string;
  timestamp: string;
}

export interface AIInsights {
  personality_traits: string[];
  core_themes: string[];
  writing_style: string;
  processed_at: string;
}

export interface NarrativesData {
  personal_stories?: NarrativeItem[];
  memories?: NarrativeItem[];
  values?: NarrativeItem[];
  wisdom?: NarrativeItem[];
  reflections?: NarrativeItem[];
  documents?: DocumentItem[];
  ai_insights?: AIInsights;
}

/**
 * Validates and normalizes family tree data
 */
export interface FamilyTreeFile {
  name: string;
  size: number;
  type: string;
  uploadDate: string;
  url: string;
}

export interface FamilyTreeData {
  files: FamilyTreeFile[];
  lastUpdated: string;
}

/**
 * Validates and normalizes media links data
 */
export interface MediaLink {
  id: string;
  title: string;
  url: string;
  type: 'video' | 'podcast' | 'article';
  source: string;
  description?: string;
  date: string;
}

/**
 * Validates and normalizes portrait generation data
 */
export interface GeneratedPortrait {
  id: string;
  name: string;
  sourceImage: string;
  generatedImages: string[];
  style: string;
  timestamp: string | Date;
}

export interface PortraitsData {
  generated: GeneratedPortrait[];
  last_updated: string;
}

/**
 * Validates and normalizes avatar data
 */
export interface AvaturnAvatar {
  id: string;
  sourcePhoto?: string | null;
  avaturnUrl?: string;
  modelUrl?: string;
  modelName?: string;
  modelSize?: number;
  isCustomModel?: boolean;
  isExternal?: boolean;
  externalSource?: string;
  embedCode?: string;
  createdAt: string | Date;
  status: string;
}

export interface AvaturnAvatarsData {
  avatars: AvaturnAvatar[];
  last_updated: string;
}

/**
 * Validates and normalizes personality test data
 */
export interface PersonalityTestData {
  type: string;
  name: string;
  description: string;
  answers?: Record<string, number>;
  completedAt: string;
  pdfUrl?: string;
  pdfName?: string;
  pdfUploadedAt?: string;
}

/**
 * Validates and normalizes space customization data
 */
export interface SpaceCustomizationSettings {
  itemSizeMultiplier: number;
  itemDistanceFromCenter: number;
  verticalSpread: number;
  rotationSpeed: number;
  autoRotate: boolean;
  colorTheme: string;
  backgroundIntensity: number;
  iconScale: number;
  itemColorOverrides: Record<string, string>;
  itemVisible: Record<string, boolean>;
  itemPositionOverrides: Record<string, [number, number, number]>;
  particleDensity: number;
  particleSize: number;
  particleSpeed: number;
}

export interface SpaceCustomizationPreset {
  id: string;
  name: string;
  settings: SpaceCustomizationSettings;
}

export interface SpaceCustomizationData {
  settings?: SpaceCustomizationSettings;
  presets?: SpaceCustomizationPreset[];
  last_updated?: string;
}

/**
 * Validates and normalizes tribute images data
 */
export interface TributeImage {
  id: string;
  url: string;
  style?: string;
  prompt?: string;
  createdAt: string;
}

/**
 * Validates and normalizes a string value
 */
export function validateString(value: unknown, defaultValue: string = ''): string {
  if (typeof value === 'string') {
    return value.trim();
  }
  
  if (value === null || value === undefined) {
    return defaultValue;
  }
  
  try {
    return String(value).trim();
  } catch (e) {
    return defaultValue;
  }
}

/**
 * Validates and normalizes a number value
 */
export function validateNumber(value: unknown, defaultValue: number = 0): number {
  if (typeof value === 'number' && !isNaN(value)) {
    return value;
  }
  
  if (value === null || value === undefined) {
    return defaultValue;
  }
  
  try {
    const parsedValue = Number(value);
    return isNaN(parsedValue) ? defaultValue : parsedValue;
  } catch (e) {
    return defaultValue;
  }
}

/**
 * Validates and normalizes a boolean value
 */
export function validateBoolean(value: unknown, defaultValue: boolean = false): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  
  if (value === null || value === undefined) {
    return defaultValue;
  }
  
  return Boolean(value);
}

/**
 * Validates and normalizes a date string
 */
export function validateDateString(value: unknown): string {
  if (typeof value === 'string') {
    // Check if it's a valid ISO date string
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return value;
    }
  }
  
  // Return current date as ISO string if invalid
  return new Date().toISOString();
}

/**
 * Validates and normalizes a string array
 */
export function validateStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map(item => validateString(item))
      .filter(item => item.length > 0);
  }
  
  return [];
}

/**
 * Validates and normalizes a URL string
 */
export function validateUrl(value: unknown): string | null {
  if (typeof value !== 'string' || !value) {
    return null;
  }
  
  const trimmed = value.trim();
  
  // Simple URL validation
  try {
    new URL(trimmed);
    return trimmed;
  } catch (e) {
    // Not a valid URL
    return null;
  }
}

/**
 * Validates and normalizes a MIME type
 */
export function validateMimeType(value: unknown, fallback: string = 'application/octet-stream'): string {
  if (typeof value === 'string' && value.includes('/')) {
    return value.trim().toLowerCase();
  }
  
  return fallback;
}

/**
 * Validates and normalizes personal preferences data
 */
export function validatePersonalPreferences(data: any): PersonalPreferences {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid personal preferences data: expected an object');
  }
  
  // Create normalized object with default empty arrays
  const normalized: PersonalPreferences = {
    favorite_songs: validateStringArray(data.favorite_songs),
    favorite_locations: validateStringArray(data.favorite_locations),
    favorite_movies: validateStringArray(data.favorite_movies),
    favorite_books: validateStringArray(data.favorite_books),
    favorite_quotes: validateStringArray(data.favorite_quotes),
    favorite_foods: validateStringArray(data.favorite_foods),
    favorite_signature_dishes: validateStringArray(data.favorite_signature_dishes),
    digital_presence: [],
    gaming_preferences: [],
    last_updated: validateDateString(data.last_updated || new Date().toISOString())
  };
  
  // Validate digital presence entries
  if (Array.isArray(data.digital_presence)) {
    normalized.digital_presence = data.digital_presence.map((entry: any) => ({
      id: validateString(entry.id, `digital-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`),
      name: validateString(entry.name, 'Unknown Platform'),
      url: validateString(entry.url, ''),
      timestamp: validateDateString(entry.timestamp)
    })).filter(entry => entry.url.length > 0);
  }
  
  // Validate gaming preferences
  if (Array.isArray(data.gaming_preferences)) {
    normalized.gaming_preferences = data.gaming_preferences.map((entry: any) => ({
      id: validateString(entry.id, `game-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`),
      name: validateString(entry.name, 'Unknown Game'),
      platform: validateString(entry.platform, 'Other'),
      invite_link: validateString(entry.invite_link, ''),
      invite_code: validateString(entry.invite_code, ''),
      notes: validateString(entry.notes, ''),
      favorite: validateBoolean(entry.favorite, false),
      timestamp: validateDateString(entry.timestamp)
    })).filter(entry => entry.name.length > 0);
  }
  
  return normalized;
}

/**
 * Validates and normalizes narratives data
 */
export function validateNarrativesData(data: any): NarrativesData {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid narratives data: expected an object');
  }
  
  const normalized: NarrativesData = {};
  
  // Validate personal stories
  if (Array.isArray(data.personal_stories)) {
    normalized.personal_stories = data.personal_stories
      .filter((item: any) => item && typeof item === 'object')
      .map((item: any) => ({
        title: validateString(item.title, 'Untitled Story'),
        content: validateString(item.content, ''),
        timestamp: validateDateString(item.timestamp),
        aiEnhanced: validateBoolean(item.aiEnhanced, false),
        documentUrl: validateString(item.documentUrl, ''),
        documentType: validateString(item.documentType, ''),
        documentName: validateString(item.documentName, '')
      }))
      .filter((item: NarrativeItem) => item.content.length > 0 || item.documentUrl.length > 0);
  }
  
  // Validate memories
  if (Array.isArray(data.memories)) {
    normalized.memories = data.memories
      .filter((item: any) => item && typeof item === 'object')
      .map((item: any) => ({
        title: validateString(item.title, 'Untitled Memory'),
        content: validateString(item.content, ''),
        timestamp: validateDateString(item.timestamp),
        aiEnhanced: validateBoolean(item.aiEnhanced, false)
      }))
      .filter((item: NarrativeItem) => item.content.length > 0);
  }
  
  // Validate values
  if (Array.isArray(data.values)) {
    normalized.values = data.values
      .filter((item: any) => item && typeof item === 'object')
      .map((item: any) => ({
        title: validateString(item.title, 'Untitled Value'),
        content: validateString(item.content, ''),
        timestamp: validateDateString(item.timestamp),
        aiEnhanced: validateBoolean(item.aiEnhanced, false)
      }))
      .filter((item: NarrativeItem) => item.content.length > 0);
  }
  
  // Validate wisdom
  if (Array.isArray(data.wisdom)) {
    normalized.wisdom = data.wisdom
      .filter((item: any) => item && typeof item === 'object')
      .map((item: any) => ({
        title: validateString(item.title, 'Untitled Wisdom'),
        content: validateString(item.content, ''),
        timestamp: validateDateString(item.timestamp),
        aiEnhanced: validateBoolean(item.aiEnhanced, false)
      }))
      .filter((item: NarrativeItem) => item.content.length > 0);
  }
  
  // Validate reflections
  if (Array.isArray(data.reflections)) {
    normalized.reflections = data.reflections
      .filter((item: any) => item && typeof item === 'object')
      .map((item: any) => ({
        title: validateString(item.title, 'Untitled Reflection'),
        content: validateString(item.content, ''),
        timestamp: validateDateString(item.timestamp),
        aiEnhanced: validateBoolean(item.aiEnhanced, false)
      }))
      .filter((item: NarrativeItem) => item.content.length > 0);
  }
  
  // Validate documents
  if (Array.isArray(data.documents)) {
    normalized.documents = data.documents
      .filter((item: any) => item && typeof item === 'object')
      .map((item: any) => ({
        title: validateString(item.title, 'Untitled Document'),
        documentUrl: validateString(item.documentUrl, ''),
        documentType: validateString(item.documentType, 'application/octet-stream'),
        documentName: validateString(item.documentName, 'document.pdf'),
        timestamp: validateDateString(item.timestamp)
      }))
      .filter((item: DocumentItem) => item.documentUrl.length > 0);
  }
  
  // Validate AI insights
  if (data.ai_insights && typeof data.ai_insights === 'object') {
    normalized.ai_insights = {
      personality_traits: validateStringArray(data.ai_insights.personality_traits),
      core_themes: validateStringArray(data.ai_insights.core_themes),
      writing_style: validateString(data.ai_insights.writing_style, ''),
      processed_at: validateDateString(data.ai_insights.processed_at)
    };
  }
  
  return normalized;
}

/**
 * Validates and normalizes family tree data
 */
export function validateFamilyTreeData(data: any): FamilyTreeData {
  if (!data || typeof data !== 'object') {
    return {
      files: [],
      lastUpdated: new Date().toISOString()
    };
  }
  
  let files: FamilyTreeFile[] = [];
  
  // Validate files array
  if (Array.isArray(data.files)) {
    files = data.files
      .filter((file: any) => file && typeof file === 'object')
      .map((file: any) => ({
        name: validateString(file.name, 'Untitled File'),
        size: validateNumber(file.size, 0),
        type: validateString(file.type, 'application/octet-stream'),
        uploadDate: validateDateString(file.uploadDate),
        url: validateString(file.url, '')
      }))
      .filter((file: FamilyTreeFile) => file.url.length > 0);
  }
  
  return {
    files,
    lastUpdated: validateDateString(data.lastUpdated || new Date().toISOString())
  };
}

/**
 * Validates and normalizes media links data
 */
export function validateMediaLinks(data: any[]): MediaLink[] {
  if (!Array.isArray(data)) {
    return [];
  }
  
  return data
    .filter(link => link && typeof link === 'object')
    .map(link => ({
      id: validateString(link.id, `media-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`),
      title: validateString(link.title, 'Untitled Media'),
      url: validateString(link.url, ''),
      type: validateString(link.type, 'video') as 'video' | 'podcast' | 'article',
      source: validateString(link.source, 'Unknown Source'),
      description: validateString(link.description, ''),
      date: validateDateString(link.date)
    }))
    .filter(link => link.url.length > 0);
}

/**
 * Validates and normalizes portraits data
 */
export function validatePortraitsData(data: any): PortraitsData {
  if (!data || typeof data !== 'object') {
    return {
      generated: [],
      last_updated: new Date().toISOString()
    };
  }
  
  let generated: GeneratedPortrait[] = [];
  
  // Validate generated portraits array
  if (Array.isArray(data.generated)) {
    generated = data.generated
      .filter((portrait: any) => portrait && typeof portrait === 'object')
      .map((portrait: any) => {
        // Ensure generatedImages is an array of strings
        let generatedImages: string[] = [];
        if (Array.isArray(portrait.generatedImages)) {
          generatedImages = portrait.generatedImages
            .filter((url: any) => typeof url === 'string')
            .map((url: string) => url.trim())
            .filter((url: string) => url.length > 0);
        }
        
        return {
          id: validateString(portrait.id, `portrait-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`),
          name: validateString(portrait.name, 'Untitled Portrait'),
          sourceImage: validateString(portrait.sourceImage, ''),
          generatedImages,
          style: validateString(portrait.style, 'default'),
          timestamp: validateDateString(portrait.timestamp)
        };
      })
      .filter((portrait: GeneratedPortrait) => 
        portrait.sourceImage.length > 0 && portrait.generatedImages.length > 0);
  }
  
  return {
    generated,
    last_updated: validateDateString(data.last_updated || new Date().toISOString())
  };
}

/**
 * Validates and normalizes Avaturn avatars data
 */
export function validateAvaturnAvatarsData(data: any): AvaturnAvatarsData {
  if (!data || typeof data !== 'object') {
    return {
      avatars: [],
      last_updated: new Date().toISOString()
    };
  }
  
  let avatars: AvaturnAvatar[] = [];
  
  // Validate avatars array
  if (Array.isArray(data.avatars)) {
    avatars = data.avatars
      .filter((avatar: any) => avatar && typeof avatar === 'object')
      .map((avatar: any) => ({
        id: validateString(avatar.id, `avatar-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`),
        sourcePhoto: validateString(avatar.sourcePhoto, null),
        avaturnUrl: validateString(avatar.avaturnUrl, ''),
        modelUrl: validateString(avatar.modelUrl, ''),
        modelName: validateString(avatar.modelName, ''),
        modelSize: validateNumber(avatar.modelSize, 0),
        isCustomModel: validateBoolean(avatar.isCustomModel, false),
        isExternal: validateBoolean(avatar.isExternal, false),
        externalSource: validateString(avatar.externalSource, ''),
        embedCode: validateString(avatar.embedCode, ''),
        createdAt: validateDateString(avatar.createdAt),
        status: validateString(avatar.status, 'ready')
      }))
      .filter((avatar: AvaturnAvatar) => 
        avatar.avaturnUrl.length > 0 || avatar.modelUrl.length > 0);
  }
  
  return {
    avatars,
    last_updated: validateDateString(data.last_updated || new Date().toISOString())
  };
}

/**
 * Validates and normalizes personality test data
 */
export function validatePersonalityTestData(data: any): PersonalityTestData {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid personality test data: expected an object');
  }
  
  return {
    type: validateString(data.type, 'INFJ'),
    name: validateString(data.name, 'Advocate'),
    description: validateString(data.description, ''),
    answers: data.answers && typeof data.answers === 'object' ? data.answers : {},
    completedAt: validateDateString(data.completedAt),
    pdfUrl: validateString(data.pdfUrl, ''),
    pdfName: validateString(data.pdfName, ''),
    pdfUploadedAt: validateString(data.pdfUploadedAt, '')
  };
}

/**
 * Validates and normalizes integration status data
 */
export function validateIntegrationStatus(data: any): MemoirIntegrationStatus {
  if (!data || typeof data !== 'object') {
    return {
      elevenlabs: {
        status: 'not_started',
        voice_cloned: false,
        last_updated: null
      },
      gemini: {
        status: 'not_started',
        narratives_processed: false,
        last_updated: null
      }
    };
  }
  
  const normalized: MemoirIntegrationStatus = {
    elevenlabs: {
      status: validateString(data.elevenlabs?.status, 'not_started') as any,
      voice_cloned: validateBoolean(data.elevenlabs?.voice_cloned, false),
      last_updated: data.elevenlabs?.last_updated || null
    },
    gemini: {
      status: validateString(data.gemini?.status, 'not_started') as any,
      narratives_processed: validateBoolean(data.gemini?.narratives_processed, false),
      last_updated: data.gemini?.last_updated || null
    }
  };
  
  // Optional properties, only add if present in the original data
  if (data.avaturn) {
    normalized.avaturn = {
      status: validateString(data.avaturn?.status, 'not_started') as any,
      avatar_created: validateBoolean(data.avaturn?.avatar_created, false),
      last_updated: data.avaturn?.last_updated || null
    };
  }
  
  if (data.portrait_generation) {
    normalized.portrait_generation = {
      status: validateString(data.portrait_generation?.status, 'not_started') as any,
      portraits_generated: validateBoolean(data.portrait_generation?.portraits_generated, false),
      last_updated: data.portrait_generation?.last_updated || null
    };
  }
  
  return normalized;
}

/**
 * Validates and normalizes space customization data
 */
export function validateSpaceCustomizationData(data: any): SpaceCustomizationData {
  if (!data || typeof data !== 'object') {
    return {
      last_updated: new Date().toISOString()
    };
  }
  
  const result: SpaceCustomizationData = {
    last_updated: validateDateString(data.last_updated || new Date().toISOString())
  };
  
  // Validate settings
  if (data.settings && typeof data.settings === 'object') {
    result.settings = {
      itemSizeMultiplier: validateNumber(data.settings.itemSizeMultiplier, 1),
      itemDistanceFromCenter: validateNumber(data.settings.itemDistanceFromCenter, 10),
      verticalSpread: validateNumber(data.settings.verticalSpread, 2),
      rotationSpeed: validateNumber(data.settings.rotationSpeed, 0.02),
      autoRotate: validateBoolean(data.settings.autoRotate, false),
      colorTheme: validateString(data.settings.colorTheme, 'cosmos'),
      backgroundIntensity: validateNumber(data.settings.backgroundIntensity, 0.5),
      iconScale: validateNumber(data.settings.iconScale, 1),
      itemColorOverrides: data.settings.itemColorOverrides && typeof data.settings.itemColorOverrides === 'object' 
        ? data.settings.itemColorOverrides 
        : {},
      itemVisible: data.settings.itemVisible && typeof data.settings.itemVisible === 'object' 
        ? data.settings.itemVisible 
        : {},
      itemPositionOverrides: data.settings.itemPositionOverrides && typeof data.settings.itemPositionOverrides === 'object' 
        ? data.settings.itemPositionOverrides 
        : {},
      particleDensity: validateNumber(data.settings.particleDensity, 1),
      particleSize: validateNumber(data.settings.particleSize, 1),
      particleSpeed: validateNumber(data.settings.particleSpeed, 1)
    };
  }
  
  // Validate presets
  if (Array.isArray(data.presets)) {
    result.presets = data.presets
      .filter(preset => preset && typeof preset === 'object')
      .map(preset => ({
        id: validateString(preset.id, `preset-${Date.now()}`),
        name: validateString(preset.name, 'Unnamed Preset'),
        settings: preset.settings && typeof preset.settings === 'object' 
          ? validateSpaceCustomizationData({ settings: preset.settings }).settings 
          : {
              itemSizeMultiplier: 1,
              itemDistanceFromCenter: 10,
              verticalSpread: 2,
              rotationSpeed: 0.02,
              autoRotate: false,
              colorTheme: 'cosmos',
              backgroundIntensity: 0.5,
              iconScale: 1,
              itemColorOverrides: {},
              itemVisible: {},
              itemPositionOverrides: {},
              particleDensity: 1,
              particleSize: 1,
              particleSpeed: 1
            }
      }));
  }
  
  return result;
}

/**
 * Validates and normalizes tribute images data
 */
export function validateTributeImagesData(data: unknown): TributeImage[] {
  if (!Array.isArray(data)) {
    return [];
  }
  
  return data
    .filter(item => item && typeof item === 'object')
    .map(item => ({
      id: validateString(item.id, `tribute-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`),
      url: validateString(item.url, ''),
      style: validateString(item.style, ''),
      prompt: validateString(item.prompt, ''),
      createdAt: validateDateString(item.createdAt)
    }))
    .filter(item => item.url.length > 0);
}

/**
 * Main validation function to ensure data has the right structure
 * This validates the top-level data structure for the memoir_data or profile_data
 */
export function validateMemoirData(data: any): any {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid memoir data: expected an object');
  }
  
  const result: any = { ...data };
  
  // Validate preferences if it exists
  if (data.preferences && typeof data.preferences === 'object') {
    result.preferences = { ...data.preferences };
    
    // Validate personal preferences
    if (data.preferences.personal) {
      try {
        result.preferences.personal = validatePersonalPreferences(data.preferences.personal);
      } catch (e) {
        console.warn('Error validating personal preferences:', e);
        // Keep original data if validation fails
      }
    }
  }
  
  // Validate narratives
  if (data.narratives && typeof data.narratives === 'object') {
    try {
      result.narratives = validateNarrativesData(data.narratives);
    } catch (e) {
      console.warn('Error validating narratives:', e);
      // Keep original data if validation fails
    }
  }
  
  // Validate family_tree
  if (data.family_tree) {
    try {
      result.family_tree = validateFamilyTreeData(data.family_tree);
    } catch (e) {
      console.warn('Error validating family tree data:', e);
      // Keep original data if validation fails
    }
  }
  
  // Validate media_links
  if (data.media_links) {
    try {
      result.media_links = validateMediaLinks(data.media_links);
    } catch (e) {
      console.warn('Error validating media links:', e);
      // Keep original data if validation fails
    }
  }
  
  // Validate portraits
  if (data.portraits) {
    try {
      result.portraits = validatePortraitsData(data.portraits);
    } catch (e) {
      console.warn('Error validating portraits data:', e);
      // Keep original data if validation fails
    }
  }
  
  // Validate avaturn_avatars
  if (data.avaturn_avatars) {
    try {
      result.avaturn_avatars = validateAvaturnAvatarsData(data.avaturn_avatars);
    } catch (e) {
      console.warn('Error validating Avaturn avatars data:', e);
      // Keep original data if validation fails
    }
  }
  
  // Validate personality_test
  if (data.personality_test) {
    try {
      result.personality_test = validatePersonalityTestData(data.personality_test);
    } catch (e) {
      console.warn('Error validating personality test data:', e);
      // Keep original data if validation fails
    }
  }
  
  // Validate space_customization
  if (data.space_customization) {
    try {
      result.space_customization = validateSpaceCustomizationData(data.space_customization);
    } catch (e) {
      console.warn('Error validating space customization data:', e);
      // Keep original data if validation fails
    }
  }
  
  // Validate tribute_images
  if (data.tribute_images) {
    try {
      result.tribute_images = validateTributeImagesData(data.tribute_images);
    } catch (e) {
      console.warn('Error validating tribute images data:', e);
      // Keep original data if validation fails
    }
  }
  
  return result;
}