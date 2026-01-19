const mongoose = require('mongoose');
require('dotenv').config();

async function readUsers() {
    const uri = process.env.MONGODB_URI;
    console.log('Connecting to:', uri);

    try {
        await mongoose.connect(uri);

        // Define a basic schema to read the data
        const userSchema = new mongoose.Schema({ name: String, email: String }, { strict: false });
        const User = mongoose.model('User', userSchema);

        const users = await User.find({});
        console.log('\n--- ALL USERS IN DB ---');
        console.log(JSON.stringify(users, null, 2));
        console.log(`Total Count: ${users.length}`);

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
}

readUsers();
