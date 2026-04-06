import { Router, type IRouter } from "express";
import { eq, ilike, and, desc, or } from "drizzle-orm";
import { db, bugsTable } from "@workspace/db";
import {
  ListBugsQueryParams,
  CreateBugBody,
  GetBugParams,
  GetBugResponse,
  UpdateBugParams,
  UpdateBugBody,
  UpdateBugResponse,
  DeleteBugParams,
  GetRecentBugsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/bugs", async (req, res): Promise<void> => {
  const parsed = ListBugsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { category, severity, search, status } = parsed.data;

  const conditions = [];
  if (category) conditions.push(eq(bugsTable.category, category));
  if (severity) conditions.push(eq(bugsTable.severity, severity));
  if (status) conditions.push(eq(bugsTable.status, status));
  if (search) {
    conditions.push(
      or(
        ilike(bugsTable.title, `%${search}%`),
        ilike(bugsTable.actualBehaviour, `%${search}%`),
        ilike(bugsTable.expectedBehaviour, `%${search}%`)
      )
    );
  }

  const bugs = await db
    .select()
    .from(bugsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(bugsTable.createdAt));

  res.json(bugs);
});

router.post("/bugs", async (req, res): Promise<void> => {
  const parsed = CreateBugBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [bug] = await db
    .insert(bugsTable)
    .values({
      title: parsed.data.title,
      category: parsed.data.category ?? "Other",
      severity: parsed.data.severity ?? "Medium",
      status: parsed.data.status ?? "Draft",
      environment: parsed.data.environment,
      stepsToReproduce: parsed.data.stepsToReproduce,
      expectedBehaviour: parsed.data.expectedBehaviour,
      actualBehaviour: parsed.data.actualBehaviour,
      rootCause: parsed.data.rootCause ?? null,
      suggestedFix: parsed.data.suggestedFix ?? null,
      submittedToForm: parsed.data.submittedToForm ?? false,
      formSubmissionUrl: parsed.data.formSubmissionUrl ?? null,
    })
    .returning();

  res.status(201).json(GetBugResponse.parse(bug));
});

router.get("/bugs/stats/summary", async (req, res): Promise<void> => {
  const bugs = await db.select().from(bugsTable);

  const total = bugs.length;

  const byCategoryMap: Record<string, number> = {};
  const bySeverityMap: Record<string, number> = {};
  const byStatusMap: Record<string, number> = {};
  let rewardEligible = 0;

  for (const bug of bugs) {
    byCategoryMap[bug.category] = (byCategoryMap[bug.category] ?? 0) + 1;
    bySeverityMap[bug.severity] = (bySeverityMap[bug.severity] ?? 0) + 1;
    byStatusMap[bug.status] = (byStatusMap[bug.status] ?? 0) + 1;
    if (["Critical", "High", "Medium"].includes(bug.severity)) {
      rewardEligible++;
    }
  }

  const byCategory = Object.entries(byCategoryMap).map(([category, count]) => ({ category, count }));
  const bySeverity = Object.entries(bySeverityMap).map(([severity, count]) => ({ severity, count }));
  const byStatus = Object.entries(byStatusMap).map(([status, count]) => ({ status, count }));

  res.json({ total, byCategory, bySeverity, byStatus, rewardEligible });
});

router.get("/bugs/stats/recent", async (req, res): Promise<void> => {
  const parsed = GetRecentBugsQueryParams.safeParse(req.query);
  const limit = parsed.success && parsed.data.limit ? parsed.data.limit : 5;

  const bugs = await db
    .select()
    .from(bugsTable)
    .orderBy(desc(bugsTable.createdAt))
    .limit(limit);

  res.json(bugs);
});

router.get("/bugs/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetBugParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [bug] = await db
    .select()
    .from(bugsTable)
    .where(eq(bugsTable.id, params.data.id));

  if (!bug) {
    res.status(404).json({ error: "Bug not found" });
    return;
  }

  res.json(GetBugResponse.parse(bug));
});

router.put("/bugs/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateBugParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateBugBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
  if (parsed.data.category !== undefined) updateData.category = parsed.data.category;
  if (parsed.data.severity !== undefined) updateData.severity = parsed.data.severity;
  if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
  if (parsed.data.environment !== undefined) updateData.environment = parsed.data.environment;
  if (parsed.data.stepsToReproduce !== undefined) updateData.stepsToReproduce = parsed.data.stepsToReproduce;
  if (parsed.data.expectedBehaviour !== undefined) updateData.expectedBehaviour = parsed.data.expectedBehaviour;
  if (parsed.data.actualBehaviour !== undefined) updateData.actualBehaviour = parsed.data.actualBehaviour;
  if (parsed.data.rootCause !== undefined) updateData.rootCause = parsed.data.rootCause;
  if (parsed.data.suggestedFix !== undefined) updateData.suggestedFix = parsed.data.suggestedFix;
  if (parsed.data.submittedToForm !== undefined) updateData.submittedToForm = parsed.data.submittedToForm;
  if (parsed.data.formSubmissionUrl !== undefined) updateData.formSubmissionUrl = parsed.data.formSubmissionUrl;

  const [bug] = await db
    .update(bugsTable)
    .set(updateData)
    .where(eq(bugsTable.id, params.data.id))
    .returning();

  if (!bug) {
    res.status(404).json({ error: "Bug not found" });
    return;
  }

  res.json(UpdateBugResponse.parse(bug));
});

router.delete("/bugs/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteBugParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [bug] = await db
    .delete(bugsTable)
    .where(eq(bugsTable.id, params.data.id))
    .returning();

  if (!bug) {
    res.status(404).json({ error: "Bug not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
