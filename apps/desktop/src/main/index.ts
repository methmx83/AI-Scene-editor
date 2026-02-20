import path from 'node:path';
import fs from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import Ajv2020 from 'ajv/dist/2020.js';
import type { Asset, Project } from '@shared/types';
import projectSchema from '../../../../packages/shared/project.schema.json';

const ajv = new Ajv2020({ allErrors: true, strict: false });
ajv.addFormat('date-time', true);
const validateProject = ajv.compile<Project>(projectSchema);

const PROJECT_FILE_NAME = 'project.json';

let currentProjectRoot: string | null = null;

interface ProjectResponse {
  success: boolean;
  message: string;
  project?: Project;
}

interface AssetImportResponse {
  success: boolean;
  message: string;
  asset?: Asset;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function migrateProjectToV2(project: unknown): unknown {
  if (!isRecord(project)) {
    return project;
  }

  const schemaVersion = project.schemaVersion;
  if (schemaVersion === 2) {
    return project;
  }

  if (schemaVersion !== 1) {
    return project;
  }

  const timeline = isRecord(project.timeline) ? project.timeline : null;
  const oldClips = Array.isArray(timeline?.clips) ? timeline.clips : [];
  const migratedClips = oldClips.map((clip) => {
    if (!isRecord(clip)) {
      return clip;
    }
    return {
      ...clip,
      offset: 0,
    };
  });

  return {
    ...project,
    schemaVersion: 2,
    timeline: {
      tracks: [
        {
          id: 'track_video_1',
          kind: 'video',
          name: 'Video Track',
          clips: migratedClips,
        },
      ],
    },
  };
}

function runMigrationSanityCheck(): void {
  const v1Project: unknown = {
    schemaVersion: 1,
    timeline: {
      clips: [
        {
          id: 'clip-1',
          assetId: 'asset-1',
          start: 0,
          duration: 4,
        },
      ],
    },
  };

  const migrated = migrateProjectToV2(v1Project);
  if (!isRecord(migrated) || migrated.schemaVersion !== 2) {
    throw new Error('Migration sanity check failed: schemaVersion was not migrated to 2.');
  }

  const timeline = migrated.timeline;
  if (!isRecord(timeline) || !Array.isArray(timeline.tracks) || timeline.tracks.length !== 1) {
    throw new Error('Migration sanity check failed: timeline.tracks was not created.');
  }

  const firstTrack = timeline.tracks[0];
  if (!isRecord(firstTrack) || firstTrack.id !== 'track_video_1' || firstTrack.kind !== 'video') {
    throw new Error('Migration sanity check failed: default track is invalid.');
  }

  if (!Array.isArray(firstTrack.clips)) {
    throw new Error('Migration sanity check failed: default track clips are missing.');
  }

  const firstClip = firstTrack.clips[0];
  if (!isRecord(firstClip) || firstClip.offset !== 0) {
    throw new Error('Migration sanity check failed: clip offset was not added.');
  }
}

function resolveProjectPath(projectRoot: string, relativePath: string): string {
  return path.join(projectRoot, relativePath);
}

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.cjs'),
    },
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    void win.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    void win.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

function createEmptyProject(projectName: string): Project {
  return {
    schemaVersion: 2,
    projectId: randomUUID(),
    name: projectName,
    createdAt: new Date().toISOString(),
    assets: [],
    timeline: { tracks: [] },
    workflowDefinitions: [],
    workflowRuns: [],
  };
}

async function ensureProjectStructure(projectRoot: string): Promise<void> {
  const requiredFolders = [
    'assets',
    'assets/videos',
    'assets/images',
    'assets/thumbnails',
    'generated',
    'cache',
  ];

  await Promise.all(
    requiredFolders.map(async (folder) => {
      await fs.mkdir(resolveProjectPath(projectRoot, folder), { recursive: true });
    }),
  );
}

async function saveProjectToCurrentRoot(project: Project): Promise<ProjectResponse> {
  if (!currentProjectRoot) {
    return { success: false, message: 'No ProjectRoot set. Create or load a project first.' };
  }

  if (!validateProject(project)) {
    const message = `Project validation failed: ${ajv.errorsText(validateProject.errors)}`;
    await dialog.showMessageBox({
      type: 'error',
      title: 'Save failed',
      message,
    });
    return { success: false, message };
  }

  const projectPath = resolveProjectPath(currentProjectRoot, PROJECT_FILE_NAME);
  await fs.writeFile(projectPath, JSON.stringify(project, null, 2), 'utf-8');
  return { success: true, message: `Saved to ${projectPath}` };
}

async function createVideoThumbnail(inputPath: string, outputPath: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-y',
      '-ss',
      '0.5',
      '-i',
      inputPath,
      '-frames:v',
      '1',
      '-q:v',
      '2',
      outputPath,
    ]);

    let stderr = '';

    ffmpeg.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    ffmpeg.on('error', (error) => {
      reject(error);
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`ffmpeg exited with code ${code}: ${stderr}`));
    });
  });
}

async function importAssetFile(type: 'video' | 'image'): Promise<AssetImportResponse> {
  if (!currentProjectRoot) {
    return { success: false, message: 'No ProjectRoot set. Create or load a project first.' };
  }

  const result = await dialog.showOpenDialog({
    title: type === 'video' ? 'Import Video' : 'Import Image',
    properties: ['openFile'],
    filters:
      type === 'video'
        ? [{ name: 'Videos', extensions: ['mp4', 'mov', 'mkv', 'webm', 'm4v', 'avi'] }]
        : [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'] }],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { success: false, message: 'Import canceled' };
  }

  const sourcePath = result.filePaths[0];
  const originalName = path.basename(sourcePath);
  const extension = path.extname(originalName);
  const baseName = path.basename(originalName, extension);
  const safeName = baseName.replace(/[^a-zA-Z0-9-_]/g, '_');
  const assetId = randomUUID();

  const relativeFilePath = path.posix.join(
    type === 'video' ? 'assets/videos' : 'assets/images',
    `${assetId}_${safeName}${extension}`,
  );
  const relativeThumbnailPath = path.posix.join('assets/thumbnails', `${assetId}.jpg`);

  const absoluteFilePath = resolveProjectPath(currentProjectRoot, relativeFilePath);
  const absoluteThumbnailPath = resolveProjectPath(currentProjectRoot, relativeThumbnailPath);

  await fs.copyFile(sourcePath, absoluteFilePath);

  if (type === 'video') {
    try {
      await createVideoThumbnail(absoluteFilePath, absoluteThumbnailPath);
    } catch (error) {
      const nodeError = error as NodeJS.ErrnoException;
      if (nodeError.code === 'ENOENT') {
        await dialog.showMessageBox({
          type: 'error',
          title: 'FFmpeg missing',
          message: 'FFmpeg not found in PATH',
        });
      } else {
        await dialog.showMessageBox({
          type: 'error',
          title: 'Thumbnail generation failed',
          message: `Failed to generate video thumbnail: ${nodeError.message}`,
        });
      }
    }
  } else {
    await fs.copyFile(sourcePath, absoluteThumbnailPath);
  }

  const asset: Asset = {
    id: assetId,
    type,
    originalName,
    filePath: relativeFilePath,
    thumbnailPath: relativeThumbnailPath,
    createdAt: new Date().toISOString(),
    tags: [],
    notes: '',
    status: 'idea',
  };

  return {
    success: true,
    message: `${type === 'video' ? 'Video' : 'Image'} imported`,
    asset,
  };
}

ipcMain.handle('project:new', async (): Promise<ProjectResponse> => {
  const result = await dialog.showOpenDialog({
    title: 'Choose Project Folder',
    properties: ['openDirectory', 'createDirectory'],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { success: false, message: 'New project canceled' };
  }

  const projectRoot = result.filePaths[0];
  await ensureProjectStructure(projectRoot);

  const projectName = path.basename(projectRoot);
  const project = createEmptyProject(projectName);

  if (!validateProject(project)) {
    return {
      success: false,
      message: `Project validation failed: ${ajv.errorsText(validateProject.errors)}`,
    };
  }

  const projectPath = resolveProjectPath(projectRoot, PROJECT_FILE_NAME);
  await fs.writeFile(projectPath, JSON.stringify(project, null, 2), 'utf-8');

  currentProjectRoot = projectRoot;

  return {
    success: true,
    message: `Created project in ${projectRoot}`,
    project,
  };
});

ipcMain.handle('project:save', async (_event, project: Project): Promise<ProjectResponse> => {
  return saveProjectToCurrentRoot(project);
});

ipcMain.handle('project:load', async (): Promise<ProjectResponse> => {
  const result = await dialog.showOpenDialog({
    title: 'Load project',
    properties: ['openFile'],
    filters: [{ name: 'Project JSON', extensions: ['json'] }],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { success: false, message: 'Load canceled' };
  }

  const projectPath = result.filePaths[0];
  if (path.basename(projectPath) !== PROJECT_FILE_NAME) {
    return { success: false, message: 'Please select project.json.' };
  }

  const content = await fs.readFile(projectPath, 'utf-8');
  const parsed = JSON.parse(content) as unknown;
  const migrated = migrateProjectToV2(parsed);

  if (!validateProject(migrated)) {
    return {
      success: false,
      message: `Loaded file is invalid: ${ajv.errorsText(validateProject.errors)}`,
    };
  }

  const project: Project = migrated;

  currentProjectRoot = path.dirname(projectPath);
  await ensureProjectStructure(currentProjectRoot);

  return {
    success: true,
    message: `Loaded from ${projectPath}`,
    project,
  };
});

ipcMain.handle('project:get-root', (): string | null => {
  return currentProjectRoot;
});

ipcMain.handle('project:import-video', async (): Promise<AssetImportResponse> => {
  return importAssetFile('video');
});

ipcMain.handle('project:import-image', async (): Promise<AssetImportResponse> => {
  return importAssetFile('image');
});

ipcMain.handle('project:asset-thumbnail-data-url', async (_event, relativePath: string) => {
  if (!currentProjectRoot || !relativePath) {
    return null;
  }

  const absolutePath = resolveProjectPath(currentProjectRoot, relativePath);
  try {
    await fs.access(absolutePath, fsConstants.R_OK);
    const buffer = await fs.readFile(absolutePath);
    const extension = path.extname(absolutePath).toLowerCase();
    const mimeType = extension === '.png' ? 'image/png' : 'image/jpeg';
    return `data:${mimeType};base64,${buffer.toString('base64')}`;
  } catch {
    return null;
  }
});

app.whenReady().then(() => {
  if (process.env.AI_SCENE_EDITOR_RUN_MIGRATION_SANITY === '1') {
    runMigrationSanityCheck();
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
