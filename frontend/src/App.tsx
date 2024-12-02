import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LoadingProvider } from './contexts/LoadingContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LocaleProvider } from './contexts/LocaleContext';
import AppRoutes from './routes';
import ErrorBoundary from './components/ErrorBoundary';
import NetworkStatus from './components/NetworkStatus';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <LocaleProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <LoadingProvider>
              <AuthProvider>
                <Router>
                  <AppRoutes />
                  <NetworkStatus />
                </Router>
              </AuthProvider>
            </LoadingProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </LocaleProvider>
    </ErrorBoundary>
  );
}

export default App; 