import { contextBridge, ipcRenderer } from 'electron';
import type { Project } from '@shared/types';

export interface SaveLoadResult {
  success: boolean;
  message: string;
  project?: Project;
}

contextBridge.exposeInMainWorld('projectApi', {
  saveProject: async (project: Project): Promise<SaveLoadResult> => {
    return ipcRenderer.invoke(
      'project:save',
      project,
    ) as Promise<SaveLoadResult>;
  },
  loadProject: async (): Promise<SaveLoadResult> => {
    return ipcRenderer.invoke('project:load') as Promise<SaveLoadResult>;
  },
});
