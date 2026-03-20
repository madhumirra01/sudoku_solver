from flask import Flask, request, jsonify
from flask_cors import CORS
from solver import solve_sudoku   # 👈 IMPORT

app = Flask(__name__)
CORS(app)

@app.route("/solve", methods=["POST"])
def solve():
    data = request.get_json()
    board = data["board"]

    solve_sudoku(board)

    return jsonify({"solution": board})

if __name__ == "__main__":
    app.run(debug=True)