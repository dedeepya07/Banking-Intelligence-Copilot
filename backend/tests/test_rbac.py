import pytest
from rbac import rbac_manager
from models import UserRole

def test_admin_full_access():
    """Test admin role has full access to PII data"""
    data = [
        {"id": 1, "name": "John Doe", "email": "john@example.com", "phone": "123-456-7890"}
    ]
    
    masked_data = rbac_manager.mask_pii_for_role(data, UserRole.admin)
    
    assert masked_data == data  # Admin should see unmasked data

def test_analyst_partial_masking():
    """Test analyst role gets partial PII masking"""
    data = [
        {"id": 1, "name": "John Doe", "email": "john@example.com", "phone": "123-456-7890"}
    ]
    
    masked_data = rbac_manager.mask_pii_for_role(data, UserRole.analyst)
    
    assert masked_data[0]["email"] != "john@example.com"
    assert masked_data[0]["phone"] != "123-456-7890"
    assert "*" in masked_data[0]["email"]
    assert "*" in masked_data[0]["phone"]
    assert masked_data[0]["name"] == "John Doe"  # Non-PII should be unchanged

def test_auditor_full_masking():
    """Test auditor role gets full PII masking"""
    data = [
        {"id": 1, "name": "John Doe", "email": "john@example.com", "phone": "123-456-7890"}
    ]
    
    masked_data = rbac_manager.mask_pii_for_role(data, UserRole.auditor)
    
    assert masked_data[0]["email"] == "*" * len("john@example.com")
    assert masked_data[0]["phone"] == "*" * len("123-456-7890")
    assert masked_data[0]["name"] == "John Doe"  # Non-PII should be unchanged

def test_table_access_control():
    """Test table access control by role"""
    # Admin can access any table
    assert rbac_manager.check_table_access("users", UserRole.admin) == True
    assert rbac_manager.check_table_access("customers", UserRole.admin) == True
    
    # Non-admins cannot access sensitive tables
    assert rbac_manager.check_table_access("users", UserRole.analyst) == False
    assert rbac_manager.check_table_access("roles", UserRole.auditor) == False
    
    # Non-admins can access regular tables
    assert rbac_manager.check_table_access("customers", UserRole.analyst) == True
    assert rbac_manager.check_table_access("transactions", UserRole.auditor) == True

def test_column_access_control():
    """Test column access control by role"""
    # Admin can access any column
    assert rbac_manager.check_column_access("users", "hashed_password", UserRole.admin) == True
    assert rbac_manager.check_column_access("customers", "email", UserRole.admin) == True
    
    # Non-admins cannot access sensitive columns
    assert rbac_manager.check_column_access("users", "hashed_password", UserRole.analyst) == False
    assert rbac_manager.check_column_access("customers", "email", UserRole.auditor) == False
    
    # Non-admins can access non-sensitive columns
    assert rbac_manager.check_column_access("customers", "name", UserRole.analyst) == True
    assert rbac_manager.check_column_access("transactions", "amount", UserRole.auditor) == True

def test_filter_query_columns():
    """Test SQL query column filtering"""
    # Admin queries should not be filtered
    sql = "SELECT email, phone, name FROM customers LIMIT 100"
    filtered_sql = rbac_manager.filter_query_columns(sql, UserRole.admin)
    assert filtered_sql == sql
    
    # Non-admin queries should have PII columns removed
    sql = "SELECT email, phone, name FROM customers LIMIT 100"
    filtered_sql = rbac_manager.filter_query_columns(sql, UserRole.analyst)
    assert "email" not in filtered_sql.upper()
    assert "phone" not in filtered_sql.upper()
    assert "name" in filtered_sql

def test_mask_empty_data():
    """Test masking with empty data"""
    data = []
    masked_data = rbac_manager.mask_pii_for_role(data, UserRole.analyst)
    assert masked_data == []

def test_mask_missing_pii_columns():
    """Test masking when PII columns are missing"""
    data = [{"id": 1, "name": "John Doe"}]  # No PII columns
    masked_data = rbac_manager.mask_pii_for_role(data, UserRole.auditor)
    assert masked_data == data

if __name__ == "__main__":
    pytest.main([__file__])
