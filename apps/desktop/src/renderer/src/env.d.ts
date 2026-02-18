import type { Asset, Project } from '@shared/types';
import type { AssetImportResponse, ProjectResponse } from '../../preload/index';

declare global {
  interface Window {
    projectApi: {
      newProject: () => Promise<ProjectResponse>;
      saveProject: (project: Project) => Promise<ProjectResponse>;
      loadProject: () => Promise<ProjectResponse>;
      importVideo: () => Promise<AssetImportResponse>;
      importImage: () => Promise<AssetImportResponse>;
      getProjectRoot: () => Promise<string | null>;
      getAssetThumbnailDataUrl: (relativePath: string) => Promise<string | null>;
    };
  }
}

export {};
