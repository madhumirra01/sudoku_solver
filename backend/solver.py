def is_valid(board, row, col, num):
    for i in range(9):
        if board[row][i] == num or board[i][col] == num:
            return False

    start_row, start_col = 3 * (row // 3), 3 * (col // 3)

    for i in range(3):
        for j in range(3):
            if board[start_row + i][start_col + j] == num:
                return False

    return True


def solve_sudoku_with_steps(board):
    import copy
    steps = []
    working = copy.deepcopy(board)

    def backtrack():
        for row in range(9):
            for col in range(9):
                if working[row][col] == 0:
                    for num in range(1, 10):
                        if is_valid(working, row, col, num):
                            working[row][col] = num
                            steps.append({"row": row, "col": col, "val": num, "type": "place"})
                            if backtrack():
                                return True
                            working[row][col] = 0
                            steps.append({"row": row, "col": col, "val": 0, "type": "backtrack"})
                    return False
        return True

    success = backtrack()
    return success, working, steps


def analyze_puzzle(board):
    import copy

    given = sum(1 for r in range(9) for c in range(9) if board[r][c] != 0)
    empty = 81 - given

    total_candidates = 0
    naked_singles = 0

    for row in range(9):
        for col in range(9):
            if board[row][col] == 0:
                candidates = [n for n in range(1, 10) if is_valid(board, row, col, n)]
                total_candidates += len(candidates)
                if len(candidates) == 1:
                    naked_singles += 1

    avg_candidates = round(total_candidates / empty, 2) if empty > 0 else 0

    test_board = copy.deepcopy(board)
    _, _, steps = solve_sudoku_with_steps(test_board)
    backtracks = sum(1 for s in steps if s["type"] == "backtrack")

    if backtracks > 500 or given < 28:
        difficulty = "Expert"
    elif backtracks > 100 or given < 36:
        difficulty = "Hard"
    elif backtracks > 20 or given < 50:
        difficulty = "Medium"
    else:
        difficulty = "Easy"

    return {
        "given_cells": given,
        "empty_cells": empty,
        "avg_candidates": avg_candidates,
        "naked_singles": naked_singles,
        "total_steps": len(steps),
        "backtracks": backtracks,
        "difficulty": difficulty,
    }