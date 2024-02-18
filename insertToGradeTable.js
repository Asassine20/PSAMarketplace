const db = require('./db'); // Ensure this is your promise-based connection module

async function insertGradesForCards() {
  try {
    // Fetch all CardID from the Card table
    const cardIdsResult = await db.query('SELECT CardID FROM Card');
    const cardIds = cardIdsResult.map(row => row.CardID);

    // Prepare INSERT statement for Grade table
    const insertGradeQuery = 'INSERT INTO Grade (CardID, GradeValue) VALUES ?';

    // Iterate over each CardID
    for (const cardId of cardIds) {
      // Prepare values for grades 1-10 for the current CardID
      const gradesValues = [];
      for (let gradeValue = 1; gradeValue <= 10; gradeValue++) {
        gradesValues.push([cardId, gradeValue]);
      }

      // Insert grades 1-10 for the current CardID into Grade table
      await db.query(insertGradeQuery, [gradesValues]);
    }

    console.log('Grades for all cards inserted successfully.');
  } catch (error) {
    console.error('Error inserting grades for cards:', error);
  }
}

// Run the function
insertGradesForCards();
