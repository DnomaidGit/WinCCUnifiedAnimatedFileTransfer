let animatedRunning = false;
let animatedAnimationFrame = 0;
let animatedAnimationTime = 2500;
let animatedStart = false;

const animatedRoot = document.getElementById('animatedFileTransfer');
const animatedFile = document.getElementById('movingFile');
const animatedSource = document.getElementById('sourceContainer');
const animatedDestination = document.getElementById('destinationContainer');
const animatedStatus = document.getElementById('status');

function init(result) {
    if (result) {
        updateAllText();
        resetAnimation(false);
        webccInterfaceInit();
    } else {
        console.log('Animated File Transfer: Connection NOK');
    }
}

WebCC.start(init, webccInterface.contract, EXTENSIONS, TIMEOUT);

function propertyValue(name, fallback) {
    try {
        const value = WebCC.Properties[name];
        return (value === undefined || value === null) ? fallback : value;
    } catch (e) {
        return fallback;
    }
}

function writeEnd(value) {
    try {
        if (WebCC.Properties.End !== value) {
            WebCC.Properties.End = value;
        }
    } catch (e) {
        console.log('Animated File Transfer: Error writing End: ' + e.message);
    }
}

function updateStart(value) {
    animatedStart = Boolean(value);

    if (animatedStart) {
        if (!animatedRunning && !Boolean(propertyValue('End', false))) {
            startAnimation();
        }
        return;
    }

    // Handshake reset: WinCC lowers Start after receiving End = TRUE.
    if (!animatedRunning) {
        resetAnimation(true);
    }
}

function updateAnimationTime(value) {
    const time = Number(value);
    if (Number.isFinite(time) && time >= 100) {
        animatedAnimationTime = time;
    } else {
        animatedAnimationTime = 2500;
    }
}

function updateSourceFolderName(value) {
    document.getElementById('sourceFolderName').textContent = String(value ?? 'Source');
}

function updateDestinationFolderName(value) {
    document.getElementById('destinationFolderName').textContent = String(value ?? 'Destination');
}

function updateFileName(value) {
    document.getElementById('fileName').textContent = String(value ?? 'File.txt');
}

function updateAllText() {
    updateAnimationTime(propertyValue('AnimationTime', 2500));
    updateSourceFolderName(propertyValue('SourceFolderName', 'Source'));
    updateDestinationFolderName(propertyValue('DestinationFolderName', 'Destination'));
    updateFileName(propertyValue('FileName', 'File.txt'));
}

function elementCenter(element, yFactor) {
    const r = element.getBoundingClientRect();
    const root = animatedRoot.getBoundingClientRect();
    return {
        x: r.left - root.left + r.width / 2,
        y: r.top - root.top + r.height * yFactor
    };
}

function placeFile(point, scale, rotation, opacity) {
    animatedFile.style.opacity = String(opacity);
    animatedFile.style.transform =
        'translate3d(' + (point.x - animatedFile.offsetWidth / 2) + 'px,' +
        (point.y - animatedFile.offsetHeight / 2) + 'px,0) ' +
        'scale(' + scale + ') rotate(' + rotation + 'deg)';
}

function bezier(a, b, c, t) {
    const u = 1 - t;
    return u * u * a + 2 * u * t * b + t * t * c;
}

function ease(t) {
    return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function startAnimation() {
    if (animatedRunning) return;

    const source = elementCenter(animatedSource, 0.45);
    const destination = elementCenter(animatedDestination, 0.45);

    animatedRunning = true;
    writeEnd(false);
    animatedDestination.classList.remove('active');
    animatedStatus.textContent = 'Transferring...';

    placeFile(source, 0.72, 0, 1);

    const control = {
        x: (source.x + destination.x) / 2,
        y: Math.max(30, Math.min(source.y, destination.y) - 75)
    };

    const startTime = performance.now();
    const duration = Math.max(100, animatedAnimationTime);

    function frame(now) {
        if (!animatedRunning) return;

        const raw = Math.min((now - startTime) / duration, 1);
        const t = ease(raw);
        const point = {
            x: bezier(source.x, control.x, destination.x, t),
            y: bezier(source.y, control.y, destination.y, t)
        };

        const scale = 0.72 + 0.22 * Math.sin(Math.PI * t);
        const rotation = 7 * Math.sin(Math.PI * t);
        placeFile(point, scale, rotation, 1);

        if (raw > 0.78) animatedDestination.classList.add('active');

        if (raw < 1) {
            animatedAnimationFrame = requestAnimationFrame(frame);
        } else {
            finishAnimation(destination);
        }
    }

    animatedAnimationFrame = requestAnimationFrame(frame);
}

function finishAnimation(destination) {
    animatedRunning = false;
    animatedAnimationFrame = 0;

    // File remains visible at destination to show a successful transfer.
    placeFile(destination, 0.72, 0, 1);
    animatedDestination.classList.add('active');
    animatedStatus.textContent = 'Transfer completed';

    // Handshake acknowledge to WinCC / PLC.
    writeEnd(true);
}

function resetAnimation(writeProperty) {
    if (animatedAnimationFrame) {
        cancelAnimationFrame(animatedAnimationFrame);
        animatedAnimationFrame = 0;
    }

    animatedRunning = false;
    animatedDestination.classList.remove('active');
    animatedStatus.textContent = 'Waiting...';

    const source = elementCenter(animatedSource, 0.45);
    placeFile(source, 0.72, 0, 1);

    if (writeProperty) writeEnd(false);
}

function showDemoData() {
    animatedStatus.textContent = 'Design Mode';
}

function showRuntimeData() {
    animatedStatus.textContent = 'Waiting...';
}

window.addEventListener('resize', function () {
    if (!animatedRunning) {
        if (Boolean(propertyValue('End', false))) {
            placeFile(elementCenter(animatedDestination, 0.45), 0.72, 0, 1);
        } else {
            placeFile(elementCenter(animatedSource, 0.45), 0.72, 0, 1);
        }
    }
});
