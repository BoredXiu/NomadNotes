import api from "./client";
import type { ApiResponse } from "../types";

export type ExportFormat = "html" | "markdown" | "pdf";

export interface ExportParams {
  tripId: string;
  format: ExportFormat;
  noteIds?: string[] | null;
}

export async function exportNotes(params: ExportParams): Promise<Blob> {
  const queryParams: Record<string, string> = {
    format: params.format,
  };
  if (params.noteIds && params.noteIds.length > 0) {
    queryParams.noteIds = params.noteIds.join(",");
  }

  const res = await api.get(`/trips/${params.tripId}/notes/export`, {
    params: queryParams,
    responseType: "blob",
  });
  return res.data;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}