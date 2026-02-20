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

export interface ProjectApiPort {
  newProject: () => Promise<ProjectResponse>;
  loadProject: () => Promise<ProjectResponse>;
  saveProject: (project: Project) => Promise<ProjectResponse>;
  importVideo: () => Promise<AssetImportResponse>;
  importImage: () => Promise<AssetImportResponse>;
}

export function getProjectApi(): ProjectApiPort {
  return window.projectApi;
}