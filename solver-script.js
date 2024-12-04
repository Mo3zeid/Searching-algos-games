// solver-script.js

class Sudoku {
    constructor() {
        this.boardElement = document.getElementById('sudokuBoard');
        this.difficultySelector = document.getElementById('difficulty');
        this.actionStack = [];
        this.redoStack = [];
        this.initializeBoard();
        this.bindEvents();
        this.generateNewPuzzle();
    }

    initializeBoard() {
        this.boardElement.innerHTML = '';
        this.cells = [];
        for (let r = 0; r < 9; r++) {
            this.cells[r] = [];
            for (let c = 0; c < 9; c++) {
                const cell = document.createElement('div');
                cell.classList.add('sudoku-cell');
                cell.setAttribute('role', 'gridcell');
                cell.setAttribute('aria-rowindex', r + 1);
                cell.setAttribute('aria-colindex', c + 1);
                this.boardElement.appendChild(cell);
                this.cells[r][c] = cell;
            }
        }
    }

    bindEvents() {
        document.getElementById('generatePuzzle').addEventListener('click', () => {
            this.generateNewPuzzle();
        });

        document.getElementById('startSolve').addEventListener('click', async () => {
            await this.solvePuzzle();
        });

        document.getElementById('undoButton').addEventListener('click', () => {
            this.undo();
        });

        document.getElementById('redoButton').addEventListener('click', () => {
            this.redo();
        });
    }

    generateNewPuzzle() {
        const difficulty = this.difficultySelector.value;
        this.completedBoard = this.generateFullBoard();
        this.puzzleState = this.createPlayablePuzzle(this.completedBoard, difficulty);
        this.actionStack = [];
        this.redoStack = [];
        this.setupPuzzle(this.puzzleState);
    }

    setupPuzzle(puzzle) {
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const cell = this.cells[r][c];
                const val = puzzle[r][c];
                cell.textContent = val !== 0 ? val : '';
                cell.classList.remove('preset', 'conflict', 'selected');
                cell.contentEditable = false;
                if (val !== 0) {
                    cell.classList.add('preset');
                } else {
                    cell.contentEditable = true;
                    cell.addEventListener('focus', () => cell.classList.add('selected'));
                    cell.addEventListener('blur', () => cell.classList.remove('selected'));
                    cell.addEventListener('input', (e) => this.handleInput(e, r, c));
                }
            }
        }
    }

    handleInput(e, row, col) {
        const input = parseInt(e.target.textContent);
        const oldValue = this.puzzleState[row][col];
        if (isNaN(input) || input < 1 || input > 9) {
            e.target.textContent = '';
            this.puzzleState[row][col] = 0;
        } else {
            this.puzzleState[row][col] = input;
        }
        this.recordAction(row, col, oldValue, this.puzzleState[row][col]);
        this.highlightConflicts(row, col, input);
    }

    highlightConflicts(row, col, num) {
        // Clear all conflicts
        this.cells.flat().forEach(cell => cell.classList.remove('conflict'));
        if (num === 0) return;

        // Check for conflicts in row, column, and block
        for (let i = 0; i < 9; i++) {
            if (i !== col && this.puzzleState[row][i] === num) {
                this.cells[row][i].classList.add('conflict');
                this.cells[row][col].classList.add('conflict');
            }
            if (i !== row && this.puzzleState[i][col] === num) {
                this.cells[i][col].classList.add('conflict');
                this.cells[row][col].classList.add('conflict');
            }
        }

        const startR = Math.floor(row / 3) * 3;
        const startC = Math.floor(col / 3) * 3;
        for (let r = startR; r < startR + 3; r++) {
            for (let c = startC; c < startC + 3; c++) {
                if ((r !== row || c !== col) && this.puzzleState[r][c] === num) {
                    this.cells[r][c].classList.add('conflict');
                    this.cells[row][col].classList.add('conflict');
                }
            }
        }
    }

    recordAction(row, col, oldValue, newValue) {
        this.actionStack.push({ row, col, oldValue, newValue });
        this.redoStack = [];
    }

    undo() {
        if (this.actionStack.length > 0) {
            const action = this.actionStack.pop();
            this.puzzleState[action.row][action.col] = action.oldValue;
            this.redoStack.push(action);
            this.cells[action.row][action.col].textContent = action.oldValue !== 0 ? action.oldValue : '';
            this.highlightConflicts(action.row, action.col, action.oldValue);
        }
    }

    redo() {
        if (this.redoStack.length > 0) {
            const action = this.redoStack.pop();
            this.puzzleState[action.row][action.col] = action.newValue;
            this.actionStack.push(action);
            this.cells[action.row][action.col].textContent = action.newValue !== 0 ? action.newValue : '';
            this.highlightConflicts(action.row, action.col, action.newValue);
        }
    }

    // Helper function to check if placing a number is valid
    isValid(board, r, c, n) {
        for (let i = 0; i < 9; i++) {
            if (board[r][i] === n && i !== c) return false;
            if (board[i][c] === n && i !== r) return false;
        }
        const startR = Math.floor(r / 3) * 3;
        const startC = Math.floor(c / 3) * 3;
        for (let i = startR; i < startR + 3; i++) {
            for (let j = startC; j < startC + 3; j++) {
                if (board[i][j] === n && (i !== r || j !== c)) return false;
            }
        }
        return true;
    }

    generateFullBoard() {
        const board = Array.from({ length: 9 }, () => Array(9).fill(0));

        const fillBoard = () => {
            const emptyCell = this.findEmptyCell(board);
            if (!emptyCell) return true;
            const { row, col } = emptyCell;
            const nums = this.shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
            for (const n of nums) {
                if (this.isValid(board, row, col, n)) {
                    board[row][col] = n;
                    if (fillBoard()) return true;
                    board[row][col] = 0;
                }
            }
            return false;
        };

        fillBoard();
        return board;
    }

    createPlayablePuzzle(board, difficulty = 'medium') {
        const puzzle = board.map(row => [...row]);
        const difficultyLevels = { 'easy': 35, 'medium': 45, 'hard': 55 };
        let cellsToRemove = difficultyLevels[difficulty];
        while (cellsToRemove > 0) {
            const r = Math.floor(Math.random() * 9);
            const c = Math.floor(Math.random() * 9);
            if (puzzle[r][c] !== 0) {
                const backup = puzzle[r][c];
                puzzle[r][c] = 0;
                if (!this.hasUniqueSolution(puzzle)) {
                    puzzle[r][c] = backup;
                } else {
                    cellsToRemove--;
                }
            }
        }
        return puzzle;
    }

    hasUniqueSolution(puzzle) {
        let solutionCount = 0;

        const solve = (board) => {
            const emptyCell = this.findEmptyCell(board);
            if (!emptyCell) {
                solutionCount++;
                return solutionCount <= 1;
            }
            const { row, col } = emptyCell;
            for (let n = 1; n <= 9; n++) {
                if (this.isValid(board, row, col, n)) {
                    board[row][col] = n;
                    if (!solve(board)) return false;
                    board[row][col] = 0;
                }
            }
            return true;
        };

        const boardCopy = puzzle.map(row => [...row]);
        solve(boardCopy);
        return solutionCount === 1;
    }

    findEmptyCell(board) {
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (board[r][c] === 0) {
                    return { row: r, col: c };
                }
            }
        }
        return null;
    }

    shuffleArray(array) {
        return array.sort(() => Math.random() - 0.5);
    }

    async solvePuzzle() {
        const board = this.puzzleState.map(row => [...row]);
        const possibleValues = this.createPossibleValues(board);

        const solve = async () => {
            const cell = this.selectUnassignedCell(possibleValues);
            if (!cell) return true;
            const { row, col } = cell;
            for (const n of possibleValues[row][col]) {
                if (this.isValid(board, row, col, n)) {
                    board[row][col] = n;
                    const oldPossibleValues = JSON.stringify(possibleValues);
                    this.updatePossibleValues(possibleValues, row, col, n);

                    this.puzzleState[row][col] = n;
                    this.cells[row][col].textContent = n;
                    await this.delay(20);

                    if (await solve()) return true;

                    board[row][col] = 0;
                    this.puzzleState[row][col] = 0;
                    this.cells[row][col].textContent = '';
                    Object.assign(possibleValues, JSON.parse(oldPossibleValues));
                    await this.delay(20);
                }
            }
            return false;
        };

        await solve();
    }

    createPossibleValues(board) {
        const possibleValues = [];
        for (let r = 0; r < 9; r++) {
            possibleValues[r] = [];
            for (let c = 0; c < 9; c++) {
                if (board[r][c] === 0) {
                    possibleValues[r][c] = this.getPossibleNumbers(board, r, c);
                } else {
                    possibleValues[r][c] = [];
                }
            }
        }
        return possibleValues;
    }

    getPossibleNumbers(board, row, col) {
        const candidates = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        for (let i = 0; i < 9; i++) {
            candidates.delete(board[row][i]);
            candidates.delete(board[i][col]);
        }
        const startR = Math.floor(row / 3) * 3;
        const startC = Math.floor(col / 3) * 3;
        for (let r = startR; r < startR + 3; r++) {
            for (let c = startC; c < startC + 3; c++) {
                candidates.delete(board[r][c]);
            }
        }
        return Array.from(candidates);
    }

    selectUnassignedCell(possibleValues) {
        let minCandidates = 10;
        let selectedCell = null;
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (this.puzzleState[r][c] === 0) {
                    const candidates = possibleValues[r][c];
                    if (candidates.length < minCandidates) {
                        minCandidates = candidates.length;
                        selectedCell = { row: r, col: c };
                    }
                }
            }
        }
        return selectedCell;
    }

    updatePossibleValues(possibleValues, row, col, num) {
        possibleValues[row][col] = [];
        for (let i = 0; i < 9; i++) {
            if (possibleValues[row][i]) {
                possibleValues[row][i] = possibleValues[row][i].filter(n => n !== num);
            }
            if (possibleValues[i][col]) {
                possibleValues[i][col] = possibleValues[i][col].filter(n => n !== num);
            }
        }
        const startR = Math.floor(row / 3) * 3;
        const startC = Math.floor(col / 3) * 3;
        for (let r = startR; r < startR + 3; r++) {
            for (let c = startC; c < startC + 3; c++) {
                if (possibleValues[r][c]) {
                    possibleValues[r][c] = possibleValues[r][c].filter(n => n !== num);
                }
            }
        }
    }

    delay(ms) {
        return new Promise(res => setTimeout(res, ms));
    }
}

// Initialize the Sudoku game
document.addEventListener('DOMContentLoaded', () => {
    new Sudoku();
});

// Global error handler
window.onerror = function (message, source, lineno, colno, error) {
    alert(`An error occurred: ${message} at line ${lineno}`);
    console.error(error);
};
