// Test API Connection Component
import { useState, useEffect } from 'react';
import { useHealth, useMetrics } from '../hooks/useApi';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api.service';

export function ApiConnectionTest() {
  const { health, isLoading: healthLoading, error: healthError } = useHealth();
  const { metrics, isLoading: metricsLoading } = useMetrics();
  const { isAuthenticated, login, logout, user } = useAuth();
  const [testResult, setTestResult] = useState<string>('');

  const runConnectionTest = async () => {
    try {
      // Test 1: Health check
      const healthResponse = await apiService.getHealth();
      if (healthResponse.error) {
        setTestResult(`❌ Health check failed: ${healthResponse.error}`);
        return;
      }

      // Test 2: Login
      const loginResponse = await apiService.login({
        username: 'admin',
        password: 'admin123'
      });
      
      if (loginResponse.error) {
        setTestResult(`❌ Login failed: ${loginResponse.error}`);
        return;
      }

      // Test 3: Context chat
      const chatResponse = await apiService.contextChat({
        user_input: 'Test message from frontend',
        session_id: 'frontend_test_session',
        context_type: 'test'
      });

      if (chatResponse.error) {
        setTestResult(`❌ Chat failed: ${chatResponse.error}`);
        return;
      }

      setTestResult('✅ All connection tests passed! Frontend is connected to backend.');
    } catch (error) {
      setTestResult(`❌ Test error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h2 className="text-xl font-bold mb-4">API Connection Test</h2>
      
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2">
          <span className={health ? 'text-green-600' : 'text-red-600'}>
            {health ? '✅' : '❌'}
          </span>
          <span>Backend Health: {health ? 'Connected' : 'Disconnected'}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={isAuthenticated ? 'text-green-600' : 'text-gray-600'}>
            {isAuthenticated ? '✅' : '⭕'}
          </span>
          <span>Authentication: {isAuthenticated ? `Logged in as ${user?.role}` : 'Not logged in'}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={metrics ? 'text-green-600' : 'text-gray-600'}>
            {metrics ? '✅' : '⭕'}
          </span>
          <span>Metrics: {metrics ? `${metrics.total_transactions} transactions` : 'Not loaded'}</span>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={runConnectionTest}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Run Connection Test
        </button>
        
        {!isAuthenticated ? (
          <button
            onClick={() => login({ username: 'admin', password: 'admin123' })}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Login
          </button>
        ) : (
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Logout
          </button>
        )}
      </div>

      {testResult && (
        <div className={`p-3 rounded ${testResult.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {testResult}
        </div>
      )}
    </div>
  );
}
