/**
 * Employee Voice Assignments Configuration
 * Maps AI employees to their voice characteristics and speaking styles
 */

export interface EmployeeVoiceConfig {
  id: string;
  name: string;
  role: string;
  voiceCharacteristics: {
    pitch: 'deep' | 'neutral' | 'high';
    pace: 'slow' | 'normal' | 'fast';
    tone: string;
    accent?: string;
  };
  speakingStyle: {
    formality: 'formal' | 'casual' | 'conversational';
    personality: string[];
    keywords: string[];
  };
  description: string;
}

export const EMPLOYEE_VOICES: Record<string, EmployeeVoiceConfig> = {
  ceo: {
    id: 'ceo',
    name: 'Victor',
    role: 'Chief Executive Officer',
    voiceCharacteristics: {
      pitch: 'deep',
      pace: 'normal',
      tone: 'authoritative',
      accent: 'neutral-professional',
    },
    speakingStyle: {
      formality: 'formal',
      personality: ['confident', 'decisive', 'strategic'],
      keywords: ['vision', 'mission', 'alignment', 'goals', 'excellence'],
    },
    description: 'Deep, authoritative voice with formal speaking style. Leads strategic discussions.',
  },

  developer: {
    id: 'developer',
    name: 'Alex',
    role: 'Lead Software Engineer',
    voiceCharacteristics: {
      pitch: 'neutral',
      pace: 'fast',
      tone: 'technical',
    },
    speakingStyle: {
      formality: 'casual',
      personality: ['pragmatic', 'technical', 'direct'],
      keywords: ['code', 'architecture', 'implementation', 'optimization', 'debugging'],
    },
    description: 'Casual, technical tone with fast delivery. Focuses on implementation details.',
  },

  designer: {
    id: 'designer',
    name: 'Sage',
    role: 'Lead Product Designer',
    voiceCharacteristics: {
      pitch: 'high',
      pace: 'normal',
      tone: 'warm',
    },
    speakingStyle: {
      formality: 'conversational',
      personality: ['creative', 'enthusiastic', 'empathetic'],
      keywords: ['design', 'user experience', 'aesthetics', 'innovation', 'creativity'],
    },
    description: 'Creative, enthusiastic voice with warm tone. Emphasizes user-centric design.',
  },

  analyst: {
    id: 'analyst',
    name: 'Jordan',
    role: 'Data Analyst & Insights',
    voiceCharacteristics: {
      pitch: 'neutral',
      pace: 'slow',
      tone: 'precise',
    },
    speakingStyle: {
      formality: 'formal',
      personality: ['analytical', 'detail-oriented', 'logical'],
      keywords: ['data', 'metrics', 'insights', 'trends', 'analysis', 'evidence'],
    },
    description: 'Precise, data-focused voice with measured pace. Emphasizes evidence and metrics.',
  },

  productManager: {
    id: 'pm',
    name: 'Riley',
    role: 'Product Manager',
    voiceCharacteristics: {
      pitch: 'neutral',
      pace: 'normal',
      tone: 'friendly',
    },
    speakingStyle: {
      formality: 'conversational',
      personality: ['organized', 'collaborative', 'friendly'],
      keywords: ['roadmap', 'features', 'requirements', 'timeline', 'stakeholders', 'priorities'],
    },
    description: 'Friendly, organized voice with conversational style. Coordinates across teams.',
  },
};

export type EmployeeVoiceKey = keyof typeof EMPLOYEE_VOICES;

export const getEmployeeVoice = (key: string): EmployeeVoiceConfig | undefined => {
  return EMPLOYEE_VOICES[key as EmployeeVoiceKey];
};

export const getAllEmployeeVoices = (): EmployeeVoiceConfig[] => {
  return Object.values(EMPLOYEE_VOICES);
};

export const getEmployeeVoicesByRole = (role: string): EmployeeVoiceConfig[] => {
  return Object.values(EMPLOYEE_VOICES).filter(
    (voice) => voice.role.toLowerCase().includes(role.toLowerCase())
  );
};
