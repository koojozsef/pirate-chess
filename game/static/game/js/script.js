class HexChess {
    constructor() {
        this.boardSize = 7;
        this.hexSize = 40;
        this.gameId = null;
        this.board = {}; // Structure: { q: { r: { piece: ... } } }
        this.currentPlayer = 1;
        this.selectedPiece = null;
        this.gamePhase = 'move';
        this.lastMovedPiece = null;

        this.createBoardSVG();
        this.setupEventListeners();
        this.startNewGame();
    }

    async startNewGame() {
        try {
            const response = await fetch('/api/new_game/', {
                method: 'POST'
            });
            const data = await response.json();
            this.gameId = data.game_id;
            this.updateState(data);
        } catch (error) {
            console.error('Error starting new game:', error);
        }
    }

    async fetchGameState() {
        if (!this.gameId) return;
        try {
            const response = await fetch(`/api/game/${this.gameId}/`);
            const data = await response.json();
            this.updateState(data);
        } catch (error) {
            console.error('Error fetching game state:', error);
        }
    }

    updateState(data) {
        this.board = data.board;
        this.currentPlayer = data.current_player;
        this.gamePhase = data.phase || 'move';
        this.lastMovedPiece = data.last_moved_piece;

        this.updatePieces();
        this.updatePlayerTurn();
        this.updatePlayerTurn();
        this.updateButtons();
        this.updateCapturedList(data.captured); // Backend need to support returning full captured list or we track it

        if (data.winner) {
            alert(`Player ${data.winner} Wins!`);
        }
    }

    // Note: The backend logic currently doesn't return full list of captured pieces, 
    // so for now we might lose visual history of captured pieces on refresh 
    // unless we enhance the backend to return them.
    updateCapturedList(capturedPiece) {
        if (capturedPiece) {
            const capturedContainer = document.getElementById(`player${capturedPiece.player}-captured`);
            const pieceElement = document.createElement('div');
            pieceElement.className = `captured-piece player${capturedPiece.player}`;
            pieceElement.textContent = this.getPieceSymbol(capturedPiece.type);
            capturedContainer.appendChild(pieceElement);
        }
    }

    createBoardSVG() {
        const svg = document.getElementById('game-board');
        // Keep existing board creation logic but use empty board initially
        // ... (Reusing helper methods)

        const centerX = 400;
        const centerY = 350;

        // Create hexagons
        for (let q = -3; q <= 3; q++) {
            for (let r = Math.max(-3, -q - 3); r <= Math.min(3, -q + 3); r++) {
                const hex = this.createHexagon(q, r, centerX, centerY);
                svg.appendChild(hex);
            }
        }
    }

    updatePieces() {
        // Remove existing pieces
        const svg = document.getElementById('game-board');
        const existingPieces = svg.querySelectorAll('.piece');
        existingPieces.forEach(piece => piece.remove());

        const centerX = 400;
        const centerY = 350;

        // Add current pieces from server state
        // Server state board is: { "q": { "r": { piece: {...} } } } (keys are strings)
        Object.keys(this.board).forEach(qStr => {
            const q = parseInt(qStr);
            const rDict = this.board[qStr];
            Object.keys(rDict).forEach(rStr => {
                const r = parseInt(rStr);
                const cell = rDict[rStr];
                if (cell.piece) {
                    const piece = this.createPiece(q, r, cell.piece, centerX, centerY);
                    svg.appendChild(piece);
                }
            });
        });
    }

    // Helper methods reused from original script (with minor mods if needed)
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
        const x = centerX + this.hexSize * (Math.sqrt(3) * q + Math.sqrt(3) / 2 * r);
        const y = centerY + this.hexSize * (3 / 2 * r);
        return { x, y };
    }

    getHexPoints(x, y) {
        const points = [];
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i + (Math.PI / 6);
            const px = x + this.hexSize * Math.cos(angle);
            const py = y + this.hexSize * Math.sin(angle);
            points.push(`${px},${py}`);
        }
        return points.join(' ');
    }

    createPiece(q, r, pieceData, centerX, centerY) {
        const { x, y } = this.hexToPixel(q, r, centerX, centerY);
        const pieceGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        pieceGroup.setAttribute('class', `piece player${pieceData.player}`);
        pieceGroup.setAttribute('data-q', q);
        pieceGroup.setAttribute('data-r', r);

        const shape = this.createPieceShape(pieceData.type, x, y, pieceData.rotation);
        pieceGroup.appendChild(shape);

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
        const size = this.hexSize * 0.7; // Slightly larger for chunky feel
        const shape = document.createElementNS('http://www.w3.org/2000/svg', 'g');

        // Base Rotation wrapper
        if (rotation > 0) {
            const angle = rotation * 60;
            shape.setAttribute('transform', `rotate(${angle} ${x} ${y})`);
        }

        switch (type) {
            case 'warrior':
                // Warrior: A solid, angular shield/hull shape
                const warriorBody = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                // chunky triangle
                warriorBody.setAttribute('points',
                    `${x},${y - size * 0.6} ` + // Tip
                    `${x + size * 0.5},${y + size * 0.5} ` + // Bottom Right
                    `${x},${y + size * 0.3} ` + // Inner bottom
                    `${x - size * 0.5},${y + size * 0.5}` // Bottom Left
                );
                // Inherits fill/stroke from .piece class but we can override if needed for detail
                shape.appendChild(warriorBody);

                // Directional Arrow (Triangle on top)
                const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                arrow.setAttribute('points',
                    `${x},${y - size * 0.9} ` + // Far Tip
                    `${x + size * 0.2},${y - size * 0.5} ` +
                    `${x - size * 0.2},${y - size * 0.5}`
                );
                arrow.setAttribute('fill', '#ffc107'); // Gold arrow
                shape.appendChild(arrow);
                break;

            case 'scout':
                // Scout: Diamond shape, low poly
                const scoutBody = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                scoutBody.setAttribute('points',
                    `${x},${y - size * 0.5} ` +
                    `${x + size * 0.4},${y} ` +
                    `${x},${y + size * 0.5} ` +
                    `${x - size * 0.4},${y}`
                );
                shape.appendChild(scoutBody);

                // Directions: Thicker angular lines
                const directions = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                directions.setAttribute('stroke', '#ffc107'); // Gold
                directions.setAttribute('stroke-width', '4');
                directions.setAttribute('stroke-linecap', 'butt'); // Hard ends

                // Forward
                const fwd = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                fwd.setAttribute('x1', x); fwd.setAttribute('y1', y);
                fwd.setAttribute('x2', x); fwd.setAttribute('y2', y - size * 0.8);
                directions.appendChild(fwd);

                // Back Left
                const bl = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                bl.setAttribute('x1', x); bl.setAttribute('y1', y);
                bl.setAttribute('x2', x - size * 0.4); bl.setAttribute('y2', y + size * 0.3);
                directions.appendChild(bl);

                // Back Right
                const br = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                br.setAttribute('x1', x); br.setAttribute('y1', y);
                br.setAttribute('x2', x + size * 0.4); br.setAttribute('y2', y + size * 0.3);
                directions.appendChild(br);

                shape.appendChild(directions);
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

    async handleHexClick(q, r, event) {
        if (this.gamePhase === 'rotate') return;

        if (this.selectedPiece) {
            // Attempt move
            await this.tryMovePiece(this.selectedPiece.q, this.selectedPiece.r, q, r);
            this.clearSelection();
        } else {
            this.clearSelection();
        }
    }

    async handlePieceClick(q, r, pieceData) {
        if (this.gamePhase === 'rotate') return;

        if (pieceData.player === this.currentPlayer) {
            this.selectPiece(q, r);
        } else if (this.selectedPiece) {
            // Attempt capture
            await this.tryMovePiece(this.selectedPiece.q, this.selectedPiece.r, q, r);
            this.clearSelection();
        }
    }

    async tryMovePiece(fromQ, fromR, toQ, toR) {
        try {
            const response = await fetch(`/api/game/${this.gameId}/move/`, {
                method: 'POST',
                body: JSON.stringify({
                    from_q: fromQ, from_r: fromR, to_q: toQ, to_r: toR
                })
            });
            const data = await response.json();

            if (response.ok) {
                this.updateState(data);
            } else {
                console.log('Invalid move:', data.error);
                // Optional: visuals for invalid move
            }
        } catch (error) {
            console.error('Error moving piece:', error);
        }
    }

    selectPiece(q, r) {
        this.selectedPiece = { q, r };
        // Highlight logic could be kept client-side for better UX, 
        // using a mirror of server logic or just generic highlight
        // For now, simple selection highlight
        this.updateVisuals();
    }

    clearSelection() {
        this.selectedPiece = null;
        this.clearHighlights();
        this.updateVisuals();
    }

    updateVisuals() {
        this.clearHighlights();
        if (this.selectedPiece) {
            const selectedHex = document.querySelector(`[data-q="${this.selectedPiece.q}"][data-r="${this.selectedPiece.r}"]`);
            if (selectedHex) selectedHex.classList.add('selected');

            const selectedPieceElement = document.querySelector(`.piece[data-q="${this.selectedPiece.q}"][data-r="${this.selectedPiece.r}"]`);
            if (selectedPieceElement) selectedPieceElement.classList.add('selected');
        }
    }

    clearHighlights() {
        const hexes = document.querySelectorAll('.hex');
        hexes.forEach(hex => hex.classList.remove('selected'));
        const pieces = document.querySelectorAll('.piece');
        pieces.forEach(piece => piece.classList.remove('selected'));
    }

    getPieceSymbol(type) {
        const symbols = { 'warrior': '⚔️', 'scout': '🔍' };
        return symbols[type] || '?';
    }

    async rotatePiece() {
        if (!this.lastMovedPiece) return;
        const { q, r } = this.lastMovedPiece;

        try {
            const response = await fetch(`/api/game/${this.gameId}/rotate/`, {
                method: 'POST',
                body: JSON.stringify({ q, r })
            });
            const data = await response.json();
            if (response.ok) {
                this.updateState(data);
            }
        } catch (error) {
            console.error('Error rotating piece:', error);
        }
    }

    async endTurn() {
        if (!this.gameId) return;
        try {
            const response = await fetch(`/api/game/${this.gameId}/end_turn/`, {
                method: 'POST'
            });
            const data = await response.json();
            if (response.ok) {
                this.updateState(data);
            } else {
                console.error('Error ending turn:', data.error);
            }
        } catch (error) {
            console.error('Error in request:', error);
        }
    }

    updatePlayerTurn() {
        document.getElementById('current-player').textContent = `Player ${this.currentPlayer}`;
    }

    updateButtons() {
        // Rotate button only enabled in rotate phase and if it's our turn (implied by phase check usually)
        const rotateBtn = document.getElementById('rotate-btn');
        rotateBtn.disabled = this.gamePhase !== 'rotate';

        // End Turn button enabled in rotate phase
        const endTurnBtn = document.getElementById('end-turn-btn');
        endTurnBtn.disabled = this.gamePhase !== 'rotate';
    }

    setupEventListeners() {
        document.getElementById('new-game-btn').addEventListener('click', () => this.startNewGame());
        document.getElementById('rotate-btn').addEventListener('click', () => this.rotatePiece());
        document.getElementById('end-turn-btn').addEventListener('click', () => this.endTurn());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.game = new HexChess();
});
