/** Keys that must never appear in user-facing tables. */
export const HIDDEN_TABLE_KEYS = new Set([
  'PLAYER_ID',
  'playerId',
  'player_id',
  'TEAM_ID',
  'teamId',
  'team_id',
  'GAME_ID',
  'gameId',
  'game_id',
  'id',
  'PERSON_ID',
  'personId',
])

export function filterRecordColumns(records: Record<string, unknown>[], extraHidden?: Set<string>): string[] {
  if (!records.length) return []
  const hidden = extraHidden ? new Set([...HIDDEN_TABLE_KEYS, ...extraHidden]) : HIDDEN_TABLE_KEYS
  return Object.keys(records[0]).filter((k) => !k.startsWith('_') && !hidden.has(k))
}
