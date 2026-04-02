from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
import json
from .models import Game
from . import logic

def index(request):
    return render(request, 'game/index.html')

@require_POST
@csrf_exempt # For simplicity in this demo, though CSRF tokens should be used in prod
def new_game(request):
    board = logic.initialize_board()
    game = Game.objects.create(board=board)
    return JsonResponse({'game_id': game.id, 'board': game.board, 'current_player': game.current_player})

def get_game_state(request, game_id):
    game = get_object_or_404(Game, id=game_id)
    return JsonResponse({
        'game_id': game.id,
        'board': game.board,
        'current_player': game.current_player,
        'phase': game.phase,
        'last_moved_piece': game.last_moved_piece,
        'winner': game.winner
    })

def get_valid_moves(request, game_id):
    game = get_object_or_404(Game, id=game_id)
    try:
        q = int(request.GET.get('q', 0))
        r = int(request.GET.get('r', 0))
    except (TypeError, ValueError):
        return JsonResponse({'error': 'Invalid coordinates'}, status=400)

    piece = logic.get_piece(game.board, q, r)
    if not piece:
        return JsonResponse({'moves': []})

    moves = logic.get_valid_moves(game.board, q, r, piece)
    return JsonResponse({'moves': moves})

@require_POST
@csrf_exempt
def move_piece(request, game_id):
    game = get_object_or_404(Game, id=game_id)
    try:
        data = json.loads(request.body)
        from_q = int(data['from_q'])
        from_r = int(data['from_r'])
        to_q = int(data['to_q'])
        to_r = int(data['to_r'])
    except (KeyError, ValueError):
        return JsonResponse({'error': 'Invalid data'}, status=400)
        
    is_valid, error = logic.validate_move(game, from_q, from_r, to_q, to_r)
    if not is_valid:
        return JsonResponse({'error': error}, status=400)
        
    captured = logic.execute_move(game, from_q, from_r, to_q, to_r)
    
    return JsonResponse({
        'success': True,
        'board': game.board,
        'phase': game.phase,
        'last_moved_piece': game.last_moved_piece,
        'winner': game.winner,
        'captured': captured
    })

@require_POST
@csrf_exempt
def rotate_piece(request, game_id):
    game = get_object_or_404(Game, id=game_id)
    try:
        data = json.loads(request.body)
        q = int(data['q'])
        r = int(data['r'])
    except (KeyError, ValueError):
        return JsonResponse({'error': 'Invalid data'}, status=400)

    success, error = logic.rotate_piece(game, q, r)
    if not success:
        return JsonResponse({'error': error}, status=400)
        
    return JsonResponse({
        'success': True,
        'board': game.board,
        'phase': game.phase,
        # Player stays same
        'current_player': game.current_player,
        'last_moved_piece': game.last_moved_piece
    })

@require_POST
@csrf_exempt
def end_turn(request, game_id):
    game = get_object_or_404(Game, id=game_id)
    success, error = logic.end_turn(game)
    if not success:
        return JsonResponse({'error': error}, status=400)
        
    return JsonResponse({
        'success': True,
        'board': game.board,
        'phase': game.phase,
        'current_player': game.current_player,
        'last_moved_piece': game.last_moved_piece
    })
