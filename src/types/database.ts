import { Timestamp } from 'firebase/firestore';

export type UserRole =
    | 'khulu_admin'      // Full access — Khulu Digital master account
    | 'oem_manager'      // Powerstar factory/OEM management — Tier 1 view
    | 'dealer_manager'   // Dealership manager — Tier 2, scoped to their dealership
    | 'fleet_client';    // Truck operator — Tier 3, scoped to their client folder

export interface User {
    uid: string;
    email: string;
    role: UserRole;
    dealershipId?: string;   // set for dealer_manager
    clientId?: string;       // set for fleet_client
    displayName: string;
    createdAt: Timestamp;
    lastLogin: Timestamp;
}

export interface Dealership {
    id: string;
    name: string;
    powerTechFolderName: string;
    region: string;
    province: string;
    managerName: string;
    managerEmail: string;
    managerPhone: string;
    objectCount: number;
    clientCount: number;
    createdAt: Timestamp;
}

export interface Client {
    id: string;
    dealershipId: string;
    companyName: string;
    registeredName: string;
    companyRegNumber: string;
    vatNumber: string;
    contactName: string;
    contactPhone: string;
    contactEmail: string;
    physicalAddress: string;
    operationalProvinces: string[];
    crossBorder: boolean;
    crossBorderCountries: string[];
    truckCount: number;
    signupDate: Timestamp;
    signedUpBySalesperson: string;
    salespersonPhone: string;
    factoryFitOrRetrofit: 'factory_fit' | 'retrofit' | 'mixed';
    primaryUseCase: string;
    averageDailyKm: number;
    servicedAt: string;
    currentFleetTools: string;
    packageSelected: 'base' | 'engine_protect' | 'full';
    retrofitPayee: 'client' | 'dealership' | 'factory' | null;
    monthlyPayee: 'client' | 'dealership';
    billingCycle: 'monthly' | 'quarterly' | 'annual';
    authorisedSignatory: string;
    salesIntelligence: {
        problemSolving: string;
        featureThatClosedDeal: string;
        objectionsRaised: string;
        featureRequestsNotOffered: string;
        clientEnthusiasm: number;  // 1-5
    };
    onboardingStatus: 'pending' | 'active' | 'suspended';
    notes: string;
}

export interface Truck {
    id: string;
    stockNumber: string;
    vinNumber: string;
    engineNumber: string;
    make: string;
    model: string;
    euroSpec: 'euro2';
    galileoImei: string;
    sim1Iccid: string;   // Vodacom
    sim2Iccid: string;   // BICS
    ecuSerialNumber: string;
    ecuFirmwareVersion: string;
    limiterGpsSerial: string;
    installDate: Timestamp;
    installerName: string;
    installDurationMinutes: number;
    odometerAtInstall: number;
    engineHoursAtInstall: number;
    currentOdometer: number;
    currentEngineHours: number;
    powerTechFolder: string;       // current folder path on PowerTech
    lifecycleStage: 'virtual_stockyard' | 'to_be_driven' | 'qc_hold' | 'active_fleet' | 'delivered';
    dealershipId: string;
    clientId: string;
    factoryFitOrRetrofit: 'factory_fit' | 'retrofit';
    calibrationProfile: string;
    engineProtectConfig: {
        coolantWarnTemp: number;
        coolantProtectTemp: number;
        oilPressureWarn: number;
        oilPressureProtect: number;
        batteryWarnVoltage: number;
        rpmWarn: number;
        rpmLimit: number;
        speedLimit: number;
    };
    deviceStatus: 'online_moving' | 'online_stationary' | 'alert' | 'offline';
    lastCommunication: Timestamp;
    createdAt: Timestamp;
}

export interface HardwareStock {
    id: string;
    itemType: 'galileo_10x' | 'ecu_limiter' | 'limiter_gps' | 'vodacom_sim' | 'bics_sim';
    supplier: string;
    totalOrdered: number;
    totalReceived: number;
    totalAllocated: number;
    availableStock: number;
    minimumBuffer: number;
    lastOrderDate: Timestamp;
    expectedLeadTimeDays: number;
    notes: string;
}

export interface StockTransaction {
    id: string;
    type: 'received' | 'allocated' | 'returned';
    quantity: number;
    truckStockNumber?: string;
    orderReference: string;
    date: Timestamp;
    notes: string;
}

export interface EngineProtectEvent {
    id: string;
    truckId: string;
    stockNumber: string;
    dealershipId: string;
    clientId: string;
    timestamp: Timestamp;
    parameter: 'coolant_temp' | 'oil_pressure' | 'battery_voltage' | 'rpm' | 'speed';
    value: number;
    threshold: number;
    actionTaken: string;
    durationMinutes: number;
    location: { lat: number, lng: number };
    resolved: boolean;
}

export interface OnboardingEmail {
    id: string;
    receivedAt: Timestamp;
    rawEmailText: string;
    clientName: string;
    dealershipId: string;
    salespersonName: string;
    truckStockNumbers: string[];
    processedAt: Timestamp | null;
    processedBy: string | null;
    status: 'pending' | 'processed';
    clientId: string | null;
}

export interface Algorithm {
    id: string;
    powerTechId: number;       // e.g. 22 for speeding
    name: string;
    triggerCondition: string;
    thresholdValue: number;
    thresholdUnit: string;
    affectedFolders: string[];
    actionOnTrigger: string;
    status: 'active' | 'planned' | 'inactive';
    createdAt: Timestamp;
    notes: string;
}

export interface BulkStorageTank {
    id: string;
    name: string;
    location: 'factory' | 'dealership';
    dealershipId?: string;
    type: 'diesel' | 'coolant';
    capacityLitres: number;
    currentLevelLitres: number;
    reorderThresholdLitres: number;
    lastUpdated: Timestamp;
}

export interface TankReading {
    id: string;
    timestamp: Timestamp;
    levelLitres: number;
    isAfterHours: boolean;
    flaggedAsAnomaly: boolean;
}

export interface SKDBatch {
    id: string;
    batchNumber: string;         // e.g. "SKD-2024-001"
    model: string;
    quantity: number;            // Number of trucks in batch
    startDate: Timestamp;
    targetCompletionDate: Timestamp;
    status: 'planned' | 'in_progress' | 'completed';
    resourceTargets: {
        dieselPerUnit: number;    // expected litres per truck
        coolantPerUnit: number;   // expected litres per truck
    };
    actualConsumption: {
        dieselTotal: number;
        coolantTotal: number;
    };
}

export interface ResourceTransaction {
    id: string;
    tankId: string;
    type: 'usage' | 'wastage' | 'spillage' | 'theft' | 'refill';
    subType?: string;            // e.g. "SKD-2024-001"
    liquidType: 'diesel' | 'coolant';
    litres: number;
    timestamp: Timestamp;
    recordedBy: string;
    authorizedBy?: string;
    notes?: string;
}

export interface Part {
    id: string;
    partNumber: string;
    description: string;
    category: 'engine' | 'transmission' | 'electronics' | 'chassis' | 'filters';
    movementSpeed: 'fast' | 'slow';
    globalStock: number;          // Total available across all dealerships + factory
    factoryStock: number;         // Buffer held at factory
    reorderLevel: number;
    unitCost: number;
    leadTimeDays: number;         // e.g. 90 days for China orders
}

export interface PartOrder {
    id: string;
    orderReference: string;
    parts: { partId: string; quantity: number }[];
    status: 'ordered' | 'in_transit' | 'customs_hold' | 'received';
    origin: 'China' | 'Local';
    orderDate: Timestamp;
    expectedArrival: Timestamp;
    actualArrival?: Timestamp;
}

export interface GlobalServicePlan {
    id: string;
    truckId: string;
    truckStockNumber: string;
    serviceType: 'major' | 'minor' | 'inspection';
    dueOdometer: number;
    dueEngineHours: number;
    currentOdometer: number;
    currentEngineHours: number;
    urgency: 'low' | 'medium' | 'high' | 'overdue';
    closestDealershipId: string;
    partsRequired: string[];      // partIds
    partsAvailableAtDealer: boolean;
}

export interface QualityHealthEvent {
    id: string;
    truckId: string;
    stockNumber: string;
    lifecycleStage: 'virtual_stockyard' | 'to_be_driven' | 'qc_hold' | 'active_fleet';
    type: 'sensor_offline' | 'device_not_active' | 'battery_low' | 'pdi_fail' | 'warranty_event';
    offlineReason?: 'flat_battery' | 'iso_switch_activated' | 'signal_loss' | 'no_data_airtime';
    severity: 'low' | 'medium' | 'high' | 'critical';
    details: string;
    timestamp: Timestamp;
    resolved: boolean;
    batteryVoltage?: number;
    lastSignalStrength?: number; // dBm
}

export interface WarrantyClaim {
    id: string;
    truckId: string;
    stockNumber: string;
    claimDate: Timestamp;
    partId: string;
    faultType: 'manufacturing_defect' | 'driver_abuse' | 'component_failure' | 'wear_and_tear';
    status: 'pending' | 'investigating' | 'approved' | 'rejected';
    telematicsProofUrl?: string; // Link to a report or behavioral data
    associatedBehaviorEvents?: string[]; // IDs of behaviors like over-revving, harsh braking
    limpModeTriggered: boolean;
    estimatedCost: number;
    notes: string;
}

export interface ClientOnboarding {
    id: string;
    dealershipId: string;
    clientName: string;
    industry: string;
    expectedFleetSize: number;
    contactPerson: string;
    email: string;
    phone: string;
    interestLevel: 'high' | 'medium' | 'low';
    capturedBy: string; // Sales Person Name
    specialRequirements?: string;
    createdAt: Timestamp;
}
