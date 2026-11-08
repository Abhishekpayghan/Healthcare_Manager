from rest_framework import serializers


class HistoryItemSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=["user", "assistant"])
    text = serializers.CharField(max_length=4000)


class AgentRequestSerializer(serializers.Serializer):
    message = serializers.CharField(max_length=1000)
    history = HistoryItemSerializer(many=True, required=False)

    def validate_history(self, value):
        if len(value) > 10:
            raise serializers.ValidationError("The conversation history is too long.")
        return value
