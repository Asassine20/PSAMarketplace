const db = require('../db'); // Adjust the path to your actual db module

async function updateCardSetIDs() {
    const query = `
        UPDATE Card C
        JOIN CardSetTest CST ON C.CardSet = CST.Name
        SET C.CardSetID = CST.CardSetID;
    `;

    try {
        const result = await db.query(query);
        console.log('Number of records updated:', result.affectedRows);
    } catch (error) {
        console.error('Error updating CardSetIDs:', error);
    }
}

updateCardSetIDs();
