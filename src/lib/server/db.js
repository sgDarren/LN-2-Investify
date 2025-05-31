import { MongoClient, ObjectId } from 'mongodb'; // ObjectId Import hinzugefügt
import bcrypt from 'bcryptjs';
import { DB_URI } from '$env/static/private';

let client = null;
let db = null;

export async function connectToDatabase() {
    if (!client) {
        client = new MongoClient(DB_URI);
        await client.connect();
        db = client.db('investify');
        console.log('Connected to MongoDB');
    }
    return db;
}

export async function getDb() {
    if (!db) {
        await connectToDatabase();
    }
    return db;
}

// Customer functions
export async function getCustomerById(id) {
    const db = await getDb();
    const customers = db.collection('customers');
    return await customers.findOne({ _id: new ObjectId(id) });
}

// getUserByEmail function - FEHLTE IN DEINER VERSION
export async function getUserByEmail(email) {
    const db = await getDb();
    const customers = db.collection('customers');
    return await customers.findOne({ email: email.toLowerCase() });
}

// Portfolio functions
export async function getPortfolioByCustomerId(customerId) {
    const db = await getDb();
    const portfolio = db.collection('portfolio');
    return await portfolio.find({ customer_id: customerId }).toArray();
}

export async function addTransaction(transaction) {
    const db = await getDb();
    const transactions = db.collection('transactions');
    
    const transactionDoc = {
        ...transaction,
        transaction_date: new Date(),
        created_at: new Date()
    };
    
    const result = await transactions.insertOne(transactionDoc);
    
    // Update portfolio
    const portfolio = db.collection('portfolio');
    const existingPosition = await portfolio.findOne({
        customer_id: transaction.customer_id,
        asset_symbol: transaction.asset_symbol
    });
    
    if (existingPosition) {
        // Update existing position
        const newAmount = existingPosition.amount + transaction.amount;
        const newTotalValue = (existingPosition.amount * existingPosition.avg_price) + 
                            (transaction.amount * transaction.price_per_unit);
        const newAvgPrice = newTotalValue / newAmount;
        
        await portfolio.updateOne(
            { _id: existingPosition._id },
            {
                $set: {
                    amount: newAmount,
                    avg_price: newAvgPrice,
                    total_value: newTotalValue,
                    updated_at: new Date()
                }
            }
        );
    } else {
        // Create new position
        await portfolio.insertOne({
            customer_id: transaction.customer_id,
            asset_symbol: transaction.asset_symbol,
            amount: transaction.amount,
            avg_price: transaction.price_per_unit,
            total_value: transaction.amount * transaction.price_per_unit,
            created_at: new Date(),
            updated_at: new Date()
        });
    }
    
    return result;
}

export async function createUser(email, password, firstName, lastName) {
    const db = await getDb();
    const users = db.collection('customers');
    
    // Check if user exists
    const existingUser = await users.findOne({ email: email.toLowerCase() });
    if (existingUser) {
        throw new Error('User already exists');
    }
    
    const hashedPassword = await hashPassword(password);
    const user = {
        email: email.toLowerCase(),
        password_hash: hashedPassword,
        firstname: firstName,
        lastname: lastName,
        created_at: new Date(),
        last_login: null
    };
    
    const result = await users.insertOne(user);
    return { 
        id: result.insertedId.toString(), 
        email: user.email, 
        firstName, 
        lastName,
        created_at: user.created_at
    };
}

export async function authenticateUser(email, password) {
    const db = await getDb();
    const users = db.collection('customers');
    
    const user = await users.findOne({ email: email.toLowerCase() });
    if (!user) {
        return null; // User nicht gefunden - RETURN NULL statt Exception
    }
    
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
        return null; // Falsches Passwort - RETURN NULL statt Exception
    }
    
    // Update last login
    await users.updateOne(
        { _id: user._id },
        { $set: { last_login: new Date() } }
    );
    
    return {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstname,
        lastName: user.lastname,
        last_login: new Date()
    };
}

export async function hashPassword(password) {
    return await bcrypt.hash(password, 12);
}

export async function verifyPassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
}

export default { 
    getCustomerById, 
    getPortfolioByCustomerId, 
    addTransaction,
    connectToDatabase,
    authenticateUser, 
    createUser,
    getUserByEmail  // Jetzt implementiert!
};