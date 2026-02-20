import type { Clip, Timeline } from '@shared/types';

import { ValidationError, type ValidationIssue } from './errors';

export type TrackKind = 'video' | 'overlay' | 'audio' | 'text';

export interface Track {
  id: string;
  kind: TrackKind;
  name: string;
}

export interface CreateClipParams {
  id?: string;
  assetId: string;
  start: number;
  duration: number;
}

const TRACK_DEFAULT_NAMES: Record<TrackKind, string> = {
  video: 'Video Track',
  overlay: 'Overlay Track',
  audio: 'Audio Track',
  text: 'Text Track',
};

export function createEmptyTimeline(): Timeline {
  return { clips: [] };
}

export function createTrack(kind: TrackKind, name?: string): Track {
  const normalizedName = (name ?? '').trim();

  return {
    id: createId('track'),
    kind,
    name: normalizedName.length > 0 ? normalizedName : TRACK_DEFAULT_NAMES[kind],
  };
}

export function createClip(params: CreateClipParams): Clip {
  const candidate: Clip = {
    id: params.id ?? createId('clip'),
    assetId: params.assetId,
    start: params.start,
    duration: params.duration,
  };

  const issues = validateClip(candidate);
  if (issues.length > 0) {
    throw new ValidationError('Invalid clip payload.', issues);
  }

  return candidate;
}

export function isTrackKind(value: unknown): value is TrackKind {
  return value === 'video' || value === 'overlay' || value === 'audio' || value === 'text';
}

export function isTrack(value: unknown): value is Track {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isNonEmptyString(value.id) &&
    isTrackKind(value.kind) &&
    isNonEmptyString(value.name)
  );
}

export function isClip(value: unknown): value is Clip {
  return validateClip(value).length === 0;
}

export function isTimeline(value: unknown): value is Timeline {
  if (!isRecord(value) || !Array.isArray(value.clips)) {
    return false;
  }

  return value.clips.every((clip) => isClip(clip));
}

export function validateClip(value: unknown): ValidationIssue[] {
  if (!isRecord(value)) {
    return [{ field: 'clip', message: 'Clip must be an object.' }];
  }

  const issues: ValidationIssue[] = [];

  if (!isNonEmptyString(value.id)) {
    issues.push({ field: 'id', message: 'id must be a non-empty string.' });
  }

  if (!isNonEmptyString(value.assetId)) {
    issues.push({ field: 'assetId', message: 'assetId must be a non-empty string.' });
  }

  if (!isFiniteNumber(value.start) || value.start < 0) {
    issues.push({ field: 'start', message: 'start must be a finite number >= 0.' });
  }

  if (!isFiniteNumber(value.duration) || value.duration <= 0) {
    issues.push({ field: 'duration', message: 'duration must be a finite number > 0.' });
  }

  return issues;
}

function createId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}