import { RouterProvider } from "react-router-dom";

import { storefrontRouter } from "./app/router.jsx";

function App() {
  return <RouterProvider router={storefrontRouter} />;
}

export default App;
