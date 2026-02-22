import re
from typing import Dict, List, Any, Tuple, Optional
from .models import Base

class SQLValidator:
    def __init__(self):
        self.allowed_tables = [table.name for table in Base.metadata.tables.values()]
        self.unsafe_functions = [
            'EXEC', 'EXECUTE', 'DROP', 'DELETE', 'UPDATE', 'INSERT', 
            'CREATE', 'ALTER', 'TRUNCATE', 'MERGE', 'UNION', 'GRANT',
            'REVOKE', 'COMMIT', 'ROLLBACK', 'SAVEPOINT'
        ]
        self.unsafe_keywords = [
            '--', '/*', '*/', 'xp_', 'sp_', '0x', 'WAITFOR', 'BULK'
        ]
    
    def validate_sql(self, sql: str, params: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
        """Validate SQL query for security"""
        sql_upper = sql.upper().strip()
        
        # Check if it's a SELECT query
        if not sql_upper.startswith('SELECT'):
            return False, "Only SELECT queries are allowed"
        
        # Check for unsafe functions
        for unsafe_func in self.unsafe_functions:
            if unsafe_func in sql_upper:
                return False, f"Unsafe function '{unsafe_func}' not allowed"
        
        # Check for unsafe keywords
        for unsafe_keyword in self.unsafe_keywords:
            if unsafe_keyword in sql_upper:
                return False, f"Unsafe keyword '{unsafe_keyword}' not allowed"
        
        # Extract table names and validate
        tables = self._extract_tables(sql)
        for table in tables:
            if table.lower() not in [t.lower() for t in self.allowed_tables]:
                return False, f"Table '{table}' is not allowed"
        
        # Check for LIMIT clause
        if 'LIMIT' not in sql_upper:
            return False, "Query must include a LIMIT clause"
        
        # Validate LIMIT value
        limit_match = re.search(r'LIMIT\s+(\d+)', sql_upper, re.IGNORECASE)
        if limit_match:
            limit_value = int(limit_match.group(1))
            if limit_value > 1000:
                return False, "LIMIT cannot exceed 1000 rows"
        else:
            return False, "Invalid LIMIT clause"
        
        # Validate parameters
        for param_name, param_value in params.items():
            if not isinstance(param_value, (str, int, float, bool)):
                return False, f"Invalid parameter type for {param_name}"
        
        return True, None
    
    def _extract_tables(self, sql: str) -> List[str]:
        """Extract table names from SQL query"""
        tables = []
        
        # Simple regex to extract table names after FROM and JOIN
        from_pattern = re.compile(r'FROM\s+([a-zA-Z_][a-zA-Z0-9_]*)', re.IGNORECASE)
        join_pattern = re.compile(r'JOIN\s+([a-zA-Z_][a-zA-Z0-9_]*)', re.IGNORECASE)
        
        from_matches = from_pattern.findall(sql)
        join_matches = join_pattern.findall(sql)
        
        tables.extend(from_matches)
        tables.extend(join_matches)
        
        return list(set(tables))
    
    def validate_columns(self, sql: str) -> Tuple[bool, Optional[str]]:
        """Validate column names in SELECT clause"""
        select_pattern = re.compile(r'SELECT\s+(.*?)\s+FROM', re.IGNORECASE | re.DOTALL)
        match = select_pattern.search(sql)
        
        if not match:
            return False, "Invalid SELECT clause"
        
        columns_part = match.group(1)
        
        # Check for wildcard
        if '*' in columns_part:
            return False, "Wildcard (*) queries are not allowed"
        
        return True, None
    
    def sanitize_sql(self, sql: str) -> str:
        """Basic SQL sanitization"""
        # Remove comments
        sql = re.sub(r'--.*$', '', sql, flags=re.MULTILINE)
        sql = re.sub(r'/\*.*?\*/', '', sql, flags=re.DOTALL)
        
        # Normalize whitespace
        sql = ' '.join(sql.split())
        
        return sql.strip()
    
    def check_query_complexity(self, sql: str) -> Tuple[bool, Optional[str]]:
        """Check query complexity to prevent performance issues"""
        sql_upper = sql.upper()
        
        # Count JOINs
        join_count = sql_upper.count('JOIN')
        if join_count > 5:
            return False, "Too many JOINs (maximum 5 allowed)"
        
        # Check for subqueries
        if sql_upper.count('(SELECT') > 3:
            return False, "Too many subqueries (maximum 3 allowed)"
        
        # Check for expensive operations
        expensive_ops = ['GROUP BY', 'ORDER BY', 'DISTINCT']
        for op in expensive_ops:
            if op in sql_upper and 'LIMIT' not in sql_upper:
                return False, f"Expensive operation '{op}' requires LIMIT clause"
        
        return True, None

sql_validator = SQLValidator()
