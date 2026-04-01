from flask import Flask, request, jsonify
from flask_cors import CORS
from solver import solve_sudoku_with_steps, analyze_puzzle
import copy

app = Flask(__name__)
CORS(app)


@app.route("/solve", methods=["POST"])
def solve():
    data = request.get_json()
    board = data["board"]
    original = copy.deepcopy(board)

    success, solution, steps = solve_sudoku_with_steps(board)

    if not success:
        return jsonify({"error": "No solution exists"}), 400

    return jsonify({
        "solution": solution,
        "steps": steps,
        "original": original
    })


@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.get_json()
    board = data["board"]
    stats = analyze_puzzle(board)
    return jsonify(stats)


if __name__ == "__main__":
    app.run(debug=True)