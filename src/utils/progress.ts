import type { BadgeDef } from '../types/user';

/* Badges reward safe, feasible planning only — never low reserves or skipped charging. */
export const BADGES: BadgeDef[] = [
{ id: 'first-mission', name: 'First Mission', description: 'Locked in your first feasible journey plan.' },
{ id: 'safe-margin', name: 'Safe Margin', description: 'Planned an arrival at least 10% above your reserve.' },
{ id: 'long-haul', name: 'Long Haul', description: 'Planned a feasible journey of 200 km or more.' },
{ id: 'zero-wait', name: 'Clean Lap', description: 'Every charging stop had a free compatible plug at ETA.' },
{ id: 'veteran', name: 'Road Veteran', description: 'Locked in five feasible journeys.' },
{ id: 'sandbox', name: 'Network Engineer', description: 'Logged a Sandbox scenario.' }];


export const XP_MISSION = 100;
export const XP_SAFE_MARGIN = 50;
export const XP_SANDBOX = 40;
export const XP_PER_LEVEL = 500;

export function levelFor(xp: number) {
  return { level: Math.floor(xp / XP_PER_LEVEL) + 1, into: xp % XP_PER_LEVEL, pct: xp % XP_PER_LEVEL / XP_PER_LEVEL };
}