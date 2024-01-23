const db = require('./db'); // Replace './db' with your database connection module path

async function clearSpecificCardVariant(variant) {
    try {
        // Update CardVariant to NULL where it is equal to the specified variant
        const result = await db.query(`UPDATE Card SET CardVariant = NULL WHERE CardVariant = ?`, [variant]);
        const updatedRows = result.affectedRows;
        
        console.log(`Updated ${updatedRows} rows where CardVariant was '${variant}'.`);
    } catch (error) {
        console.error('Error updating CardVariant:', error);
    }
}

clearSpecificCardVariant('base');
