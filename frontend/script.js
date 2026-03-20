const grid = document.getElementById("grid");

// Create grid
for (let i = 0; i < 81; i++) {
    const input = document.createElement("input");
    input.type = "text";
    input.maxLength = 1;
    input.classList.add("cell");
    input.id = "cell-" + i;

    // Allow only numbers 1–9
    input.addEventListener("input", () => {
        if (!/^[1-9]?$/.test(input.value)) {
            input.value = "";
        }
    });

    grid.appendChild(input);
}

// Get board
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

// Display solution
function displaySolution(solution, original) {
    const container = document.getElementById("solution");
    container.innerHTML = "";

    solution.forEach((row, i) => {
        const rowDiv = document.createElement("div");
        rowDiv.classList.add("solution-row");

        row.forEach((num, j) => {
            const cell = document.createElement("div");
            cell.classList.add("solution-cell");

            if (original[i][j] !== 0) {
                cell.classList.add("original");
            } else {
                cell.classList.add("solved");
            }

            cell.textContent = num;
            rowDiv.appendChild(cell);
        });

        container.appendChild(rowDiv);
    });
}

// Solve
async function solveSudoku() {
    const board = getBoard();

    try {
        const response = await fetch("http://127.0.0.1:5000/solve", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ board: board })
        });

        const data = await response.json();
        displaySolution(data.solution, board);

    } catch (error) {
        alert("Backend not running!");
    }
}

function resetGrid() {
    const inputs = document.querySelectorAll(".cell");

    inputs.forEach(input => {
        input.value = "";
    });

    document.getElementById("solution").innerHTML = "";
}