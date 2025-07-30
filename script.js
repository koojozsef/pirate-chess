class HexChess {
    constructor() {
        this.boardSize = 7; // 7x7 hexagonal board
        this.hexSize = 40;
        this.board = [];
        this.currentPlayer = 1;
        this.selectedPiece = null;
        this.selectedHex = null;
        this.gamePhase = 'move'; // 'move' or 'rotate'
        this.lastMovedPiece = null;
        
        this.initializeBoard();
        this.createBoardSVG();
        this.setupEventListeners();
    }
    
    initializeBoard() {
        // Initialize empty board
        for (let q = -3; q <= 3; q++) {
            this.board[q] = {};
            for (let r = Math.max(-3, -q-3); r <= Math.min(3, -q+3); r++) {
                this.board[q][r] = {
                    piece: null,
                    coords: { q, r, s: -q-r }
                };
            }
        }
        
        // Place initial pieces
        this.setupInitialPieces();
    }
    
    setupInitialPieces() {
        // Player 1 pieces (bottom) - 7 pieces total
        const player1Positions = [
            // Warriors (can move 1-3 hexes forward) - 4 pieces
            {q: -2, r: 3, type: 'warrior', rotation: 0},
            {q: -1, r: 3, type: 'warrior', rotation: 0},
            {q: 0, r: 3, type: 'warrior', rotation: 0},
            {q: 1, r: 2, type: 'warrior', rotation: 0},
            
            // Scouts (can move 1 hex forward, left, or right) - 3 pieces
            {q: -1, r: 2, type: 'scout', rotation: 0},
            {q: 0, r: 2, type: 'scout', rotation: 0},
            {q: 1, r: 1, type: 'scout', rotation: 0}
        ];
        
        // Player 2 pieces (top) - 7 pieces total
        const player2Positions = [
            // Warriors (can move 1-3 hexes forward) - 4 pieces
            {q: 2, r: -3, type: 'warrior', rotation: 3},
            {q: 1, r: -3, type: 'warrior', rotation: 3},
            {q: 0, r: -3, type: 'warrior', rotation: 3},
            {q: -1, r: -2, type: 'warrior', rotation: 3},
            
            // Scouts (can move 1 hex forward, left, or right) - 3 pieces
            {q: 1, r: -2, type: 'scout', rotation: 3},
            {q: 0, r: -2, type: 'scout', rotation: 3},
            {q: -1, r: -1, type: 'scout', rotation: 3}
        ];
        
        // Place pieces
        player1Positions.forEach(pos => {
            if (this.board[pos.q] && this.board[pos.q][pos.r]) {
                this.board[pos.q][pos.r].piece = {
                    type: pos.type,
                    player: 1,
                    rotation: pos.rotation
                };
            }
        });
        
        player2Positions.forEach(pos => {
            if (this.board[pos.q] && this.board[pos.q][pos.r]) {
                this.board[pos.q][pos.r].piece = {
                    type: pos.type,
                    player: 2,
                    rotation: pos.rotation
                };
            }
        });
    }
    
    createBoardSVG() {
        const svg = document.getElementById('game-board');
        svg.innerHTML = '';
        
        const centerX = 400;
        const centerY = 350;
        
        // Create hexagons
        for (let q = -3; q <= 3; q++) {
            for (let r = Math.max(-3, -q-3); r <= Math.min(3, -q+3); r++) {
                const hex = this.createHexagon(q, r, centerX, centerY);
                svg.appendChild(hex);
            }
        }
        
        // Create pieces
        this.updatePieces();
    }
    
    createHexagon(q, r, centerX, centerY) {
        const { x, y } = this.hexToPixel(q, r, centerX, centerY);
        
        const hexGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        const hex = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        const points = this.getHexPoints(x, y);
        
        hex.setAttribute('points', points);
        hex.setAttribute('class', `hex ${(q + r) % 2 === 0 ? 'light' : 'dark'}`);
        hex.setAttribute('data-q', q);
        hex.setAttribute('data-r', r);
        
        hex.addEventListener('click', (e) => this.handleHexClick(q, r, e));
        
        hexGroup.appendChild(hex);
        return hexGroup;
    }
    
    hexToPixel(q, r, centerX, centerY) {
        // Flat-top hexagon layout (rotated 30 degrees from pointy-top)
        const x = centerX + this.hexSize * (Math.sqrt(3) * q + Math.sqrt(3)/2 * r);
        const y = centerY + this.hexSize * (3/2 * r);
        return { x, y };
    }
    
    getHexPoints(x, y) {
        const points = [];
        for (let i = 0; i < 6; i++) {
            // Add 30 degrees (π/6) to rotate from pointy-top to flat-top
            const angle = (Math.PI / 3) * i + (Math.PI / 6);
            const px = x + this.hexSize * Math.cos(angle);
            const py = y + this.hexSize * Math.sin(angle);
            points.push(`${px},${py}`);
        }
        return points.join(' ');
    }
    
    updatePieces() {
        // Remove existing pieces
        const svg = document.getElementById('game-board');
        const existingPieces = svg.querySelectorAll('.piece');
        existingPieces.forEach(piece => piece.remove());
        
        const centerX = 400;
        const centerY = 350;
        
        // Add current pieces
        for (let q = -3; q <= 3; q++) {
            for (let r = Math.max(-3, -q-3); r <= Math.min(3, -q+3); r++) {
                if (this.board[q] && this.board[q][r] && this.board[q][r].piece) {
                    const piece = this.createPiece(q, r, this.board[q][r].piece, centerX, centerY);
                    svg.appendChild(piece);
                }
            }
        }
    }
    
    createPiece(q, r, pieceData, centerX, centerY) {
        const { x, y } = this.hexToPixel(q, r, centerX, centerY);
        
        const pieceGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        pieceGroup.setAttribute('class', `piece player${pieceData.player}`);
        pieceGroup.setAttribute('data-q', q);
        pieceGroup.setAttribute('data-r', r);
        
        // Create piece shape based on type
        const shape = this.createPieceShape(pieceData.type, x, y, pieceData.rotation);
        pieceGroup.appendChild(shape);
        
        // Add rotation indicator
        if (pieceData.rotation > 0) {
            const indicator = this.createRotationIndicator(x, y, pieceData.rotation);
            pieceGroup.appendChild(indicator);
        }
        
        pieceGroup.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handlePieceClick(q, r, pieceData);
        });
        
        return pieceGroup;
    }
    
    createPieceShape(type, x, y, rotation) {
        const size = this.hexSize * 0.6;
        const shape = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        // Rotate the piece based on rotation value
        if (rotation > 0) {
            const angle = rotation * 60; // 60 degrees per rotation step
            shape.setAttribute('transform', `rotate(${angle} ${x} ${y})`);
        }
        
        switch (type) {
            case 'warrior':
                // Warrior: Diamond shape with a line indicating forward direction
                const warrior = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                warrior.setAttribute('points', `${x},${y-size*0.5} ${x+size*0.4},${y} ${x},${y+size*0.5} ${x-size*0.4},${y}`);
                shape.appendChild(warrior);
                
                // Add forward direction indicator
                const warriorArrow = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                warriorArrow.setAttribute('x1', x);
                warriorArrow.setAttribute('y1', y);
                warriorArrow.setAttribute('x2', x);
                warriorArrow.setAttribute('y2', y - size * 0.3);
                warriorArrow.setAttribute('stroke', 'currentColor');
                warriorArrow.setAttribute('stroke-width', '3');
                warriorArrow.setAttribute('stroke-linecap', 'round');
                shape.appendChild(warriorArrow);
                break;
                
            case 'scout':
                // Scout: Circle with three direction indicators (forward, left, right)
                const scout = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                scout.setAttribute('cx', x);
                scout.setAttribute('cy', y);
                scout.setAttribute('r', size * 0.35);
                shape.appendChild(scout);
                
                // Add three direction indicators
                const directions = [
                    {x1: x, y1: y, x2: x, y2: y - size * 0.25}, // forward
                    {x1: x, y1: y, x2: x - size * 0.22, y2: y + size * 0.13}, // left
                    {x1: x, y1: y, x2: x + size * 0.22, y2: y + size * 0.13}  // right
                ];
                
                directions.forEach(dir => {
                    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    line.setAttribute('x1', dir.x1);
                    line.setAttribute('y1', dir.y1);
                    line.setAttribute('x2', dir.x2);
                    line.setAttribute('y2', dir.y2);
                    line.setAttribute('stroke', 'currentColor');
                    line.setAttribute('stroke-width', '2');
                    line.setAttribute('stroke-linecap', 'round');
                    shape.appendChild(line);
                });
                break;
        }
        
        return shape;
    }
    
    createRotationIndicator(x, y, rotation) {
        const indicator = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        indicator.setAttribute('x', x + this.hexSize * 0.3);
        indicator.setAttribute('y', y - this.hexSize * 0.3);
        indicator.setAttribute('text-anchor', 'middle');
        indicator.setAttribute('dominant-baseline', 'middle');
        indicator.setAttribute('font-size', '12');
        indicator.setAttribute('fill', '#f39c12');
        indicator.setAttribute('font-weight', 'bold');
        indicator.textContent = rotation;
        return indicator;
    }
    
    handleHexClick(q, r, event) {
        if (this.gamePhase === 'rotate') {
            return; // Can't select new hex during rotation phase
        }
        
        const hex = event.target;
        
        if (this.selectedPiece && this.isValidMove(this.selectedPiece.q, this.selectedPiece.r, q, r)) {
            this.movePiece(this.selectedPiece.q, this.selectedPiece.r, q, r);
            this.clearSelection();
            this.gamePhase = 'rotate';
            this.lastMovedPiece = { q, r };
            this.updateRotateButton();
        } else {
            this.clearSelection();
        }
    }
    
    handlePieceClick(q, r, pieceData) {
        if (this.gamePhase === 'rotate') {
            return; // Can't select pieces during rotation phase
        }
        
        if (pieceData.player === this.currentPlayer) {
            this.selectPiece(q, r);
        } else if (this.selectedPiece && this.isValidMove(this.selectedPiece.q, this.selectedPiece.r, q, r)) {
            this.movePiece(this.selectedPiece.q, this.selectedPiece.r, q, r);
            this.clearSelection();
            this.gamePhase = 'rotate';
            this.lastMovedPiece = { q, r };
            this.updateRotateButton();
        }
    }
    
    selectPiece(q, r) {
        this.selectedPiece = { q, r };
        this.highlightValidMoves(q, r);
        this.updateVisuals();
    }
    
    clearSelection() {
        this.selectedPiece = null;
        this.clearHighlights();
        this.updateVisuals();
    }
    
    highlightValidMoves(q, r) {
        const piece = this.board[q][r].piece;
        if (!piece) return;
        
        const validMoves = this.getValidMoves(q, r, piece);
        
        validMoves.forEach(move => {
            const hex = document.querySelector(`[data-q="${move.q}"][data-r="${move.r}"]`);
            if (hex && hex.classList.contains('hex')) {
                hex.classList.add('valid-move');
            }
        });
    }
    
    clearHighlights() {
        const hexes = document.querySelectorAll('.hex');
        hexes.forEach(hex => {
            hex.classList.remove('valid-move', 'selected');
        });
        
        const pieces = document.querySelectorAll('.piece');
        pieces.forEach(piece => {
            piece.classList.remove('selected');
        });
    }
    
    updateVisuals() {
        this.clearHighlights();
        
        if (this.selectedPiece) {
            const selectedHex = document.querySelector(`[data-q="${this.selectedPiece.q}"][data-r="${this.selectedPiece.r}"]`);
            if (selectedHex && selectedHex.classList.contains('hex')) {
                selectedHex.classList.add('selected');
            }
            
            const selectedPieceElement = document.querySelector(`.piece[data-q="${this.selectedPiece.q}"][data-r="${this.selectedPiece.r}"]`);
            if (selectedPieceElement) {
                selectedPieceElement.classList.add('selected');
            }
            
            this.highlightValidMoves(this.selectedPiece.q, this.selectedPiece.r);
        }
    }
    
    getValidMoves(q, r, piece) {
        const moves = [];
        const directions = [
            {q: 1, r: 0}, {q: 1, r: -1}, {q: 0, r: -1},
            {q: -1, r: 0}, {q: -1, r: 1}, {q: 0, r: 1}
        ];
        
        // Adjust directions based on piece rotation
        const rotatedDirections = this.rotateDirections(directions, piece.rotation);
        
        switch (piece.type) {
            case 'warrior':
                // Warrior can move 1-3 hexes forward in the direction it's facing
                const forwardDir = rotatedDirections[0]; // First direction is "forward"
                for (let i = 1; i <= 3; i++) {
                    const newQ = q + forwardDir.q * i;
                    const newR = r + forwardDir.r * i;
                    
                    if (!this.isValidCoordinate(newQ, newR)) break;
                    
                    if (this.board[newQ][newR].piece) {
                        // Can capture opponent piece
                        if (this.board[newQ][newR].piece.player !== piece.player) {
                            moves.push({q: newQ, r: newR});
                        }
                        break; // Stop after hitting any piece
                    }
                    moves.push({q: newQ, r: newR});
                }
                break;
                
            case 'scout':
                // Scout can move 1 hex forward, left, or right relative to its facing direction
                const scoutDirections = [
                    rotatedDirections[0], // forward
                    rotatedDirections[5], // left (relative to forward)
                    rotatedDirections[1]  // right (relative to forward)
                ];
                
                scoutDirections.forEach(dir => {
                    const newQ = q + dir.q;
                    const newR = r + dir.r;
                    if (this.isValidCoordinate(newQ, newR) && 
                        (!this.board[newQ][newR].piece || this.board[newQ][newR].piece.player !== piece.player)) {
                        moves.push({q: newQ, r: newR});
                    }
                });
                break;
        }
        
        return moves;
    }
    
    rotateDirections(directions, rotation) {
        if (rotation === 0) return directions;
        
        const rotated = [];
        const steps = rotation % 6;
        
        directions.forEach(dir => {
            let newDir = {...dir};
            for (let i = 0; i < steps; i++) {
                // Rotate 60 degrees clockwise in hex coordinates
                const temp = newDir.q;
                newDir.q = -newDir.r;
                newDir.r = -(-temp - newDir.r);
            }
            rotated.push(newDir);
        });
        
        return rotated;
    }
    
    isValidCoordinate(q, r) {
        return this.board[q] && this.board[q][r] !== undefined;
    }
    
    isValidMove(fromQ, fromR, toQ, toR) {
        const piece = this.board[fromQ][fromR].piece;
        if (!piece || piece.player !== this.currentPlayer) return false;
        
        const validMoves = this.getValidMoves(fromQ, fromR, piece);
        return validMoves.some(move => move.q === toQ && move.r === toR);
    }
    
    movePiece(fromQ, fromR, toQ, toR) {
        const piece = this.board[fromQ][fromR].piece;
        const capturedPiece = this.board[toQ][toR].piece;
        
        // Handle capture
        if (capturedPiece) {
            this.addCapturedPiece(capturedPiece);
        }
        
        // Move piece
        this.board[toQ][toR].piece = piece;
        this.board[fromQ][fromR].piece = null;
        
        this.updatePieces();
    }
    
    addCapturedPiece(piece) {
        const capturedContainer = document.getElementById(`player${piece.player}-captured`);
        const pieceElement = document.createElement('div');
        pieceElement.className = `captured-piece player${piece.player}`;
        pieceElement.textContent = this.getPieceSymbol(piece.type);
        capturedContainer.appendChild(pieceElement);
    }
    
    getPieceSymbol(type) {
        const symbols = {
            'warrior': '⚔️',
            'scout': '🔍'
        };
        return symbols[type] || '?';
    }
    
    rotatePiece() {
        if (this.gamePhase !== 'rotate' || !this.lastMovedPiece) return;
        
        const { q, r } = this.lastMovedPiece;
        const piece = this.board[q][r].piece;
        
        if (piece) {
            piece.rotation = (piece.rotation + 1) % 6;
            this.updatePieces();
        }
        
        // End rotation phase and switch players
        this.gamePhase = 'move';
        this.lastMovedPiece = null;
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        this.updatePlayerTurn();
        this.updateRotateButton();
    }
    
    updatePlayerTurn() {
        document.getElementById('current-player').textContent = `Player ${this.currentPlayer}`;
    }
    
    updateRotateButton() {
        const rotateBtn = document.getElementById('rotate-btn');
        rotateBtn.disabled = this.gamePhase !== 'rotate';
    }
    
    newGame() {
        this.currentPlayer = 1;
        this.selectedPiece = null;
        this.gamePhase = 'move';
        this.lastMovedPiece = null;
        
        // Clear captured pieces
        document.getElementById('player1-captured').innerHTML = '';
        document.getElementById('player2-captured').innerHTML = '';
        
        this.initializeBoard();
        this.createBoardSVG();
        this.updatePlayerTurn();
        this.updateRotateButton();
    }
    
    setupEventListeners() {
        document.getElementById('new-game-btn').addEventListener('click', () => this.newGame());
        document.getElementById('rotate-btn').addEventListener('click', () => this.rotatePiece());
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.game = new HexChess();
});
