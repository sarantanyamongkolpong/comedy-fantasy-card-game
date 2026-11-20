/**
 * Reads map positions from the asset manifest.
 * Building hotspots live on slot "building" entries (fixed-canvas pixels).
 * Changing a coordinate is a manifest edit, not a code edit.
 */

export function designSize(manifest) {
  const canvas = manifest?.designCanvas ?? {};
  return {
    width: canvas.width,
    height: canvas.height,
    id: canvas.id ?? `${canvas.width}x${canvas.height}`,
  };
}

export function buildingHotspots(manifest) {
  return (manifest?.assets ?? [])
    .filter((asset) => asset.slot === 'building' && asset.hotspot)
    .map((asset) => {
      const hotspot = asset.hotspot;
      const targetWidth = hotspot.targetWidth ?? hotspot.w;
      const targetHeight = hotspot.targetHeight ?? hotspot.h ?? targetWidth;
      const anchorX = hotspot.anchorX ?? hotspot.x;
      const anchorY = hotspot.anchorY ?? hotspot.y;
      const bottomCenter = hotspot.anchorMode === 'bottom-center';
      return {
        assetId: asset.asset_id,
        placeholder: asset.placeholder === true,
        path: asset.path,
        ...hotspot,
        anchorX,
        anchorY,
        targetWidth,
        targetHeight,
        label: hotspot.label,
        x: bottomCenter ? anchorX - targetWidth / 2 : hotspot.x,
        y: bottomCenter ? anchorY - targetHeight : hotspot.y,
        w: targetWidth,
        h: targetHeight,
      };
    });
}

export function uiAnchors(manifest) {
  return (manifest?.uiAnchors ?? []).map((anchor) => ({ ...anchor }));
}

export function anchorById(manifest, id) {
  return uiAnchors(manifest).find((anchor) => anchor.id === id) ?? null;
}

/**
 * @param {{ x: number, y: number, w: number, h: number }} rect
 * @param {{ width: number, height: number }} canvas
 */
export function rectInsideCanvas(rect, canvas) {
  return rect.x >= 0
    && rect.y >= 0
    && rect.w > 0
    && rect.h > 0
    && rect.x + rect.w <= canvas.width
    && rect.y + rect.h <= canvas.height;
}
