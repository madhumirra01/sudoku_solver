const grid = document.getElementById("grid");
let animationTimer = null;
let isAnimating = false;

// Build grid
for (let i = 0; i < 81; i++) {
    const input = document.createElement("input");
    input.type = "text";
    input.maxLength = 1;
    input.classList.add("cell");
    input.id = "cell-" + i;
    input.addEventListener("input", () => {
        if (!/^[1-9]?$/.test(input.value)) input.value = "";
        highlightConflicts();
    });
    grid.appendChild(input);
}

function getBoard() {
    let board = [];
    for (let i = 0; i < 9; i++) {
        let row = [];
        for (let j = 0; j < 9; j++) {
            let val = document.getElementById(`cell-${i * 9 + j}`).value;
            row.push(val === "" ? 0 : parseInt(val));
        }
        board.push(row);
    }
    return board;
}

function highlightConflicts() {
    document.querySelectorAll(".cell").forEach(c => c.classList.remove("conflict"));
    const board = getBoard();

    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            const val = board[row][col];
            if (val === 0) continue;
            let conflict = false;

            for (let c = 0; c < 9; c++) if (c !== col && board[row][c] === val) conflict = true;
            for (let r = 0; r < 9; r++) if (r !== row && board[r][col] === val) conflict = true;

            const br = Math.floor(row / 3) * 3, bc = Math.floor(col / 3) * 3;
            for (let r = br; r < br + 3; r++)
                for (let c = bc; c < bc + 3; c++)
                    if ((r !== row || c !== col) && board[r][c] === val) conflict = true;

            if (conflict) document.getElementById(`cell-${row * 9 + col}`).classList.add("conflict");
        }
    }
}

async function analyzePuzzle() {
    const board = getBoard();
    if (board.flat().every(v => v === 0)) { alert("Enter some numbers first!"); return; }

    try {
        const res = await fetch("http://127.0.0.1:5000/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ board })
        });
        showStats(await res.json(), null, null, null);
    } catch { alert("Backend not running!"); }
}

async function solveSudoku() {
    if (isAnimating) { stopAnimation(); return; }
    const board = getBoard();
    const t0 = performance.now();

    try {
        const res = await fetch("http://127.0.0.1:5000/solve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ board })
        });
        const data = await res.json();
        if (data.error) { alert(data.error); return; }

        const elapsed = ((performance.now() - t0) / 1000).toFixed(3) + "s";
        displaySolution(data.solution, data.original);
        showStats(null, elapsed, data.steps.length, data.steps.filter(s => s.type === "backtrack").length);
    } catch { alert("Backend not running!"); }
}

async function solveAnimated() {
    if (isAnimating) { stopAnimation(); return; }
    const board = getBoard();

    try {
        const res = await fetch("http://127.0.0.1:5000/solve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ board })
        });
        const data = await res.json();
        if (data.error) { alert(data.error); return; }

        const { original, steps, solution } = data;

        document.querySelectorAll(".cell").forEach(c => c.disabled = true);
        isAnimating = true;
        document.getElementById("speedControl").classList.remove("hidden");
        document.getElementById("progressWrap").classList.remove("hidden");
        document.getElementById("solution").innerHTML = "";

        const speedMap = { 1: 30, 2: 15, 3: 6, 4: 2, 5: 0 };
        let stepIndex = 0;

        function nextStep() {
            if (!isAnimating || stepIndex >= steps.length) {
                finishAnimation(solution, original, steps);
                return;
            }

            const speed = parseInt(document.getElementById("speedSlider").value);
            const batchSize = speed === 5 ? 300 : 1;

            for (let b = 0; b < batchSize && stepIndex < steps.length; b++) {
                const step = steps[stepIndex];
                if (original[step.row][step.col] === 0) {
                    const cellEl = document.getElementById(`cell-${step.row * 9 + step.col}`);
                    cellEl.value = step.val === 0 ? "" : step.val;
                    cellEl.classList.remove("anim-place", "anim-backtrack");
                    cellEl.classList.add(step.type === "place" ? "anim-place" : "anim-backtrack");
                }
                stepIndex++;
            }

            const pct = Math.round((stepIndex / steps.length) * 100);
            document.getElementById("progressBar").style.width = pct + "%";
            document.getElementById("progressText").textContent = pct + "%";

            const delay = speedMap[parseInt(document.getElementById("speedSlider").value)] ?? 6;
            animationTimer = delay === 0 ? requestAnimationFrame(nextStep) : setTimeout(nextStep, delay);
        }

        nextStep();
    } catch { alert("Backend not running!"); }
}

function finishAnimation(solution, original, steps) {
    isAnimating = false;
    document.querySelectorAll(".cell").forEach(c => {
        c.disabled = false;
        c.classList.remove("anim-place", "anim-backtrack");
        c.classList.add("anim-done");
    });
    displaySolution(solution, original);
    document.getElementById("progressBar").style.width = "100%";
    document.getElementById("progressText").textContent = "100%";
    showStats(null, null, steps.length, steps.filter(s => s.type === "backtrack").length);
}

function stopAnimation() {
    isAnimating = false;
    clearTimeout(animationTimer);
    cancelAnimationFrame(animationTimer);
    document.querySelectorAll(".cell").forEach(c => {
        c.disabled = false;
        c.classList.remove("anim-place", "anim-backtrack");
    });
    document.getElementById("speedControl").classList.add("hidden");
    document.getElementById("progressWrap").classList.add("hidden");
}

function showStats(analyzeData, solveTime, totalSteps, backtracks) {
    document.getElementById("statsPanel").classList.remove("hidden");

    if (analyzeData) {
        const el = document.getElementById("statDifficulty");
        el.textContent = analyzeData.difficulty;
        el.setAttribute("data-level", analyzeData.difficulty);
        document.getElementById("statGiven").textContent = analyzeData.given_cells;
        document.getElementById("statEmpty").textContent = analyzeData.empty_cells;
        document.getElementById("statBacktracks").textContent = analyzeData.backtracks ?? "—";
        document.getElementById("statSteps").textContent = analyzeData.total_steps ?? "—";
    }
    if (solveTime != null) document.getElementById("statTime").textContent = solveTime;
    if (totalSteps != null) document.getElementById("statSteps").textContent = totalSteps;
    if (backtracks != null) document.getElementById("statBacktracks").textContent = backtracks;
}

function displaySolution(solution, original) {
    const container = document.getElementById("solution");
    container.innerHTML = "";
    const sGrid = document.createElement("div");
    sGrid.classList.add("solution-grid");

    solution.forEach((row, i) => {
        row.forEach((num, j) => {
            const cell = document.createElement("div");
            cell.classList.add("solution-cell", original[i][j] !== 0 ? "original" : "solved");
            cell.style.animationDelay = `${(i * 9 + j) * 8}ms`;
            cell.textContent = num;
            sGrid.appendChild(cell);
        });
    });

    container.appendChild(sGrid);
}

function resetGrid() {
    stopAnimation();
    document.querySelectorAll(".cell").forEach(c => {
        c.value = "";
        c.disabled = false;
        c.classList.remove("conflict", "anim-place", "anim-backtrack", "anim-done");
    });
    document.getElementById("solution").innerHTML = "";
    document.getElementById("statsPanel").classList.add("hidden");
    document.getElementById("speedControl").classList.add("hidden");
    document.getElementById("progressWrap").classList.add("hidden");
    document.getElementById("progressBar").style.width = "0%";
    document.getElementById("progressText").textContent = "0%";
}

document.getElementById("speedSlider").addEventListener("input", (e) => {
    const labels = { 1: "Slow", 2: "Normal", 3: "Fast", 4: "Very Fast", 5: "Instant" };
    document.getElementById("speedLabel").textContent = labels[e.target.value];
});