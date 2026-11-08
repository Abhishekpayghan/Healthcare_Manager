from .models import AuditLog


def log_action(user, action, object_type, object_id=None):
    AuditLog.objects.create(user=user, action=action, object_type=object_type, object_id=object_id)
