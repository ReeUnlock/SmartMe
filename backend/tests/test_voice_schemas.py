"""Tests for voice schema validation — ensures payloads from frontend are accepted correctly."""

import pytest
from datetime import datetime
from app.voice.schemas import (
    VoiceActionType,
    VoiceConfirmAction,
    VoiceProposedAction,
)


class TestVoiceConfirmAction:
    """Test that VoiceConfirmAction correctly parses calendar payloads."""

    def test_timed_event_with_datetime(self):
        """Standard timed event — start_at as full ISO datetime."""
        action = VoiceConfirmAction(
            action="add_event",
            transcript="Szpital w poniedziałek",
            title="Szpital",
            start_at="2026-03-11T08:00:00",
            end_at="2026-03-11T15:30:00",
            all_day=False,
            color="sky",
        )
        assert action.start_at == datetime(2026, 3, 11, 8, 0)
        assert action.end_at == datetime(2026, 3, 11, 15, 30)
        assert action.all_day is False

    def test_allday_event_with_date_only(self):
        """All-day event — start_at as date-only string (the batch-flow scenario)."""
        action = VoiceConfirmAction(
            action="add_event",
            transcript="Wolne w piątek",
            title="Wolne",
            start_at="2026-03-30",
            all_day=True,
            color="pink",
        )
        # Pydantic v2 parses date-only as datetime at midnight
        assert action.start_at == datetime(2026, 3, 30, 0, 0)
        assert action.all_day is True

    def test_allday_event_with_datetime_string(self):
        """All-day event where frontend sends datetime with time — backend still accepts."""
        action = VoiceConfirmAction(
            action="add_event",
            transcript="Wolne",
            title="Wolne",
            start_at="2026-03-30T00:00:00",
            all_day=True,
        )
        assert action.start_at is not None

    def test_missing_start_at_is_none(self):
        """When start_at not provided, it should be None (executor will reject)."""
        action = VoiceConfirmAction(
            action="add_event",
            transcript="test",
            title="Test",
        )
        assert action.start_at is None

    def test_shopping_action_no_calendar_fields(self):
        """Shopping action should not require calendar fields."""
        action = VoiceConfirmAction(
            action="create_shopping_list",
            transcript="Stwórz listę zakupów",
            list_name="Biedronka",
            items=[{"name": "Mleko", "quantity": 1, "unit": "szt"}],
        )
        assert action.action == VoiceActionType.create_shopping_list
        assert action.list_name == "Biedronka"
        assert len(action.items) == 1

    def test_expense_action(self):
        """Expense action with required fields."""
        action = VoiceConfirmAction(
            action="add_expense",
            transcript="Wydałam 50 złotych",
            amount=50.0,
            expense_date="2026-03-10",
            expense_category="Jedzenie",
        )
        assert action.amount == 50.0
        assert action.expense_date == "2026-03-10"

    def test_plan_action_add_goal(self):
        """Plans: add_goal action."""
        action = VoiceConfirmAction(
            action="add_goal",
            transcript="Oszczędzić 10000 zł",
            goal_title="Oszczędzić 10000 zł",
            goal_target_value=10000,
            goal_unit="zł",
            goal_category="finanse",
            goal_deadline="2026-12-31",
        )
        assert action.action == VoiceActionType.add_goal
        assert action.goal_title == "Oszczędzić 10000 zł"
        assert action.goal_target_value == 10000

    def test_plan_action_add_bucket_item(self):
        """Plans: add_bucket_item action."""
        action = VoiceConfirmAction(
            action="add_bucket_item",
            transcript="Marzę o podróży do Japonii",
            bucket_title="Podróż do Japonii",
            bucket_category="podroze",
        )
        assert action.action == VoiceActionType.add_bucket_item
        assert action.bucket_title == "Podróż do Japonii"

    def test_all_action_types_valid(self):
        """All defined action types are accepted by the schema."""
        for action_type in VoiceActionType:
            action = VoiceConfirmAction(
                action=action_type.value,
                transcript="test",
            )
            assert action.action == action_type


class TestVoiceProposedAction:
    """Test that GPT response format is correctly parsed."""

    def test_multi_action_response_shape(self):
        """Simulates multiple actions from a single voice command."""
        actions_data = [
            {
                "action": "add_event",
                "transcript": "test",
                "title": "Szpital",
                "start_at": "2026-03-11T08:00:00",
                "end_at": "2026-03-11T15:30:00",
                "color": "sky",
            },
            {
                "action": "add_event",
                "transcript": "test",
                "title": "Wolne",
                "start_at": "2026-03-30",
                "all_day": True,
                "color": "pink",
            },
            {
                "action": "create_shopping_list",
                "transcript": "test",
                "list_name": "Zakupy",
                "items": [{"name": "Mleko"}],
            },
        ]
        actions = [VoiceProposedAction(**data) for data in actions_data]
        assert len(actions) == 3
        assert actions[0].action == VoiceActionType.add_event
        assert actions[1].all_day is True
        assert actions[2].action == VoiceActionType.create_shopping_list
