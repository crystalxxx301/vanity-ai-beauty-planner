import { createBrowserRouter, Navigate } from "react-router-dom";
import { HomePage } from "../pages/HomePage";
import { LandingPage } from "../pages/LandingPage";
import { SceneInputPage } from "../pages/SceneInputPage";
import { AddProductPage } from "../pages/AddProductPage";
import { BeautyBagPage } from "../pages/BeautyBagPage";
import { BeautyPlanPage } from "../pages/BeautyPlanPage";
import { FollowUpPage } from "../pages/FollowUpPage";
import { LoadingPage } from "../pages/LoadingPage";
import { RefinementPage } from "../pages/RefinementPage";

export const router = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  { path: "/home", element: <HomePage /> },
  { path: "/plan/new", element: <SceneInputPage /> },
  { path: "/plan/follow-up", element: <FollowUpPage /> },
  { path: "/plan/building", element: <LoadingPage /> },
  { path: "/plan/:planId", element: <BeautyPlanPage /> },
  { path: "/plan/:planId/refine", element: <RefinementPage /> },
  { path: "/beauty-bag", element: <BeautyBagPage /> },
  { path: "/beauty-bag/add", element: <AddProductPage /> },
  { path: "*", element: <Navigate to="/" replace /> },
]);
