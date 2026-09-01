// ===== Constants =====
const OVERLAY_FILENAMES = [
    'en-0---white.png',
    'en-1---white.png',
    'en-2-A B C--white.png',
    'en-3-D E F--white.png',
    'en-4-G H I--white.png',
    'en-5-J K L--white.png',
    'en-6-M N O--white.png',
    'en-7-P Q R S--white.png',
    'en-8-T U V--white.png',
    'en-9-W X Y Z--white.png'
];

const V10_KEY_DEFINITIONS = [
    { key: '0', prefix: 'other-0-+', position: [1, 3] },
    { key: '1', prefix: 'other-1-', position: [0, 0] },
    { key: '2', prefix: 'other-2-A B C', position: [1, 0] },
    { key: '3', prefix: 'other-3-D E F', position: [2, 0] },
    { key: '4', prefix: 'other-4-G H I', position: [0, 1] },
    { key: '5', prefix: 'other-5-J K L', position: [1, 1] },
    { key: '6', prefix: 'other-6-M N O', position: [2, 1] },
    { key: '7', prefix: 'other-7-P Q R S', position: [0, 2] },
    { key: '8', prefix: 'other-8-T U V', position: [1, 2] },
    { key: '9', prefix: 'other-9-W X Y Z', position: [2, 2] },
    { key: '*', prefix: 'other-*-', position: [0, 3] },
    { key: '#', prefix: 'other-#-', position: [2, 3] }
];
const V10_APPEARANCES = {
    dark: 'white',
    light: 'mask'
};
const V10_OUTPUT_WIDTH = 305;
const V10_OUTPUT_HEIGHT = 287;
const OUTPUT_WIDTH = 305;
const OUTPUT_HEIGHT = 287;

// ===== State =====
let backgroundImage = null;
const separateOverlays = {
    dark: new Map(),
    light: new Map()
};
const singleOverlayImages = {
    dark: null,
    light: null
};
const overlayTransforms = {
    dark: { scale: 100, posX: 0, posY: 0, rotation: 0 },
    light: { scale: 100, posX: 0, posY: 0, rotation: 0 }
};
let overlayMode = 'single'; // 'single' or 'multiple'
let generatedImages = [];
let exportVersion = '10'; // '10' while TelephonyUI-8 is temporarily disabled
let generatedVersion = null;
let previewAppearance = 'dark';
let generationRequest = 0;

// ===== DOM Elements =====
const photoDropZone = document.getElementById('photoDropZone');
const photoInput = document.getElementById('photoInput');
const photoPreview = document.getElementById('photoPreview');
const singleOverlayDropZones = {
    dark: document.getElementById('singleOverlayDarkDropZone'),
    light: document.getElementById('singleOverlayLightDropZone')
};
const singleOverlayInputs = {
    dark: document.getElementById('singleOverlayDarkInput'),
    light: document.getElementById('singleOverlayLightInput')
};
const singleOverlayPreviews = {
    dark: document.getElementById('singleOverlayDarkPreview'),
    light: document.getElementById('singleOverlayLightPreview')
};
const separateOverlayDropZones = {
    dark: document.getElementById('darkOverlaysDropZone'),
    light: document.getElementById('lightOverlaysDropZone')
};
const separateOverlayInputs = {
    dark: document.getElementById('darkOverlaysInput'),
    light: document.getElementById('lightOverlaysInput')
};
const overlayChecklists = {
    dark: document.getElementById('darkOverlayChecklist'),
    light: document.getElementById('lightOverlayChecklist')
};
const modeButtons = document.querySelectorAll('.mode-btn[data-mode]');
const toggleButtons = document.querySelectorAll('.toggle-btn');
const generateBtn = document.getElementById('generateBtn');
const previewSection = document.getElementById('previewSection');
const previewGrid = document.getElementById('previewGrid');
const downloadBtn = document.getElementById('downloadBtn');
const downloadPassthmBtn = document.getElementById('downloadPassthmBtn');
const versionBtn8 = document.getElementById('versionBtn8');
const versionBtn10 = document.getElementById('versionBtn10');
const appearanceToggle = document.getElementById('appearanceToggle');
const appearanceButtons = document.querySelectorAll('.mode-btn[data-appearance]');
const v10ExportNote = document.getElementById('v10ExportNote');
const generateWarning = document.getElementById('generateWarning');
const transparentBgBtn = document.getElementById('transparentBgBtn');
const overlayControls = document.getElementById('overlayControls');
const overlayScaleSlider = document.getElementById('overlayScale');
const scaleValueDisplay = document.getElementById('scaleValue');
const overlayPosXSlider = document.getElementById('overlayPosX');
const posXValueDisplay = document.getElementById('posXValue');
const overlayPosYSlider = document.getElementById('overlayPosY');
const posYValueDisplay = document.getElementById('posYValue');
const overlayRotationSlider = document.getElementById('overlayRotation');
const rotationValueDisplay = document.getElementById('rotationValue');
const resetPosBtn = document.getElementById('resetPosBtn');

// ===== Initialize =====
function init() {
    setupDropZone(photoDropZone, photoInput, handlePhotoUpload);
    Object.keys(singleOverlayDropZones).forEach(appearance => {
        setupDropZone(singleOverlayDropZones[appearance], singleOverlayInputs[appearance], files => handleSingleOverlayUpload(files, appearance));
    });
    Object.keys(separateOverlayDropZones).forEach(appearance => {
        setupDropZone(separateOverlayDropZones[appearance], separateOverlayInputs[appearance], files => handleOverlaysUpload(files, appearance));
    });
    setupTransparentBgButton();
    setupOverlayModeToggle();
    setupPositionControls();
    setupGenerateButton();
    setupVersionToggle();
    setupAppearanceToggle();
    setupDownloadButton();
    setupDownloadPassthmButton();
    updateAppearanceControls();
    renderOverlayChecklist('dark');
    renderOverlayChecklist('light');
}

// ===== Drop Zone Setup =====
function setupDropZone(dropZone, input, handler) {
    dropZone.addEventListener('click', () => input.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        const files = Array.from(e.dataTransfer.files);
        handler(files);
    });

    input.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        handler(files);
    });
}

// ===== Photo Upload =====
function handlePhotoUpload(files) {
    const file = files[0];
    if (!file || !file.type.startsWith('image/')) {
        alert('Please upload a valid image file');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            backgroundImage = img;
            photoPreview.src = e.target.result;
            photoDropZone.classList.add('has-image');
            transparentBgBtn.classList.remove('active');
            updateGenerateButton();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// ===== Transparent Background =====
function setupTransparentBgButton() {
    transparentBgBtn.addEventListener('click', useTransparentBackground);
}

function useTransparentBackground() {
    // Create a transparent canvas as the background
    // Size it to match 10 keys at 305x287 each (3050x287 for horizontal)
    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT_WIDTH * 10;
    canvas.height = OUTPUT_HEIGHT;
    const ctx = canvas.getContext('2d');

    // Leave it transparent (default canvas state)
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Create an image from the canvas
    const img = new Image();
    img.onload = () => {
        backgroundImage = img;
        photoPreview.src = canvas.toDataURL('image/png');
        photoDropZone.classList.add('has-image');
        transparentBgBtn.classList.add('active');
        updateGenerateButton();
    };
    img.src = canvas.toDataURL('image/png');
}

// ===== Positioning Controls =====
function setupPositionControls() {
    // Helper to update preview
    const update = () => {
        // Only generate if we have minimum requirements (logic handled inside generateTheme)
        generateTheme();
    };

    // Scale
    overlayScaleSlider.addEventListener('input', () => {
        scaleValueDisplay.textContent = overlayScaleSlider.value;
        overlayTransforms[previewAppearance].scale = Number(overlayScaleSlider.value);
        update();
    });

    // X Position
    overlayPosXSlider.addEventListener('input', () => {
        posXValueDisplay.textContent = overlayPosXSlider.value;
        overlayTransforms[previewAppearance].posX = Number(overlayPosXSlider.value);
        update();
    });

    // Y Position
    overlayPosYSlider.addEventListener('input', () => {
        posYValueDisplay.textContent = overlayPosYSlider.value;
        overlayTransforms[previewAppearance].posY = Number(overlayPosYSlider.value);
        update();
    });

    // Rotation
    overlayRotationSlider.addEventListener('input', () => {
        rotationValueDisplay.textContent = overlayRotationSlider.value;
        overlayTransforms[previewAppearance].rotation = Number(overlayRotationSlider.value);
        update();
    });

    // Reset Button
    resetPosBtn.addEventListener('click', () => {
        overlayTransforms[previewAppearance] = { scale: 100, posX: 0, posY: 0, rotation: 0 };
        syncPositionControls();
        update();
    });
}

function syncPositionControls() {
    const transform = overlayTransforms[previewAppearance];
    overlayScaleSlider.value = transform.scale;
    scaleValueDisplay.textContent = String(transform.scale);
    overlayPosXSlider.value = transform.posX;
    posXValueDisplay.textContent = String(transform.posX);
    overlayPosYSlider.value = transform.posY;
    posYValueDisplay.textContent = String(transform.posY);
    overlayRotationSlider.value = transform.rotation;
    rotationValueDisplay.textContent = String(transform.rotation);
}

// ===== Overlays Upload =====
function handleOverlaysUpload(files, appearance) {
    const imageFiles = files.filter(f => f.type.startsWith('image/'));

    if (imageFiles.length === 0) {
        alert('Please upload image files');
        return;
    }

    let matchedCount = 0;
    let unmatchedFiles = [];

    imageFiles.forEach(file => {
        const filename = file.name;

        const key = resolveV10OverlayKey(filename);
        if (key !== null) {
            loadOverlay(file, key, appearance);
            matchedCount++;
            return;
        }

        unmatchedFiles.push(filename);
    });

    if (unmatchedFiles.length > 0 && matchedCount === 0) {
        alert('Could not match overlay files. Use filenames containing 0-9, * or #.');
    }
}

function resolveV10OverlayKey(filename) {
    if (filename.includes('#')) return '#';
    if (filename.includes('*')) return '*';

    const digitMatch = filename.match(/(\d+)/);
    if (!digitMatch) return null;

    let digit = parseInt(digitMatch[1]);
    if (digit === 10) digit = 0;
    return digit >= 0 && digit <= 9 ? String(digit) : null;
}

function loadOverlay(file, key, appearance) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            separateOverlays[appearance].set(key, img);
            renderOverlayChecklist(appearance);
            updateGenerateButton();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// ===== Single Overlay Upload =====
function handleSingleOverlayUpload(files, appearance) {
    const file = files[0];
    if (!file || !file.type.startsWith('image/')) {
        alert('Please upload a valid image file');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            singleOverlayImages[appearance] = img;
            singleOverlayPreviews[appearance].src = e.target.result;
            singleOverlayDropZones[appearance].classList.add('has-image');
            overlayControls.classList.add('visible');
            updateGenerateButton();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// ===== Overlay Mode Toggle =====
function setupOverlayModeToggle() {
    modeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            modeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            overlayMode = btn.dataset.mode;

            // Toggle visibility of drop zones
            if (overlayMode === 'single') {
                document.getElementById('singleOverlayInputs').classList.remove('hidden');
                document.getElementById('separateOverlayInputs').classList.add('hidden');
            } else {
                document.getElementById('singleOverlayInputs').classList.add('hidden');
                document.getElementById('separateOverlayInputs').classList.remove('hidden');
            }

            overlayControls.classList.add('visible');
            overlayControls.classList.remove('hidden');

            updateGenerateButton();
        });
    });
}

// ===== Overlay Checklist =====
function renderOverlayChecklist(appearance) {
    const checklist = overlayChecklists[appearance];
    if (!checklist) return;
    checklist.innerHTML = V10_KEY_DEFINITIONS.map(({ key }) => {
        const loaded = separateOverlays[appearance].has(key);
        return `<li class="${loaded ? 'loaded' : ''}">${key}</li>`;
    }).join('');
}



// ===== Generate Button =====
function updateGenerateButton() {
    const hasPhoto = backgroundImage !== null;
    let hasOverlay = false;

    if (overlayMode === 'single') {
        hasOverlay = singleOverlayImages.dark !== null && singleOverlayImages.light !== null;
    } else {
        hasOverlay = separateOverlays.dark.size === V10_KEY_DEFINITIONS.length && separateOverlays.light.size === V10_KEY_DEFINITIONS.length;
    }

    generateBtn.disabled = !(hasPhoto && hasOverlay);

    const warningEl = document.getElementById('generateWarning');
    if (warningEl) {
        if (generateBtn.disabled) {
            let missing = [];
            if (!hasPhoto) missing.push("Background Photo");
            if (!hasOverlay) missing.push(overlayMode === 'single' ? "Both Dark and Light Overlay Images" : "All 12 Dark and 12 Light Overlay Images");

            // Only show the warning if they have uploaded AT LEAST one thing, 
            // so it doesn't yell at them immediately on page load.
            if (hasPhoto || separateOverlays.dark.size > 0 || separateOverlays.light.size > 0 || singleOverlayImages.dark !== null || singleOverlayImages.light !== null) {
                warningEl.textContent = `Missing: ${missing.join(' and ')}`;
                warningEl.classList.remove('hidden');
            } else {
                warningEl.classList.add('hidden');
            }
        } else {
            warningEl.classList.add('hidden');
        }
    }
}

function setupGenerateButton() {
    generateBtn.addEventListener('click', generateTheme);
}

// ===== Core Image Processing =====
async function generateTheme() {
    if (!backgroundImage) return;

    const targetVersion = exportVersion;
    const requestId = ++generationRequest;
    if (requestId !== generationRequest || targetVersion !== exportVersion) return;

    try {
        clearGeneratedTheme();

        // TelephonyUI-10 uses 12 keypad positions; the hidden v8 fallback uses 10.
        const photoSlices = splitPhoto(backgroundImage, targetVersion === '10' ? 12 : 10);

        // Get overlay slices based on mode
        let overlaySlices;
        if (targetVersion === '10') {
            const overlaySlicesByAppearance = {};
            for (const appearance of Object.keys(V10_APPEARANCES)) {
                if (overlayMode === 'single' && singleOverlayImages[appearance]) {
                    overlaySlicesByAppearance[appearance] = splitOverlayFixed(
                        singleOverlayImages[appearance],
                        V10_OUTPUT_WIDTH,
                        V10_OUTPUT_HEIGHT,
                        true,
                        overlayTransforms[appearance]
                    );
                } else if (overlayMode === 'multiple' && separateOverlays[appearance].size === V10_KEY_DEFINITIONS.length) {
                    overlaySlicesByAppearance[appearance] = V10_KEY_DEFINITIONS.map(({ key }) =>
                        transformOverlaySlice(
                            separateOverlays[appearance].get(key),
                            V10_OUTPUT_WIDTH,
                            V10_OUTPUT_HEIGHT,
                            overlayTransforms[appearance]
                        )
                    );
                } else {
                    return;
                }
            }
            generateV10Images(photoSlices, overlaySlicesByAppearance);
        } else {
            if (overlayMode === 'single' && !singleOverlayImages.dark) return;
            if (overlayMode === 'multiple' && separateOverlays.dark.size !== 10) return;
            const overlaySlices = overlayMode === 'single'
                ? splitOverlayFixed(singleOverlayImages.dark, OUTPUT_WIDTH, OUTPUT_HEIGHT, false, overlayTransforms.dark)
                : OVERLAY_FILENAMES.map((filename, index) =>
                    transformOverlaySlice(separateOverlays.dark.get(String(index)), OUTPUT_WIDTH, OUTPUT_HEIGHT, overlayTransforms.dark)
                );
            generateV8Images(photoSlices, overlaySlices);
        }

        generatedVersion = targetVersion;
        updateAppearanceControls();
        renderPreview();
        previewSection.classList.add('visible');
    } catch (error) {
        console.error('Theme generation failed:', error);
        const message = error.message || 'unknown error';
        const isTaintedCanvas = message.includes('Tainted canvases') || error.name === 'SecurityError';
        showGenerationError(isTaintedCanvas
            ? 'Theme generation was blocked because an image came from another origin. Run the app through a local HTTP server (for example: python3 -m http.server 8080) and make sure the complete "TelephonyUI-10 Default" directory is deployed beside it.'
            : `Theme generation failed: ${message}`);
    }
}

function generateV8Images(photoSlices, overlaySlices) {
    photoSlices.forEach((photoSlice, index) => {
        const filename = OVERLAY_FILENAMES[index];
        const overlaySlice = overlaySlices[index];

        // Resize and crop photo slice to output dimensions
        const resizedPhoto = resizeAndCrop(photoSlice, OUTPUT_WIDTH, OUTPUT_HEIGHT);

        // Use overlay slice as-is (no resizing for overlays to preserve their original content)
        const overlayToUse = overlaySlice;

        // Composite overlay on top
        const final = compositeOverlay(resizedPhoto, overlayToUse, OUTPUT_WIDTH, OUTPUT_HEIGHT);

        // Store result
        generatedImages.push({
            key: index,
            filename: filename,
            dataUrl: final.toDataURL('image/png')
        });
    });
}

function generateV10Images(photoSlices, overlaySlicesByAppearance) {
    V10_KEY_DEFINITIONS.forEach(({ key }, keyIndex) => {
        Object.entries(V10_APPEARANCES).forEach(([appearance, assetType]) => {
            const base = compositeOverlay(
                resizeAndCrop(photoSlices[keyIndex], V10_OUTPUT_WIDTH, V10_OUTPUT_HEIGHT),
                overlaySlicesByAppearance[appearance][keyIndex],
                V10_OUTPUT_WIDTH,
                V10_OUTPUT_HEIGHT
            );

            ['normal', 'highlighted'].forEach(state => {
                const filename = getV10AssetFilename(key, state, assetType);

                generatedImages.push({
                    key,
                    filename,
                    appearance,
                    state,
                    dataUrl: base.toDataURL('image/png')
                });
            });
        });
    });
}

function renderPreview() {
    const isV10 = generatedVersion === '10';
    const displayOrder = isV10
        ? ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#']
        : [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

    previewGrid.innerHTML = '';
    previewGrid.classList.toggle('v10-grid', isV10);
    previewGrid.classList.toggle('preview-light', isV10 && previewAppearance === 'light');
    displayOrder.forEach(key => {
        const img = isV10
            ? generatedImages.find(g => g.key === key && g.appearance === previewAppearance && g.state === 'normal')
            : generatedImages.find(g => g.key === key);
        if (img) {
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';
            previewItem.dataset.key = key;
            previewItem.innerHTML = `
                <img src="${img.dataUrl}" alt="Key ${key}">
                <div class="label">${key}</div>
            `;
            previewGrid.appendChild(previewItem);
        }
    });
}

function clearGeneratedTheme() {
    generatedImages = [];
    generatedVersion = null;
    previewGrid.innerHTML = '';
    previewGrid.classList.remove('v10-grid', 'preview-light');
    updateAppearanceControls();
}

function showGenerationError(message) {
    if (!generateWarning) return;
    generateWarning.textContent = message;
    generateWarning.classList.remove('hidden');
}

function getV10AssetFilename(key, state, assetType) {
    const definition = V10_KEY_DEFINITIONS.find(item => item.key === key);
    const statePart = state === 'highlighted' ? '-hi' : '-';
    return `${definition.prefix}${statePart}-${assetType}.png`;
}

function createBlankOverlaySlice() {
    const canvas = document.createElement('canvas');
    canvas.width = V10_OUTPUT_WIDTH;
    canvas.height = V10_OUTPUT_HEIGHT;
    return canvas;
}

function transformOverlaySlice(image, outputWidth, outputHeight, transform) {
    const canvas = document.createElement('canvas');
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const ctx = canvas.getContext('2d');
    const scale = transform.scale / 100;
    const rotation = transform.rotation * Math.PI / 180;

    ctx.translate(outputWidth / 2 - transform.posX, outputHeight / 2 - transform.posY);
    ctx.rotate(rotation);
    ctx.drawImage(
        image,
        -(image.width * scale) / 2,
        -(image.height * scale) / 2,
        image.width * scale,
        image.height * scale
    );

    return canvas;
}

function splitPhoto(image, sliceCount = 10) {
    const slices = [];
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Split horizontally (left to right)
    const sliceWidth = image.width / sliceCount;
    canvas.width = sliceWidth;
    canvas.height = image.height;

    for (let i = 0; i < sliceCount; i++) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(
            image,
            i * sliceWidth, 0, sliceWidth, image.height,
            0, 0, sliceWidth, image.height
        );

        // Create a new canvas for this slice
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = sliceWidth;
        sliceCanvas.height = image.height;
        const sliceCtx = sliceCanvas.getContext('2d');
        sliceCtx.drawImage(canvas, 0, 0);
        slices.push(sliceCanvas);
    }

    return slices;
}

// Split overlay into 10 sections matching passcode grid layout (3x4 grid with 0 centered)
// Layout:  1 2 3
//          4 5 6
//          7 8 9
//            0
function splitOverlayFixed(image, outputWidth = OUTPUT_WIDTH, outputHeight = OUTPUT_HEIGHT, includeSpecialKeys = false, transform = overlayTransforms.dark) {
    const slices = [];

    // Get scale from slider (default 100%)
    const scale = transform.scale / 100;

    // Get rotation
    const rotation = transform.rotation;

    // Get X/Y offsets from sliders
    const posX = transform.posX;
    const posY = transform.posY;

    // Scale the image first
    const scaledWidth = Math.round(image.width * scale);
    const scaledHeight = Math.round(image.height * scale);

    // Calculate Bounding Box of Rotated Image
    const rad = rotation * Math.PI / 180;
    const absCos = Math.abs(Math.cos(rad));
    const absSin = Math.abs(Math.sin(rad));
    const rotatedWidth = Math.round((scaledWidth * absCos) + (scaledHeight * absSin));
    const rotatedHeight = Math.round((scaledWidth * absSin) + (scaledHeight * absCos));

    // Create canvas for rotated image
    const scaledCanvas = document.createElement('canvas');
    scaledCanvas.width = rotatedWidth;
    scaledCanvas.height = rotatedHeight;
    const scaledCtx = scaledCanvas.getContext('2d');

    // Draw rotated image centered in canvas
    scaledCtx.translate(rotatedWidth / 2, rotatedHeight / 2);
    scaledCtx.rotate(rad);
    scaledCtx.drawImage(image, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);

    // Grid layout: 3 columns, 4 rows (last row has only center cell for 0)
    const gridCols = 3;
    const gridRows = 4;
    const totalWidth = outputWidth * gridCols;
    const totalHeight = outputHeight * gridRows;

    // Calculate offset to center the grid on the rotated image
    // Subtract user offsets to move the crop region
    const offsetX = Math.round((rotatedWidth - totalWidth) / 2) - posX;
    const offsetY = Math.round((rotatedHeight - totalHeight) / 2) - posY;

    // Define grid positions for each key (0-9)
    // Key index -> [column, row]
    // Middle column (col 1) keys need 305px width
    const keyPositions = includeSpecialKeys
        ? Object.fromEntries(V10_KEY_DEFINITIONS.map(({ key, position }) => [key, position]))
        : {
        '*': [0, 3],
        '#': [2, 3],
        0: [1, 3],  // Center of row 4 (middle column)
        1: [0, 0],  // Row 1
        2: [1, 0],  // Middle column
        3: [2, 0],
        4: [0, 1],  // Row 2
        5: [1, 1],  // Middle column
        6: [2, 1],
        7: [0, 2],  // Row 3
        8: [1, 2],  // Middle column
        9: [2, 2]
        };

    const keys = includeSpecialKeys ? ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '#'] : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

    // Generate slices in the same order as the output definitions.
    for (const key of keys) {
        const [col, row] = keyPositions[key];

        const canvas = document.createElement('canvas');
        canvas.width = outputWidth;
        canvas.height = outputHeight;
        const ctx = canvas.getContext('2d');

        // Calculate source position on scaled image
        const sx = Math.round(offsetX + (col * outputWidth));
        const sy = Math.round(offsetY + (row * outputHeight));

        // Draw the section from the scaled image
        ctx.drawImage(
            scaledCanvas,
            sx, sy, outputWidth, outputHeight,
            0, 0, outputWidth, outputHeight
        );

        slices.push(canvas);
    }

    return slices;
}

function resizeAndCrop(slice, targetWidth, targetHeight) {
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');

    const sourceWidth = slice.width;
    const sourceHeight = slice.height;

    // Calculate scale to cover the target area
    const scale = Math.max(targetWidth / sourceWidth, targetHeight / sourceHeight);

    // Calculate scaled dimensions
    const scaledWidth = sourceWidth * scale;
    const scaledHeight = sourceHeight * scale;

    // Center the image (crop from center)
    const offsetX = (targetWidth - scaledWidth) / 2;
    const offsetY = (targetHeight - scaledHeight) / 2;

    // Draw with cover behavior
    ctx.drawImage(slice, offsetX, offsetY, scaledWidth, scaledHeight);

    return canvas;
}

function compositeOverlay(base, overlay, width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Draw base image
    ctx.drawImage(base, 0, 0);

    // Draw overlay on top (centered if overlay is different size)
    const overlayX = (width - overlay.width) / 2;
    const overlayY = (height - overlay.height) / 2;
    ctx.drawImage(overlay, overlayX, overlayY);

    return canvas;
}
// ===== Download =====
const exportFilenameInput = document.getElementById('exportFilename');

function getExportFilename(extension) {
    const baseName = exportFilenameInput.value.trim() || `TelephonyUI-${exportVersion}`;
    return `${baseName}.${extension}`;
}

function setupVersionToggle() {
    const versionButtons = [versionBtn8, versionBtn10];
    versionButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            versionButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            exportVersion = btn.dataset.version;
            exportFilenameInput.value = `TelephonyUI-${exportVersion}`;
            appearanceToggle.classList.toggle('hidden', exportVersion !== '10');
            v10ExportNote.classList.toggle('hidden', exportVersion !== '10');
            clearGeneratedTheme();
            generateTheme();
        });
    });
}

function setupAppearanceToggle() {
    appearanceButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            appearanceButtons.forEach(button => button.classList.remove('active'));
            btn.classList.add('active');
            previewAppearance = btn.dataset.appearance;
            syncPositionControls();
            if (generatedVersion === '10') renderPreview();
        });
    });
}

function updateAppearanceControls() {
    const v10PreviewReady = exportVersion === '10' && generatedVersion === '10';
    appearanceToggle.classList.toggle('hidden', !v10PreviewReady);
    v10ExportNote.classList.toggle('hidden', exportVersion !== '10');
    appearanceButtons.forEach(button => {
        button.disabled = !v10PreviewReady;
    });
}

function setupDownloadButton() {
    downloadBtn.addEventListener('click', () => downloadAll(getExportFilename('zip')));
}

function setupDownloadPassthmButton() {
    downloadPassthmBtn.addEventListener('click', () => downloadAll(getExportFilename('passthm')));
}

async function downloadAll(filename) {
    if (generatedImages.length === 0) return;

    const zip = new JSZip();

    // Add each image to the zip
    for (const img of generatedImages) {
        const base64Data = img.dataUrl.split(',')[1];
        zip.file(img.filename, base64Data, { base64: true });
    }

    // Add credit file
    zip.file("spy_g.txt", "Made with PassThemer\nhttps://github.com/SpyGdev/PassThemer");

    // Generate and download zip
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ===== Start =====
init();
