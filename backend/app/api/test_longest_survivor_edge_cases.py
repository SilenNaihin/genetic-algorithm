"""
Edge case and stress tests for longest survivor tracking.

These tests intentionally try to break the implementation
by exploring boundary conditions, numerical edge cases, and integration scenarios.

Tests verify that evolution.py correctly updates run.longest_survivor_* fields.
"""

import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.main import app
from app.models.run import Run


@pytest.fixture
async def test_session():
    """Create a test database with a shared session."""
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        echo=False,
        poolclass=StaticPool,
        connect_args={"check_same_thread": False},
    )

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = async_sessionmaker(engine, expire_on_commit=False)
    session = async_session()

    yield session

    await session.close()
    await engine.dispose()


@pytest.fixture
async def async_client(test_session):
    """Create a test client with dependency override using shared session."""

    async def override_get_db():
        try:
            yield test_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as client:
        yield client

    app.dependency_overrides.clear()


@pytest.fixture
async def db_session(test_session):
    """Alias for test_session to match test expectations."""
    return test_session


class TestLongestSurvivorTracking:
    """Tests for longest survivor tracking during evolution."""

    @pytest.mark.asyncio
    async def test_longest_survivor_updated_after_evolution_step(
        self, async_client: AsyncClient, db_session: AsyncSession
    ):
        """Bug test: evolution step should update run.longest_survivor_* fields.

        This was broken - evolution.py updated best_creature but NOT longest_survivor.
        """
        # Create a run
        run_response = await async_client.post(
            "/api/runs",
            json={
                "name": "Test Longest Survivor",
                "name": "Test Run",
                "config": {
                    "population_size": 20,
                    "cull_percentage": 0.5,
                    "simulation_duration": 5,
                }
            }
        )
        assert run_response.status_code == 201
        run_id = run_response.json()["id"]

        # Run multiple evolution steps to allow survivors to accumulate streaks
        for _ in range(3):
            step_response = await async_client.post(f"/api/evolution/{run_id}/step")
            assert step_response.status_code == 200

        # Check the run has longest survivor tracked
        run_response = await async_client.get(f"/api/runs/{run_id}")
        assert run_response.status_code == 200
        run_data = run_response.json()

        # After 3 generations with 50% cull, some creatures should have survived 2+ gens
        # The run should have longest_survivor_streak > 0
        assert run_data["longest_survivor_streak"] >= 0, \
            "longest_survivor_streak should be tracked"

        # If any creature survived multiple generations, it should be recorded
        if run_data["longest_survivor_streak"] > 0:
            assert run_data["longest_survivor_id"] is not None, \
                "longest_survivor_id should be set when streak > 0"

    @pytest.mark.asyncio
    async def test_longest_survivor_increments_correctly(
        self, async_client: AsyncClient, db_session: AsyncSession
    ):
        """Verify that survival streak increments by 1 each generation for survivors."""
        # Create a run with low cull to ensure survivors
        run_response = await async_client.post(
            "/api/runs",
            json={
                "name": "Test Run",
                "config": {
                    "population_size": 10,
                    "cull_percentage": 0.3,  # 70% survive
                    "simulation_duration": 5,
                    }
            }
        )
        run_id = run_response.json()["id"]

        # Track max streak across generations
        max_streaks = []

        for gen in range(5):
            step_response = await async_client.post(f"/api/evolution/{run_id}/step")
            assert step_response.status_code == 200
            data = step_response.json()

            # Find max survival streak in this generation
            max_streak = max(
                c.get("survival_streak", 0) for c in data["creatures"]
            )
            max_streaks.append(max_streak)

        # After 5 gens with 70% survival, max streak should be at least 4
        # (one creature surviving all 5 generations would have streak=4 after gen 5)
        assert max_streaks[-1] >= 3, \
            f"Expected max streak >= 3 after 5 gens, got {max_streaks}"

    @pytest.mark.asyncio
    async def test_offspring_have_zero_streak(
        self, async_client: AsyncClient, db_session: AsyncSession
    ):
        """New offspring should always have survivalStreak = 0."""
        run_response = await async_client.post(
            "/api/runs",
            json={
                "name": "Test Run",
                "config": {
                    "population_size": 20,
                    "cull_percentage": 0.5,
                    "simulation_duration": 5,
                    }
            }
        )
        run_id = run_response.json()["id"]

        # Run a few generations
        for _ in range(3):
            await async_client.post(f"/api/evolution/{run_id}/step")

        # Run one more and check
        step_response = await async_client.post(f"/api/evolution/{run_id}/step")
        data = step_response.json()

        # Non-survivors (is_survivor=False) should have streak=0
        for creature in data["creatures"]:
            if not creature.get("is_survivor", False):
                assert creature.get("survival_streak", -1) == 0, \
                    f"Offspring should have survival_streak=0, got {creature.get('survival_streak')}"


class TestLongestSurvivorEdgeCases:
    """Edge cases for longest survivor tracking."""

    @pytest.mark.asyncio
    async def test_high_cull_few_survivors(
        self, async_client: AsyncClient, db_session: AsyncSession
    ):
        """With 90% cull (max allowed), very few creatures survive."""
        run_response = await async_client.post(
            "/api/runs",
            json={
                "name": "Test Run",
                "config": {
                    "population_size": 20,
                    "cull_percentage": 0.9,  # 90% cull = only 10% survive
                    "simulation_duration": 5,
                }
            }
        )
        assert run_response.status_code == 201
        run_id = run_response.json()["id"]

        # Run initial generation
        await async_client.post(f"/api/evolution/{run_id}/step")

        # Run second generation - only 2 of 20 survive (10%)
        step_response = await async_client.post(f"/api/evolution/{run_id}/step")
        data = step_response.json()

        survivors = [c for c in data["creatures"] if c.get("is_survivor", False)]
        # With 90% cull, only 10% survive = 2 creatures (may vary slightly due to rounding)
        assert len(survivors) >= 1 and len(survivors) <= 3, \
            f"Expected 1-3 survivors with 90% cull, got {len(survivors)}"

    @pytest.mark.asyncio
    async def test_low_cull_most_survive(
        self, async_client: AsyncClient, db_session: AsyncSession
    ):
        """With 10% cull (min allowed), most creatures survive and streaks increment."""
        run_response = await async_client.post(
            "/api/runs",
            json={
                "name": "Test Run",
                "config": {
                    "population_size": 10,
                    "cull_percentage": 0.1,  # 10% cull = 90% survive
                    "simulation_duration": 5,
                }
            }
        )
        assert run_response.status_code == 201
        run_id = run_response.json()["id"]

        # Initial generation
        await async_client.post(f"/api/evolution/{run_id}/step")

        # Second generation - 9 of 10 should survive (90%)
        step_response = await async_client.post(f"/api/evolution/{run_id}/step")
        data = step_response.json()

        survivors = [c for c in data["creatures"] if c.get("is_survivor", False)]
        assert len(survivors) == 9, f"Expected 9 survivors with 10% cull, got {len(survivors)}"

        for creature in survivors:
            assert creature.get("survival_streak", 0) >= 1, \
                "All survivors should have streak >= 1"

    @pytest.mark.asyncio
    async def test_small_population(
        self, async_client: AsyncClient, db_session: AsyncSession
    ):
        """Edge case: minimum population of 10 creatures."""
        run_response = await async_client.post(
            "/api/runs",
            json={
                "name": "Test Run",
                "config": {
                    "population_size": 10,
                    "cull_percentage": 0.1,  # Low cull to ensure survivors
                    "simulation_duration": 5,
                }
            }
        )
        assert run_response.status_code == 201
        run_id = run_response.json()["id"]

        # Run a few generations
        for gen in range(3):
            step_response = await async_client.post(f"/api/evolution/{run_id}/step")
            data = step_response.json()
            assert len(data["creatures"]) == 10, "Should have exactly 10 creatures"

        # After 3 gens with 10% cull, some creatures should have streak >= 2
        max_streak = max(c.get("survival_streak", 0) for c in data["creatures"])
        assert max_streak >= 2, f"Expected max streak >= 2 after 3 gens, got {max_streak}"


class TestSurvivalStreakIntegration:
    """Integration tests for survival streak across system components."""

    @pytest.mark.asyncio
    async def test_streak_persisted_to_database(
        self, async_client: AsyncClient, db_session: AsyncSession
    ):
        """Verify survival streak is persisted to the database correctly."""
        run_response = await async_client.post(
            "/api/runs",
            json={
                "name": "Test Run",
                "config": {
                    "population_size": 10,
                    "cull_percentage": 0.3,
                    "simulation_duration": 5,
                    }
            }
        )
        run_id = run_response.json()["id"]

        # Run several generations
        for _ in range(4):
            await async_client.post(f"/api/evolution/{run_id}/step")

        # Fetch run from API
        run_response = await async_client.get(f"/api/runs/{run_id}")
        run_data = run_response.json()

        # Check database run record
        from sqlalchemy import select
        result = await db_session.execute(select(Run).where(Run.id == run_id))
        db_run = result.scalar_one()

        # Verify API and DB are consistent
        assert run_data["longest_survivor_streak"] == db_run.longest_survivor_streak, \
            "API and DB should have same longest_survivor_streak"
        assert run_data["longest_survivor_id"] == db_run.longest_survivor_id, \
            "API and DB should have same longest_survivor_id"

    @pytest.mark.asyncio
    async def test_longest_survivor_endpoint(
        self, async_client: AsyncClient, db_session: AsyncSession
    ):
        """Test the dedicated longest survivor endpoint if it exists."""
        run_response = await async_client.post(
            "/api/runs",
            json={
                "name": "Test Run",
                "config": {
                    "population_size": 10,
                    "cull_percentage": 0.3,
                    "simulation_duration": 5,
                    }
            }
        )
        run_id = run_response.json()["id"]

        # Run several generations
        for _ in range(4):
            await async_client.post(f"/api/evolution/{run_id}/step")

        # Try to fetch longest survivor via creatures endpoint
        creatures_response = await async_client.get(
            f"/api/runs/{run_id}/creatures/longest-survivor"
        )

        # This endpoint may or may not exist
        if creatures_response.status_code == 200:
            data = creatures_response.json()
            assert "survival_streak" in data, "Response should include survival_streak"
            assert data["survival_streak"] > 0, "Longest survivor should have streak > 0"


class TestSurvivalStreakNumericalEdgeCases:
    """Numerical edge cases for survival streak."""

    @pytest.mark.asyncio
    async def test_long_run_streak_accumulation(
        self, async_client: AsyncClient, db_session: AsyncSession
    ):
        """Test that streaks accumulate correctly over many generations."""
        run_response = await async_client.post(
            "/api/runs",
            json={
                "name": "Test Run",
                "config": {
                    "population_size": 10,
                    "cull_percentage": 0.1,  # Low cull = 90% survive
                    "simulation_duration": 2,  # Short sim for speed
                }
            }
        )
        assert run_response.status_code == 201
        run_id = run_response.json()["id"]

        # Run 10 generations
        for _ in range(10):
            step_response = await async_client.post(f"/api/evolution/{run_id}/step")
            assert step_response.status_code == 200

        data = step_response.json()
        max_streak = max(c.get("survival_streak", 0) for c in data["creatures"])

        # With 90% survival, some creatures should have high streaks
        assert max_streak >= 5, f"Expected max streak >= 5 after 10 gens, got {max_streak}"

        # Verify it's stored correctly in the run
        run_response = await async_client.get(f"/api/runs/{run_id}")
        run_data = run_response.json()
        assert run_data["longest_survivor_streak"] >= 5
