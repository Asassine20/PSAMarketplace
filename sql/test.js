const db = require('../db'); // Ensure this is your promise-based connection module

async function cleanCardSetNames() {
    try {
        // Fetch all CardCopy entries
        const cards = await db.query(`
        ALTER TABLE Card 
        MODIFY Sport VARCHAR(20),
        MODIFY CardSet VARCHAR(120),
        MODIFY CardYear VARCHAR(7),
        MODIFY CardColor VARCHAR(25),
        MODIFY CardVariant VARCHAR(100);
    `);
        console.log('CardSet names in CardCopy table cleaned successfully.');
    } catch (error) {
        console.error('Failed to clean CardSet names in the CardCopy table:', error);
    }
}

// Execute the cleaning function
cleanCardSetNames();
