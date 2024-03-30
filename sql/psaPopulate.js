const puppeteer = require('puppeteer');
const db = require('../db'); // Ensure this is your promise-based connection module

async function insertCardDetails(cards) {
    const query = 'INSERT INTO psa (CardName, CardNumber, CardColor, CardVariant, Sport, CardYear, CardSet) VALUES ?';
    await db.query(query, [cards.map(card => [card.name, card.dataId, 'N/A', 'N/A', 'Baseball', card.year, card.set])])
        .catch(dbError => console.error(`Database insertion error for set ${cards[0].set} of year ${cards[0].year}:`, dbError));
}

async function scrapeCardDetails(url, year, set) {
    console.log(`Starting scrape for set ${set} of year ${year}...`);
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle0' });

    const cards = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('table tbody tr'));
        return rows.map(row => {
            // Fetch the card name
            const nameCell = row.querySelector('td.text-left strong');
            const name = nameCell ? nameCell.innerText.trim() : null;
            
            // Correctly fetch the CardNumber as the second text-left class value in the row
            const numberCell = row.querySelectorAll('td.text-left')[1]; // Fetches the second occurrence
            const cardNumber = numberCell ? numberCell.innerText.trim() : null;
            
            // Fetch the dataId, which was previously mistaken for CardNumber
            const linkCell = row.querySelector('td.text-left a.shop-link');
            const dataId = linkCell ? linkCell.getAttribute('data-id').trim() : null;
            
            return { name, cardNumber, dataId }; // Include cardNumber in the returned object
        }).filter(card => card.name && card.dataId); // You might want to adjust this filter based on whether cardNumber is mandatory
    });
    
    const cardsWithExtraInfo = cards.map(card => ({
        ...card,
        year,
        set
    }));

    await browser.close();

    if (cardsWithExtraInfo.length > 0) {
        await insertCardDetails(cardsWithExtraInfo);
        console.log(`Successfully inserted ${cardsWithExtraInfo.length} cards for set ${set} of year ${year}.`);
    } else {
        console.log(`No cards found for set ${set} of year ${year}.`);
    }
}

async function scrapeSetLinks(yearURL, year) {
    console.log(`Fetching set links for year ${year}...`);
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(yearURL, { waitUntil: 'networkidle0' });

    const setLinks = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a[href^="/pop/baseball-cards/"]'));
        return links.map(link => ({
            url: link.href,
            setText: link.innerText.trim()
        }));
    });

    await browser.close();
    console.log(`Found ${setLinks.length} sets for year ${year}.`);
    return setLinks.map(link => ({
        ...link,
        year
    }));
}

async function scrapeYearLinks() {
    console.log(`Fetching year links...`);
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const baseURL = 'https://www.psacard.com';
    await page.goto(`${baseURL}/pop/baseball-cards/20003`, { waitUntil: 'networkidle0' });

    const yearLinks = await page.evaluate((baseURL) => {
        const links = Array.from(document.querySelectorAll('a[href^="/pop/baseball-cards/"]'));
        return links.map(link => ({
            url: baseURL + link.getAttribute('href'),
            year: link.innerText.trim()
        }));
    }, baseURL);

    await browser.close();
    console.log(`Found ${yearLinks.length} year links.`);
    return yearLinks;
}

async function scrapeAll() {
    const yearLinks = await scrapeYearLinks();
    for (let { url: yearURL, year } of yearLinks) {
        console.log(`Processing year: ${year}`);
        const setLinks = await scrapeSetLinks(yearURL, year);
        for (let { url: setURL, setText: set, year } of setLinks) {
            await scrapeCardDetails(setURL, year, set);
        }
    }
}

scrapeAll().then(() => console.log('Scraping complete.'));
