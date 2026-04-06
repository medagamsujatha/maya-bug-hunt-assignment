import { Router, type IRouter } from "express";
import healthRouter from "./health";
import bugsRouter from "./bugs";

const router: IRouter = Router();

router.use(healthRouter);
router.use(bugsRouter);

export default router;
