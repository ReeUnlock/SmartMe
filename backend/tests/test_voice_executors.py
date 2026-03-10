"""Tests for voice executor validation logic.

These are unit tests that verify executor functions reject invalid input
and accept valid input correctly, without needing a real database.
We mock the DB session to test only the validation/transformation logic.
"""

import pytest
from unittest.mock import MagicMock, patch
from datetime import datetime, date

from app.voice.schemas import VoiceConfirmAction, VoiceActionType


class TestCalendarExecutorValidation:
    """Test that calendar executor validates fields correctly."""

    def test_add_event_missing_title_raises(self):
        from app.voice.executor import execute_add_event
        db = MagicMock()
        user = MagicMock()
        user.id = 1
        action = VoiceConfirmAction(
            action="add_event",
            transcript="test",
            start_at="2026-03-11T08:00:00",
        )
        with pytest.raises(ValueError, match="Brak tytułu"):
            execute_add_event(db, user, action)

    def test_add_event_missing_start_at_raises(self):
        from app.voice.executor import execute_add_event
        db = MagicMock()
        user = MagicMock()
        user.id = 1
        action = VoiceConfirmAction(
            action="add_event",
            transcript="test",
            title="Szpital",
        )
        with pytest.raises(ValueError, match="Brak daty rozpoczęcia"):
            execute_add_event(db, user, action)

    def test_add_event_valid_timed(self):
        """Valid timed event should create without raising."""
        from app.voice.executor import execute_add_event
        db = MagicMock()
        user = MagicMock()
        user.id = 1

        mock_event = MagicMock()
        mock_event.id = 1
        mock_event.title = "Szpital"
        mock_event.start_at = datetime(2026, 3, 11, 8, 0)
        mock_event.end_at = datetime(2026, 3, 11, 15, 30)
        mock_event.all_day = False
        mock_event.description = None
        mock_event.color = "sky"
        mock_event.icon = "hospital"
        mock_event.category = None
        mock_event.location = None

        db.add = MagicMock()
        db.commit = MagicMock()
        db.refresh = MagicMock(side_effect=lambda e: setattr(e, '__dict__', {**e.__dict__, **mock_event.__dict__}))

        # Patch Event constructor to return our mock
        with patch("app.voice.executor.Event") as MockEvent:
            MockEvent.return_value = mock_event
            action = VoiceConfirmAction(
                action="add_event",
                transcript="Szpital",
                title="Szpital",
                start_at="2026-03-11T08:00:00",
                end_at="2026-03-11T15:30:00",
                color="sky",
                icon="hospital",
            )
            result = execute_add_event(db, user, action)
            assert result["title"] == "Szpital"
            assert result["color"] == "sky"
            db.add.assert_called_once()
            db.commit.assert_called_once()

    def test_add_event_allday_date_only_string(self):
        """All-day event with date-only string should be accepted by the schema."""
        action = VoiceConfirmAction(
            action="add_event",
            transcript="Wolne",
            title="Wolne",
            start_at="2026-03-30",
            all_day=True,
            color="pink",
        )
        # Pydantic parsed it
        assert action.start_at is not None
        assert action.title == "Wolne"
        assert action.all_day is True

    def test_delete_all_events_missing_date_query(self):
        from app.voice.executor import execute_delete_all_events
        db = MagicMock()
        user = MagicMock()
        user.id = 1
        action = VoiceConfirmAction(
            action="delete_all_events",
            transcript="test",
        )
        with pytest.raises(ValueError, match="Brak zakresu dat"):
            execute_delete_all_events(db, user, action)

    def test_delete_all_events_invalid_date_query(self):
        from app.voice.executor import execute_delete_all_events
        db = MagicMock()
        user = MagicMock()
        user.id = 1
        action = VoiceConfirmAction(
            action="delete_all_events",
            transcript="test",
            date_query="not-a-date",
        )
        with pytest.raises(ValueError, match="Nieprawidłowy zakres"):
            execute_delete_all_events(db, user, action)


class TestShoppingExecutorValidation:
    """Test shopping executor validates fields correctly."""

    def test_create_list_missing_name(self):
        from app.voice.shopping_executor import execute_create_shopping_list
        db = MagicMock()
        user = MagicMock()
        user.id = 1
        action = VoiceConfirmAction(
            action="create_shopping_list",
            transcript="test",
        )
        with pytest.raises(ValueError, match="Brak nazwy listy"):
            execute_create_shopping_list(db, user, action)

    def test_add_items_missing_list_name(self):
        from app.voice.shopping_executor import execute_add_shopping_items
        db = MagicMock()
        user = MagicMock()
        user.id = 1
        action = VoiceConfirmAction(
            action="add_shopping_items",
            transcript="test",
            items=[{"name": "Mleko"}],
        )
        with pytest.raises(ValueError, match="Brak nazwy listy"):
            execute_add_shopping_items(db, user, action)

    def test_add_items_missing_items(self):
        from app.voice.shopping_executor import execute_add_shopping_items
        db = MagicMock()
        user = MagicMock()
        user.id = 1
        action = VoiceConfirmAction(
            action="add_shopping_items",
            transcript="test",
            list_name="Biedronka",
        )
        with pytest.raises(ValueError, match="Brak produktów"):
            execute_add_shopping_items(db, user, action)


class TestExpenseExecutorValidation:
    """Test expense executor validates fields correctly."""

    def test_add_expense_missing_amount(self):
        from app.voice.expense_executor import execute_add_expense
        db = MagicMock()
        user = MagicMock()
        user.id = 1
        action = VoiceConfirmAction(
            action="add_expense",
            transcript="test",
        )
        with patch("app.voice.expense_executor._ensure_defaults"):
            with pytest.raises(ValueError, match="Brak kwoty"):
                execute_add_expense(db, user, action)

    def test_add_recurring_missing_name(self):
        from app.voice.expense_executor import execute_add_recurring_expense
        db = MagicMock()
        user = MagicMock()
        user.id = 1
        action = VoiceConfirmAction(
            action="add_recurring_expense",
            transcript="test",
            amount=50.0,
        )
        with patch("app.voice.expense_executor._ensure_defaults"):
            with pytest.raises(ValueError, match="Brak nazwy"):
                execute_add_recurring_expense(db, user, action)

    def test_set_budget_missing_amount(self):
        from app.voice.expense_executor import execute_set_budget
        db = MagicMock()
        user = MagicMock()
        user.id = 1
        action = VoiceConfirmAction(
            action="set_budget",
            transcript="test",
        )
        with pytest.raises(ValueError, match="Brak kwoty"):
            execute_set_budget(db, user, action)


class TestPlansExecutorValidation:
    """Test plans executor validates fields correctly."""

    def test_add_goal_missing_title(self):
        from app.voice.plans_executor import execute_add_goal
        db = MagicMock()
        user = MagicMock()
        user.id = 1
        action = VoiceConfirmAction(
            action="add_goal",
            transcript="test",
        )
        with pytest.raises(ValueError, match="Brak tytułu celu"):
            execute_add_goal(db, user, action)

    def test_add_bucket_item_missing_title(self):
        from app.voice.plans_executor import execute_add_bucket_item
        db = MagicMock()
        user = MagicMock()
        user.id = 1
        action = VoiceConfirmAction(
            action="add_bucket_item",
            transcript="test",
        )
        with pytest.raises(ValueError, match="Brak tytułu"):
            execute_add_bucket_item(db, user, action)

    def test_delete_goal_not_found(self):
        from app.voice.plans_executor import execute_delete_goal
        db = MagicMock()
        user = MagicMock()
        user.id = 1
        # Mock empty query result
        db.query.return_value.filter.return_value.order_by.return_value.first.return_value = None
        action = VoiceConfirmAction(
            action="delete_goal",
            transcript="test",
            goal_title="nieistniejący cel",
        )
        with pytest.raises(ValueError, match="Nie znaleziono celu"):
            execute_delete_goal(db, user, action)

    def test_toggle_goal_not_found(self):
        from app.voice.plans_executor import execute_toggle_goal
        db = MagicMock()
        user = MagicMock()
        user.id = 1
        db.query.return_value.filter.return_value.order_by.return_value.first.return_value = None
        action = VoiceConfirmAction(
            action="toggle_goal",
            transcript="test",
            goal_title="cel",
        )
        with pytest.raises(ValueError, match="Nie znaleziono celu"):
            execute_toggle_goal(db, user, action)

    def test_delete_recurring_not_found(self):
        from app.voice.expense_executor import execute_delete_recurring_expense
        db = MagicMock()
        user = MagicMock()
        user.id = 1
        db.query.return_value.filter.return_value.first.return_value = None
        action = VoiceConfirmAction(
            action="delete_recurring_expense",
            transcript="test",
            recurring_name="Netflix",
        )
        with pytest.raises(ValueError, match="Nie znaleziono"):
            execute_delete_recurring_expense(db, user, action)
