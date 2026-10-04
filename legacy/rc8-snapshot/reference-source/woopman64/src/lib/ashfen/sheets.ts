export type Sheets = {
  player: HTMLImageElement | null;
  mireling: HTMLImageElement | null;
  npcs: HTMLImageElement | null;
};

export function loadSheets(): Promise<Sheets> {
  const load = (src: string) =>
    new Promise<HTMLImageElement | null>((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  return Promise.all([
    load("/sprites/player.png"),
    load("/sprites/mireling.png"),
    load("/sprites/npcs.png"),
  ]).then(([player, mireling, npcs]) => ({ player, mireling, npcs }));
}

export function blitSheet(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cols: number,
  rows: number,
  col: number,
  row: number,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
) {
  const cw = img.width / cols;
  const ch = img.height / rows;
  ctx.drawImage(img, col * cw, row * ch, cw, ch, dx, dy, dw, dh);
}
