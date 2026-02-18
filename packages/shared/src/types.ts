export interface Asset {
  id: string;
  name: string;
  type: 'image' | 'video' | 'audio' | 'unknown';
  path: string;
}

export interface Clip {
  id: string;
  assetId: string;
  start: number;
  duration: number;
}

export interface Timeline {
  clips: Clip[];
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  version: string;
  config: Record<string, unknown>;
}

export interface WorkflowRun {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  createdAt: string;
}

export interface Project {
  schemaVersion: number;
  id: string;
  name: string;
  assets: Asset[];
  timeline: Timeline;
  workflowDefinitions: WorkflowDefinition[];
  workflowRuns: WorkflowRun[];
}
