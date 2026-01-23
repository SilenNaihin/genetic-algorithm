"""Tests for runs API endpoints."""

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.main import app
from app.models import Creature, CreatureFrame, Generation, Run


@pytest.fixture
async def test_session():
    """Create a test database with a shared session."""
    # Use in-memory SQLite with StaticPool for single connection
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        echo=False,
        poolclass=StaticPool,
        connect_args={"check_same_thread": False},
    )

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = async_sessionmaker(engine, expire_on_commit=False)

    # Create a single session that will be shared
    session = async_session()

    yield session

    await session.close()
    await engine.dispose()


@pytest.fixture
async def client(test_session):
    """Create a test client with dependency override using shared session."""

    async def override_get_db():
        try:
            yield test_session
        finally:
            pass  # Don't close - we manage it in the fixture

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as client:
        yield client

    app.dependency_overrides.clear()


@pytest.fixture
async def sample_run(test_session: AsyncSession):
    """Create a sample run with generations and creatures for testing."""
    # Create run
    run = Run(
        id="test-run-123",
        name="Test Run",
        config={"population_size": 20},
        generation_count=3,
        current_generation=2,
        best_fitness=150.0,
        status="idle",
    )
    test_session.add(run)

    # Create 3 generations with creatures
    for gen_num in range(3):
        gen = Generation(
            run_id="test-run-123",
            generation=gen_num,
            best_fitness=100.0 + gen_num * 20,
            avg_fitness=50.0 + gen_num * 10,
            worst_fitness=10.0,
            median_fitness=45.0,
            creature_types={"3": 10, "4": 10},
            simulation_time_ms=1000,
        )
        test_session.add(gen)

        # Create creatures for each generation
        for i in range(5):
            creature_id = f"creature-{gen_num}-{i}"
            parent_ids = []
            if gen_num > 0:
                parent_ids = [f"creature-{gen_num - 1}-{i % 5}"]

            creature = Creature(
                id=creature_id,
                run_id="test-run-123",
                generation=gen_num,
                genome={"id": creature_id, "nodes": [], "muscles": []},
                fitness=50.0 + i * 10 + gen_num * 20,
                pellets_collected=i,
                disqualified=False,
                survival_streak=gen_num if i == 0 else 0,
                is_elite=i < 2,
                parent_ids=parent_ids,
            )
            test_session.add(creature)

            # Add frames for first creature of each generation
            if i == 0:
                frames = CreatureFrame(
                    creature_id=creature_id,
                    frames_data=b"test frame data",
                    frame_count=100,
                    frame_rate=15,
                )
                test_session.add(frames)

    await test_session.commit()
    return run


class TestForkRun:
    """Tests for the fork_run endpoint."""

    @pytest.mark.asyncio
    async def test_fork_run_success(self, client: AsyncClient, sample_run: Run):
        """Test successful fork of a run."""
        response = await client.post(
            "/api/runs/test-run-123/fork",
            json={"name": "Forked Run", "up_to_generation": 1}
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Forked Run"
        assert data["generation_count"] == 2  # Generations 0 and 1
        assert data["current_generation"] == 1
        assert data["id"] != "test-run-123"  # New ID

    @pytest.mark.asyncio
    async def test_fork_run_not_found(self, client: AsyncClient):
        """Test fork of non-existent run."""
        response = await client.post(
            "/api/runs/nonexistent/fork",
            json={"name": "Forked Run", "up_to_generation": 0}
        )

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_fork_run_invalid_generation(self, client: AsyncClient, sample_run: Run):
        """Test fork with invalid generation number."""
        # Generation too high
        response = await client.post(
            "/api/runs/test-run-123/fork",
            json={"name": "Forked Run", "up_to_generation": 10}
        )
        assert response.status_code == 400
        assert "does not exist" in response.json()["detail"]

        # Negative generation
        response = await client.post(
            "/api/runs/test-run-123/fork",
            json={"name": "Forked Run", "up_to_generation": -1}
        )
        assert response.status_code == 400

    @pytest.mark.asyncio
    async def test_fork_run_copies_config(self, client: AsyncClient, sample_run: Run):
        """Test that fork copies the original run's config."""
        response = await client.post(
            "/api/runs/test-run-123/fork",
            json={"name": "Forked Run", "up_to_generation": 0}
        )

        assert response.status_code == 201
        data = response.json()
        assert data["config"]["population_size"] == 20

    @pytest.mark.asyncio
    async def test_fork_run_tracks_best_creature(self, client: AsyncClient, sample_run: Run):
        """Test that fork correctly tracks best creature."""
        response = await client.post(
            "/api/runs/test-run-123/fork",
            json={"name": "Forked Run", "up_to_generation": 1}
        )

        assert response.status_code == 201
        data = response.json()
        # Best fitness should be from generation 1 (highest in forked range)
        assert data["best_fitness"] > 0
        assert data["best_creature_id"] is not None

    @pytest.mark.asyncio
    async def test_fork_at_generation_zero(self, client: AsyncClient, sample_run: Run):
        """Test forking at generation 0."""
        response = await client.post(
            "/api/runs/test-run-123/fork",
            json={"name": "Gen Zero Fork", "up_to_generation": 0}
        )

        assert response.status_code == 201
        data = response.json()
        assert data["generation_count"] == 1
        assert data["current_generation"] == 0


class TestRunCRUD:
    """Tests for basic CRUD operations."""

    @pytest.mark.asyncio
    async def test_create_run(self, client: AsyncClient):
        """Test creating a new run."""
        response = await client.post(
            "/api/runs",
            json={"name": "New Run", "config": {"population_size": 50}}
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "New Run"
        assert data["config"]["population_size"] == 50
        assert data["generation_count"] == 0

    @pytest.mark.asyncio
    async def test_list_runs(self, client: AsyncClient, sample_run: Run):
        """Test listing runs."""
        response = await client.get("/api/runs")

        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1

    @pytest.mark.asyncio
    async def test_get_run(self, client: AsyncClient, sample_run: Run):
        """Test getting a specific run."""
        response = await client.get("/api/runs/test-run-123")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "test-run-123"
        assert data["name"] == "Test Run"

    @pytest.mark.asyncio
    async def test_get_run_not_found(self, client: AsyncClient):
        """Test getting non-existent run."""
        response = await client.get("/api/runs/nonexistent")

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_update_run(self, client: AsyncClient, sample_run: Run):
        """Test updating a run."""
        response = await client.patch(
            "/api/runs/test-run-123",
            json={"name": "Updated Name"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Name"

    @pytest.mark.asyncio
    async def test_delete_run(self, client: AsyncClient):
        """Test deleting a run."""
        # Create a run via API
        create_response = await client.post(
            "/api/runs",
            json={"name": "Run to Delete", "config": {"population_size": 10}}
        )
        assert create_response.status_code == 201
        run_id = create_response.json()["id"]

        # Delete it
        response = await client.delete(f"/api/runs/{run_id}")
        assert response.status_code == 204

        # Verify deletion
        response = await client.get(f"/api/runs/{run_id}")
        assert response.status_code == 404
