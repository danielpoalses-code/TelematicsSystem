import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

// 1. onClientSignupFormSubmit
// Creates /onboarding_emails doc, sends email notification
export const onClientSignupFormSubmit = functions.https.onCall(async (data, context) => {
    const { dealershipId, clientName, salespersonName, stockNumbers } = data;

    const emailDoc = await db.collection('onboarding_emails').add({
        receivedAt: admin.firestore.Timestamp.now(),
        clientName,
        dealershipId,
        salespersonName,
        truckStockNumbers: stockNumbers,
        status: 'pending',
        processedAt: null,
        processedBy: null,
        clientId: null
    });

    console.log(`New onboarding request received for ${clientName}. Email ID: ${emailDoc.id}`);

    // In a real app, integrate with SendGrid/SMTP to notify daniel@khuludigital.co.za
    return { success: true, id: emailDoc.id };
});

// 2. processOnboardingEmail
// Creates /clients doc, updates /trucks docs
export const processOnboardingEmail = functions.https.onCall(async (data, context) => {
    const { emailId, clientDetails } = data;

    const emailRef = db.collection('onboarding_emails').doc(emailId);
    const emailSnap = await emailRef.get();

    if (!emailSnap.exists) throw new Error("Email request not found");

    const batch = db.batch();

    const clientRef = db.collection('clients').doc();
    batch.set(clientRef, {
        ...clientDetails,
        signupDate: admin.firestore.Timestamp.now(),
        onboardingStatus: 'active'
    });

    batch.update(emailRef, {
        status: 'processed',
        processedAt: admin.firestore.Timestamp.now(),
        clientId: clientRef.id
    });

    // Assign trucks to client
    const stockNumbers = emailSnap.data()?.truckStockNumbers || [];
    for (const stockNo of stockNumbers) {
        const trucksSnap = await db.collection('trucks').where('stockNumber', '==', stockNo).get();
        trucksSnap.forEach(truckDoc => {
            batch.update(truckDoc.ref, {
                clientId: clientRef.id,
                lifecycleStage: 'delivered'
            });
        });
    }

    await batch.commit();
    return { success: true, clientId: clientRef.id };
});

// 3. checkHardwareStockLevels (Scheduled 07:00 SAST = 05:00 UTC)
export const checkHardwareStockLevels = functions.pubsub.schedule('0 5 * * *').onRun(async (context) => {
    const stockSnap = await db.collection('hardware_stock').get();
    const lowStockItems: string[] = [];

    stockSnap.forEach(doc => {
        const data = doc.data();
        if (data.availableStock < data.minimumBuffer) {
            lowStockItems.push(`${data.itemType} (${data.availableStock} available, buffer is ${data.minimumBuffer})`);
        }
    });

    if (lowStockItems.length > 0) {
        console.warn(`LOW STOCK ALERT: ${lowStockItems.join(', ')}`);
        // Send email alert to admin
    }
});

// 4. flagOfflineDevices (Every 6 hours)
export const flagOfflineDevices = functions.pubsub.schedule('0 */6 * * *').onRun(async (context) => {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - 24);

    const trucksSnap = await db.collection('trucks')
        .where('lastCommunication', '<', admin.firestore.Timestamp.fromDate(cutoff))
        .where('deviceStatus', '!=', 'offline')
        .get();

    const batch = db.batch();
    trucksSnap.forEach(doc => {
        batch.update(doc.ref, { deviceStatus: 'offline' });
    });

    await batch.commit();
    console.log(`Flagged ${trucksSnap.size} as offline.`);
});
