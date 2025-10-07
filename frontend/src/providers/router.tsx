import { BrowserRouter, Route, Routes } from "react-router";
import { Home } from "../app/home/home";

export function RouterProvider() {
  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}
