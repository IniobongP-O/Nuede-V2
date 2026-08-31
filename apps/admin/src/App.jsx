import { RouterProvider } from "react-router-dom";

import { adminRouter } from "./app/router.jsx";

function App() {
  return <RouterProvider router={adminRouter} />;
}

export default App;
