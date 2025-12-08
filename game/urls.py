from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('api/new_game/', views.new_game, name='new_game'),
    path('api/game/<uuid:game_id>/', views.get_game_state, name='get_game_state'),
    path('api/game/<uuid:game_id>/move/', views.move_piece, name='move_piece'),
    path('api/game/<uuid:game_id>/rotate/', views.rotate_piece, name='rotate_piece'),
    path('api/game/<uuid:game_id>/end_turn/', views.end_turn, name='end_turn'),
]
