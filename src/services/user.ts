// ─────────────────────────────────────────────────────────────
// The ONE place that decides whose data we read and write.
//
// Until auth (Phase 10) everyone shares this test ID. When auth
// lands, getUserId() returns the signed-in user's uid instead —
// no other service file needs to change.
// ─────────────────────────────────────────────────────────────

const TEMP_USER_ID = 'temp-user-123';

export const getUserId = (): string => TEMP_USER_ID;

export const userPath = (): string => `users/${getUserId()}`;
