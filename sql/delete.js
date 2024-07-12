const db = require('../db'); // Ensure this is your promise-based connection module

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function deleteAllFromCard1(batchSize = 1000, delay = 1000) {
  try {
    let rowsAffected;
    do {
      try {
        const result = await db.query(`DELETE FROM Card1 LIMIT ${batchSize}`);
        console.log(result); // Log the result to understand its structure
        rowsAffected = result.affectedRows; // Access affectedRows directly
        console.log(`Deleted ${rowsAffected} records from the Card1 table.`);
      } catch (error) {
        if (error.code === 'ER_LOCK_WAIT_TIMEOUT') {
          console.log('Lock wait timeout exceeded, retrying...');
          await sleep(delay); // Wait before retrying
        } else {
          throw error;
        }
      }
    } while (rowsAffected > 0);
    
    console.log('All records from the Card1 table have been deleted.');
  } catch (error) {
    console.error('Error deleting records from the Card1 table:', error);
  }
}

deleteAllFromCard1().catch(console.error);
