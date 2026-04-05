export interface Conversation {
  id: string;
  participants: string[];
  turns: ConversationTurn[];
  startedAt: number;
  endedAt: number | null;
  location: string;
  gameDay: number;
  summary?: string;
}

export interface ConversationTurn {
  speaker: string;
  text: string;
  mood?: string;
  timestamp: number;
}
