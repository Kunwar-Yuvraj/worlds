export interface User {
  id: string;
  email: string;
  full_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
}

export interface Novel {
  id: string;
  user_id: string;
  title: string;
  genre?: string;
  language: string;
  tone?: string;
  style?: string;
  pov?: string;
  estimated_chapters: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Chapter {
  id: string;
  novel_id: string;
  chapter_number: number;
  title: string;
  content: string;
  summary?: string;
  status: string;
  word_count: number;
  created_at: string;
  updated_at: string;
}

export interface Character {
  id: string;
  novel_id: string;
  name: string;
  role: string;
  description?: string;
  personality_traits: Record<string, any>;
  backstory?: string;
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: string;
  novel_id: string;
  name: string;
  description?: string;
  significance?: string;
  created_at: string;
  updated_at: string;
}

export interface TimelineEvent {
  id: string;
  novel_id: string;
  event_order: number;
  title: string;
  description: string;
  chapter_id?: string;
  impact?: string;
  created_at: string;
  updated_at: string;
}

export interface Outline {
  id: string;
  novel_id: string;
  chapter_number: number;
  title: string;
  synopsis: string;
  key_events: any[];
  target_word_count: number;
  created_at: string;
  updated_at: string;
}

export interface WorldRule {
  id: string;
  novel_id: string;
  rule_name: string;
  category: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface GenerateRequest {
  novel_id: string;
  chapter_id?: string;
  user_instruction: string;
  request_type?: string;
}

export interface GenerateResponse {
  novel_id: string;
  chapter_id?: string;
  draft_content: string;
  edited_content: string;
  word_count: number;
  consistency_results: Record<string, any>;
  memory_results: Record<string, any>;
  logs: string[];
}

export interface SearchResult {
  entity_type: string;
  entity_id: string;
  similarity: number;
  content_snippet: string;
}

export interface SearchResponse {
  novel_id: string;
  query: string;
  results: SearchResult[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
