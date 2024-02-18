const db = require('./db'); // Ensure this is your promise-based connection module

async function deleteAllGrades() {
  try {
    await db.query('SET SESSION innodb_lock_wait_timeout = 120');
    const deleteQuery = 'DELETE FROM Grade';

    // Execute the query
    await db.query(deleteQuery);

    console.log('All records deleted from the Grade table successfully.');
  } catch (error) {
    console.error('Failed to delete records from the Grade table:', error);
  }
}

// Run the delete function
deleteAllGrades();
