import { useMemo, useState } from 'react';
import type { Project } from '@shared/types';

function createHelloProject(): Project {
  return {
    schemaVersion: 1,
    id: crypto.randomUUID(),
    name: 'Hello Project',
    assets: [],
    timeline: { clips: [] },
    workflowDefinitions: [
      {
        id: 'wf-1',
        name: 'Demo Workflow',
        version: '1.0.0',
        config: { prompt: 'hello' },
      },
    ],
    workflowRuns: [],
  };
}

export function App(): JSX.Element {
  const [project, setProject] = useState<Project>(createHelloProject);
  const [status, setStatus] = useState<string>('Ready');

  const summary = useMemo(
    () =>
      `${project.name} • assets: ${project.assets.length} • clips: ${project.timeline.clips.length}`,
    [project],
  );

  const handleNew = (): void => {
    setProject(createHelloProject());
    setStatus('Created new dummy project');
  };

  const handleSave = async (): Promise<void> => {
    const result = await window.projectApi.saveProject(project);
    setStatus(result.message);
  };

  const handleLoad = async (): Promise<void> => {
    const result = await window.projectApi.loadProject();
    if (result.success && result.project) {
      setProject(result.project);
    }
    setStatus(result.message);
  };

  return (
    <main className="container">
      <h1>AI Scene Editor</h1>
      <p className="subtitle">{summary}</p>

      <div className="actions">
        <button onClick={handleNew}>New Project</button>
        <button onClick={handleSave}>Save Project</button>
        <button onClick={handleLoad}>Load Project</button>
      </div>

      <section>
        <h2>Project JSON</h2>
        <pre>{JSON.stringify(project, null, 2)}</pre>
      </section>

      <p className="status">Status: {status}</p>
    </main>
  );
}
