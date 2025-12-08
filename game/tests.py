from django.test import TestCase
from . import logic
from .models import Game

class HexChessLogicTests(TestCase):
    def setUp(self):
        self.game = Game.objects.create(board=logic.initialize_board())
        
    def test_initial_board_setup(self):
        # Check piece count (7 per player)
        p1_count = 0
        p2_count = 0
        for q in self.game.board:
            for r in self.game.board[q]:
                piece = self.game.board[q][r]['piece']
                if piece:
                    if piece['player'] == 1:
                        p1_count += 1
                    elif piece['player'] == 2:
                        p2_count += 1
        self.assertEqual(p1_count, 7)
        self.assertEqual(p2_count, 7)
        
    def test_valid_move(self):
        # P1 Warrior at -2, 3
        # Valid moves: -1,3 (forward 1)
        # Note: forward for P1 (rot 0) is (+1, 0) in q,r? 
        # Logic: directions[0] = {1, 0}.
        # So -2+1 = -1, 3+0 = 3.
        
        # Wait, let's check logic.py directions.
        # directions = [{1,0}, {1,-1}, {0,-1}, {-1,0}, {-1,1}, {0,1}]
        # Rot 0 (P1) -> forward is {1, 0}.
        # Start: q=-2, r=3.
        # Target: q=-1, r=3.
        
        is_valid, error = logic.validate_move(self.game, -2, 3, -1, 3)
        self.assertTrue(is_valid, f"Move should be valid: {error}")
        
    def test_invalid_move_wrong_player(self):
        # Try moving P2 piece as P1
        is_valid, error = logic.validate_move(self.game, 2, -3, 3, -3)
        self.assertFalse(is_valid)
        self.assertEqual(error, "Not your piece")
        
    def test_rotation(self):
        # Move piece first
        logic.execute_move(self.game, -2, 3, -1, 3)
        
        # Try rotating
        success, error = logic.rotate_piece(self.game, -1, 3)
        self.assertTrue(success)
        
        # Check rotation incremented
        piece = logic.get_piece(self.game.board, -1, 3)
        self.assertEqual(piece['rotation'], 1)
        
        # Check phase changed back to move and player switched
        self.assertEqual(self.game.phase, 'move')
        self.assertEqual(self.game.current_player, 2)
