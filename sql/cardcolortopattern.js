const mysql = require('mysql2/promise');
require('dotenv').config(); // Ensure you have dotenv to load .env variables
const db = require('../db'); // Ensure this is your promise-based connection module

async function updateCardColorAndPattern() {
  try {
    // Define the query
    const query = `
      UPDATE Card2
      SET 
          CardColor = TRIM(
            REPLACE(
              REPLACE(
                REPLACE(
                  REPLACE(
                    REPLACE(
                      REPLACE(
                        REPLACE(
                          REPLACE(
                            REPLACE(
                              REPLACE(
                                REPLACE(
                                  REPLACE(
                                    REPLACE(
                                      REPLACE(
                                        REPLACE(
                                          REPLACE(
                                            REPLACE(
                                              REPLACE(
                                                REPLACE(
                                                  REPLACE(
                                                    REPLACE(
                                                      REPLACE(
                                                        REPLACE(
                                                          REPLACE(
                                                            REPLACE(
                                                              REPLACE(
                                                                REPLACE(
                                                                  REPLACE(
                                                                    REPLACE(
                                                                      REPLACE(
                                                                        REPLACE(
                                                                          REPLACE(
                                                                            REPLACE(
                                                                              REPLACE(
                                                                                REPLACE(
                                                                                  REPLACE(
                                                                                    REPLACE(
                                                                                      CardColor, 'Prizm', ''
                                                                                    ), 'Refractor', ''
                                                                                  ), 'Wave', ''
                                                                                ), 'Artist Proof', ''
                                                                              ), 'Atomic', ''
                                                                            ), 'Spectrum', ''
                                                                          ), 'Circles', ''
                                                                        ), 'Seismic', ''
                                                                      ), 'Squares', ''
                                                                    ), 'Starball', ''
                                                                  ), 'Checker', ''
                                                                ), 'Ice', ''
                                                              ), 'Icy', ''
                                                            ), 'Die-Cut', ''
                                                          ), 'RayWave', ''
                                                        ), 'Glossy', ''
                                                      ), 'Asia', ''
                                                    ), 'Difractor', ''
                                                  ), 'X-fractor', ''
                                                ), 'Disco', ''
                                              ), 'Etch', ''
                                            ), 'Finite', ''
                                          ), 'Flash', ''
                                        ), 'FOTL', ''
                                      ), 'Laser', ''
                                    ), 'Lava', ''
                                  ), 'Mojo', ''
                                ), 'Mosaic', ''
                              ), 'Pulsar', ''
                            ), 'Shimmer', ''
                          ), 'Tiger', ''
                        ), 'Velocity', ''
                      ), 'Cosmic', ''
                    ), 'Camo', ''
                  ), 'Bubbles', ''
                ), 'Vapor', ''
              ), 'Glow', '')
          ),
          ColorPattern = TRIM(CONCAT_WS(' ', 
              CASE WHEN CardColor LIKE '%Prizm%' THEN 'Prizm' ELSE NULL END,
              CASE WHEN CardColor LIKE '%Refractor%' THEN 'Refractor' ELSE NULL END,
              CASE WHEN CardColor LIKE '%Wave%' THEN 'Wave' ELSE NULL END,
              CASE WHEN CardColor LIKE '%Artist Proof%' THEN 'Artist Proof' ELSE NULL END,
              CASE WHEN CardColor LIKE '%Atomic%' THEN 'Atomic' ELSE NULL END,
              CASE WHEN CardColor LIKE '%Spectrum%' THEN 'Spectrum' ELSE NULL END,
              CASE WHEN CardColor LIKE '%Circles%' THEN 'Circles' ELSE NULL END,
              CASE WHEN CardColor LIKE '%Seismic%' THEN 'Seismic' ELSE NULL END,
              CASE WHEN CardColor LIKE '%Squares%' THEN 'Squares' ELSE NULL END,
              CASE WHEN CardColor LIKE '%Starball%' THEN 'Starball' ELSE NULL END,
              CASE WHEN CardColor LIKE '%Checker%' THEN 'Checker' ELSE NULL END,
              CASE WHEN CardColor LIKE '%Ice%' THEN 'Ice' ELSE NULL END,
              CASE WHEN CardColor LIKE '%Icy%' THEN 'Icy' ELSE NULL END,
              CASE WHEN CardColor LIKE '%Die-Cut%' THEN 'Die-Cut' ELSE NULL END,
              CASE WHEN CardColor LIKE '%RayWave%' THEN 'RayWave' ELSE NULL END,
              CASE WHEN CardColor LIKE '%Glossy%' THEN 'Glossy' ELSE NULL END,
              CASE WHEN CardColor LIKE '%Asia%' THEN 'Asia' ELSE NULL END,
              CASE WHEN CardColor LIKE '%Difractor%' THEN 'Difractor' ELSE NULL END,
              CASE WHEN CardColor LIKE '%X-fractor%' THEN 'X-fractor' ELSE NULL END,
              CASE WHEN CardColor LIKE '%Disco%' THEN 'Disco' ELSE NULL END,
              CASE WHEN CardColor LIKE '%Etch%' THEN 'Etch' ELSE NULL END,
              CASE WHEN CardColor LIKE '%Finite%' THEN 'Finite' ELSE NULL END,
              CASE WHEN CardColor LIKE '%Flash%' THEN 'Flash' ELSE NULL END,
              CASE WHEN CardColor LIKE '%FOTL%' THEN 'FOTL' ELSE NULL END,
              CASE WHEN CardColor LIKE '%Laser%' THEN 'Laser' ELSE NULL END,
              CASE WHEN CardColor LIKE '%Lava%' THEN 'Lava' ELSE NULL END,
              CASE WHEN CardColor LIKE '%Mojo%' THEN 'Mojo' ELSE NULL END,
              CASE WHEN CardColor LIKE '%Mosaic%' THEN 'Mosaic' ELSE NULL END,
              CASE WHEN CardColor LIKE '%Pulsar%' THEN 'Pulsar' ELSE NULL END,
              CASE WHEN CardColor LIKE '%Shimmer%' THEN 'Shimmer' ELSE NULL END,
              CASE WHEN CardColor LIKE '%Tiger%' THEN 'Tiger' ELSE NULL END,
              CASE WHEN CardColor LIKE '%Velocity%' THEN 'Velocity' ELSE NULL END,
              CASE WHEN CardColor LIKE '%Cosmic%' THEN 'Cosmic' ELSE NULL END,
              CASE WHEN CardColor LIKE '%Camo%' THEN 'Camo' ELSE NULL END,
              CASE WHEN CardColor LIKE '%Bubbles%' THEN 'Bubbles' ELSE NULL END,
              CASE WHEN CardColor LIKE '%Vapor%' THEN 'Vapor' ELSE NULL END,
              CASE WHEN CardColor LIKE '%Glow%' THEN 'Glow' ELSE NULL END
          ))
      WHERE 
          CardColor LIKE '%Prizm%' OR
          CardColor LIKE '%Refractor%' OR
          CardColor LIKE '%Wave%' OR
          CardColor LIKE '%Artist Proof%' OR
          CardColor LIKE '%Atomic%' OR
          CardColor LIKE '%Spectrum%' OR
          CardColor LIKE '%Circles%' OR
          CardColor LIKE '%Seismic%' OR
          CardColor LIKE '%Squares%' OR
          CardColor LIKE '%Starball%' OR
          CardColor LIKE '%Checker%' OR
          CardColor LIKE '%Ice%' OR
          CardColor LIKE '%Icy%' OR
          CardColor LIKE '%Die-Cut%' OR
          CardColor LIKE '%RayWave%' OR
          CardColor LIKE '%Glossy%' OR
          CardColor LIKE '%Asia%' OR
          CardColor LIKE '%Difractor%' OR
          CardColor LIKE '%X-fractor%' OR
          CardColor LIKE '%Disco%' OR
          CardColor LIKE '%Etch%' OR
          CardColor LIKE '%Finite%' OR
          CardColor LIKE '%Flash%' OR
          CardColor LIKE '%FOTL%' OR
          CardColor LIKE '%Laser%' OR
          CardColor LIKE '%Lava%' OR
          CardColor LIKE '%Mojo%' OR
          CardColor LIKE '%Mosaic%' OR
          CardColor LIKE '%Pulsar%' OR
          CardColor LIKE '%Shimmer%' OR
          CardColor LIKE '%Tiger%' OR
          CardColor LIKE '%Velocity%' OR
          CardColor LIKE '%Cosmic%' OR
          CardColor LIKE '%Camo%' OR
          CardColor LIKE '%Bubbles%' OR
          CardColor LIKE '%Vapor%' OR
          CardColor LIKE '%Glow%';
    `;

    // Execute the query
    const [result] = await db.query(query);
    console.log(`Rows affected: ${result.affectedRows}`);
  } catch (error) {
    console.error(`Error executing update query: ${error.message}`);
  }
}

updateCardColorAndPattern();
