"""
Test configuration and fixtures
"""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.database import Base


# Test database URL (use in-memory SQLite for testing)
TEST_DATABASE_URL = "sqlite:///./test.db"


@pytest.fixture(scope="function")
def test_db():
    """Create a test database session"""
    engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        # Drop tables after test
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def sample_warehouse_data():
    """Sample warehouse data for testing"""
    return {
        "name": "Test Warehouse",
        "address": "Test Address 123",
        "latitude": -2.2,
        "longitude": -79.9,
        "capacity": 1000.0
    }


@pytest.fixture
def sample_product_data():
    """Sample product data for testing"""
    return {
        "sku": "TEST-001",
        "name": "Test Product",
        "description": "Test description",
        "unit_price": 99.99,
        "weight": 1.5,
        "volume": 0.1,
        "category": "Test"
    }
