import { contextBridge, ipcRenderer } from 'electron';
import type { Asset, Project } from '@shared/types';

export interface ProjectResponse {
  success: boolean;
  message: string;
  project?: Project;
}

export interface AssetImportResponse {
  success: boolean;
  message: string;
  asset?: Asset;
}

contextBridge.exposeInMainWorld('projectApi', {
  newProject: async (): Promise<ProjectResponse> => {
    return ipcRenderer.invoke('project:new') as Promise<ProjectResponse>;
  },
  saveProject: async (project: Project): Promise<ProjectResponse> => {
    return ipcRenderer.invoke('project:save', project) as Promise<ProjectResponse>;
  },
  loadProject: async (): Promise<ProjectResponse> => {
    return ipcRenderer.invoke('project:load') as Promise<ProjectResponse>;
  },
  importVideo: async (): Promise<AssetImportResponse> => {
    return ipcRenderer.invoke('project:import-video') as Promise<AssetImportResponse>;
  },
  importImage: async (): Promise<AssetImportResponse> => {
    return ipcRenderer.invoke('project:import-image') as Promise<AssetImportResponse>;
  },
  getProjectRoot: async (): Promise<string | null> => {
    return ipcRenderer.invoke('project:get-root') as Promise<string | null>;
  },
  getAssetThumbnailDataUrl: async (relativePath: string): Promise<string | null> => {
    return ipcRenderer.invoke('project:asset-thumbnail-data-url', relativePath) as Promise<string | null>;
  },
});
