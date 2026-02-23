/**
 * Powerstar Telematics System - Mock Data Seeding Script
 * 
 * Usage: Run with 'npx ts-node scripts/seed.ts' (requires Node environment)
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, Timestamp } from 'firebase/firestore';

const firebaseConfig = {
    // Replace with yours
    projectId: "powerstar-telematics-demo",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const seedData = async () => {
    console.log('🚀 Starting seed process...');

    // 1. Seed Dealerships
    const dealerships = [
        { id: 'dealer_centurion', name: 'Powerstar Centurion', powerTechFolderName: 'Powerstar Centurion', region: 'Gauteng', province: 'Gauteng', objectCount: 249, clientCount: 8, managerName: 'John Smith' },
        { id: 'dealer_brackenfell', name: 'Powerstar Brackenfell', powerTechFolderName: 'Powerstar Brackenfell', region: 'Western Cape', province: 'Western Cape', objectCount: 50, clientCount: 3, managerName: 'Piet van der Merwe' },
        { id: 'dealer_ermelo', name: 'Powerstar Ermelo', powerTechFolderName: 'Powerstar Ermelo', region: 'Mpumalanga', province: 'Mpumalanga', objectCount: 88, clientCount: 2, managerName: 'Sibusiso Khumalo' },
        { id: 'dealer_empangeni', name: 'Powerstar Empangeni', powerTechFolderName: 'Powerstar Empangeni', region: 'KZN', province: 'KZN', objectCount: 77, clientCount: 1, managerName: 'Barend Steyn' },
        { id: 'dealer_botswana', name: 'Powerstar Botswana', powerTechFolderName: 'Powerstar Botswana', region: 'SADC', province: 'Gaborone', objectCount: 5, clientCount: 1, managerName: 'Kago Motsumi' },
    ];

    for (const dealer of dealerships) {
        await setDoc(doc(db, 'dealerships', dealer.id), {
            ...dealer,
            createdAt: Timestamp.now()
        });
    }
    console.log('✅ Seeded 5 Dealerships');

    // 2. Seed Hardware Stock
    const stockItems = [
        { id: 'stock_galileo', itemType: 'galileo_10x', supplier: 'External', availableStock: 26, minimumBuffer: 30, totalOrdered: 847, totalReceived: 820, totalAllocated: 794 },
        { id: 'stock_ecu', itemType: 'ecu_limiter', supplier: 'PMB (Local)', availableStock: 0, minimumBuffer: 20, totalOrdered: 794, totalReceived: 794, totalAllocated: 794 },
        { id: 'stock_sim_voda', itemType: 'vodacom_sim', supplier: 'Vodacom', availableStock: 120, minimumBuffer: 50, totalOrdered: 850, totalReceived: 850, totalAllocated: 830 },
    ];

    for (const item of stockItems) {
        await setDoc(doc(db, 'hardware_stock', item.id), {
            ...item,
            lastOrderDate: Timestamp.now(),
            expectedLeadTimeDays: 14,
            notes: "Auto-seeded mock data"
        });
    }
    console.log('✅ Seeded Hardware Stock');

    // 3. Seed Algorithms
    const algorithms = [
        { id: 'alg_22', powerTechId: 22, name: 'Speeding', status: 'active', triggerCondition: 'Speed > Limit', thresholdValue: 80, thresholdUnit: 'km/h' },
        { id: 'alg_coolant', powerTechId: 101, name: 'Coolant Overtemp', status: 'planned', triggerCondition: 'Temp > 103C', thresholdValue: 103, thresholdUnit: 'C' },
    ];

    for (const alg of algorithms) {
        await setDoc(doc(db, 'algorithms', alg.id), {
            ...alg,
            createdAt: Timestamp.now(),
            notes: "Critical for engine protection"
        });
    }
    console.log('✅ Seeded Algorithms');

    // 4. Seed some Mock Trucks
    for (let i = 1; i <= 20; i++) {
        const truckId = `truck_st_${1000 + i}`;
        await setDoc(doc(db, 'trucks', truckId), {
            id: truckId,
            stockNumber: `ST-${1000 + i}`,
            model: 'Powerstar VX-3335',
            lifecycleStage: i % 10 === 0 ? 'qc_hold' : 'active_fleet',
            deviceStatus: i % 4 === 0 ? 'offline' : (i % 3 === 0 ? 'online_stationary' : 'online_moving'),
            currentOdometer: 50000 + (i * 1234),
            lastCommunication: Timestamp.now(),
            dealershipId: 'dealer_centurion',
            clientId: 'client_teichman',
            createdAt: Timestamp.now()
        });
    }
    console.log('✅ Seeded 20 Mock Trucks');

    // 5. Seed Bulk Storage Tanks
    const tanks = [
        { id: 'tank_main_diesel', name: 'Main Diesel Tank', type: 'diesel', capacityLitres: 15000, currentLevelLitres: 12400, reorderThresholdLitres: 3000, location: 'factory' },
        { id: 'tank_reserve_diesel', name: 'Reserve Diesel', type: 'diesel', capacityLitres: 5000, currentLevelLitres: 2100, reorderThresholdLitres: 1000, location: 'factory' },
        { id: 'tank_coolant_a', name: 'Coolant Bulk A', type: 'coolant', capacityLitres: 1000, currentLevelLitres: 850, reorderThresholdLitres: 200, location: 'factory' },
    ];

    for (const tank of tanks) {
        await setDoc(doc(db, 'bulk_storage_tanks', tank.id), {
            ...tank,
            lastUpdated: Timestamp.now()
        });
    }
    console.log('✅ Seeded 3 Storage Tanks');

    // 6. Seed SKD Batches
    const skdBatches = [
        {
            id: 'skd_2024_001',
            batchNumber: 'SKD-2024-001',
            model: 'Powerstar VX-3335',
            quantity: 50,
            status: 'in_progress',
            startDate: Timestamp.now(),
            targetCompletionDate: Timestamp.now(),
            resourceTargets: { dieselPerUnit: 40, coolantPerUnit: 12 },
            actualConsumption: { dieselTotal: 1250, coolantTotal: 380 }
        }
    ];

    for (const batch of skdBatches) {
        await setDoc(doc(db, 'skd_batches', batch.id), batch);
    }
    console.log('✅ Seeded SKD Batch data');

    // 7. Seed Parts Inventory
    const parts = [
        { id: 'part_ecu', partNumber: 'PS-ECU-001', description: 'Euro 2 ECU Mainframe', category: 'electronics', movementSpeed: 'fast', factoryStock: 12, globalStock: 45, reorderLevel: 20, leadTimeDays: 90 },
        { id: 'part_sensor', partNumber: 'PS-SEN-HT', description: 'High-Temp Coolant Sensor', category: 'electronics', movementSpeed: 'slow', factoryStock: 156, globalStock: 890, reorderLevel: 200, leadTimeDays: 30 },
    ];

    for (const part of parts) {
        await setDoc(doc(db, 'parts', part.id), part);
    }
    console.log('✅ Seeded Parts Inventory');

    // 8. Seed Overseas Orders
    const orders = [
        {
            id: 'order_9921', orderReference: 'CO-9921', status: 'in_transit', origin: 'China',
            orderDate: Timestamp.now(), expectedArrival: Timestamp.now(),
            parts: [{ partId: 'part_ecu', quantity: 50 }]
        }
    ];

    for (const order of orders) {
        await setDoc(doc(db, 'part_orders', order.id), order);
    }
    console.log('✅ Seeded Part Orders');

    // 9. Seed Quality Health Events
    const qualityEvents = [
        {
            id: 'event_batt_1', truckId: 'truck_st_1001', stockNumber: 'ST-1001',
            lifecycleStage: 'virtual_stockyard', type: 'battery_low', offlineReason: 'flat_battery',
            severity: 'high', details: 'Voltage dropped to 11.5V. Required recharge.',
            timestamp: Timestamp.now(), resolved: false, batteryVoltage: 11.5
        }
    ];

    for (const event of qualityEvents) {
        await setDoc(doc(db, 'quality_health_events', event.id), event);
    }
    console.log('✅ Seeded Quality Events');

    console.log('✨ Seed complete!');
};

seedData().catch(console.error);
