// script.js

document.addEventListener('DOMContentLoaded', () => {
    const PLAYER_SYMBOL = 'X';
    const COMPUTER_SYMBOL = 'O';
    const PLAYER_COLOR = '#1e90ff'; // Blue
    const COMPUTER_COLOR = '#ff4500'; // Red

    let board = [['', '', ''], ['', '', ''], ['', '', '']];
    let searchMode = 'BFS'; // Default search mode

    const boardElement = document.getElementById('board');
    const searchModeSelect = document.getElementById('searchMode');
    const resetButton = document.getElementById('resetButton');

    // Initialize the game
    function initGame() {
        createBoard();
        bindEvents();
    }

    // Create the board cells
    function createBoard() {
        boardElement.innerHTML = '';
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = r;
                cell.dataset.col = c;

                const cellContent = document.createElement('div');
                cellContent.classList.add('cell-content');
                cell.appendChild(cellContent);

                cell.addEventListener('click', playerMove);
                boardElement.appendChild(cell);
            }
        }
    }

    // Bind event listeners
    function bindEvents() {
        searchModeSelect.addEventListener('change', (e) => {
            searchMode = e.target.value;
        });
        resetButton.addEventListener('click', resetBoard);
    }

    // Handle player move
    function playerMove(e) {
        const cell = e.currentTarget;
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);

        if (board[row][col] === '') {
            board[row][col] = PLAYER_SYMBOL;
            updateCell(cell, PLAYER_SYMBOL, PLAYER_COLOR);
            const winningLine = checkWinner(board, PLAYER_SYMBOL);
            if (winningLine) {
                highlightWinningLine(winningLine);
                setTimeout(() => {
                    alert('You win!');
                    disableBoard();
                }, 100);
            } else if (getEmptyCells(board).length === 0) {
                setTimeout(() => {
                    alert("It's a draw!");
                    disableBoard();
                }, 100);
            } else {
                setTimeout(computerTurn, 500); // Delay for better UX
            }
        }
    }

    // Handle computer move
    function computerTurn() {
        let move;
        switch (searchMode) {
            case 'BFS':
                move = bfsMove();
                break;
            case 'DFS':
                move = dfsMove();
                break;
            case 'UCS':
                move = aStarMove();
                break;
            case 'IDDFS':
                move = iddfsMove();
                break;
            default:
                move = bfsMove();
                break;
        }

        if (move) {
            const [row, col] = move;
            board[row][col] = COMPUTER_SYMBOL;
            const cell = document.querySelector(`.cell[data-row='${row}'][data-col='${col}']`);
            updateCell(cell, COMPUTER_SYMBOL, COMPUTER_COLOR);
            const winningLine = checkWinner(board, COMPUTER_SYMBOL);
            if (winningLine) {
                highlightWinningLine(winningLine);
                setTimeout(() => {
                    alert('Computer wins!');
                    disableBoard();
                }, 100);
            } else if (getEmptyCells(board).length === 0) {
                setTimeout(() => {
                    alert("It's a draw!");
                    disableBoard();
                }, 100);
            }
        }
    }

    // Update the cell UI
    function updateCell(cell, symbol, color) {
        const cellContent = cell.querySelector('.cell-content');
        cellContent.textContent = symbol;
        cellContent.style.color = color;
        cell.classList.add('disabled');
        cell.removeEventListener('click', playerMove);
    }

    // Disable the board
    function disableBoard() {
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.classList.add('disabled');
            cell.removeEventListener('click', playerMove);
        });
    }

    // Reset the board
    function resetBoard() {
        board = [['', '', ''], ['', '', ''], ['', '', '']];
        createBoard();
    }

    // Check for a winner
    function checkWinner(brd, symbol) {
        // Rows, columns, and diagonals
        const lines = [
            // Rows
            [[0,0], [0,1], [0,2]],
            [[1,0], [1,1], [1,2]],
            [[2,0], [2,1], [2,2]],
            // Columns
            [[0,0], [1,0], [2,0]],
            [[0,1], [1,1], [2,1]],
            [[0,2], [1,2], [2,2]],
            // Diagonals
            [[0,0], [1,1], [2,2]],
            [[0,2], [1,1], [2,0]],
        ];

        for (const line of lines) {
            if (line.every(([r, c]) => brd[r][c] === symbol)) {
                return line; // Return the winning line
            }
        }
        return null;
    }

    // Highlight the winning line
    function highlightWinningLine(line) {
        line.forEach(([r, c]) => {
            const cell = document.querySelector(`.cell[data-row='${r}'][data-col='${c}']`);
            cell.classList.add('winning-cell');
        });
    }

    // Heuristic evaluation function
    function evaluateBoard(brd) {
        if (checkWinner(brd, COMPUTER_SYMBOL)) {
            return 10;
        } else if (checkWinner(brd, PLAYER_SYMBOL)) {
            return -10;
        } else {
            return 0;
        }
    }

    // Get empty cells
    function getEmptyCells(brd) {
        const emptyCells = [];
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                if (brd[r][c] === '') {
                    emptyCells.push([r, c]);
                }
            }
        }
        return emptyCells;
    }

    // Copy the board
    function copyBoard(brd) {
        return brd.map(row => row.slice());
    }

    // BFS for computer move with heuristic
    function bfsMove() {
        const queue = [];
        queue.push({ board: copyBoard(board), move: null });
        while (queue.length > 0) {
            const { board: currentBoard, move } = queue.shift();
            if (checkWinner(currentBoard, COMPUTER_SYMBOL)) {
                return move;
            }
            const emptyCells = getEmptyCells(currentBoard);
            for (const [r, c] of emptyCells) {
                const nextBoard = copyBoard(currentBoard);
                nextBoard[r][c] = COMPUTER_SYMBOL;
                const score = evaluateBoard(nextBoard);
                if (score === 10) {
                    return move || [r, c];
                }
                queue.push({ board: nextBoard, move: move || [r, c] });
            }
        }
        return bestAvailableMove();
    }

    // DFS for computer move with heuristic
    function dfsMove() {
        const stack = [];
        stack.push({ board: copyBoard(board), move: null });
        while (stack.length > 0) {
            const { board: currentBoard, move } = stack.pop();
            if (checkWinner(currentBoard, COMPUTER_SYMBOL)) {
                return move;
            }
            const emptyCells = getEmptyCells(currentBoard);
            for (const [r, c] of emptyCells) {
                const nextBoard = copyBoard(currentBoard);
                nextBoard[r][c] = COMPUTER_SYMBOL;
                const score = evaluateBoard(nextBoard);
                if (score === 10) {
                    return move || [r, c];
                }
                stack.push({ board: nextBoard, move: move || [r, c] });
            }
        }
        return bestAvailableMove();
    }

    // A* Search for computer move
    function aStarMove() {
        const pq = new PriorityQueue((a, b) => (a.cost + a.heuristic) - (b.cost + b.heuristic));
        pq.enqueue({ board: copyBoard(board), move: null, cost: 0, heuristic: evaluateBoard(board) });
        while (!pq.isEmpty()) {
            const { board: currentBoard, move, cost } = pq.dequeue();
            const score = evaluateBoard(currentBoard);
            if (score === 10) {
                return move;
            }
            const emptyCells = getEmptyCells(currentBoard);
            for (const [r, c] of emptyCells) {
                const nextBoard = copyBoard(currentBoard);
                nextBoard[r][c] = COMPUTER_SYMBOL;
                const heuristic = evaluateBoard(nextBoard);
                pq.enqueue({
                    board: nextBoard,
                    move: move || [r, c],
                    cost: cost + 1,
                    heuristic
                });
            }
        }
        return bestAvailableMove();
    }

    // IDDFS for computer move with heuristic
    function iddfsMove() {
        for (let depth = 1; depth <= 9; depth++) {
            const result = dls(copyBoard(board), depth, null);
            if (result) {
                return result;
            }
        }
        return bestAvailableMove();
    }

    function dls(currentBoard, depth, move) {
        const score = evaluateBoard(currentBoard);
        if (score === 10) {
            return move;
        }
        if (depth === 0) {
            return null;
        }
        const emptyCells = getEmptyCells(currentBoard);
        for (const [r, c] of emptyCells) {
            const nextBoard = copyBoard(currentBoard);
            nextBoard[r][c] = COMPUTER_SYMBOL;
            const result = dls(nextBoard, depth - 1, move || [r, c]);
            if (result) {
                return result;
            }
        }
        return null;
    }

    // Choose the best available move
    function bestAvailableMove() {
        // Check for immediate win or block
        for (const [r, c] of getEmptyCells(board)) {
            // Check if AI can win
            board[r][c] = COMPUTER_SYMBOL;
            if (checkWinner(board, COMPUTER_SYMBOL)) {
                board[r][c] = '';
                return [r, c];
            }
            board[r][c] = '';

            // Check if player can win
            board[r][c] = PLAYER_SYMBOL;
            if (checkWinner(board, PLAYER_SYMBOL)) {
                board[r][c] = '';
                return [r, c];
            }
            board[r][c] = '';
        }
        // Else, pick center, corners, or sides
        const preferredMoves = [
            [1, 1], // Center
            [0, 0], [0, 2], [2, 0], [2, 2], // Corners
            [0, 1], [1, 0], [1, 2], [2, 1]  // Sides
        ];
        for (const [r, c] of preferredMoves) {
            if (board[r][c] === '') {
                return [r, c];
            }
        }
        return null;
    }

    // Priority Queue implementation
    class PriorityQueue {
        constructor(comparator = (a, b) => a - b) {
            this._heap = [];
            this._comparator = comparator;
        }
        isEmpty() {
            return this._heap.length === 0;
        }
        enqueue(value) {
            this._heap.push(value);
            this._siftUp();
        }
        dequeue() {
            const top = this.peek();
            const bottom = this._heap.pop();
            if (this._heap.length > 0) {
                this._heap[0] = bottom;
                this._siftDown();
            }
            return top;
        }
        peek() {
            return this._heap[0];
        }
        _parent(index) {
            return Math.floor((index - 1) / 2);
        }
        _leftChild(index) {
            return index * 2 + 1;
        }
        _rightChild(index) {
            return index * 2 + 2;
        }
        _siftUp() {
            let nodeIndex = this._heap.length - 1;
            while (
                nodeIndex > 0 &&
                this._comparator(this._heap[nodeIndex], this._heap[this._parent(nodeIndex)]) < 0
            ) {
                this._swap(nodeIndex, this._parent(nodeIndex));
                nodeIndex = this._parent(nodeIndex);
            }
        }
        _siftDown() {
            let nodeIndex = 0;
            while (this._leftChild(nodeIndex) < this._heap.length) {
                let smallerChildIndex = this._leftChild(nodeIndex);
                if (
                    this._rightChild(nodeIndex) < this._heap.length &&
                    this._comparator(this._heap[this._rightChild(nodeIndex)], this._heap[smallerChildIndex]) < 0
                ) {
                    smallerChildIndex = this._rightChild(nodeIndex);
                }
                if (this._comparator(this._heap[smallerChildIndex], this._heap[nodeIndex]) >= 0) {
                    break;
                }
                this._swap(nodeIndex, smallerChildIndex);
                nodeIndex = smallerChildIndex;
            }
        }
        _swap(i, j) {
            [this._heap[i], this._heap[j]] = [this._heap[j], this._heap[i]];
        }
    }

    // Initialize the game
    initGame();
});
