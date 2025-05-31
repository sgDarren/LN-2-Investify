import { MongoClient } from 'mongodb';
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

export default { 
    getCustomerById, 
    getPortfolioByCustomerId, 
    addTransaction,
    connectToDatabase 
};