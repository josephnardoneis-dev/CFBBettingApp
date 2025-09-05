#!/usr/bin/env node

// Manual data scraping script for development/testing
require('dotenv').config();
const mongoose = require('mongoose');

// Import services
const { scrapeGameSchedules } = require('../services/gameService');
const { scrapeOddsData } = require('../services/oddsService');
const { scrapeTwitterInsights } = require('../services/twitterService');

async function main() {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/college-football-betting', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        
        console.log('🏈 Connected to database');
        console.log('🚀 Starting manual data scrape...\n');

        const startTime = Date.now();

        // Run all scraping services
        console.log('📅 Scraping game schedules...');
        await scrapeGameSchedules();
        
        console.log('\n📊 Scraping odds data...');
        await scrapeOddsData();
        
        console.log('\n🐦 Scraping Twitter insights...');
        await scrapeTwitterInsights();

        const endTime = Date.now();
        const duration = Math.round((endTime - startTime) / 1000);

        console.log(`\n✅ Manual scraping completed in ${duration} seconds`);
        
    } catch (error) {
        console.error('❌ Error during manual scraping:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('📴 Disconnected from database');
        process.exit(0);
    }
}

// Handle process termination
process.on('SIGINT', async () => {
    console.log('\n🛑 Scraping interrupted...');
    await mongoose.disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Scraping terminated...');
    await mongoose.disconnect();
    process.exit(0);
});

// Run the script
main();