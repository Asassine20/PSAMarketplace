/*
use this link to scrape from
https://www.tcgcollector.com/cards/jp?releaseDateOrder=oldToNew&cardsPerPage=120&displayAs=list&sortBy=cardNumber
*/

const axios = require('axios');
const cheerio = require('cheerio');
const db = require('./db'); // Ensure this is your promise-based connection module

const baseUrl = 'https://www.tcgcollector.com/cards/jp?releaseDateOrder=oldToNew&cardsPerPage=120&displayAs=list&sortBy=cardNumber';

async function scrapePage(pageNumber) {
    if (pageNumber > 177) { // Stop condition
        console.log("Finished scraping at page 177.");
        return;
    }

    const url = `${baseUrl}&page=${pageNumber}`;
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        let cards = [];
        $('.card-search-result-item').each((i, element) => {
            let cardName = $(element).find('.card-list-item-card-name a').attr('title').trim();
            // Remove text within parentheses and trim
            cardName = cardName.replace(/\(.*?\)/g, '').trim();
            const cardNumber = $(element).find('.card-list-item-card-number .card-list-item-entry-text').text().trim().replace('No. ', '');
            const expansion = $(element).find('.card-list-item-expansion .card-list-item-expansion-name').text().trim();
            const cardType = $(element).find('.card-list-item-card-type img').attr('alt');
            const cardRarity = $(element).find('.card-list-item-rarity img').attr('alt');
            cards.push([cardName, cardNumber, expansion, cardType, cardRarity, 'Pokemon (Japan)', null, null]); // Adjusted for parameterized query
        });

        // Prepare data for insertion into the Card table
        if (cards.length > 0) {
            const query = 'INSERT INTO Card (CardName, CardNumber, CardSet, CardColor, CardVariant, Sport, CardYear, CardImage) VALUES ?';
            // Use parameterized query to safely insert data
            await db.query(query, [cards]).then(() => {
                console.log(`Inserted ${cards.length} cards from page ${pageNumber} into the Card table`);
            }).catch(error => {
                console.error(`Error inserting data into the Card table from page ${pageNumber}:`, error);
            });
        }
    } catch (error) {
        console.error(`Error scraping page ${pageNumber}:`, error);
    }
}

async function scrapeAllPages() {
    for (let currentPage = 1; currentPage <= 177; currentPage++) { // Set a fixed end for loop
        console.log(`Scraping page ${currentPage}...`);
        await scrapePage(currentPage);
        // Optionally, add a delay here if needed
    }
    console.log("Completed scraping all pages.");
}

scrapeAllPages();
