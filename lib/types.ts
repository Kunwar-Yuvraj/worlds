export type Character = { name: string; role: string; constraints: string[]; background?: string; goals?: string[] };
export type World = { name: string; genre: string; rulesText: string; visibility: 'public' | 'private'; passwordHash: string | null; mainContext: string; createdBy: string; turnCount: number; nextSequence: number };
export type Event = { type: 'player_action' | 'narration' | 'system'; playerId: string | null; content: string; optionsOffered: string[] | null; visibility: 'public' | 'private'; audienceId: string | null; sequenceNumber: number };
