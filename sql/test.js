const db = require('../db'); // Ensure this is your promise-based connection module

async function copyAndCleanCardTable() {
  try {
    // Create a copy of the Card table
    await db.query('CREATE TABLE CardCopy AS SELECT * FROM Card');
    console.log('Copy of Card table created successfully.');

    // Assuming CardColor and CardVariant are straightforward substrings of CardSet,
    // the following query attempts to remove these substrings from CardSet names.
    // Note: This approach has limitations and might not perfectly handle all cases.
    await db.query(`
      UPDATE CardCopy
      SET CardSet = TRIM(REPLACE(REPLACE(CardSet, IFNULL(CardColor, ''), ''), IFNULL(CardVariant, ''), ''))
    `);

    console.log('CardSet names in CardCopy table updated successfully.');
  } catch (error) {
    console.error('Failed to copy and update the Card table:', error);
  }
}

copyAndCleanCardTable();
