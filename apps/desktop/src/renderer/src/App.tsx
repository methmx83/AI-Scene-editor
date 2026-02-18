import { useEffect, useMemo, useState } from 'react';
import type { Asset, Project } from '@shared/types';

function emptyProject(): Project {
  return {
    schemaVersion: 1,
    projectId: '',
    name: 'No Project Loaded',
    createdAt: new Date(0).toISOString(),
    assets: [],
    timeline: { clips: [] },
    workflowDefinitions: [],
    workflowRuns: [],
  };
}

const STATUS_OPTIONS: Asset['status'][] = [
  'idea',
  'generating',
  'review',
  'approved',
  'used',
];

export function App(): JSX.Element {
  const [project, setProject] = useState<Project>(emptyProject);
  const [projectRoot, setProjectRoot] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Ready');
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [thumbnails, setThumbnails] = useState<Record<string, string | null>>({});

  const selectedAsset = useMemo(
    () => project.assets.find((asset) => asset.id === selectedAssetId) ?? null,
    [project.assets, selectedAssetId],
  );

  const summary = useMemo(() => {
    return `${project.name} • assets: ${project.assets.length}`;
  }, [project.assets.length, project.name]);

  const refreshProjectRoot = async (): Promise<void> => {
    const root = await window.projectApi.getProjectRoot();
    setProjectRoot(root);
  };

  const loadThumbnail = async (asset: Asset): Promise<void> => {
    const dataUrl = await window.projectApi.getAssetThumbnailDataUrl(asset.thumbnailPath);
    setThumbnails((previous) => ({ ...previous, [asset.id]: dataUrl }));
  };

  useEffect(() => {
    void refreshProjectRoot();
  }, []);

  useEffect(() => {
    project.assets.forEach((asset) => {
      if (!(asset.id in thumbnails)) {
        void loadThumbnail(asset);
      }
    });
  }, [project.assets, thumbnails]);

  const handleNew = async (): Promise<void> => {
    const result = await window.projectApi.newProject();
    if (result.success && result.project) {
      setProject(result.project);
      setSelectedAssetId(null);
      setThumbnails({});
      await refreshProjectRoot();
    }
    setStatus(result.message);
  };

  const handleSave = async (): Promise<void> => {
    const result = await window.projectApi.saveProject(project);
    setStatus(result.message);
  };

  const handleLoad = async (): Promise<void> => {
    const result = await window.projectApi.loadProject();
    if (result.success && result.project) {
      setProject(result.project);
      setSelectedAssetId(result.project.assets[0]?.id ?? null);
      setThumbnails({});
      await refreshProjectRoot();
    }
    setStatus(result.message);
  };

  const handleImport = async (kind: 'video' | 'image'): Promise<void> => {
    const result =
      kind === 'video' ? await window.projectApi.importVideo() : await window.projectApi.importImage();

    if (result.success && result.asset) {
      const nextProject = {
        ...project,
        assets: [...project.assets, result.asset],
      };
      setProject(nextProject);
      setSelectedAssetId(result.asset.id);
      await loadThumbnail(result.asset);
      const saveResult = await window.projectApi.saveProject(nextProject);
      setStatus(`${result.message}. ${saveResult.message}`);
      return;
    }

    setStatus(result.message);
  };

  const updateAsset = (assetId: string, updater: (asset: Asset) => Asset): void => {
    setProject((previous) => ({
      ...previous,
      assets: previous.assets.map((asset) => (asset.id === assetId ? updater(asset) : asset)),
    }));
  };

  return (
    <main className="layout">
      <header className="topbar">
        <div>
          <h1>AI Scene Editor</h1>
          <p className="subtitle">{summary}</p>
          <p className="subtitle">ProjectRoot: {projectRoot ?? 'Not set'}</p>
        </div>
        <div className="actions">
          <button onClick={() => void handleNew()}>New Project</button>
          <button onClick={() => void handleSave()}>Save Project</button>
          <button onClick={() => void handleLoad()}>Load Project</button>
          <button onClick={() => void handleImport('video')} disabled={!projectRoot}>
            Import Video
          </button>
          <button onClick={() => void handleImport('image')} disabled={!projectRoot}>
            Import Image
          </button>
        </div>
      </header>

      <section className="content">
        <aside className="sidebar">
          <h2>Assets</h2>
          {project.assets.length === 0 ? <p>No assets yet.</p> : null}
          <ul className="assetList">
            {project.assets.map((asset) => (
              <li
                key={asset.id}
                className={`assetItem ${selectedAssetId === asset.id ? 'selected' : ''}`}
                onClick={() => setSelectedAssetId(asset.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    setSelectedAssetId(asset.id);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <img
                  className="thumbnail"
                  src={thumbnails[asset.id] ?? ''}
                  alt={`${asset.originalName} thumbnail`}
                />
                <div>
                  <p className="assetName">{asset.originalName}</p>
                  <p className="metaRow">
                    <span className="badge">{asset.type}</span>
                    <span className="statusText">{asset.status}</span>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </aside>

        <article className="detailsPanel">
          <h2>Asset Details</h2>
          {!selectedAsset ? (
            <p>Select an asset to edit details.</p>
          ) : (
            <div className="detailsForm">
              <label>
                Name
                <input type="text" value={selectedAsset.originalName} readOnly />
              </label>

              <label>
                Status
                <select
                  value={selectedAsset.status}
                  onChange={(event) => {
                    updateAsset(selectedAsset.id, (asset) => ({
                      ...asset,
                      status: event.target.value as Asset['status'],
                    }));
                  }}
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Tags (comma separated)
                <input
                  type="text"
                  value={selectedAsset.tags.join(', ')}
                  onChange={(event) => {
                    const tags = event.target.value
                      .split(',')
                      .map((tag) => tag.trim())
                      .filter(Boolean);
                    updateAsset(selectedAsset.id, (asset) => ({ ...asset, tags }));
                  }}
                />
              </label>

              <label>
                Notes
                <textarea
                  value={selectedAsset.notes}
                  onChange={(event) => {
                    updateAsset(selectedAsset.id, (asset) => ({
                      ...asset,
                      notes: event.target.value,
                    }));
                  }}
                />
              </label>
            </div>
          )}
        </article>
      </section>

      <p className="status">Status: {status}</p>
    </main>
  );
}
