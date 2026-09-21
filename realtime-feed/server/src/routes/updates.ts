import { Router, Request, Response } from "express";
import { createUpdate } from "../services/update-service";
import { getUpdatesAfter } from "../services/update-repository";

const router = Router();

router.get(
  "/incidents/:incidentId/updates",
  async (
    req: Request<{ incidentId: string }>,
    res: Response
  ) => {
    try {
      const { incidentId } = req.params;

      if (!incidentId) {
        return res.status(400).json({
          error: "incidentId is required",
        });
      }

      const afterParam = req.query.after ?? "0";
      const after = Number(afterParam);

      if (!Number.isInteger(after) || after < 0) {
        return res.status(400).json({
          error: "after must be a non-negative integer",
        });
      }

      const updates = await getUpdatesAfter(
        incidentId,
        after
      );

      return res.status(200).json({
        incidentId,
        after,
        updates,
      });
    } catch (error) {
      console.error("Failed to retrieve updates:", error);

      return res.status(500).json({
        error: "Failed to retrieve incident updates",
      });
    }
  }
);

router.post(
  "/incidents/:incidentId/updates",
  async (
    req: Request<{ incidentId: string }, {}, { message: string }>,
    res: Response
  ) => {
    try {
      const { incidentId } = req.params;
      const { message } = req.body;

      if (!incidentId) {
        return res.status(400).json({
          error: "incidentId is required",
        });
      }

      if (
        typeof message !== "string" ||
        message.trim().length === 0
      ) {
        return res.status(400).json({
          error: "message is required",
        });
      }

      const update = await createUpdate(
        incidentId,
        message.trim()
      );

      return res.status(201).json(update);
    } catch (error) {
      console.error("Failed to create update:", error);

      return res.status(500).json({
        error: "Failed to create incident update",
      });
    }
  }
);

export default router;