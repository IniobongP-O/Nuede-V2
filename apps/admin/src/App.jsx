import { RouterProvider } from "react-router-dom";

import { adminRouter } from "./app/router.jsx";
import { AuthProvider } from "./features/auth/context/AuthContext.jsx";

function App() {
  return <AuthProvider><RouterProvider router={adminRouter} /></AuthProvider>;
}

export default App;
