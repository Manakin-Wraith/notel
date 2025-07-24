import { EMOJI_DATA } from '../emoji-data';

// Named icons for pages (backward compatibility)
export const NAMED_ICONS = [
  'document-text',
  'book-open',
  'light-bulb',
  'sparkles',
  'rocket-launch',
  'briefcase',
  'chart-bar',
  'code-bracket',
];

// Extract all emojis from the comprehensive emoji data and deduplicate
export const EMOJIS = [...new Set(EMOJI_DATA.flatMap(category => 
  category.emojis.map(emoji => emoji.emoji)
))];

// Combined icons array for the picker (named icons + emojis)
export const ICONS = [...NAMED_ICONS, ...EMOJIS];

// Also export the categorized data for enhanced picker UI
export const EMOJI_CATEGORIES = EMOJI_DATA;
