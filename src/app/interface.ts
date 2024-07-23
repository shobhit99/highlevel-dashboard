export interface IBulkAction {
    id: number;
    actionId: string;
    totalRecords: number;
    isScheduled: boolean;
    scheduledTime: string | null;
    createdAt: string;
    actionType: string;
    status: string;
    entity: string;
    skippedCount: number | null;
    failedCount: number | null;
    successCount: number | null;
    completedAt: string | null;
}