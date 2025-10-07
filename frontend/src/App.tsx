import { ReactQueryProvider } from "./providers/react-query";
import { RouterProvider } from "./providers/router";

function App() {
  return (
    <ReactQueryProvider>
      <RouterProvider />
    </ReactQueryProvider>
  );
}

export default App;
