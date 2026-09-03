import { Router } from "express";
import { getDashboardStats } from "../controllers/dashboardController";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.get("/stats", requireAuth, getDashboardStats);

export default router;
