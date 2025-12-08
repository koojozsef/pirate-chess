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
        # P1 Scout at -1, 2
        # Rot 0. Scout directions: Forward (1,0), Left (0,1), Right (1,-1).
        # Move Right to (-1+1, 2-1) = (0, 1).
        # (0, 1) is empty.
        
        is_valid, error = logic.validate_move(self.game, -1, 2, 0, 1)
        self.assertTrue(is_valid, f"Move should be valid: {error}")
        
    def test_invalid_move_wrong_player(self):
        # Try moving P2 piece as P1
        is_valid, error = logic.validate_move(self.game, 2, -3, 3, -3)
        self.assertFalse(is_valid)
        self.assertEqual(error, "Not your piece")
        
    def test_rotation(self):
        # Move piece first (Scout -1,2 -> 0,1)
        logic.execute_move(self.game, -1, 2, 0, 1)
        
        # Try rotating (at new pos 0,1)
        success, error = logic.rotate_piece(self.game, 0, 1)
        self.assertTrue(success)
        
        # Check rotation incremented
        piece = logic.get_piece(self.game.board, 0, 1)
        self.assertEqual(piece['rotation'], 1)
        
        # Check phase is STILL rotate and player is STILL 1
        self.assertEqual(self.game.phase, 'rotate')
        self.assertEqual(self.game.current_player, 1)

        # Rotate again
        success, error = logic.rotate_piece(self.game, 0, 1)
        self.assertTrue(success)
        piece = logic.get_piece(self.game.board, 0, 1)
        self.assertEqual(piece['rotation'], 2)

        # NOW End Turn
        success, error = logic.end_turn(self.game)
        self.assertTrue(success)

        # Check phase changed back to move and player switched
        self.assertEqual(self.game.phase, 'move')
        self.assertEqual(self.game.current_player, 2)

    def test_end_turn_invalid(self):
        # Attempt to end turn in move phase
        success, error = logic.end_turn(self.game)
        self.assertFalse(success)
        self.assertEqual(error, "Can only end turn after moving (in rotate phase)")

