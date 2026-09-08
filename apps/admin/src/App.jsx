import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";

import { adminRouter } from "./app/router.jsx";
import { AuthProvider } from "./features/auth/context/AuthContext.jsx";
import { queryClient } from "./lib/queryClient.js";

/** Mounts the admin router beneath authentication, query, and toast providers. */
function App() {
  return <QueryClientProvider client={queryClient}><AuthProvider><RouterProvider router={adminRouter} /></AuthProvider></QueryClientProvider>;
}

export default App;
