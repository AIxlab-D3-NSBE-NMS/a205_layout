import Konva from 'konva';
import type { CatalogItemV1, LayoutV1, PlacedItem } from '../types';
import type { RoomConfig } from '../roomConfig';
import { createWorldTransform } from '../render/worldTransform';
import { renderDoorsAndRamps, renderPillar, renderRoom, renderTechnicalCabinets, renderWindows } from '../render/renderFixed';
import { createItemNode, syncItemFromNode } from '../render/renderItem';
import { defaultSpawnPosition, validatePlacedItem } from '../constraints';
import { newId } from '../utils/id';
import type { Rect } from '../geometry';

export type EditorApi = {
  destroy: () => void;
  setLayout: (layout: LayoutV1) => void;
  getLayout: () => LayoutV1;
  addFromCatalog: (ci: CatalogItemV1) => void;
  deleteSelected: () => void;
  duplicateSelected: () => void;
  bringForward: () => void;
  sendBackward: () => void;
  fitToRoom: () => void;
  downloadPng: () => void;
};

export function createEditor(
  host: HTMLDivElement,
  cfg: RoomConfig,
  initialLayout: LayoutV1,
  onLayoutChange: (l: LayoutV1) => void,
): EditorApi {
  const stage = new Konva.Stage({
    container: host,
    width: host.clientWidth,
    height: host.clientHeight,
  });

  const layer = new Konva.Layer();
  stage.add(layer);

  const world = createWorldTransform(layer, cfg.heightCm);

  // Fixed
  renderRoom(world.group, { widthCm: cfg.widthCm, heightCm: cfg.heightCm });
  renderDoorsAndRamps(world.group, cfg);
  renderPillar(world.group, cfg.pillar);
  renderWindows(world.group, cfg);
  renderTechnicalCabinets(world.group, cfg);

  // Items
  const itemsGroup = new Konva.Group({ listening: true });
  world.group.add(itemsGroup);

  const transformer = new Konva.Transformer({
    rotateEnabled: true,
    anchorSize: 8,
    borderStroke: '#2563eb',
    borderStrokeWidth: 1,
  });
  world.group.add(transformer);

  let layout: LayoutV1 = initialLayout;
  let selectedId: string | null = null;

  const pillarRect: Rect = {
    x: cfg.pillar.xCm,
    y: cfg.pillar.yCm,
    width: cfg.pillar.widthCm,
    height: cfg.pillar.heightCm,
  };

  function getPlacedItem(id: string): PlacedItem | undefined {
    return layout.items.find((it) => it.id === id);
  }

  function setSelected(id: string | null) {
    selectedId = id;
    if (!id) {
      transformer.nodes([]);
      layer.draw();
      return;
    }
    const node = itemsGroup.findOne(`#${CSS.escape(id)}`) as Konva.Group | null;
    if (node) transformer.nodes([node]);
    layer.draw();
  }

  function snapshotLastValid(node: Konva.Group) {
    node.setAttr('lastValid', {
      x: node.x(),
      y: node.y(),
      rotation: node.rotation(),
      scaleX: node.scaleX(),
      scaleY: node.scaleY(),
    });
  }

  function revertToLastValid(node: Konva.Group) {
    const s = node.getAttr('lastValid') as any;
    if (!s) return;
    node.position({ x: s.x, y: s.y });
    node.rotation(s.rotation);
    node.scale({ x: s.scaleX, y: s.scaleY });
  }

  function validateNode(node: Konva.Group): boolean {
    const id = node.id();
    const item = getPlacedItem(id);
    if (!item) return true;
    const candidate = syncItemFromNode(item, node);
    const res = validatePlacedItem(candidate, layout.room, pillarRect);
    return res.ok;
  }

  function commitNode(node: Konva.Group) {
    const id = node.id();
    const item = getPlacedItem(id);
    if (!item) return;
    const updated = syncItemFromNode(item, node);
    layout = {
      ...layout,
      items: layout.items.map((it) => (it.id === id ? updated : it)),
      updatedAt: new Date().toISOString(),
    };
    onLayoutChange(layout);
  }

  function rebuildItems() {
    itemsGroup.destroyChildren();
    const sorted = [...layout.items].sort((a, b) => a.zIndex - b.zIndex);
    for (const it of sorted) {
      const node = createItemNode(it);
      itemsGroup.add(node.group);
      attachItemHandlers(node.group);
    }
    layer.draw();
    setSelected(selectedId && getPlacedItem(selectedId) ? selectedId : null);
  }

  function attachItemHandlers(group: Konva.Group) {
    group.on('mousedown touchstart', (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      e.cancelBubble = true;
      setSelected(group.id());
    });

    group.on('dragstart', () => {
      // no-op: stage is never draggable
    });

    group.on('dragmove', () => {
      if (validateNode(group)) {
        snapshotLastValid(group);
      }
    });

    group.on('dragend', () => {
      if (!validateNode(group)) {
        revertToLastValid(group);
      }
      commitNode(group);
      layer.draw();
    });

    group.on('transform', () => {
      if (validateNode(group)) {
        snapshotLastValid(group);
      }
    });

    group.on('transformend', () => {
      // Snap rotation to stable 45° increments.
      const snapped = Math.round(group.rotation() / 45) * 45;
      group.rotation(snapped);

      if (!validateNode(group)) {
        revertToLastValid(group);
      }
      commitNode(group);
      layer.draw();
    });
  }

  // Selection on background (ignore transformer and its anchors)
  // Use click/tap so drag start on items is never affected.
  stage.on('click tap', (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    const target = e.target as Konva.Node;
    if (!target) return;
    let n: Konva.Node | null = target;
    let isTransformer = false;
    while (n) {
      if (n === transformer) {
        isTransformer = true;
        break;
      }
      n = n.getParent();
    }
    if (isTransformer) return;
    if (target === stage) setSelected(null);
  });

  // Stage is never draggable (no empty-space pan). Zoom via wheel, pan via buttons only.
  stage.draggable(false);

  // Zoom
  stage.on('wheel', (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();

    const oldScale = world.getScalePxPerCm();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const factor = 1.05;
    const newScale = direction > 0 ? oldScale * factor : oldScale / factor;
    world.setScalePxPerCm(Math.max(0.1, Math.min(10, newScale)));

    const newPos = {
      x: pointer.x - mousePointTo.x * world.getScalePxPerCm(),
      y: pointer.y - mousePointTo.y * world.getScalePxPerCm(),
    };
    stage.position(newPos);
    stage.batchDraw();
  });

  function fitToRoom() {
    const margin = 20;
    const w = stage.width();
    const h = stage.height();
    const scale = Math.min((w - margin * 2) / cfg.widthCm, (h - margin * 2) / cfg.heightCm);
    world.setScalePxPerCm(scale);
    stage.position({ x: margin, y: margin });
    stage.batchDraw();
  }

  function downloadPng() {
    const prevStagePos = stage.position();
    const prevScale = world.getScalePxPerCm();

    fitToRoom();

    const dataUrl = stage.toDataURL({ pixelRatio: 2 });
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `layout_${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    world.setScalePxPerCm(prevScale);
    stage.position(prevStagePos);
    stage.batchDraw();
  }

  function addFromCatalog(ci: CatalogItemV1) {
    const item: PlacedItem = {
      id: newId('item'),
      catalogName: ci.name,
      color: ci.color,
      corners: ci.corners,
      positionCm: defaultSpawnPosition(layout.room, ci.corners),
      rotationDeg: 0,
      scale: { x: 1, y: 1 },
      zIndex: layout.items.length ? Math.max(...layout.items.map((x) => x.zIndex)) + 1 : 0,
    };

    // Validate spawn; if it hits pillar, try a few offsets.
    const offsets = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: -100, y: 0 },
      { x: 0, y: 100 },
      { x: 0, y: -100 },
    ];
    for (const o of offsets) {
      const candidate = { ...item, positionCm: { x: item.positionCm.x + o.x, y: item.positionCm.y + o.y } };
      if (validatePlacedItem(candidate, layout.room, pillarRect).ok) {
        item.positionCm = candidate.positionCm;
        break;
      }
    }

    layout = {
      ...layout,
      items: [...layout.items, item],
      updatedAt: new Date().toISOString(),
    };
    onLayoutChange(layout);
    rebuildItems();
    setSelected(item.id);
  }

  function deleteSelected() {
    if (!selectedId) return;
    layout = {
      ...layout,
      items: layout.items.filter((it) => it.id !== selectedId),
      updatedAt: new Date().toISOString(),
    };
    onLayoutChange(layout);
    selectedId = null;
    rebuildItems();
  }

  function duplicateSelected() {
    if (!selectedId) return;
    const it = getPlacedItem(selectedId);
    if (!it) return;
    const dup: PlacedItem = {
      ...structuredClone(it),
      id: newId('item'),
      positionCm: { x: it.positionCm.x + 20, y: it.positionCm.y + 20 },
      zIndex: Math.max(...layout.items.map((x) => x.zIndex)) + 1,
    };

    if (!validatePlacedItem(dup, layout.room, pillarRect).ok) return;

    layout = {
      ...layout,
      items: [...layout.items, dup],
      updatedAt: new Date().toISOString(),
    };
    onLayoutChange(layout);
    rebuildItems();
    setSelected(dup.id);
  }

  function bringForward() {
    if (!selectedId) return;
    const it = getPlacedItem(selectedId);
    if (!it) return;
    const maxZ = Math.max(...layout.items.map((x) => x.zIndex));
    if (it.zIndex >= maxZ) return;
    layout = {
      ...layout,
      items: layout.items.map((x) => (x.id === it.id ? { ...x, zIndex: maxZ + 1 } : x)),
      updatedAt: new Date().toISOString(),
    };
    onLayoutChange(layout);
    rebuildItems();
  }

  function sendBackward() {
    if (!selectedId) return;
    const it = getPlacedItem(selectedId);
    if (!it) return;
    const minZ = Math.min(...layout.items.map((x) => x.zIndex));
    if (it.zIndex <= minZ) return;
    layout = {
      ...layout,
      items: layout.items.map((x) => (x.id === it.id ? { ...x, zIndex: minZ - 1 } : x)),
      updatedAt: new Date().toISOString(),
    };
    onLayoutChange(layout);
    rebuildItems();
  }

  function onResize() {
    stage.width(host.clientWidth);
    stage.height(host.clientHeight);
    stage.batchDraw();
  }

  const ro = new ResizeObserver(onResize);
  ro.observe(host);

  // Initial
  rebuildItems();
  fitToRoom();

  return {
    destroy() {
      ro.disconnect();
      stage.destroy();
    },
    setLayout(l: LayoutV1) {
      layout = l;
      onLayoutChange(layout);
      selectedId = null;
      rebuildItems();
      fitToRoom();
    },
    getLayout() {
      return layout;
    },
    addFromCatalog,
    deleteSelected,
    duplicateSelected,
    bringForward,
    sendBackward,
    fitToRoom,
    downloadPng,
  };
}
