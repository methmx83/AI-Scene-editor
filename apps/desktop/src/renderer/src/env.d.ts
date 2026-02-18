import type { SaveLoadResult } from '../../preload/index';
import type { Project } from '@shared/types';

declare global {
  interface Window {
    projectApi: {
      saveProject: (project: Project) => Promise<SaveLoadResult>;
      loadProject: () => Promise<SaveLoadResult>;
    };
  }
}

export {};
