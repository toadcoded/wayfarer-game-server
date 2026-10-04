export function realmHeartbeat(connected, ageMs, hidden = false, hasSnapshot = true) {
    if (hidden)
        return { state: 'paused', text: 'Realm heartbeat · page resting' };
    if (!connected)
        return { state: 'offline', text: 'Realm heartbeat · offline' };
    if (!hasSnapshot)
        return { state: 'waiting', text: 'Realm heartbeat · awaiting first snapshot' };
    if (!Number.isFinite(ageMs) || ageMs >= 5000)
        return { state: 'lost', text: 'Realm heartbeat · updates lost' };
    if (ageMs >= 500)
        return { state: 'waiting', text: 'Realm heartbeat · waiting for server' };
    return { state: 'live', text: 'Realm heartbeat · live · ' + Math.max(0, Math.round(ageMs)) + ' ms since snapshot' };
}
