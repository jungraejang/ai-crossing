import type { LLMProvider, LLMProviderConfig } from './base';
import { OllamaProvider } from './ollama';

export type ProviderType = 'ollama' | 'openai' | 'anthropic';

export function createProvider(type: ProviderType, config: LLMProviderConfig): LLMProvider {
  switch (type) {
    case 'ollama':
      return new OllamaProvider(config);
    case 'openai':
      throw new Error('OpenAI provider not yet implemented. Add OPENAI_API_KEY and implement OpenAIProvider.');
    case 'anthropic':
      throw new Error('Anthropic provider not yet implemented. Add ANTHROPIC_API_KEY and implement AnthropicProvider.');
    default:
      throw new Error(`Unknown provider type: ${type}`);
  }
}
