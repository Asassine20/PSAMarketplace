const db = require('./db'); // Replace './db' with your database connection module path

async function deleteInBatches(tableName, batchSize) {
    try {
        let deletedRows = 0;
        let totalRowsDeleted = 0;

        do {
            const result = await db.query(`DELETE FROM ${tableName} LIMIT ?`, [batchSize]);
            deletedRows = result.affectedRows;
            totalRowsDeleted += deletedRows;
            console.log(`Deleted ${deletedRows} rows. Total deleted: ${totalRowsDeleted}`);
        } while (deletedRows === batchSize);

        console.log(`Finished deleting rows from ${tableName}.`);
    } catch (error) {
        console.error('Error during deletion:', error);
    }
}

deleteInBatches('Grade', 10000);
