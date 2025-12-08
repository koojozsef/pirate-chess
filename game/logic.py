import math

def initialize_board():
    board = {}
    
    # Initialize empty hex grid
    for q in range(-3, 4):
        board[str(q)] = {}
        r_start = max(-3, -q - 3)
        r_end = min(3, -q + 3)
        for r in range(r_start, r_end + 1):
            board[str(q)][str(r)] = {
                'piece': None,
                'coords': {'q': q, 'r': r, 's': -q - r}
            }

    # Setup pieces
    setup_initial_pieces(board)
    return board

def setup_initial_pieces(board):
     # Player 1 (bottom)
    p1_pieces = [
        {'q': -2, 'r': 3, 'type': 'warrior', 'rotation': 0},
        {'q': -1, 'r': 3, 'type': 'warrior', 'rotation': 0},
        {'q': 0, 'r': 3, 'type': 'warrior', 'rotation': 0},
        {'q': 1, 'r': 2, 'type': 'warrior', 'rotation': 0},
        {'q': -1, 'r': 2, 'type': 'scout', 'rotation': 0},
        {'q': 0, 'r': 2, 'type': 'scout', 'rotation': 0},
        {'q': 1, 'r': 1, 'type': 'scout', 'rotation': 0}
    ]

    # Player 2 (top)
    p2_pieces = [
        {'q': 2, 'r': -3, 'type': 'warrior', 'rotation': 3},
        {'q': 1, 'r': -3, 'type': 'warrior', 'rotation': 3},
        {'q': 0, 'r': -3, 'type': 'warrior', 'rotation': 3},
        {'q': -1, 'r': -2, 'type': 'warrior', 'rotation': 3},
        {'q': 1, 'r': -2, 'type': 'scout', 'rotation': 3},
        {'q': 0, 'r': -2, 'type': 'scout', 'rotation': 3},
        {'q': -1, 'r': -1, 'type': 'scout', 'rotation': 3}
    ]

    for p in p1_pieces:
        q, r = str(p['q']), str(p['r'])
        if q in board and r in board[q]:
            board[q][r]['piece'] = {'type': p['type'], 'player': 1, 'rotation': p['rotation']}

    for p in p2_pieces:
        q, r = str(p['q']), str(p['r'])
        if q in board and r in board[q]:
            board[q][r]['piece'] = {'type': p['type'], 'player': 2, 'rotation': p['rotation']}

def get_piece(board, q, r):
    q, r = str(q), str(r)
    if q in board and r in board[q]:
        return board[q][r]['piece']
    return None

def set_piece(board, q, r, piece):
    q, r = str(q), str(r)
    if q in board and r in board[q]:
        board[q][r]['piece'] = piece

def is_valid_coordinate(board, q, r):
    return str(q) in board and str(r) in board[str(q)]

def rotate_directions(directions, rotation):
    if rotation == 0:
        return directions
    
    rotated = []
    steps = rotation % 6
    
    for d in directions:
        new_q, new_r = d['q'], d['r']
        for _ in range(steps):
             # Rotate 60 degrees clockwise: (q, r) -> (-r, -s) = (-r, q+r)
             # Wait, generic formula for clockwise hex rotation:
             # x, y, z -> -z, -x, -y
             # q, r, s -> -s, -q, -r
             # q, r -> -(-q-r), -q = q+r, -q.
             
             # Let's check the JS logic: newDir.q = -newDir.r; newDir.r = -(-temp - newDir.r);
             # temp = q. new_q = -r. new_r = -(-q - r) = q + r.
             # Correct.
             temp_q = new_q
             new_q = -new_r
             new_r = temp_q + new_r
        rotated.append({'q': new_q, 'r': new_r})
    return rotated

def get_valid_moves(board, q, r, piece):
    moves = []
    directions = [
        {'q': 1, 'r': 0}, {'q': 1, 'r': -1}, {'q': 0, 'r': -1},
        {'q': -1, 'r': 0}, {'q': -1, 'r': 1}, {'q': 0, 'r': 1}
    ]
    
    rotated_directions = rotate_directions(directions, piece['rotation'])
    
    if piece['type'] == 'warrior':
        forward_dir = rotated_directions[0]
        for i in range(1, 4):
            new_q = q + forward_dir['q'] * i
            new_r = r + forward_dir['r'] * i
            
            if not is_valid_coordinate(board, new_q, new_r):
                break
            
            target_piece = get_piece(board, new_q, new_r)
            if target_piece:
                if target_piece['player'] != piece['player']:
                    moves.append({'q': new_q, 'r': new_r})
                break
            moves.append({'q': new_q, 'r': new_r})
            
    elif piece['type'] == 'scout':
        scout_directions = [
            rotated_directions[0], # forward
            rotated_directions[5], # left
            rotated_directions[1]  # right
        ]
        
        for d in scout_directions:
            new_q = q + d['q']
            new_r = r + d['r']
            if is_valid_coordinate(board, new_q, new_r):
                target_piece = get_piece(board, new_q, new_r)
                if not target_piece or target_piece['player'] != piece['player']:
                    moves.append({'q': new_q, 'r': new_r})
                    
    return moves

def validate_move(game, from_q, from_r, to_q, to_r):
    piece = get_piece(game.board, from_q, from_r)
    if not piece:
        return False, "No piece at origin"
    
    if piece['player'] != game.current_player:
        return False, "Not your piece"
    
    if game.phase != 'move':
        return False, "Not in move phase"
    
    valid_moves = get_valid_moves(game.board, from_q, from_r, piece)
    # Check if target is in valid moves
    is_valid = any(m['q'] == to_q and m['r'] == to_r for m in valid_moves)
    
    if not is_valid:
        return False, "Invalid move"
        
    return True, None

def execute_move(game, from_q, from_r, to_q, to_r):
    piece = get_piece(game.board, from_q, from_r)
    target_piece = get_piece(game.board, to_q, to_r)
    
    # Move
    set_piece(game.board, to_q, to_r, piece)
    set_piece(game.board, from_q, from_r, None)
    
    game.last_moved_piece = {'q': to_q, 'r': to_r}
    game.phase = 'rotate'
    
    # Check win condition (capture all opponent pieces)
    check_win_condition(game)
    
    game.save()
    return target_piece # Return captured piece if any

def rotate_piece(game, q, r):
    if game.phase != 'rotate':
        return False, "Not in rotate phase"
        
    if not game.last_moved_piece or game.last_moved_piece['q'] != q or game.last_moved_piece['r'] != r:
        return False, "Can only rotate the last moved piece"
        
    piece = get_piece(game.board, q, r)
    if not piece:
        return False, "No piece found"
        
    piece['rotation'] = (piece['rotation'] + 1) % 6
    # Update board piece
    set_piece(game.board, q, r, piece)
    
    # End turn
    game.phase = 'move'
    game.current_player = 2 if game.current_player == 1 else 1
    game.last_moved_piece = None
    game.save()
    
    return True, None

def check_win_condition(game):
    p1_count = 0
    p2_count = 0
    
    for q_val in game.board.values():
        for hex_val in q_val.values():
            piece = hex_val['piece']
            if piece:
                if piece['player'] == 1:
                    p1_count += 1
                else:
                    p2_count += 1
                    
    if p1_count == 0:
        game.winner = 2
    elif p2_count == 0:
        game.winner = 1
