const db = require('../db'); // Ensure this is your promise-based connection module

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function copyTable(batchSize = 1000, delay = 1000) {
  try {
    // Step 1: Create the new table with the same structure as Card2
    await db.query('CREATE TABLE IF NOT EXISTS Card2_copy LIKE Card2');
    console.log('Table Card2_copy created.');

    // Step 2: Copy the data from Card2 to Card2_copy in batches
    let offset = 0;
    let rowsCopied;

    do {
      try {
        await db.query('START TRANSACTION');
        const result = await db.query(
          `INSERT INTO Card2_copy (SELECT * FROM Card2 LIMIT ${offset}, ${batchSize})`
        );
        await db.query('COMMIT');
        
        rowsCopied = result[0].affectedRows; // Access affectedRows directly
        offset += batchSize;

        console.log(`Copied ${rowsCopied} records to the Card2_copy table.`);
        
        if (rowsCopied > 0) {
          await sleep(delay); // Wait before copying the next batch
        }
      } catch (error) {
        await db.query('ROLLBACK');
        if (error.code === 'ER_LOCK_WAIT_TIMEOUT') {
          console.log('Lock wait timeout exceeded, retrying...');
          await sleep(delay); // Wait before retrying
        } else {
          throw error;
        }
      }
    } while (rowsCopied > 0);

    console.log('All records from the Card2 table have been copied to Card2_copy.');
  } catch (error) {
    console.error('Error copying records from the Card2 table:', error);
  }
}

copyTable().catch(console.error);
