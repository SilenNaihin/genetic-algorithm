"""Tests for frame storage utilities."""

import pytest

from app.storage.frames import select_creatures_for_frames, should_record_frames


class TestSelectCreaturesForFrames:
    """Tests for select_creatures_for_frames function."""

    def test_none_mode_returns_empty(self):
        """None mode should return empty set."""
        ids = ['a', 'b', 'c']
        scores = [10.0, 20.0, 30.0]
        result = select_creatures_for_frames(ids, scores, 'none')
        assert result == set()

    def test_all_mode_returns_all(self):
        """All mode should return all creature IDs."""
        ids = ['a', 'b', 'c']
        scores = [10.0, 20.0, 30.0]
        result = select_creatures_for_frames(ids, scores, 'all')
        assert result == {'a', 'b', 'c'}

    def test_sparse_mode_top_and_bottom(self):
        """Sparse mode should return top N and bottom N."""
        ids = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']
        scores = [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0]

        # Top 2 + bottom 2
        result = select_creatures_for_frames(ids, scores, 'sparse', top_count=2, bottom_count=2)

        # Top 2: j (10.0), i (9.0)
        # Bottom 2: a (1.0), b (2.0)
        assert result == {'j', 'i', 'a', 'b'}

    def test_sparse_mode_overlap(self):
        """Sparse mode with small list should handle overlap."""
        ids = ['a', 'b', 'c']
        scores = [10.0, 20.0, 30.0]

        # Top 5 + bottom 5, but only 3 creatures
        result = select_creatures_for_frames(ids, scores, 'sparse', top_count=5, bottom_count=5)

        # Should return all 3 (overlap)
        assert result == {'a', 'b', 'c'}

    def test_sparse_mode_single_creature(self):
        """Sparse mode with single creature."""
        ids = ['a']
        scores = [10.0]

        result = select_creatures_for_frames(ids, scores, 'sparse', top_count=10, bottom_count=10)
        assert result == {'a'}

    def test_empty_list(self):
        """Empty list should return empty set for all modes."""
        assert select_creatures_for_frames([], [], 'none') == set()
        assert select_creatures_for_frames([], [], 'all') == set()
        assert select_creatures_for_frames([], [], 'sparse') == set()

    def test_sparse_mode_exact_counts(self):
        """Sparse mode with exact top/bottom counts."""
        # 20 creatures, top 10 + bottom 10 = all 20
        ids = [f'creature_{i}' for i in range(20)]
        scores = [float(i) for i in range(20)]

        result = select_creatures_for_frames(ids, scores, 'sparse', top_count=10, bottom_count=10)
        assert len(result) == 20  # All selected due to overlap

    def test_sparse_mode_no_overlap(self):
        """Sparse mode with no overlap between top and bottom."""
        # 30 creatures, top 10 + bottom 10 = 20 unique
        ids = [f'creature_{i}' for i in range(30)]
        scores = [float(i) for i in range(30)]

        result = select_creatures_for_frames(ids, scores, 'sparse', top_count=10, bottom_count=10)

        # Top 10: creatures 29-20
        # Bottom 10: creatures 0-9
        assert len(result) == 20

        # Check top 10
        for i in range(20, 30):
            assert f'creature_{i}' in result

        # Check bottom 10
        for i in range(10):
            assert f'creature_{i}' in result

    def test_negative_fitness_scores(self):
        """Handle negative fitness scores correctly."""
        ids = ['a', 'b', 'c', 'd']
        scores = [-10.0, -5.0, 5.0, 10.0]

        result = select_creatures_for_frames(ids, scores, 'sparse', top_count=1, bottom_count=1)

        # Top 1: d (10.0)
        # Bottom 1: a (-10.0)
        assert result == {'d', 'a'}

    def test_equal_fitness_scores(self):
        """Handle equal fitness scores."""
        ids = ['a', 'b', 'c', 'd']
        scores = [5.0, 5.0, 5.0, 5.0]

        result = select_creatures_for_frames(ids, scores, 'sparse', top_count=2, bottom_count=2)

        # All have same score, should still select some
        assert len(result) == 4  # Due to overlap with equal scores


class TestShouldRecordFrames:
    """Tests for should_record_frames function."""

    def test_none_mode(self):
        """None mode should not record."""
        assert should_record_frames('none') is False

    def test_all_mode(self):
        """All mode should record."""
        assert should_record_frames('all') is True

    def test_sparse_mode(self):
        """Sparse mode should record."""
        assert should_record_frames('sparse') is True
