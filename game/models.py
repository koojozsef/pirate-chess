import uuid
from django.db import models

class Game(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    board = models.JSONField(default=dict)
    current_player = models.IntegerField(default=1)
    # Phase: 'move' or 'rotate'
    phase = models.CharField(max_length=10, default='move')
    # Last moved piece coordinates for rotation: {'q': int, 'r': int}
    last_moved_piece = models.JSONField(null=True, blank=True)
    winner = models.IntegerField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Game {self.id} (P{self.current_player})"
