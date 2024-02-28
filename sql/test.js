const db = require('../db'); // Ensure this is your promise-based connection module

async function cleanCardSetNames() {
    try {
        // Set the lock wait timeout for the current session
        await db.query("SET SESSION innodb_lock_wait_timeout = 120;"); // Sets timeout to 120 seconds

        // Now, proceed with your DELETE operation
        const cards = await db.query(`
            DELETE FROM Grade;
        `);
        console.log('CardSet names in CardCopy table cleaned successfully.');
    } catch (error) {
        console.error('Failed to clean CardSet names in the CardCopy table:', error);
    }
}

// Execute the cleaning function
cleanCardSetNames();
