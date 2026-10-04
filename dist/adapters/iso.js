/** True isometric / dimetric camera constants.
 *  Pitch = arctan(1/√2) ≈ 35.264°. Yaw = 45°.
 *  Offset (1,1,1) produces the 2:1 pixel step of classic isometric clients.
 */
export const ISO_YAW = Math.PI / 4;
export const ISO_PITCH = Math.atan(1 / Math.SQRT2);
export const ISO_DIST = 78;
/** Camera-space ground axes for a locked (1,1,1) isometric view.
 *  W walks "up" the screen (northwest in world XZ).
 *  A/D strafe along the screen-horizontal isometric axis.
 */
export const ISO_FWD = { x: -Math.SQRT1_2, z: -Math.SQRT1_2 };
export const ISO_RIGHT = { x: Math.SQRT1_2, z: -Math.SQRT1_2 };
export function isoOffset(dist = ISO_DIST) {
    const h = dist * Math.cos(ISO_PITCH);
    return {
        x: h * Math.sin(ISO_YAW),
        y: dist * Math.sin(ISO_PITCH),
        z: h * Math.cos(ISO_YAW),
    };
}
/** 2D isometric equalizer for HUD / minimap overlays (Cartesian tile → iso). */
export function toIso(tx, tz) {
    return { isoX: tx - tz, isoY: (tx + tz) / 2 };
}
export function fromIso(isoX, isoY) {
    return { tx: isoY + isoX / 2, tz: isoY - isoX / 2 };
}
