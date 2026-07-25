export type StoryState = {
  currentTime: string;
  publicSummary: string;
  currentSituation: string;
  activeThreadIds: string[];
};

export type PlotThread = { id: string; title: string; status: 'active' | 'dormant' | 'resolved'; publicSummary: string; stakes: string };
export type HiddenPlot = { premise: string; hiddenTruth: string; secrets: string[]; plannedReversals: string[]; integritySummary: string };
export type Location = { id: string; name: string; description: string; atmosphere: string; publicState: string; connectedLocationIds: string[] };
export type Npc = { id: string; name: string; role: string; appearance: string; personality: string; publicFace: string; currentObjective: string; currentLocationId: string; status: string; publicSummary: string };
export type PlayerState = { currentLocationId: string; currentObjective: string; currentActivity: string; privateSummary: string; activeQuestIds: string[]; knownFacts: { fact: string; source: string; certainty: 'rumor' | 'lead' | 'confirmed' }[]; relationships: { entityId: string; label: string; trust: number; summary: string }[]; inventory: string[]; condition: string; cliffhanger: string; turnCount: number };
export type Scene = { id: string; locationId: string; participantIds: string[]; visibleNpcIds: string[]; sharedSummary: string; status: 'active' | 'quiet'; updatedAt?: unknown };
export type VoiceProfile = { voice: 'alloy' | 'ash' | 'ballad' | 'coral' | 'echo' | 'fable' | 'nova' | 'onyx' | 'sage' | 'shimmer' | 'verse' | 'marin' | 'cedar'; instructions: string };

export type WorldBlueprint = { worldSummary: string; storyState: StoryState; plotThreads: PlotThread[]; hiddenPlot: HiddenPlot; locations: Location[]; npcs: Npc[] };
export type CharacterBlueprint = { name: string; role: string; appearance: string; personality: string; background: string; strengths: string[]; constraints: string[]; goals: string[]; privateArc: string; voiceProfile: VoiceProfile; state: PlayerState };
export type TurnResolution = { narration: string; options: string[]; playerState: PlayerState; sceneEvent: string | null; worldEvent: string | null; storyState: StoryState; plotThreadUpdates: PlotThread[]; npcUpdates: Npc[]; sceneSummary: string | null };

export const STORY_VERSION = 2;
export const normalizeId = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 48) || 'unknown';
export const asString = (value: unknown, fallback = '') => typeof value === 'string' ? value.trim() : fallback;
export const asStringArray = (value: unknown, max = 12) => Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string').map(item => item.trim()).filter(Boolean).slice(0, max) : [];
export const clampTrust = (value: unknown) => Math.max(-5, Math.min(5, typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : 0));
