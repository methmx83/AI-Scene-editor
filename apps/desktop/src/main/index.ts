import path from 'node:path';
import fs from 'node:fs/promises';
import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import Ajv from 'ajv';
import type { Project } from '@shared/types';
import projectSchema from '../../../../packages/shared/project.schema.json';

const ajv = new Ajv({ allErrors: true });
const validateProject = ajv.compile<Project>(projectSchema);

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.mjs'),
    },
  });

  if (process.env['ELECTRON_RENDERER_URL']) {
    void win.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    void win.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

ipcMain.handle('project:save', async (_event, project: Project) => {
  if (!validateProject(project)) {
    return {
      success: false,
      message: `Project validation failed: ${ajv.errorsText(validateProject.errors)}`,
    };
  }

  const result = await dialog.showSaveDialog({
    title: 'Save project',
    defaultPath: `${project.name || 'project'}.json`,
    filters: [{ name: 'Project', extensions: ['json'] }],
  });

  if (result.canceled || !result.filePath) {
    return { success: false, message: 'Save canceled' };
  }

  await fs.writeFile(
    result.filePath,
    JSON.stringify(project, null, 2),
    'utf-8',
  );

  return { success: true, message: `Saved to ${result.filePath}` };
});

ipcMain.handle('project:load', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Load project',
    properties: ['openFile'],
    filters: [{ name: 'Project', extensions: ['json'] }],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { success: false, message: 'Load canceled' };
  }

  const filePath = result.filePaths[0];
  const content = await fs.readFile(filePath, 'utf-8');
  const data = JSON.parse(content) as Project;

  if (!validateProject(data)) {
    return {
      success: false,
      message: `Loaded file is invalid: ${ajv.errorsText(validateProject.errors)}`,
    };
  }

  return {
    success: true,
    message: `Loaded from ${filePath}`,
    project: data,
  };
});

app.whenReady().then(() => {
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
