import { db } from "./db";
import { APP_VERSION } from "./constants";

export interface ExportData {
  version: string;
  exportDate: string;
  sessions: unknown[];
}

/**
 * Export all game sessions to a JSON file
 */
export async function exportGameData(): Promise<void> {
  try {
    // Get all sessions from IndexedDB
    const sessions = await db.sessions.toArray();

    const exportData: ExportData = {
      version: APP_VERSION,
      exportDate: new Date().toISOString(),
      sessions,
    };

    // Create blob and download
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `poker-companion-backup-${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Export failed:", error);
    throw new Error("Failed to export game data");
  }
}

/**
 * Import game sessions from a JSON file
 */
export async function importGameData(file: File): Promise<number> {
  try {
    const text = await file.text();
    const data: ExportData = JSON.parse(text);

    // Validate data structure
    if (!data.version || !data.sessions || !Array.isArray(data.sessions)) {
      throw new Error("Invalid backup file format");
    }

    // Import sessions (merge with existing data)
    let importedCount = 0;
    for (const session of data.sessions) {
      // Type assertion since we validated the structure
      const typedSession = session as { id: string };

      // Check if session already exists
      const existing = await db.sessions.get(typedSession.id);
      if (!existing) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await db.sessions.add(session as any);
        importedCount++;
      }
    }

    return importedCount;
  } catch (error) {
    console.error("Import failed:", error);
    throw new Error(
      "Failed to import game data. Please check the file format."
    );
  }
}

/**
 * Clear all game data from IndexedDB
 */
export async function clearAllData(): Promise<void> {
  try {
    await db.sessions.clear();
  } catch (error) {
    console.error("Clear data failed:", error);
    throw new Error("Failed to clear game data");
  }
}

/**
 * Get total number of sessions
 */
export async function getSessionCount(): Promise<number> {
  try {
    return await db.sessions.count();
  } catch (error) {
    console.error("Get session count failed:", error);
    return 0;
  }
}
