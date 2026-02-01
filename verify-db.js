const mongoose = require('mongoose');
require('dotenv').config();

async function verifyDB() {
    const uri = process.env.MONGO_URI;
    console.log('--- DB Connection Check ---');
    console.log('URI used:', uri);

    try {
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
        console.log('✅ SUCCESS: Database connected successfully!');

        // Try a simple operation to check permissions
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('✅ SUCCESS: Permission check passed (Listed collections).');

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('❌ ERROR: Connection Failed!');
        console.error('Reason:', err.message);

        if (err.message.includes('authentication failed') || err.message.includes('requires authentication')) {
            console.log('\n💡 SUGGESTION: Your MongoDB server is configured with AUTHENTICATION.');
            console.log('You MUST update your .env file to include a username and password.');
            console.log('Example: MONGODB_URI=mongodb://myUser:myPassword@localhost:27017/nest-backend?authSource=admin');
        } else if (err.message.includes('ECONNREFUSED')) {
            console.log('\n💡 SUGGESTION: MongoDB server is not running on localhost:27017.');
        }

        process.exit(1);
    }
}

verifyDB();
