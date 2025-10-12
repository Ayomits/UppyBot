import { AuthProvider } from "./providers/auth";
import { ReactQueryProvider } from "./providers/react-query";
import { RouterProvider } from "./providers/router";

function App() {
  return (
    <ReactQueryProvider>
      <AuthProvider>
        <RouterProvider />
      </AuthProvider>
    </ReactQueryProvider>
  );
}

export default App;
