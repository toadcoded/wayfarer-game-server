import { eligible } from './progression.js';
const melee = Object.freeze(['attack', 'strength', 'defence']), magic = Object.freeze(['magic']);
export const WEAPON_BUILDS = Object.freeze({
    unarmed: Object.freeze({ tier: 1, style: 'melee', requirements: Object.freeze({}), accuracy: 1, modes: melee }),
    reed_blade: Object.freeze({ tier: 1, style: 'melee', requirements: Object.freeze({ attack: 1 }), accuracy: 6, modes: melee }),
    granite_maul: Object.freeze({ tier: 1, style: 'melee', requirements: Object.freeze({ strength: 1 }), accuracy: 2, modes: melee }),
    ash_staff: Object.freeze({ tier: 1, style: 'magic', requirements: Object.freeze({ magic: 1 }), accuracy: 5, modes: magic })
});
export const canEquip = (p, item) => eligible(p, WEAPON_BUILDS[item].requirements);
export const canTrain = (item, mode) => WEAPON_BUILDS[item ?? 'unarmed'].modes.includes(mode);
