/** True isometric / dimetric camera constants.
 *  Pitch = arctan(1/√2) ≈ 35.264°. Yaw = 45°.
 *  Offset (1,1,1) produces the 2:1 pixel step of classic isometric clients.
 */
export declare const ISO_YAW: number;
export declare const ISO_PITCH: number;
export declare const ISO_DIST = 78;
/** Camera-space ground axes for a locked (1,1,1) isometric view.
 *  W walks "up" the screen (northwest in world XZ).
 *  A/D strafe along the screen-horizontal isometric axis.
 */
export declare const ISO_FWD: {
    x: number;
    z: number;
};
export declare const ISO_RIGHT: {
    x: number;
    z: number;
};
export declare function isoOffset(dist?: number): {
    x: number;
    y: number;
    z: number;
};
/** 2D isometric equalizer for HUD / minimap overlays (Cartesian tile → iso). */
export declare function toIso(tx: number, tz: number): {
    isoX: number;
    isoY: number;
};
export declare function fromIso(isoX: number, isoY: number): {
    tx: number;
    tz: number;
};
