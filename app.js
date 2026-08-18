/*
  Poster Splicer Pro Lite
  A fully client-side collaborative poster builder.

  Notes:
  - Images are processed locally in the browser.
  - PDF export uses jsPDF.
  - ZIP export uses JSZip + FileSaver.
*/

const PAGE_SIZES = {
  letter: { label: 'US Letter', width: 612, height: 792 },
  a4: { label: 'A4', width: 595.28, height: 841.89 },
};

const TEMPLATE_CONFIG = {
  default: {
    name: 'Default',
    glueText: 'Apply Glue Here',
    instructionTitle: 'Instructions',
    tileStyle: 'cleanFooter',
    footerSubtitle: '',
    includeColoredPreviewByDefault: true,
  },
};

const state = {
  title: 'My Poster',
  template: 'default',
  paperSize: 'letter',
  exportScale: 3,
  rows: 3,
  cols: 3,
  gridPreset: '3x3',
  mainImage: null,
  mainFileName: '',
  secondImage: null,
  secondFileName: '',
  logoImage: null,
  logoFileName: '',
  watermarkOpacity: 0.2,
  watermarkSize: 0.45,
  selectedTileIndex: 0,
  includeInstructions: true,
  includePosterPreview: true,
  includeSecondPreview: true,
  showGlueMargin: true,
  showGridOverlay: true,
  showMiniGrid: true,
  activePdfUrl: null,
};

const els = {};

window.addEventListener('DOMContentLoaded', initApp);

function initApp() {
  cacheElements();
  wireEvents();
  syncTemplateCards();
  updateGridControls();
  rebuildTileSelect();
  updateLivePreview();
}

function cacheElements() {
  els.posterTitle = document.getElementById('posterTitle');
  els.paperSize = document.getElementById('paperSize');
  els.exportQuality = document.getElementById('exportQuality');
  els.gridPreset = document.getElementById('gridPreset');
  els.customGridControls = document.getElementById('customGridControls');
  els.gridCols = document.getElementById('gridCols');
  els.gridRows = document.getElementById('gridRows');
  els.pageCountText = document.getElementById('pageCountText');

  els.mainDropZone = document.getElementById('mainDropZone');
  els.secondDropZone = document.getElementById('secondDropZone');
  els.logoDropZone = document.getElementById('logoDropZone');
  els.mainImageInput = document.getElementById('mainImageInput');
  els.secondImageInput = document.getElementById('secondImageInput');
  els.logoImageInput = document.getElementById('logoImageInput');
  els.mainFileName = document.getElementById('mainFileName');
  els.secondFileName = document.getElementById('secondFileName');
  els.logoFileName = document.getElementById('logoFileName');
  els.watermarkOpacity = document.getElementById('watermarkOpacity');
  els.watermarkOpacityValue = document.getElementById('watermarkOpacityValue');
  els.watermarkSize = document.getElementById('watermarkSize');
  els.watermarkSizeValue = document.getElementById('watermarkSizeValue');

  els.templateInputs = Array.from(document.querySelectorAll('input[name="template"]'));
  els.templateCards = Array.from(document.querySelectorAll('.template-option'));

  els.includeInstructions = document.getElementById('includeInstructions');
  els.includePosterPreview = document.getElementById('includePosterPreview');
  els.includeSecondPreview = document.getElementById('includeSecondPreview');
  els.showGlueMargin = document.getElementById('showGlueMargin');
  els.showGridOverlay = document.getElementById('showGridOverlay');
  els.showMiniGrid = document.getElementById('showMiniGrid');

  els.generatePreviewBtn = document.getElementById('generatePreviewBtn');
  els.downloadPdfBtn = document.getElementById('downloadPdfBtn');
  els.downloadZipBtn = document.getElementById('downloadZipBtn');
  els.resetBtn = document.getElementById('resetBtn');
  els.statusText = document.getElementById('statusText');

  els.mainPreviewCanvas = document.getElementById('mainPreviewCanvas');
  els.guidePreviewCanvas = document.getElementById('guidePreviewCanvas');
  els.tilePreviewCanvas = document.getElementById('tilePreviewCanvas');
  els.pdfLiveMainCanvas = document.getElementById('pdfLiveMainCanvas');
  els.pdfLiveGuideCanvas = document.getElementById('pdfLiveGuideCanvas');
  els.pdfLiveTileCanvas = document.getElementById('pdfLiveTileCanvas');
  els.mainPreviewBadge = document.getElementById('mainPreviewBadge');
  els.guidePreviewBadge = document.getElementById('guidePreviewBadge');
  els.tilePreviewBadge = document.getElementById('tilePreviewBadge');
  els.tilePreviewSelect = document.getElementById('tilePreviewSelect');

  els.pdfDialog = document.getElementById('pdfDialog');
  els.pdfFrame = document.getElementById('pdfFrame');
  els.closeDialogBtn = document.getElementById('closeDialogBtn');
}

function wireEvents() {
  els.posterTitle.addEventListener('input', () => {
    state.title = cleanTitle(els.posterTitle.value) || 'My Poster';
    updateLivePreview();
  });

  els.paperSize.addEventListener('change', () => {
    state.paperSize = els.paperSize.value;
    updateLivePreview();
  });

  els.exportQuality.addEventListener('change', () => {
    state.exportScale = Number(els.exportQuality.value) || 3;
  });

  els.gridPreset.addEventListener('change', () => {
    state.gridPreset = els.gridPreset.value;
    updateGridControls();
    rebuildTileSelect();
    updateLivePreview();
  });

  els.gridCols.addEventListener('input', () => {
    if (state.gridPreset === 'custom') {
      state.cols = clampInt(els.gridCols.value, 1, 12, 5);
      rebuildTileSelect();
      updateLivePreview();
    }
  });

  els.gridRows.addEventListener('input', () => {
    if (state.gridPreset === 'custom') {
      state.rows = clampInt(els.gridRows.value, 1, 12, 4);
      rebuildTileSelect();
      updateLivePreview();
    }
  });

  setupDropZone(els.mainDropZone, els.mainImageInput, async (file) => {
    const loaded = await loadImageFromFile(file);
    state.mainImage = loaded.image;
    state.mainFileName = file.name;
    els.mainFileName.textContent = file.name;
    updateLivePreview();
  });

  setupDropZone(els.secondDropZone, els.secondImageInput, async (file) => {
    const loaded = await loadImageFromFile(file);
    state.secondImage = loaded.image;
    state.secondFileName = file.name;
    els.secondFileName.textContent = file.name;
    updateLivePreview();
  });

  setupDropZone(els.logoDropZone, els.logoImageInput, async (file) => {
    const loaded = await loadImageFromFile(file);
    state.logoImage = loaded.image;
    state.logoFileName = file.name;
    els.logoFileName.textContent = file.name;
    updateLivePreview();
  });

  els.watermarkOpacity.addEventListener('input', () => {
    state.watermarkOpacity = Math.max(0, Math.min(1, Number(els.watermarkOpacity.value) / 100));
    els.watermarkOpacityValue.textContent = `${Math.round(state.watermarkOpacity * 100)}%`;
    updateLivePreview();
  });

  els.watermarkSize.addEventListener('input', () => {
    state.watermarkSize = Math.max(0.1, Math.min(0.8, Number(els.watermarkSize.value) / 100));
    els.watermarkSizeValue.textContent = `${Math.round(state.watermarkSize * 100)}%`;
    updateLivePreview();
  });

  els.templateInputs.forEach((input) => {
    input.addEventListener('change', () => {
      state.template = input.value;
      syncTemplateCards();
      updateLivePreview();
    });
  });

  [
    els.includeInstructions,
    els.includePosterPreview,
    els.includeSecondPreview,
    els.showGlueMargin,
    els.showGridOverlay,
    els.showMiniGrid,
  ].forEach((checkbox) => {
    checkbox.addEventListener('change', syncOptionsFromUI);
  });

  els.tilePreviewSelect.addEventListener('change', () => {
    state.selectedTileIndex = clampInt(els.tilePreviewSelect.value, 0, state.rows * state.cols - 1, 0);
    updateLivePreview();
  });

  els.generatePreviewBtn.addEventListener('click', () => previewPdf());
  els.downloadPdfBtn.addEventListener('click', () => downloadPdf());
  els.downloadZipBtn.addEventListener('click', () => downloadZip());
  els.resetBtn.addEventListener('click', resetProject);

  els.closeDialogBtn.addEventListener('click', () => closePdfDialog());
  els.pdfDialog.addEventListener('close', () => revokeActivePdfUrl());
}

function syncOptionsFromUI() {
  state.includeInstructions = els.includeInstructions.checked;
  state.includePosterPreview = els.includePosterPreview.checked;
  state.includeSecondPreview = els.includeSecondPreview.checked;
  state.showGlueMargin = els.showGlueMargin.checked;
  state.showGridOverlay = els.showGridOverlay.checked;
  state.showMiniGrid = els.showMiniGrid.checked;
  updateLivePreview();
}

function setupDropZone(dropZone, input, onFileLoaded) {
  dropZone.addEventListener('click', () => input.click());
  dropZone.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      input.click();
    }
  });

  input.addEventListener('change', async () => {
    const file = input.files && input.files[0];
    if (file) await safeLoadFile(file, onFileLoaded);
    input.value = '';
  });

  ['dragenter', 'dragover'].forEach((eventName) => {
    dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropZone.classList.add('is-dragover');
    });
  });

  ['dragleave', 'drop'].forEach((eventName) => {
    dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropZone.classList.remove('is-dragover');
    });
  });

  dropZone.addEventListener('drop', async (event) => {
    const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
    if (file) await safeLoadFile(file, onFileLoaded);
  });
}

async function safeLoadFile(file, onFileLoaded) {
  if (!file.type.startsWith('image/')) {
    setStatus('Please upload an image file such as PNG, JPG, or WebP.');
    return;
  }

  try {
    setStatus(`Loading ${file.name}...`);
    await onFileLoaded(file);
    setStatus(`Loaded ${file.name}`);
  } catch (error) {
    console.error(error);
    setStatus('Could not load the image. Try another file.');
  }
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ image, width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Image load failed'));
    };
    image.src = url;
  });
}

function syncTemplateCards() {
  els.templateCards.forEach((card) => {
    const input = card.querySelector('input[type="radio"]');
    card.classList.toggle('is-selected', input.value === state.template);
    input.checked = input.value === state.template;
  });
}

function updateGridControls() {
  if (state.gridPreset === 'custom') {
    els.customGridControls.classList.remove('is-hidden');
    state.cols = clampInt(els.gridCols.value, 1, 12, 5);
    state.rows = clampInt(els.gridRows.value, 1, 12, 4);
  } else {
    els.customGridControls.classList.add('is-hidden');
    const [cols, rows] = state.gridPreset.split('x').map(Number);
    state.cols = cols;
    state.rows = rows;
  }

  els.pageCountText.textContent = `${state.cols} × ${state.rows} = ${state.cols * state.rows} tile pages`;
}

function rebuildTileSelect() {
  const total = state.rows * state.cols;
  if (state.selectedTileIndex >= total) state.selectedTileIndex = 0;

  els.tilePreviewSelect.innerHTML = '';
  for (let index = 0; index < total; index += 1) {
    const row = Math.floor(index / state.cols);
    const col = index % state.cols;
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = getTileLabel(row, col);
    els.tilePreviewSelect.appendChild(option);
  }
  els.tilePreviewSelect.value = String(state.selectedTileIndex);
}

function updateLivePreview() {
  updateBadges();
  renderGuidePageToCanvas(els.mainPreviewCanvas, {
    image: state.mainImage,
    title: state.title,
    mode: 'main',
    scale: getPreviewScale(els.mainPreviewCanvas),
  });

  renderGuidePageToCanvas(els.guidePreviewCanvas, {
    image: state.secondImage || state.mainImage,
    title: state.secondImage ? `${state.title} Guide` : state.title,
    mode: state.secondImage ? 'second' : 'placeholder-guide',
    scale: getPreviewScale(els.guidePreviewCanvas),
  });

  const selected = indexToRowCol(state.selectedTileIndex);
  renderTilePageToCanvas(els.tilePreviewCanvas, {
    row: selected.row,
    col: selected.col,
    scale: getTilePreviewScale(),
  });

  renderPdfPreviewLive();
}

function updateBadges() {
  els.mainPreviewBadge.textContent = state.mainImage ? `${state.cols}×${state.rows}` : 'No image';
  els.guidePreviewBadge.textContent = state.secondImage ? 'Second image' : 'Uses main image';
  const selected = indexToRowCol(state.selectedTileIndex);
  els.tilePreviewBadge.textContent = `${TEMPLATE_CONFIG[state.template].name} · ${getTileLabel(selected.row, selected.col)}`;
}

function getPreviewScale() {
  return window.innerWidth < 760 ? 0.48 : 0.6;
}

function getTilePreviewScale() {
  if (window.innerWidth < 760) return 0.52;
  if (window.innerWidth < 1180) return 0.68;
  return 0.82;
}

function getPdfLivePreviewScale() {
  if (window.innerWidth < 760) return 0.36;
  if (window.innerWidth < 1180) return 0.32;
  return 0.34;
}

function renderPdfPreviewLive() {
  if (!els.pdfLiveMainCanvas || !els.pdfLiveGuideCanvas || !els.pdfLiveTileCanvas) return;

  const scale = getPdfLivePreviewScale();

  renderGuidePageToCanvas(els.pdfLiveMainCanvas, {
    image: state.mainImage,
    title: state.title,
    mode: 'main',
    scale,
  });
  drawPreviewWatermarkToCanvas(els.pdfLiveMainCanvas, scale);

  renderGuidePageToCanvas(els.pdfLiveGuideCanvas, {
    image: state.secondImage || state.mainImage,
    title: state.secondImage ? `${state.title} Guide` : `${state.title} Guide Preview`,
    mode: state.secondImage ? 'second' : 'placeholder-guide',
    scale,
  });
  drawPreviewWatermarkToCanvas(els.pdfLiveGuideCanvas, scale);

  renderTilePageToCanvas(els.pdfLiveTileCanvas, {
    row: 0,
    col: 0,
    scale,
  });
  drawPreviewWatermarkToCanvas(els.pdfLiveTileCanvas, scale);
}

function indexToRowCol(index) {
  return {
    row: Math.floor(index / state.cols),
    col: index % state.cols,
  };
}

function renderGuidePageToCanvas(targetCanvas, options) {
  const page = createPageCanvas(options.scale || 1, targetCanvas);
  const ctx = page.ctx;
  const image = options.image;
  const title = options.title || state.title;

  drawPageBackground(ctx, page);

  const left = 36;
  const gridTop = 34;
  drawMiniGrid(ctx, {
    x: left,
    y: gridTop,
    width: 150,
    height: 150,
    rows: state.rows,
    cols: state.cols,
    activeRow: null,
    activeCol: null,
    drawImage: false,
    showLabels: true,
  });

  ctx.fillStyle = '#000';
  drawFittedText(ctx, title.toUpperCase(), 248, 75, page.width - 280, 28, 'Arial', 'bold');
  ctx.font = 'bold 20pt Arial';
  ctx.fillText('Collaborative Poster Grid', 248, 116);
  drawWrappedText(ctx, 'Color and assemble each piece (A1, A2, B1, B2, etc.) to create the full poster.', 248, 145, page.width - 280, 24, '18pt Arial');

  const posterFrame = getSquareFrame(page, {
    top: getLetterSafePosterTop(page),
    bottom: page.paperSize === 'letter' ? 28 : 38,
    side: 34,
  });
  const posterX = posterFrame.x;
  const posterY = posterFrame.y;
  const posterW = posterFrame.width;
  const posterH = posterFrame.height;

  ctx.save();
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 1.25;

  if (image) {
    const imageRect = drawImageContain(ctx, image, posterX, posterY, posterW, posterH, '#fff');
    if (state.showGridOverlay) drawGridOverlay(ctx, imageRect.x, imageRect.y, imageRect.width, imageRect.height, state.rows, state.cols);
  } else {
    drawPlaceholder(ctx, posterX, posterY, posterW, posterH, options.mode === 'second' ? 'Upload second image to see guide' : 'Upload image to see preview');
  }
  ctx.strokeRect(posterX, posterY, posterW, posterH);
  ctx.restore();
}

function renderInstructionPageToCanvas(targetCanvas, options) {
  const page = createPageCanvas(options.scale || 1, targetCanvas);
  const ctx = page.ctx;
  drawPageBackground(ctx, page);
  drawInstructionsPage(ctx, page);
}

function renderTilePageToCanvas(targetCanvas, options) {
  const page = createPageCanvas(options.scale || 1, targetCanvas);
  const ctx = page.ctx;
  drawPageBackground(ctx, page);

  drawDefaultTile(ctx, page, options.row, options.col);
}

function createPageCanvas(scale, targetCanvas) {
  const size = PAGE_SIZES[state.paperSize] || PAGE_SIZES.letter;
  const canvas = targetCanvas || document.createElement('canvas');
  canvas.width = Math.round(size.width * scale);
  canvas.height = Math.round(size.height * scale);
  canvas.style.width = `${Math.round(size.width * scale)}px`;
  canvas.style.height = `${Math.round(size.height * scale)}px`;

  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  return { canvas, ctx, width: size.width, height: size.height, scale, paperSize: state.paperSize };
}

function drawPageBackground(ctx, page) {
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, page.width, page.height);
}

function getSquareFrame(page, { top, bottom = 28, side = 34 } = {}) {
  const maxWidth = page.width - side * 2;
  const maxHeight = page.height - top - bottom;
  const size = Math.max(1, Math.min(maxWidth, maxHeight));
  return {
    x: (page.width - size) / 2,
    y: top,
    width: size,
    height: size,
  };
}

function makeSquareTileArtworkBox(page, {
  top,
  bottom = 28,
  side = 34,
  maxArtSize = 420,
  rightGlue = false,
  bottomGlue = false,
  glueRightW = 0,
  glueBottomH = 0,
} = {}) {
  // The artwork itself stays exactly 1:1.
  // Glue/adhesive margins are added outside the square artwork.
  const rightExtra = rightGlue ? glueRightW : 0;
  const bottomExtra = bottomGlue ? glueBottomH : 0;
  const maxWidth = page.width - side * 2 - rightExtra;
  const maxHeight = page.height - top - bottom - bottomExtra;
  const artSize = Math.max(1, Math.min(maxArtSize, maxWidth, maxHeight));
  const totalWidth = artSize + rightExtra;
  const totalHeight = artSize + bottomExtra;

  return {
    x: (page.width - totalWidth) / 2,
    y: top,
    width: totalWidth,
    height: totalHeight,
  };
}

function getLetterSafePosterTop(page) {
  // Letter has less vertical room than A4, so the poster preview needs to start higher.
  return page.paperSize === 'letter' ? 228 : 282;
}

function drawInstructionsPage(ctx, page) {
  const title = state.title.toUpperCase();

  drawCenteredText(ctx, `Instructions for`, page.width / 2, 64, 23, 'Arial', 'bold');
  drawCenteredText(ctx, `${title} Poster`, page.width / 2, 98, 24, 'Arial', 'bold');
  drawCenteredText(ctx, 'Collaborative Poster', page.width / 2, 130, 18, 'Arial', 'normal');

  const startY = 178;
  const x = 72;
  const maxW = page.width - 144;
  let y = startY;

  const sections = [
    {
      heading: 'Step 1: Color Your Piece',
      body: `Each student receives one section of the poster (labeled A1, A2, B1, B2, etc.). Use crayons, markers, or colored pencils. Stay inside the lines and keep colors neat and bold.`,
    },
    {
      heading: 'Step 2: Work as a Team',
      body: `Check with your group to make sure colors match across pieces. Encourage each other and share supplies.`,
    },
    {
      heading: 'Step 3: Cut and Assemble',
      body: `When finished, carefully cut along the border. Work together to match the pieces like a puzzle. Apply glue on the marked edges while assembling. Attach all pieces to a larger sheet of paper or bulletin board.`,
    },
    {
      heading: 'Step 4: Display Your Poster',
      body: `Review your final poster as a team. Make sure all pieces fit and no parts are missing. Celebrate your teamwork and creativity!`,
    },
  ];

  sections.forEach((section) => {
    ctx.fillStyle = '#000';
    ctx.font = 'bold 17pt Arial';
    ctx.fillText(section.heading, x, y);
    y += 26;
    y = drawWrappedText(ctx, section.body, x, y, maxW, 20, '13.5pt Arial') + 22;
  });
}

function drawDefaultTile(ctx, page, row, col) {
  const label = getTileLabel(row, col);
  const template = TEMPLATE_CONFIG[state.template];

  ctx.fillStyle = '#000';
  ctx.font = 'bold 34pt Arial';
  ctx.fillText('Instructions', 32, 55);
  const bulletBottom = drawBulletList(ctx, getStudentInstructionBullets(), 35, 100, page.width - 70, 17, '12.5pt Arial');

  const footerH = 108;
  const rightGlue = state.showGlueMargin && col < state.cols - 1;
  const bottomGlue = state.showGlueMargin && row < state.rows - 1;
  const glueRightW = 38;
  const glueBottomH = 38;
  const safeTop = page.paperSize === 'letter'
    ? Math.max(204, bulletBottom + 20)
    : Math.max(218, bulletBottom + 22);
  const imageBox = makeSquareTileArtworkBox(page, {
    top: safeTop,
    bottom: footerH + 12,
    side: 48,
    maxArtSize: page.paperSize === 'letter' ? 430 : 456,
    rightGlue,
    bottomGlue,
    glueRightW,
    glueBottomH,
  });

  drawTileArtworkBox(ctx, imageBox, row, col, template.glueText, {
    rightGlue,
    bottomGlue,
    glueRightW,
    glueBottomH,
    lineWidth: 1.6,
    labelSize: 15,
  });

  const title = state.title.toUpperCase().includes('POSTER')
    ? state.title.toUpperCase()
    : `${state.title.toUpperCase()} POSTER`;

  drawFooterGuide(ctx, page, row, col, {
    label,
    title,
    subtitle: '',
    labelFontSize: 54,
    titleFontSize: 27,
    subtitleFontSize: 0,
    miniX: 28,
    miniY: page.height - 108,
    miniSize: 82,
  });
}

function drawFooterGuide(ctx, page, row, col, options) {
  if (state.showMiniGrid) {
    drawMiniGrid(ctx, {
      x: options.miniX,
      y: options.miniY,
      width: options.miniSize,
      height: options.miniSize,
      rows: state.rows,
      cols: state.cols,
      activeRow: row,
      activeCol: col,
      drawImage: true,
      showLabels: true,
    });
  }

  const titleX = page.width * 0.52;
  const titleMaxW = page.width * 0.54;
  const titleY = options.subtitle ? page.height - 58 : page.height - 48;
  drawFittedText(ctx, options.title, titleX - titleMaxW / 2, titleY, titleMaxW, options.titleFontSize, 'Arial', 'bold', 'center');

  if (options.subtitle) {
    drawFittedText(ctx, options.subtitle, titleX - titleMaxW / 2, page.height - 27, titleMaxW, options.subtitleFontSize, 'Arial', 'bold', 'center');
  }

  drawFittedText(ctx, options.label, page.width - 120, page.height - 36, 100, options.labelFontSize, 'Arial', 'bold', 'right');
}

function drawTileArtworkBox(ctx, box, row, col, glueText, options) {
  const rightGlueW = options.rightGlue ? options.glueRightW : 0;
  const bottomGlueH = options.bottomGlue ? options.glueBottomH : 0;

  const art = {
    x: box.x,
    y: box.y,
    width: box.width - rightGlueW,
    height: box.height - bottomGlueH,
  };

  ctx.save();
  ctx.strokeStyle = '#000';
  ctx.lineWidth = options.lineWidth;
  ctx.fillStyle = '#fff';
  ctx.fillRect(box.x, box.y, box.width, box.height);

  if (state.mainImage) {
    drawTileCrop(ctx, state.mainImage, row, col, art.x, art.y, art.width, art.height);
  } else {
    drawTilePlaceholder(ctx, art.x, art.y, art.width, art.height, getTileLabel(row, col));
  }

  ctx.strokeRect(art.x, art.y, art.width, art.height);

  if (options.rightGlue) {
    ctx.strokeRect(art.x + art.width, art.y, rightGlueW, art.height);
    drawRotatedCenteredText(ctx, glueText, art.x + art.width + rightGlueW / 2, art.y + art.height / 2, -Math.PI / 2, `${options.labelSize}pt Arial`);
  }

  if (options.bottomGlue) {
    ctx.strokeRect(art.x, art.y + art.height, art.width + rightGlueW, bottomGlueH);
    drawCenteredText(ctx, glueText, art.x + (art.width + rightGlueW) / 2, art.y + art.height + bottomGlueH / 2 + 5, options.labelSize, 'Arial', 'normal');
  }

  ctx.restore();
}

function drawTileCrop(ctx, image, row, col, x, y, width, height) {
  const sx = Math.round((col * image.naturalWidth) / state.cols);
  const sy = Math.round((row * image.naturalHeight) / state.rows);
  const sw = Math.round(image.naturalWidth / state.cols);
  const sh = Math.round(image.naturalHeight / state.rows);
  ctx.drawImage(image, sx, sy, sw, sh, x, y, width, height);
}

function drawTilePlaceholder(ctx, x, y, width, height, label) {
  ctx.fillStyle = '#fbfcfe';
  ctx.fillRect(x, y, width, height);
  ctx.strokeStyle = '#d2ddea';
  ctx.lineWidth = 1;
  for (let line = 0; line < 8; line += 1) {
    const px = x + (width / 7) * line;
    ctx.beginPath();
    ctx.moveTo(px, y);
    ctx.lineTo(px + width * 0.22, y + height);
    ctx.stroke();
  }
  ctx.fillStyle = '#93a3ba';
  ctx.font = 'bold 40pt Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + width / 2, y + height / 2);
  ctx.textAlign = 'start';
  ctx.textBaseline = 'alphabetic';
}

function drawGridOverlay(ctx, x, y, width, height, rows, cols) {
  ctx.save();
  ctx.strokeStyle = 'rgba(0,0,0,.78)';
  ctx.lineWidth = 1.25;
  for (let c = 1; c < cols; c += 1) {
    const px = x + (width / cols) * c;
    ctx.beginPath();
    ctx.moveTo(px, y);
    ctx.lineTo(px, y + height);
    ctx.stroke();
  }
  for (let r = 1; r < rows; r += 1) {
    const py = y + (height / rows) * r;
    ctx.beginPath();
    ctx.moveTo(x, py);
    ctx.lineTo(x + width, py);
    ctx.stroke();
  }
  ctx.restore();
}

function drawMiniGrid(ctx, options) {
  const labelGap = 17;
  const gridX = options.showLabels ? options.x + labelGap : options.x;
  const gridY = options.showLabels ? options.y + labelGap : options.y;
  const gridW = options.width;
  const gridH = options.height;
  const rows = options.rows;
  const cols = options.cols;
  const cellW = gridW / cols;
  const cellH = gridH / rows;

  ctx.save();
  ctx.fillStyle = '#fff';
  ctx.fillRect(gridX, gridY, gridW, gridH);

  if (options.drawImage && state.mainImage) {
    ctx.save();
    ctx.globalAlpha = 0.72;
    drawImageCover(ctx, state.mainImage, gridX, gridY, gridW, gridH);
    ctx.restore();
  }

  if (options.activeRow !== null && options.activeCol !== null) {
    ctx.fillStyle = 'rgba(0,0,0,.35)';
    ctx.fillRect(gridX + options.activeCol * cellW, gridY + options.activeRow * cellH, cellW, cellH);
  }

  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.strokeRect(gridX, gridY, gridW, gridH);

  for (let c = 1; c < cols; c += 1) {
    const px = gridX + c * cellW;
    ctx.beginPath();
    ctx.moveTo(px, gridY);
    ctx.lineTo(px, gridY + gridH);
    ctx.stroke();
  }

  for (let r = 1; r < rows; r += 1) {
    const py = gridY + r * cellH;
    ctx.beginPath();
    ctx.moveTo(gridX, py);
    ctx.lineTo(gridX + gridW, py);
    ctx.stroke();
  }

  if (options.showLabels) {
    const fontSize = Math.max(6, Math.min(15, 16 - Math.max(rows, cols) * 0.4));
    ctx.font = `bold ${fontSize}pt Arial`;
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let c = 0; c < cols; c += 1) {
      ctx.fillText(String(c + 1), gridX + c * cellW + cellW / 2, options.y + labelGap / 2);
    }
    for (let r = 0; r < rows; r += 1) {
      ctx.fillText(getRowLabel(r), options.x + labelGap / 2, gridY + r * cellH + cellH / 2);
    }

    ctx.textAlign = 'start';
    ctx.textBaseline = 'alphabetic';
  }

  ctx.restore();
}

function drawImageContain(ctx, image, x, y, width, height, background) {
  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(x, y, width, height);
  }

  const imgRatio = image.naturalWidth / image.naturalHeight;
  const boxRatio = width / height;
  let drawW = width;
  let drawH = height;
  let dx = x;
  let dy = y;

  if (imgRatio > boxRatio) {
    drawW = width;
    drawH = width / imgRatio;
    dy = y + (height - drawH) / 2;
  } else {
    drawH = height;
    drawW = height * imgRatio;
    dx = x + (width - drawW) / 2;
  }

  ctx.drawImage(image, dx, dy, drawW, drawH);
  return { x: dx, y: dy, width: drawW, height: drawH };
}

function drawImageCover(ctx, image, x, y, width, height) {
  const imgRatio = image.naturalWidth / image.naturalHeight;
  const boxRatio = width / height;
  let sx = 0;
  let sy = 0;
  let sw = image.naturalWidth;
  let sh = image.naturalHeight;

  if (imgRatio > boxRatio) {
    sw = image.naturalHeight * boxRatio;
    sx = (image.naturalWidth - sw) / 2;
  } else {
    sh = image.naturalWidth / boxRatio;
    sy = (image.naturalHeight - sh) / 2;
  }

  ctx.drawImage(image, sx, sy, sw, sh, x, y, width, height);
}

function drawPlaceholder(ctx, x, y, width, height, text) {
  ctx.save();
  ctx.fillStyle = '#fbfcfe';
  ctx.fillRect(x, y, width, height);
  ctx.strokeStyle = '#cfdaea';
  ctx.setLineDash([8, 6]);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x + 8, y + 8, width - 16, height - 16);
  ctx.setLineDash([]);
  ctx.fillStyle = '#8294b0';
  ctx.font = '15pt Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + width / 2, y + height / 2);
  ctx.textAlign = 'start';
  ctx.textBaseline = 'alphabetic';
  ctx.restore();
}

function drawBulletList(ctx, bullets, x, y, maxWidth, lineHeight, font) {
  let currentY = y;
  ctx.fillStyle = '#000';
  ctx.font = font;
  bullets.forEach((bullet) => {
    ctx.fillText('•', x, currentY);
    currentY = drawWrappedText(ctx, bullet, x + 13, currentY, maxWidth, lineHeight, font);
    currentY += 4;
  });
  return currentY;
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, font) {
  ctx.font = font;
  const words = String(text).split(/\s+/);
  let line = '';
  let currentY = y;

  words.forEach((word, index) => {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      line = word;
      currentY += lineHeight;
    } else {
      line = testLine;
    }

    if (index === words.length - 1 && line) {
      ctx.fillText(line, x, currentY);
    }
  });

  return currentY + lineHeight;
}

function drawCenteredText(ctx, text, x, y, size, family, weight) {
  ctx.save();
  ctx.fillStyle = '#000';
  ctx.font = `${weight || 'normal'} ${size}pt ${family || 'Arial'}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawRotatedCenteredText(ctx, text, x, y, rotation, font) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.fillStyle = '#000';
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

function drawFittedText(ctx, text, x, y, maxWidth, size, family, weight, align) {
  ctx.save();
  let fontSize = size;
  ctx.fillStyle = '#000';
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = align || 'left';
  do {
    ctx.font = `${weight || 'normal'} ${fontSize}pt ${family || 'Arial'}`;
    fontSize -= 1;
  } while (ctx.measureText(text).width > maxWidth && fontSize > 6);

  let drawX = x;
  if (align === 'center') drawX = x + maxWidth / 2;
  if (align === 'right') drawX = x + maxWidth;
  ctx.fillText(text, drawX, y);
  ctx.restore();
}

function getStudentInstructionBullets() {
  return [
    'Color your section neatly using bright, bold colors.',
    'Work with classmates so colors match across sections.',
    'Cut along the border when finished and submit to your teacher.',
    'All pieces will be combined to create the full class poster.',
  ];
}

async function previewPdf() {
  if (!ensureExportReady()) return;
  await runExportTask('Generating 3-page PDF preview...', async () => {
    const previewPages = await buildPreviewPages(state.exportScale);
    const pdf = await buildPdf(previewPages);
    const blob = pdf.output('blob');
    revokeActivePdfUrl();
    state.activePdfUrl = URL.createObjectURL(blob);
    els.pdfFrame.src = state.activePdfUrl;
    if (typeof els.pdfDialog.showModal === 'function') {
      els.pdfDialog.showModal();
    } else {
      window.open(state.activePdfUrl, '_blank', 'noopener');
    }
    setStatus('PDF preview ready: Main Poster, Guide Preview, and A1 Tile.');
  });
}

async function downloadPdf() {
  if (!ensureExportReady()) return;
  await runExportTask('Creating PDF...', async () => {
    const pdf = await buildPdf();
    pdf.save(`${safeFileName(state.title)}_collaborative_poster.pdf`);
    setStatus('PDF downloaded.');
  });
}

async function downloadZip() {
  if (!ensureExportReady()) return;
  if (!window.JSZip || !window.saveAs) {
    setStatus('ZIP libraries did not load. Check your internet connection or CDN access.');
    return;
  }

  await runExportTask('Creating PNG pages...', async () => {
    const pages = await buildPrintablePages(state.exportScale);
    const zip = new window.JSZip();

    pages.forEach((page, index) => {
      const base64 = page.canvas.toDataURL('image/png').split(',')[1];
      const padded = String(index + 1).padStart(2, '0');
      zip.file(`${padded}_${page.name}.png`, base64, { base64: true });
    });

    const blob = await zip.generateAsync({ type: 'blob' });
    window.saveAs(blob, `${safeFileName(state.title)}_png_pages.zip`);
    setStatus('ZIP downloaded.');
  });
}

async function buildPdf(pagesOverride = null) {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    throw new Error('jsPDF did not load. Check CDN access.');
  }

  const pages = pagesOverride || await buildPrintablePages(state.exportScale);
  const size = PAGE_SIZES[state.paperSize] || PAGE_SIZES.letter;
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: [size.width, size.height],
    compress: true,
  });

  pages.forEach((page, index) => {
    if (index > 0) pdf.addPage([size.width, size.height], 'portrait');
    const type = state.exportScale >= 3 ? 'JPEG' : 'PNG';
    const data = type === 'JPEG'
      ? page.canvas.toDataURL('image/jpeg', 0.92)
      : page.canvas.toDataURL('image/png');
    pdf.addImage(data, type, 0, 0, size.width, size.height);
  });

  return pdf;
}

async function buildPreviewPages(scale) {
  const pages = [];

  const mainCanvas = document.createElement('canvas');
  renderGuidePageToCanvas(mainCanvas, {
    image: state.mainImage,
    title: state.title,
    mode: 'main',
    scale,
  });
  drawPreviewWatermarkToCanvas(mainCanvas, scale);
  pages.push({ name: 'preview_01_main_poster', canvas: mainCanvas });
  await nextFrame();

  const guideCanvas = document.createElement('canvas');
  renderGuidePageToCanvas(guideCanvas, {
    image: state.secondImage || state.mainImage,
    title: state.secondImage ? `${state.title} Guide` : `${state.title} Guide Preview`,
    mode: state.secondImage ? 'second' : 'placeholder-guide',
    scale,
  });
  drawPreviewWatermarkToCanvas(guideCanvas, scale);
  pages.push({ name: 'preview_02_guide', canvas: guideCanvas });
  await nextFrame();

  const tileCanvas = document.createElement('canvas');
  renderTilePageToCanvas(tileCanvas, { row: 0, col: 0, scale });
  drawPreviewWatermarkToCanvas(tileCanvas, scale);
  pages.push({ name: 'preview_03_tile_A1', canvas: tileCanvas });
  await nextFrame();

  return pages;
}

function drawPreviewWatermarkToCanvas(canvas, scale) {
  if (!state.logoImage || state.watermarkOpacity <= 0) return;

  const size = PAGE_SIZES[state.paperSize] || PAGE_SIZES.letter;
  const ctx = canvas.getContext('2d');
  ctx.save();
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  drawShopLogoWatermark(ctx, { width: size.width, height: size.height });
  ctx.restore();
}

function drawShopLogoWatermark(ctx, page) {
  const image = state.logoImage;
  if (!image) return;

  const logoSize = Math.max(0.1, Math.min(0.8, state.watermarkSize || 0.45));
  const maxW = page.width * logoSize;
  const maxH = page.height * logoSize;
  const ratio = image.naturalWidth / image.naturalHeight || 1;
  let drawW = maxW;
  let drawH = drawW / ratio;
  if (drawH > maxH) {
    drawH = maxH;
    drawW = drawH * ratio;
  }

  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, state.watermarkOpacity));
  ctx.translate(page.width / 2, page.height / 2);
  // Keep the shop logo watermark straight. Angle = 0°.
  ctx.drawImage(image, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.restore();
}

async function buildPrintablePages(scale) {
  const pages = [];

  if (state.includeInstructions) {
    const instructionCanvas = document.createElement('canvas');
    renderInstructionPageToCanvas(instructionCanvas, { scale });
    pages.push({ name: 'instructions', canvas: instructionCanvas });
    await nextFrame();
  }

  if (state.includePosterPreview) {
    const previewCanvas = document.createElement('canvas');
    renderGuidePageToCanvas(previewCanvas, {
      image: state.mainImage,
      title: state.title,
      mode: 'main',
      scale,
    });
    pages.push({ name: 'poster_preview', canvas: previewCanvas });
    await nextFrame();
  }

  if (state.includeSecondPreview && state.secondImage) {
    const secondCanvas = document.createElement('canvas');
    renderGuidePageToCanvas(secondCanvas, {
      image: state.secondImage,
      title: `${state.title} Preview`,
      mode: 'second',
      scale,
    });
    pages.push({ name: 'second_preview', canvas: secondCanvas });
    await nextFrame();
  }

  for (let row = 0; row < state.rows; row += 1) {
    for (let col = 0; col < state.cols; col += 1) {
      const tileCanvas = document.createElement('canvas');
      renderTilePageToCanvas(tileCanvas, { row, col, scale });
      pages.push({ name: `tile_${getTileLabel(row, col)}`, canvas: tileCanvas });
      if (pages.length % 3 === 0) await nextFrame();
    }
  }

  return pages;
}

function ensureExportReady() {
  if (!state.mainImage) {
    setStatus('Please upload the main poster image before exporting.');
    return false;
  }

  if (state.rows * state.cols > 144) {
    setStatus('Grid is too large. Please use 12 × 12 or smaller.');
    return false;
  }

  return true;
}

async function runExportTask(status, task) {
  setBusy(true);
  setStatus(status);
  try {
    await nextFrame();
    await task();
  } catch (error) {
    console.error(error);
    setStatus(error.message || 'Something went wrong while exporting.');
  } finally {
    setBusy(false);
  }
}

function setBusy(isBusy) {
  els.generatePreviewBtn.disabled = isBusy;
  els.downloadPdfBtn.disabled = isBusy;
  els.downloadZipBtn.disabled = isBusy;
  els.resetBtn.disabled = isBusy;
}

function closePdfDialog() {
  if (typeof els.pdfDialog.close === 'function') els.pdfDialog.close();
  else revokeActivePdfUrl();
}

function revokeActivePdfUrl() {
  if (state.activePdfUrl) {
    URL.revokeObjectURL(state.activePdfUrl);
    state.activePdfUrl = null;
  }
  if (els.pdfFrame) els.pdfFrame.src = 'about:blank';
}

function resetProject() {
  state.title = 'My Poster';
  state.template = 'default';
  state.paperSize = 'letter';
  state.exportScale = 3;
  state.rows = 3;
  state.cols = 3;
  state.gridPreset = '3x3';
  state.mainImage = null;
  state.mainFileName = '';
  state.secondImage = null;
  state.secondFileName = '';
  state.logoImage = null;
  state.logoFileName = '';
  state.watermarkOpacity = 0.2;
  state.watermarkSize = 0.45;
  state.selectedTileIndex = 0;
  state.includeInstructions = true;
  state.includePosterPreview = true;
  state.includeSecondPreview = true;
  state.showGlueMargin = true;
  state.showGridOverlay = true;
  state.showMiniGrid = true;

  els.posterTitle.value = state.title;
  els.paperSize.value = state.paperSize;
  els.exportQuality.value = String(state.exportScale);
  els.gridPreset.value = state.gridPreset;
  els.gridCols.value = '5';
  els.gridRows.value = '4';
  els.mainFileName.textContent = 'Main poster image for slicing';
  els.secondFileName.textContent = 'Optional guide / colored preview page';
  els.logoFileName.textContent = 'Optional logo for preview watermark';
  els.watermarkOpacity.value = '20';
  els.watermarkOpacityValue.textContent = '20%';
  els.watermarkSize.value = '45';
  els.watermarkSizeValue.textContent = '45%';
  els.includeInstructions.checked = true;
  els.includePosterPreview.checked = true;
  els.includeSecondPreview.checked = true;
  els.showGlueMargin.checked = true;
  els.showGridOverlay.checked = true;
  els.showMiniGrid.checked = true;

  updateGridControls();
  rebuildTileSelect();
  syncTemplateCards();
  updateLivePreview();
  setStatus('Project reset.');
}

function setStatus(message) {
  els.statusText.textContent = message;
}

function getTileLabel(row, col) {
  return `${getRowLabel(row)}${col + 1}`;
}

function getRowLabel(index) {
  let label = '';
  let n = index;
  do {
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return label;
}

function clampInt(value, min, max, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function cleanTitle(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function safeFileName(value) {
  return cleanTitle(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, '_')
    .replace(/^_+|_+$/g, '') || 'poster';
}

function nextFrame() {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}
