import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import announcementsRouter from "./announcements";
import eventsRouter from "./events";
import scrimsRouter from "./scrims";
import feedRouter from "./feed";
import leaderboardRouter from "./leaderboard";
import dashboardRouter from "./dashboard";
import adminRouter from "./admin";
import panelRouter from "./panel";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(announcementsRouter);
router.use(eventsRouter);
router.use(scrimsRouter);
router.use(feedRouter);
router.use(leaderboardRouter);
router.use(dashboardRouter);
router.use(adminRouter);
router.use(panelRouter);

export default router;
