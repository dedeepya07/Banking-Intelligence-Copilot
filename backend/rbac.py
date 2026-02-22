from typing import Dict, List, Any
from .models import UserRole
import re

class RBACManager:
    def __init__(self):
        self.pii_columns = [
            'email', 'phone', 'address', 'account_number',
            'customer_id', 'transaction_id', 'hashed_password'
        ]
    
    def mask_pii_for_role(self, data: List[Dict[str, Any]], role: UserRole) -> List[Dict[str, Any]]:
        """Mask PII columns based on user role"""
        if role == UserRole.admin:
            return data
        
        masked_data = []
        for row in data:
            masked_row = row.copy()
            for column in self.pii_columns:
                if column in masked_row:
                    if role == UserRole.analyst:
                        # Analysts get partial masking
                        value = str(masked_row[column])
                        if len(value) > 4:
                            masked_row[column] = value[:2] + "*" * (len(value) - 4) + value[-2:]
                        else:
                            masked_row[column] = "*" * len(value)
                    elif role == UserRole.auditor:
                        # Auditors get full masking
                        masked_row[column] = "*" * len(str(masked_row[column]))
            masked_data.append(masked_row)
        
        return masked_data
    
    def check_table_access(self, table_name: str, role: UserRole) -> bool:
        """Check if role has access to specific table"""
        restricted_tables = ['users', 'roles'] if role != UserRole.admin else []
        return table_name not in restricted_tables
    
    def check_column_access(self, table_name: str, column_name: str, role: UserRole) -> bool:
        """Check if role has access to specific column"""
        if role == UserRole.admin:
            return True
        
        # Non-admins cannot access sensitive columns
        sensitive_columns = {
            'users': ['hashed_password'],
            'customers': ['email', 'phone', 'address'],
            'accounts': ['account_number'],
            'transactions': ['transaction_id']
        }
        
        if table_name in sensitive_columns:
            return column_name not in sensitive_columns[table_name]
        
        return True
    
    def filter_query_columns(self, sql: str, role: UserRole) -> str:
        """Filter SQL query columns based on role"""
        if role == UserRole.admin:
            return sql
        
        # Simple column filtering - remove PII columns from SELECT
        select_pattern = re.compile(r'SELECT\s+(.*?)\s+FROM', re.IGNORECASE | re.DOTALL)
        match = select_pattern.search(sql)
        
        if match:
            columns = match.group(1)
            filtered_columns = []
            
            for col in columns.split(','):
                col = col.strip()
                col_name = col.split('.')[-1].split(' AS ')[0].strip()
                
                if not any(pii in col_name.upper() for pii in self.pii_columns):
                    filtered_columns.append(col)
            
            if filtered_columns:
                new_select = 'SELECT ' + ', '.join(filtered_columns)
                sql = sql.replace(match.group(0), new_select + ' FROM', 1)
        
        return sql

rbac_manager = RBACManager()
