import { useState, useEffect } from 'react';
import { Truck, BulkStorageTank, Part, QualityHealthEvent } from '../types/database';

/**
 * DataService centralizes all data fetching and state management.
 * It provides a unified interface for components regardless of the data source
 * (CSV ingestion, Firebase, or external APIs).
 */
class DataService {
    private static instance: DataService;

    private constructor() {
        this.seedData();
    }

    private seedData() {
        this.mockTrucks = [
            {
                id: 't-1',
                stockNumber: 'ST-001',
                vinNumber: 'VIN-12345',
                engineNumber: 'ENG-123',
                make: 'Powerstar',
                model: 'VX 2642',
                euroSpec: 'euro2',
                galileoImei: 'IMEI-1',
                sim1Iccid: 'SIM-1',
                sim2Iccid: 'BICS-1',
                ecuSerialNumber: 'ECU-1',
                ecuFirmwareVersion: '1.0',
                limiterGpsSerial: 'GPS-1',
                installDate: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
                installerName: 'Mock Tech',
                installDurationMinutes: 60,
                odometerAtInstall: 0,
                engineHoursAtInstall: 0,
                currentOdometer: 1200,
                currentEngineHours: 45,
                powerTechFolder: 'Century/Teichman',
                lifecycleStage: 'active_fleet',
                dealershipId: 'd-1',
                clientId: 'c-1',
                factoryFitOrRetrofit: 'factory_fit',
                calibrationProfile: 'Standard',
                engineProtectConfig: {
                    coolantWarnTemp: 95,
                    coolantProtectTemp: 105,
                    oilPressureWarn: 1.5,
                    oilPressureProtect: 1.0,
                    batteryWarnVoltage: 11.5,
                    rpmWarn: 2200,
                    rpmLimit: 2500,
                    speedLimit: 85
                },
                deviceStatus: 'online_moving',
                lastCommunication: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
                createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any
            }
        ];
    }

    public static getInstance(): DataService {
        if (!DataService.instance) {
            DataService.instance = new DataService();
        }
        return DataService.instance;
    }

    /**
   * Mock data for fallback and development
   */
    private mockTrucks: Truck[] = [];
    private mockTanks: BulkStorageTank[] = [];
    private listeners: Set<() => void> = new Set();

    public subscribe(listener: () => void) {
        this.listeners.add(listener);
        return () => { this.listeners.delete(listener); };
    }

    private notify() {
        this.listeners.forEach(l => l());
    }

    /**
     * Hook-style methods for React components
     */
    public useTrucks() {
        const [trucks, setTrucks] = useState<Truck[]>(this.mockTrucks);
        const [loading, setLoading] = useState(false);

        useEffect(() => {
            const unsubscribe = this.subscribe(() => {
                setTrucks([...this.mockTrucks]);
            });
            return unsubscribe;
        }, []);

        return { trucks, loading };
    }

    /**
     * Placeholder for CSV Data Ingestion
     */
    public async ingestCSV(type: string, data: any[]) {
        console.log(`Ingesting ${data.length} records into ${type}`);
        if (type === 'trucks') {
            this.mockTrucks = [...this.mockTrucks, ...data];
        }
        this.notify();
        return true;
    }

    /**
     * Placeholder for API Data Fetching
     */
    public async fetchExternalData(endpoint: string) {
        try {
            const response = await fetch(endpoint);
            return await response.json();
        } catch (error) {
            console.error("API Fetch Error:", error);
            return null;
        }
    }
}

export const dataService = DataService.getInstance();
