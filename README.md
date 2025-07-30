# 🏴‍☠️ Pirate Chess - Hexagonal Board Game

An interactive web-based chess-like board game played on a hexagonal grid with unique piece rotation mechanics.

## Features

- **Hexagonal Board**: 7x7 hexagonal grid instead of traditional square board
- **Two Players**: Turn-based gameplay between Player 1 (dark pieces) and Player 2 (red pieces)
- **Piece Rotation**: After each move, players can rotate their pieces to change movement patterns
- **Traditional Chess Pieces**: Two simple piece types - Warriors and Scouts with adapted hexagonal movement
- **Capture System**: Capture opponent pieces and track them in the sidebar
- **Visual Feedback**: Highlighted valid moves, selected pieces, and rotation indicators

## How to Play

1. **Select a Piece**: Click on one of your pieces to select it
2. **Move**: Click on a highlighted hexagon to move your piece there
3. **Rotate**: After moving, use the "Rotate Piece" button to change the piece's orientation (0-5 rotations)
4. **Capture**: Move onto an opponent's piece to capture it
5. **Win Condition**: Capture all opponent pieces to win

## Piece Movement

There are only two types of pieces, each with simple movement patterns that change based on rotation:

- **⚔️ Warrior**: Can move 1-3 hexes forward in the direction it's facing
- **🔍 Scout**: Can move 1 hex forward, left, or right relative to its facing direction

## Controls

- **Click**: Select pieces and move to valid hexagons
- **New Game**: Reset the board and start over
- **Rotate Piece**: Change the orientation of the last moved piece

## Technical Details

- Pure HTML, CSS, and JavaScript implementation
- SVG-based hexagonal board rendering
- Responsive design that works on desktop and mobile
- No external dependencies

## Getting Started

1. Clone this repository
2. Open `index.html` in your web browser
3. Start playing!

## File Structure

```
pirate-chess/
├── index.html      # Main HTML file
├── styles.css      # Styling and responsive design
├── script.js       # Game logic and interactivity
└── README.md       # This file
```

## Future Enhancements

- [ ] AI opponent
- [ ] Online multiplayer
- [ ] Move history and undo
- [ ] Different board sizes
- [ ] Custom piece sets
- [ ] Sound effects
- [ ] Animations for piece movement

## Contributing

Feel free to submit issues and pull requests to improve the game!

## License

This project is open source and available under the MIT License.
