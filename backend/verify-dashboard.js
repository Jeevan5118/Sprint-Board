const db = require('./src/config/database');
const Dashboard = require('./src/models/Dashboard');

async function verifyDashboard() {
    try {
        console.log('--- Checking Dashboard for Admin One (ID 26) ---');
        const stats = await Dashboard.getUserStats(26);
        console.log('Stats:', stats);

        if (stats.assigned_tasks > 0) {
            console.log('SUCCESS: Dashboard stats are populated.');
        } else {
            console.error('FAILURE: Dashboard stats are still zero.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Check failed:', error);
        process.exit(1);
    }
}

verifyDashboard();
