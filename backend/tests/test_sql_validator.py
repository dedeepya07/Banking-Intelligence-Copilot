import pytest
from sql_validator import sql_validator

def test_validate_select_query():
    """Test validation of valid SELECT query"""
    sql = "SELECT name, email FROM customers LIMIT 100"
    params = {}
    
    is_valid, error = sql_validator.validate_sql(sql, params)
    
    assert is_valid == True
    assert error is None

def test_reject_delete_query():
    """Test rejection of DELETE query"""
    sql = "DELETE FROM customers WHERE id = 1"
    params = {}
    
    is_valid, error = sql_validator.validate_sql(sql, params)
    
    assert is_valid == False
    assert "Only SELECT queries are allowed" in error

def test_require_limit_clause():
    """Test that LIMIT clause is required"""
    sql = "SELECT name FROM customers"
    params = {}
    
    is_valid, error = sql_validator.validate_sql(sql, params)
    
    assert is_valid == False
    assert "Query must include a LIMIT clause" in error

def test_validate_limit_value():
    """Test LIMIT value validation"""
    # Valid limit
    sql = "SELECT name FROM customers LIMIT 500"
    params = {}
    is_valid, error = sql_validator.validate_sql(sql, params)
    assert is_valid == True
    
    # Invalid limit (too high)
    sql = "SELECT name FROM customers LIMIT 2000"
    is_valid, error = sql_validator.validate_sql(sql, params)
    assert is_valid == False
    assert "LIMIT cannot exceed 1000 rows" in error

def test_reject_unsafe_functions():
    """Test rejection of unsafe SQL functions"""
    sql = "SELECT name FROM customers WHERE 1=1; DROP TABLE users; --"
    params = {}
    
    is_valid, error = sql_validator.validate_sql(sql, params)
    
    assert is_valid == False
    assert "Unsafe function" in error

def test_validate_table_names():
    """Test validation of table names"""
    # Valid table
    sql = "SELECT name FROM customers LIMIT 100"
    params = {}
    is_valid, error = sql_validator.validate_sql(sql, params)
    assert is_valid == True
    
    # Invalid table
    sql = "SELECT name FROM invalid_table LIMIT 100"
    is_valid, error = sql_validator.validate_sql(sql, params)
    assert is_valid == False
    assert "Table 'invalid_table' is not allowed" in error

def test_validate_parameters():
    """Test parameter validation"""
    sql = "SELECT name FROM customers WHERE id = :id LIMIT 100"
    params = {"id": 123}
    
    is_valid, error = sql_validator.validate_sql(sql, params)
    
    assert is_valid == True
    
    # Invalid parameter type
    params = {"id": object()}
    is_valid, error = sql_validator.validate_sql(sql, params)
    assert is_valid == False
    assert "Invalid parameter type" in error

def test_reject_wildcard_queries():
    """Test rejection of wildcard (*) queries"""
    sql = "SELECT * FROM customers LIMIT 100"
    params = {}
    
    is_valid, error = sql_validator.validate_columns(sql)
    
    assert is_valid == False
    assert "Wildcard (*) queries are not allowed" in error

def test_check_query_complexity():
    """Test query complexity validation"""
    # Simple query
    sql = "SELECT name FROM customers LIMIT 100"
    is_valid, error = sql_validator.check_query_complexity(sql)
    assert is_valid == True
    
    # Too many JOINs
    sql = """SELECT c.name, a.balance 
             FROM customers c 
             JOIN accounts a ON c.id = a.customer_id
             JOIN transactions t ON a.id = t.account_id
             JOIN bank_branches b ON t.branch_id = b.id
             JOIN users u ON c.id = u.id
             JOIN roles r ON u.role = r.name
             LIMIT 100"""
    is_valid, error = sql_validator.check_query_complexity(sql)
    assert is_valid == False
    assert "Too many JOINs" in error

if __name__ == "__main__":
    pytest.main([__file__])
