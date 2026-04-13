const runBtn = document.getElementById("run-btn");
const labelSpan = document.getElementById("label");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const predictionDiv = document.getElementById("prediction");
const faceDiv = document.getElementById("face");
const streakCount = document.getElementById("streak-count");

let running = false;
let streak = 0;

// Build a simple network diagram: layers of dots with connecting lines.
const layers = [6, 5, 5, 4];
const nodesGroup = document.getElementById("nodes");
const edgesGroup = document.getElementById("edges");
const svgNS = "http://www.w3.org/2000/svg";
const layerPositions = [];

layers.forEach((count, li) => {
    const x = 20 + li * 55;
    const positions = [];
    const spacing = 180 / (count + 1);
    for (let i = 0; i < count; i++) {
        const y = 20 + spacing * (i + 1);
        positions.push({ x, y });
        const c = document.createElementNS(svgNS, "circle");
        c.setAttribute("cx", x);
        c.setAttribute("cy", y);
        c.setAttribute("r", 5);
        c.setAttribute("fill", "#4a90d9");
        nodesGroup.appendChild(c);
    }
    layerPositions.push(positions);
});

for (let li = 0; li < layerPositions.length - 1; li++) {
    layerPositions[li].forEach(a => {
        layerPositions[li + 1].forEach(b => {
            const line = document.createElementNS(svgNS, "line");
            line.setAttribute("x1", a.x);
            line.setAttribute("y1", a.y);
            line.setAttribute("x2", b.x);
            line.setAttribute("y2", b.y);
            edgesGroup.appendChild(line);
        });
    });
}

function pulseNetwork() {
    const circles = nodesGroup.querySelectorAll("circle");
    circles.forEach((c, i) => {
        setTimeout(() => {
            c.setAttribute("fill", "#ffcc00");
            setTimeout(() => c.setAttribute("fill", "#4a90d9"), 300);
        }, i * 30);
    });
}

async function loadAndPredict() {
    // Load image
    const imgRes = await fetch("/image");
    const imgData = await imgRes.json();

    labelSpan.textContent = imgData.label;

    const imageData = ctx.createImageData(32, 32);
    for (let row = 0; row < 32; row++) {
        for (let col = 0; col < 32; col++) {
            const i = (row * 32 + col) * 4;
            imageData.data[i]     = Math.round(imgData.image[0][row][col] * 255); // R
            imageData.data[i + 1] = Math.round(imgData.image[1][row][col] * 255); // G
            imageData.data[i + 2] = Math.round(imgData.image[2][row][col] * 255); // B
            imageData.data[i + 3] = 255;
        }
    }
    ctx.putImageData(imageData, 0, 0);

    // Predict
    pulseNetwork();
    const predRes = await fetch(`/predict?index=${imgData.index}`);
    const predData = await predRes.json();

    predictionDiv.textContent = predData.prediction;

    const correct = predData.prediction === imgData.label;
    faceDiv.textContent = correct ? "🙂" : "☹️";

    if (correct) {
        streak++;
        streakCount.textContent = streak;
    }

    return correct;
}

async function runLoop() {
    running = true;
    runBtn.textContent = "Stop";
    streak = 0;
    streakCount.textContent = 0;

    while (running) {
        const correct = await loadAndPredict();
        if (!correct) {
            running = false;
            runBtn.textContent = "Run";
            return;
        }
        // Brief pause so you can see each result before moving on
        await new Promise(r => setTimeout(r, 500));
    }

    // Stopped manually
    runBtn.textContent = "Run";
}

runBtn.addEventListener("click", () => {
    if (running) {
        running = false;
    } else {
        runLoop();
    }
});