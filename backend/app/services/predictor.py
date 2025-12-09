"""
Demand prediction and forecasting service
"""
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict
from sqlalchemy.orm import Session
from app.models.models import Demand, InventoryItem


class DemandPredictor:
    """Service for demand forecasting and prediction"""
    
    def __init__(self, db: Session):
        self.db = db
    
    async def forecast_demand(
        self,
        product_id: int,
        warehouse_id: int,
        forecast_days: int = 30
    ) -> List[Dict]:
        """
        Forecast demand for a product at a warehouse
        
        For initial implementation, uses simple moving average
        In production, would use Prophet, ARIMA, or LSTM models
        """
        # Get historical data (placeholder)
        # In production, query actual historical demand data
        
        # Generate sample forecast data
        forecast_results = []
        base_demand = 100  # Base demand quantity
        
        for day in range(forecast_days):
            forecast_date = datetime.now() + timedelta(days=day + 1)
            
            # Simple forecasting with trend and seasonality (placeholder)
            trend = day * 0.5
            seasonality = 10 * np.sin(2 * np.pi * day / 7)  # Weekly pattern
            noise = np.random.normal(0, 5)
            
            predicted_quantity = max(0, base_demand + trend + seasonality + noise)
            
            # Confidence intervals (±20%)
            confidence_interval_lower = predicted_quantity * 0.8
            confidence_interval_upper = predicted_quantity * 1.2
            
            forecast_results.append({
                "product_id": product_id,
                "warehouse_id": warehouse_id,
                "forecast_date": forecast_date.isoformat(),
                "predicted_quantity": round(predicted_quantity, 2),
                "confidence_interval_lower": round(confidence_interval_lower, 2),
                "confidence_interval_upper": round(confidence_interval_upper, 2),
                "model_version": "v1.0-simple-ma"
            })
        
        return forecast_results
    
    def analyze_inventory_trends(
        self,
        warehouse_id: int,
        days: int = 90
    ) -> Dict:
        """
        Analyze inventory trends for a warehouse
        """
        # Placeholder for trend analysis
        return {
            "warehouse_id": warehouse_id,
            "analysis_period_days": days,
            "message": "Trend analysis would be implemented here with actual data"
        }
    
    def calculate_reorder_point(
        self,
        average_daily_demand: float,
        lead_time_days: int,
        safety_stock: float = None
    ) -> int:
        """
        Calculate optimal reorder point
        
        ROP = (Average Daily Demand × Lead Time) + Safety Stock
        """
        if safety_stock is None:
            # Default safety stock to 1.5 times demand during lead time
            safety_stock = average_daily_demand * lead_time_days * 0.5
        
        reorder_point = (average_daily_demand * lead_time_days) + safety_stock
        return int(np.ceil(reorder_point))
    
    def calculate_economic_order_quantity(
        self,
        annual_demand: float,
        order_cost: float,
        holding_cost: float
    ) -> int:
        """
        Calculate Economic Order Quantity (EOQ)
        
        EOQ = sqrt((2 × Annual Demand × Order Cost) / Holding Cost)
        """
        eoq = np.sqrt((2 * annual_demand * order_cost) / holding_cost)
        return int(np.ceil(eoq))
