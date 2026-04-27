import { chatWithAI } from './aiService';
import { getFinancialData, getOnboardingState } from './storage';

export async function askTeam(message, userData = {}, onProgress) {
  onProgress?.({ stage: 'routing' });

  const [financial, onboarding] = await Promise.all([
    getFinancialData(),
    getOnboardingState(),
  ]);

  const enrichedUser = { ...financial, ...userData };
  onProgress?.({ stage: 'thinking' });

  const response = await chatWithAI(message, enrichedUser, () => {});

  onProgress?.({ stage: 'synthesizing' });
  return { response: response || 'לא הצלחתי להתחבר. נסה שוב.' };
}
