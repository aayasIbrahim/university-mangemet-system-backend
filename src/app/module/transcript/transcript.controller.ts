import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { TranscriptService } from "./transcript.service";

const generateTranscript = catchAsync(async (req: Request, res: Response) => {
  const studentId = req.user?.userId;
  const semesterId = req.body.semesterId;
  const result = await TranscriptService.generateTranscript(
    studentId as string,
    semesterId,
  );
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Transcript generated successfully.",
    data: result,
  });
});
const getAllTranscript = catchAsync(async (req: Request, res: Response) => {
  const result = await TranscriptService.getAllTranscript(req.query as any);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Transcripts fetched successfully.",
    data: result,
  });
});

const getSingleTranscript = catchAsync(async (req: Request, res: Response) => {
  const result = await TranscriptService.getSingleTranscript(
    req.params.transcriptId as string,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Transcript fetched successfully.",
    data: result,
  });
});

const publishTranscript = catchAsync(async (req: Request, res: Response) => {
  const result = await TranscriptService.publishTranscript(
    req.params.transcriptId as string,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Transcript published successfully.",
    data: result,
  });
});
const getMyTranscripts = catchAsync(async (req: Request, res: Response) => {
  const student = await TranscriptService.getMyTranscripts(
    req.user!.userId,
    req.query as any,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Transcripts fetched successfully.",
    data: student,
  });
});

export const TranscriptController = {
  generateTranscript,
  getMyTranscripts,
  getAllTranscript,
  getSingleTranscript,
  publishTranscript,
};
