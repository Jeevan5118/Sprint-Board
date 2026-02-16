const db = require('./src/config/database');
const Team = require('./src/models/Team');

async function verifyMembers() {
    try {
        console.log('--- Checking Team 1 (Alpha) ---');
        const team1 = await Team.findById(1);
        const members1 = await Team.getTeamMembers(1);
        console.log(`Team: ${team1.name}`);
        console.log(`Member Count: ${members1.length}`);
        console.table(members1.map(m => ({ id: m.id, email: m.email, name: `${m.first_name} ${m.last_name}` })));

        console.log('\n--- Checking Team 2 (Beta) ---');
        const team2 = await Team.findById(2);
        const members2 = await Team.getTeamMembers(2);
        console.log(`Team: ${team2.name}`);
        console.log(`Member Count: ${members2.length}`);
        console.table(members2.map(m => ({ id: m.id, email: m.email, name: `${m.first_name} ${m.last_name}` })));

        process.exit(0);
    } catch (error) {
        console.error('Check failed:', error);
        process.exit(1);
    }
}

verifyMembers();
