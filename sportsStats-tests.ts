/**
 * DayPlanner Test Cases
 *
 * Demonstrates both manual scheduling and LLM-assisted scheduling
 */

import { AISportsStats } from './sportsStats';
import { GeminiLLM, Config } from './gemini-llm';

/**
 * Load configuration from config.json
 */
function loadConfig(): Config {
    try {
        const config = require('../config.json');
        return config;
    } catch (error) {
        console.error('❌ Error loading config.json. Please ensure it exists with your API key.');
        console.error('Error details:', (error as Error).message);
        process.exit(1);
    }
}

/**
 * Test case 1: Manual stat management
 * Demonstrates adding sports, teams, and manually viewing their stats
 */
export async function testManualStats(): Promise<void> {
    console.log('\n🧪 TEST CASE 1: Manual Stat Management');
    console.log('======================================');

    const statsSystem = new AISportsStats();

    // Add a sport and a team
    console.log('🏟️ Adding sport and team...');
    const baseball = statsSystem.addSport('Baseball', 'MLB API', ['OPS', 'ERA', 'AVG']);
    const phillies = statsSystem.addTeam('Philadelphia Phillies', baseball);

    // Manually update stats - in prod, would fetch from api
    console.log('📈 Updating team stats...');
    statsSystem.updateStat('Philadelphia Phillies', baseball, 'OPS', 0.776);
    statsSystem.updateStat('Philadelphia Phillies', baseball, 'ERA', 3.91);
    statsSystem.updateStat('Philadelphia Phillies', baseball, 'AVG', 0.258);

    // Fetch and print stats
    console.log('\n📊 Current Phillies Stats:');
    const teamStats = statsSystem.fetchTeamStats('Philadelphia Phillies', baseball);
    console.table(teamStats);

    console.log('✅ Manual stats management complete!');
}

/**
 * AI Test Case 1 / Test case 2: LLM-assisted team performance analysis
 * Demonstrates generating AI summaries for team performance
 */
export async function testLLMAnalysis(): Promise<void> {
    console.log('\n🧪 TEST CASE 2: LLM-Assisted Analysis');
    console.log('======================================');

    const statsSystem = new AISportsStats();
    const config = loadConfig();
    const llm = new GeminiLLM(config);

    // Add sport and team
    console.log('🏟️ Setting up sport and team...');
    const baseball = statsSystem.addSport('Baseball', 'MLB API', ['OPS', 'ERA', 'AVG']);
    const phillies = statsSystem.addTeam('Philadelphia Phillies', baseball);

    // Populate sample stats
    console.log('📈 Updating team stats...');
    statsSystem.updateStat('Philadelphia Phillies', baseball, 'OPS', 0.844);
    statsSystem.updateStat('Philadelphia Phillies', baseball, 'ERA', 3.80);
    statsSystem.updateStat('Philadelphia Phillies', baseball, 'AVG', 0.262);

    // Display stats before analysis
    console.log('\n📊 Phillies Current Stats:');
    console.table(statsSystem.fetchTeamStats('Philadelphia Phillies', baseball));

    // Generate AI summary
    console.log('\n🤖 Generating AI performance summary...');
    try {
    const summary = await statsSystem.analyzeTeamPerformance('Philadelphia Phillies', baseball, llm);
    console.log(`✅ Summary generated successfully`);
    } catch (error) {
        console.error(`❌ Validation failed for Philadelphia Phillies: ${(error as Error).message}`);
    }



}

/**
 * AI Test Case 2 / Test case 3: Multiple teams and sports
 * Demonstrates adding multiple sports and teams and generating AI summaries for each
 */
export async function testMultiTeamAnalysis(): Promise<void> {
    console.log('\n🧪 TEST CASE 3: Multi-Team Analysis');
    console.log('===================================');

    const statsSystem = new AISportsStats();
    const config = loadConfig();
    const llm = new GeminiLLM(config);

    // Add multiple sports
    const baseball = statsSystem.addSport('Baseball', 'MLB API', ['OPS', 'ERA', 'AVG']);
    const basketball = statsSystem.addSport('Basketball', 'NBA API', ['PPG', 'RPG', 'FG%']);

    // Add teams
    statsSystem.addTeam('Philadelphia Phillies', baseball);
    statsSystem.addTeam('Boston Red Sox', baseball);
    statsSystem.addTeam('Philadelphia 76ers', basketball);

    // Update sample stats
    statsSystem.updateStat('Philadelphia Phillies', baseball, 'OPS', 0.844);
    statsSystem.updateStat('Philadelphia Phillies', baseball, 'ERA', 4.32);
    statsSystem.updateStat('Boston Red Sox', baseball, 'OPS', 0.802);
    statsSystem.updateStat('Boston Red Sox', baseball, 'AVG', 0.300);
    statsSystem.updateStat('Philadelphia 76ers', basketball, 'PPG', 96.3);

    // Generate AI summaries
    console.log('\n🤖 Generating team performance summaries...');


    const teamConfigs = [
        { key: 'phillies', name: 'Philadelphia Phillies', sport: baseball },
        { key: 'redsox', name: 'Boston Red Sox', sport: baseball },
        { key: 'sixers', name: 'Philadelphia 76ers', sport: basketball }
    ];

    for (const { key, name, sport } of teamConfigs) {
        console.log(`\n📝 Generating summary for ${name} (${sport.name})...`);
        console.log('------------------');

        try {
            const summary = await statsSystem.analyzeTeamPerformance(name, sport, llm);
            console.log(`✅ ${name} summary successfully generated and validated.`);
        } catch (error) {
            console.error(`❌ ${name} summary validation failed: ${(error as Error).message}`);
        }
    }


}

/**
 * AI Test Case 3 / Test case 4: Conflicting and Incomplete Stats
 * Demonstrates how the LLM handles inconsistent or missing stat values
 */
export async function testConflictingStats(): Promise<void> {
    console.log('\n🧪 TEST CASE 4: Conflicting and Incomplete Stats');
    console.log('================================================');

    const statsSystem = new AISportsStats();
    const config = loadConfig();
    const llm = new GeminiLLM(config);

    // Add baseball sport and team
    console.log('🏟️ Setting up sport and team...');
    const baseball = statsSystem.addSport('Baseball', 'MLB API', ['OPS', 'ERA', 'OBP']);
    statsSystem.addTeam('Philadelphia Phillies', baseball);

    // Inject conflicting and incomplete data
    console.log('⚠️ Adding inconsistent stats...');
    statsSystem.updateStat('Philadelphia Phillies', baseball, 'OBP', 0.510); // unusually high
    statsSystem.updateStat('Philadelphia Phillies', baseball, 'OPS', 0.480); // unusually low and impossible to be lower than obp
    // ERA intentionally omitted

    // Display the messy data
    console.log('\n📊 Phillies Stats (inconsistent/incomplete):');
    console.table(statsSystem.fetchTeamStats('Philadelphia Phillies', baseball));

    // Run the AI summary using the internal (updated) prompt
    console.log('\n🤖 Generating AI analysis...');
    try {
    const summary = await statsSystem.analyzeTeamPerformance('Philadelphia Phillies', baseball, llm);
    console.log(`✅ Summary generated successfully`);
    } catch (error) {
        console.error(`❌ Validation failed for Philadelphia Phillies: ${(error as Error).message}`);
    }

}


/**
 * Main function to run all test cases
 */
async function main(): Promise<void> {
    console.log('SportsStats Test Suite');
    console.log('========================\n');

    try {
        await testManualStats();
        await testLLMAnalysis();
        await testMultiTeamAnalysis();
        await testConflictingStats();

        console.log('\n🎉 All test cases completed successfully!');
    } catch (error) {
        console.error('❌ Test error:', (error as Error).message);
        process.exit(1);
    }
}

// Run the tests if this file is executed directly
if (require.main === module) {
    main();
}
