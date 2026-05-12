import './style.css';

import { roomConfig } from './roomConfig';
import { newLayout, downloadJson, loadFromLocalStorage, readJsonFile, saveToLocalStorage, validateLayoutV1 } from './layoutIO';
import { loadCatalogIndex, loadCatalogItem } from './catalog';
import { loadExample, loadExamplesIndex } from './examples';
import type { CatalogItemV1, LayoutV1 } from './types';
import { createEditor, type EditorApi } from './editor/editor';
import { el, button } from './ui/dom';

function buildApp() {
  const root = document.querySelector<HTMLDivElement>('#app');
  if (!root) throw new Error('Missing #app');

  const sidebar = el('div', { className: 'sidebar' });
  const main = el('div', { className: 'main' });
  const canvasTitle = el('div', { className: 'canvasTitle', text: 'AI X Lab Configuration' });
  const canvasHost = el('div', { className: 'canvasHost' }) as HTMLDivElement;
  main.append(canvasTitle, canvasHost);
  root.append(sidebar, main);

  const title = el('h1', { text: 'Room Layout Editor' });

  const status = el('div', { className: 'small', text: '' });
  const devWarning = import.meta.env.DEV
    ? el('div', {
        className: 'devWarning',
        text: 'Dev mode: edit files in src/ and public/. Changes in dist/ are build output and will not hot-reload.',
      })
    : null;

  // Data/state
  const fixed = {
    pillar: { ...roomConfig.pillar },
    doors: roomConfig.doors.map((d) => ({ ...d, hingeCm: { ...d.hingeCm } })),
    ramps: roomConfig.ramps.map((r) => ({ ...r })),
    windows: roomConfig.windows.map((w) => ({ ...w })),
    technicalCabinets: roomConfig.technicalCabinets.map((tc) => ({ ...tc })),
  } as LayoutV1['fixed'];

  const actions = el('div', { className: 'section' });
  actions.appendChild(el('div', { className: 'label', text: 'Layout' }));

  const saveBtn = button('Save JSON', () => {
    const l = editor.getLayout();
    downloadJson(`layout_${new Date().toISOString().replace(/[:.]/g, '-')}.json`, l);
  }, 'primary');

  const loadInput = el('input', { attrs: { type: 'file', accept: 'application/json' } }) as HTMLInputElement;
  loadInput.addEventListener('change', async () => {
    const f = loadInput.files?.[0];
    if (!f) return;
    try {
      const parsed = await readJsonFile(f);
      if (!validateLayoutV1(parsed)) throw new Error('Layout schema invalid');
      editor.setLayout(parsed);
      status.textContent = 'Loaded layout.';
    } catch (e) {
      status.textContent = (e as Error).message;
    } finally {
      loadInput.value = '';
    }
  });

  const pngBtn = button('Download PNG', () => editor.downloadPng());

  const fitBtn = button('Fit to room', () => editor.fitToRoom());
  const resetBtn = button('Reset saved', () => {
    const fresh = newLayout({ widthCm: roomConfig.widthCm, heightCm: roomConfig.heightCm }, fixed);
    editor.setLayout(fresh);
    saveToLocalStorage(fresh);
    status.textContent = 'Reset to fresh layout.';
  });
  const rotateBtn = button('↻', () => {
    editor.rotateView();
    updateCompass();
  });

  // Compass rose container
  const compassContainer = el('div', {
    attrs: {
      style: 'width: 50px; height: 50px; position: relative; display: inline-block; vertical-align: middle; margin-left: 8px;'
    }
  });

  function updateCompass() {
    const rotation = editor.getRotation();
    compassContainer.innerHTML = `
      <svg viewBox="0 0 100 100" style="width: 100%; height: 100%;">
        <circle cx="50" cy="50" r="45" fill="rgba(255,255,255,0.9)" stroke="#374151" stroke-width="2"/>
        <g transform="rotate(${rotation}, 50, 50)">
          <line x1="50" y1="50" x2="50" y2="15" stroke="#2563eb" stroke-width="3"/>
          <line x1="50" y1="50" x2="85" y2="50" stroke="#9ca3af" stroke-width="2"/>
          <line x1="50" y1="50" x2="50" y2="85" stroke="#9ca3af" stroke-width="2"/>
          <line x1="50" y1="50" x2="15" y2="50" stroke="#9ca3af" stroke-width="2"/>
          <text x="50" y="22" text-anchor="middle" font-size="24" font-weight="bold" fill="#374151" transform="rotate(${-rotation}, 50, 22)">N</text>
          <text x="50" y="85" text-anchor="middle" font-size="24" font-weight="bold" fill="#374151" transform="rotate(${-rotation}, 50, 85)">S</text>
          <text x="82" y="54" text-anchor="middle" font-size="24" font-weight="bold" fill="#374151" transform="rotate(${-rotation}, 82, 54)">E</text>
          <text x="18" y="54" text-anchor="middle" font-size="24" font-weight="bold" fill="#374151" transform="rotate(${-rotation}, 18, 54)">W</text>
        </g>
      </svg>
    `;
  }

  actions.appendChild(el('div', { className: 'row' })).append(saveBtn, pngBtn);
  actions.appendChild(el('div', { className: 'row' })).append(fitBtn, resetBtn, rotateBtn, compassContainer);
  actions.appendChild(el('div', { className: 'row' })).append(loadInput);

  const editActions = el('div', { className: 'section' });
  editActions.appendChild(el('div', { className: 'label', text: 'Selected item' }));
  const delBtn = button('Delete', () => editor.deleteSelected());
  const dupBtn = button('Duplicate', () => editor.duplicateSelected());
  const upBtn = button('Bring forward', () => editor.bringForward());
  const downBtn = button('Send backward', () => editor.sendBackward());
  editActions.appendChild(el('div', { className: 'row' })).append(delBtn, dupBtn);
  editActions.appendChild(el('div', { className: 'row' })).append(upBtn, downBtn);

  const examplesSec = el('div', { className: 'section' });
  examplesSec.appendChild(el('div', { className: 'label', text: 'Examples' }));
  const examplesSelect = el('select') as HTMLSelectElement;
  examplesSec.appendChild(examplesSelect);
  const loadExampleBtn = button('Load example', async () => {
    const path = examplesSelect.value;
    if (!path) return;
    try {
      const ex = await loadExample(path);
      if (!validateLayoutV1(ex)) throw new Error('Example schema invalid');
      editor.setLayout(ex);
      status.textContent = `Loaded example: ${path}`;
    } catch (e) {
      status.textContent = (e as Error).message;
    }
  });
  examplesSec.appendChild(loadExampleBtn);

  const catalogSec = el('div', { className: 'section' });
  catalogSec.appendChild(el('div', { className: 'label', text: 'Catalog' }));

  const search = el('input', { attrs: { type: 'text', placeholder: 'Search...' } }) as HTMLInputElement;
  const list = el('div', { className: 'list' });
  catalogSec.append(search, list);

  if (devWarning) {
    sidebar.append(title, devWarning, actions, editActions, examplesSec, catalogSec, status);
  } else {
    sidebar.append(title, actions, editActions, examplesSec, catalogSec, status);
  }

  const fromLs = import.meta.env.DEV ? null : loadFromLocalStorage();
  const initialLayout = fromLs ?? newLayout({ widthCm: roomConfig.widthCm, heightCm: roomConfig.heightCm }, fixed);

  if (import.meta.env.DEV) {
    status.textContent = 'Dev mode: using source layout (ignoring saved local layout).';
  }

  let editor: EditorApi;

  function onLayoutChange(l: LayoutV1) {
    saveToLocalStorage(l);
  }

  editor = createEditor(canvasHost, roomConfig, initialLayout, onLayoutChange);
  updateCompass();

  // Keyboard
  window.addEventListener('keydown', (e) => {
    const isMac = navigator.platform.toLowerCase().includes('mac');
    const mod = isMac ? e.metaKey : e.ctrlKey;

    if (e.key === 'Delete' || e.key === 'Backspace') {
      editor.deleteSelected();
    }

    if (mod && (e.key === 'd' || e.key === 'D')) {
      e.preventDefault();
      editor.duplicateSelected();
    }
  });

  // Examples index
  loadExamplesIndex()
    .then((paths) => {
      examplesSelect.innerHTML = '';
      const opt0 = el('option', { text: 'Select…', attrs: { value: '' } });
      examplesSelect.appendChild(opt0);
      for (const p of paths) {
        examplesSelect.appendChild(el('option', { text: p, attrs: { value: p } }));
      }
    })
    .catch((e) => {
      status.textContent = (e as Error).message;
    });

  // Catalog
  let catalog: Array<{ path: string; item: CatalogItemV1 }> = [];

  function renderCatalog(filter: string) {
    list.innerHTML = '';
    const q = filter.trim().toLowerCase();
    const filtered = q
      ? catalog.filter((c) => c.item.name.toLowerCase().includes(q))
      : catalog;

    for (const c of filtered) {
      const b = el('button', { className: 'itemBtn', text: c.item.name });
      b.addEventListener('click', () => editor.addFromCatalog(c.item));
      list.appendChild(b);
    }
  }

  search.addEventListener('input', () => renderCatalog(search.value));

  loadCatalogIndex()
    .then(async (paths) => {
      const loaded: Array<{ path: string; item: CatalogItemV1 }> = [];
      for (const p of paths) {
        const item = await loadCatalogItem(p);
        loaded.push({ path: p, item });
      }
      catalog = loaded;
      renderCatalog('');
    })
    .catch((e) => {
      status.textContent = (e as Error).message;
    });
}

try {
  buildApp();
} catch (e) {
  document.body.innerHTML = `<pre style="color:red;padding:24px;white-space:pre-wrap">App failed to start:\n${(e as Error)?.stack ?? e}</pre>`;
}
