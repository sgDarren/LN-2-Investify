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

export async function getUserByEmail(email) {
    const db = await getDb();
    const customers = db.collection('customers');
    return await customers.findOne({ email: email.toLowerCase() });
}

export async function getUserPortfolios(userId) {
  const database = await getDb();
  const portfoliosColl = database.collection('portfolios');
  
  // Suche alle Dokumente mit customer_id = ObjectId(userId)
  const docs = await portfoliosColl.find({ customer_id: new ObjectId(userId) }).toArray();
  
  // Wandelt _id zu String um, und ggf. customer_id
  return docs.map((doc) => ({
    id: doc._id.toString(),
    name: doc.name,
    created_at: doc.created_at,
    // Falls du später noch einen Wert-Feld hast, z.B. total_value, hier anfügen:
    // value: doc.total_value
  }));
}

// 2. POST: Neues Portfolio erstellen
export async function createPortfolio(userId, name) {
  const database = await getDb();
  const portfoliosColl = database.collection('portfolios');

  const newPortfolio = {
    customer_id: new ObjectId(userId),
    name: name,
    created_at: new Date()
  };

  const result = await portfoliosColl.insertOne(newPortfolio);

  // Gib das neu erstellte Portfolio als Objekt zurück (inkl. id als String)
  return {
    id: result.insertedId.toString(),
    name: newPortfolio.name,
    created_at: newPortfolio.created_at
  };
}





// Portfolio functions
export async function getPortfolioByCustomerId(customerId) {
    const db = await getDb();
    const portfolio = db.collection('portfolio');
    return await portfolio.find({ customer_id: customerId }).toArray();
}

async function getUserPortfolio(userId) {
    const holdings = await portfolio.find({ userId: new ObjectId(userId) }).toArray();
    return holdings.map(h => ({
        ...h,
        _id: h._id.toString(),
        userId: h.userId.toString()
    }));
}

async function addToPortfolio(userId, purchase) {
    const holding = {
        userId: new ObjectId(userId),
        assetSymbol: purchase.symbol,
        assetName: purchase.name,
        assetType: purchase.type, // 'stock', 'crypto', 'etf'
        amount: purchase.amount,
        purchasePrice: purchase.price,
        purchaseDate: new Date(),
        totalInvested: purchase.amount * purchase.price
    };
    
    const result = await portfolio.insertOne(holding);
    return { ...holding, _id: result.insertedId.toString() };
}

async function removeFromPortfolio(holdingId) {
    return await portfolio.deleteOne({ _id: new ObjectId(holdingId) });
}

// Price Cache Functions
async function getCachedPrice(symbol) {
    const cached = await priceCache.findOne({ symbol });
    if (cached && (new Date() - cached.updatedAt) < 60000) { // 1 Minute Cache
        return cached.data;
    }
    return null;
}

async function setCachedPrice(symbol, data) {
    await priceCache.replaceOne(
        { symbol },
        { symbol, data, updatedAt: new Date() },
        { upsert: true }
    );
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
    getUserPortfolios,
    connectToDatabase,
    authenticateUser, 
    createUser,
    getUserByEmail  // Jetzt implementiert!
};