import { routeError } from "@/server/http";
import { backupService } from "@/server/services";

export async function GET() {
  try {
    const manifest = await backupService.exportManifest();
    const date = manifest.exportedAt.slice(0, 10);
    return new Response(JSON.stringify(manifest, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="question-bank-backup-${date}.json"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return routeError(error);
  }
}
