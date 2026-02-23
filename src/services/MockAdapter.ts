import { Truck, BulkStorageTank, QualityHealthEvent } from '../types/database';

/**
 * Mock API Adapter
 * Simulates the shape of data we expect from the pre-built reports or API calls.
 */
export const mockApiAdapter = {
    /**
     * Simulates a "Factory Health" report API response
     */
    getFactoryHealth: async (): Promise<QualityHealthEvent[]> => {
        return [
            {
                id: 'evt-1',
                truckId: 't-101',
                stockNumber: 'ST-2024-01',
                lifecycleStage: 'qc_hold',
                type: 'sensor_offline',
                offlineReason: 'signal_loss',
                severity: 'high',
                details: 'GPS Sensor 2 disconnected during PDI',
                timestamp: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
                resolved: false
            }
        ];
    },

    /**
     * Simulates a "Fuel Consumption" CSV mapping
     */
    mapFuelReport: (csvData: any[]): Partial<BulkStorageTank>[] => {
        return csvData.map(row => ({
            name: row.TankName,
            currentLevelLitres: Number(row.Level),
            lastUpdated: { seconds: Date.now() / 1000, nanoseconds: 0 } as any
        }));
    }
};
