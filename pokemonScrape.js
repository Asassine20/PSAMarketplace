/* 
This is for english cards only
Use this website to populate data table when new sets release
https://pkmncards.com/?s=&sort=date&ord=rev&display=list
Make sure to use it in reverse order (alakazam blastoise chansey ...)
*/

const axios = require('axios');
const cheerio = require('cheerio');
const db = require('./db'); // Ensure this is your promise-based connection module

async function scrapePage(pageNumber) {
    const url = `https://pkmncards.com/page/${pageNumber}/?s&sort=date&ord=rev&display=list`;
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        const cards = [];

        $('article.type-pkmn_card').each((i, element) => {
            try {
                const cardSet = $(element).find('.set abbr').attr('title') || null;
                const cardNumber = $(element).find('.number span').text() || null;
                const cardName = $(element).find('.name a').text() || null;
                const cardColor = $(element).find('.color abbr').attr('title') || null;
                const cardVariant = $(element).find('.rarity span').text() || null;

                cards.push([cardName, cardNumber, cardColor, cardVariant, 'Pokemon', null, null, cardSet]);
            } catch (error) {
                console.error(`Error processing a card on page ${pageNumber}:`, error);
                // Push a row of nulls if an error occurs while processing a specific card
                cards.push([null, null, null, null, 'Pokemon', null, null, null]);
            }
        });

        if (cards.length > 0) {
            const query = 'INSERT INTO Card (CardName, CardNumber, CardColor, CardVariant, Sport, CardYear, CardImage, CardSet) VALUES ?';
            await db.query(query, [cards]).catch(dbError => console.error(`Database insertion error on page ${pageNumber}:`, dbError));
            console.log(`Page ${pageNumber}: Inserted ${cards.length} cards into Card table.`);
        } else {
            console.log(`Page ${pageNumber}: No cards found.`);
        }
    } catch (error) {
        console.error(`Error scraping page ${pageNumber}:`, error);
    }
}

async function scrapeAllPages() {
    const totalPages = 90; // Adjust if the number of pages changes
    for (let i = 1; i <= totalPages; i++) {
        console.log(`Scraping page ${i}...`);
        await scrapePage(i);
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1-second delay to mitigate rate limiting
    }
}

scrapeAllPages();
