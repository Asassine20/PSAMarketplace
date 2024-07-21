const db = require('../db'); // Replace './db' with your database connection module path

async function updateAutoColumn() {
    try {
        // Step 1: Alter the column type from TINYINT(1) to NVARCHAR(10)
        console.log("Altering column type...");
        await db.query(`
            ALTER TABLE Card MODIFY COLUMN Auto NVARCHAR(10)
        `);

        // Step 2: Update the values where Auto = 1 to "Auto"
        console.log("Updating values to 'Auto'...");
        await db.query(`
            UPDATE Card SET Auto = 'Auto' WHERE Auto = '1'
        `);

        // Optional Step: Update the values where Auto = 0 to "Non Auto"
        console.log("Updating values to 'Non Auto'...");
        await db.query(`
            UPDATE Card SET Auto = 'Non Auto' WHERE Auto = '0'
        `);

        // Step 3: Set the default value for the column
        console.log("Setting default value...");
        await db.query(`
            ALTER TABLE Card ALTER COLUMN Auto SET DEFAULT 'Non Auto'
        `);

        console.log("Column update completed successfully.");
    } catch (error) {
        console.error("An error occurred:", error);
    }
}

// Run the function
updateAutoColumn();
