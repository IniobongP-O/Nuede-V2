import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";

import { storefrontRouter } from "./app/router.jsx";
import { queryClient } from "./lib/queryClient.js";

function App() {
  return <QueryClientProvider client={queryClient}><RouterProvider router={storefrontRouter} /></QueryClientProvider>;
}

export default App;
