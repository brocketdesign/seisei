// Shared AI Model type and initial data
// Used by both the models management page and the generate page

export type AIModel = {
  id: string;
  name: string;
  avatar: string;
  tags: string[];
  isActive: boolean;
  bodyType: 'Slim' | 'Athletic' | 'Curvy';
  isLocked: boolean;
  age?: number;
  ethnicity?: string;
};

export const initialModels: AIModel[] = [
  { id: '1', name: 'Yuki', avatar: '/models/yuki.jpg', tags: ['Cute', 'Casual'], isActive: true, bodyType: 'Slim', isLocked: true, age: 22, ethnicity: 'Japanese' },
  { id: '2', name: 'Aoi', avatar: '/models/aoi.jpg', tags: ['Cool', 'Street'], isActive: false, bodyType: 'Athletic', isLocked: false, age: 25, ethnicity: 'Japanese' },
  { id: '3', name: 'Rina', avatar: '/models/rina.jpg', tags: ['Elegant', 'Formal'], isActive: true, bodyType: 'Curvy', isLocked: true, age: 28, ethnicity: 'Japanese' },
  { id: '4', name: 'Hana', avatar: '/models/hana.jpg', tags: ['Modern', 'Vibrant'], isActive: true, bodyType: 'Slim', isLocked: false, age: 20, ethnicity: 'Japanese' },
];

/**
 * Build a prompt description for a model based on its attributes.
 * Used by the generation API to create model images via z-image-turbo.
 */
export function buildModelPrompt(model: AIModel): string {
  const ethnicityMap: Record<string, string> = {
    'Japanese': 'Japanese',
    'Asian': 'East Asian',
    'Caucasian': 'Western Caucasian',
    'Mixed': 'mixed-heritage',
  };

  const bodyTypeMap: Record<string, string> = {
    'Slim': 'slim and elegant build',
    'Athletic': 'athletic and toned build',
    'Curvy': 'curvy and confident build',
  };

  const tagVibeMap: Record<string, string> = {
    'Cute': 'cute and approachable expression',
    'Casual': 'casual relaxed pose',
    'Cool': 'cool and confident attitude',
    'Street': 'street-style vibe',
    'Elegant': 'elegant and sophisticated posture',
    'Formal': 'formal editorial stance',
    'Modern': 'modern and trendy look',
    'Vibrant': 'vibrant and energetic presence',
  };

  const ethnicity = ethnicityMap[model.ethnicity || 'Japanese'] || 'Japanese';
  const body = bodyTypeMap[model.bodyType] || 'slim build';
  const age = model.age || 24;
  const vibes = model.tags
    .map(tag => tagVibeMap[tag])
    .filter(Boolean)
    .join(', ');

  return `a ${age}-year-old ${ethnicity} female fashion model with ${body}${vibes ? `, ${vibes}` : ''}, photogenic features, professional fashion model`;
}
