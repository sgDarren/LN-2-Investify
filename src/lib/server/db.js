// src/lib/server/db.js
import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { DB_URI } from '$env/static/private';

let client = null;
let db = null;

/** Verbindet einmalig mit MongoDB und speichert das DB‐Objekt */
export async function connectToDatabase() {
  if (!client) {
    client = new MongoClient(DB_URI);
    await client.connect();
    db = client.db('investify');
    console.log('Connected to MongoDB');
  }
  return db;
}

/** Gibt das DB‐Objekt zurück (erst wenn connectToDatabase() gelaufen ist) */
export async function getDb() {
  if (!db) {
    await connectToDatabase();
  }
  return db;
}

//
// ─── USER / CUSTOMER FUNKTIONEN ────────────────────────────────────────────────
//

/** Findet einen Kunden anhand seiner ObjectId */
export async function getCustomerById(id) {
  const database = await getDb();
  return database
    .collection('user')
    .findOne({ _id: new ObjectId(id) });
}

/** Findet einen User (customer) anhand der E-Mail (case-insensitive) */
export async function getUserByEmail(email) {
  const database = await getDb();
  return database
    .collection('user')
    .findOne({ email: email.toLowerCase() });
}

/** Legt einen neuen User an, wirft Error, wenn Benutzer bereits existiert */
export async function createUser(email, password, firstName, lastName) {
  const database = await getDb();
  const users = database.collection('user');

  const existingUser = await users.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new Error('User already exists');
  }

  const hashedPassword = await hashPassword(password);
  const newUser = {
    email: email.toLowerCase(),
    password_hash: hashedPassword,
    firstname: firstName,
    lastname: lastName,
    created_at: new Date(),
    last_login: null
  };

  const result = await users.insertOne(newUser);
  return {
    id: result.insertedId.toString(),
    email: newUser.email,
    firstName,
    lastName,
    created_at: newUser.created_at
  };
}

/** Prüft E-Mail und Passwort, gibt User‐Objekt (ohne Hash) zurück oder null */
export async function authenticateUser(email, password) {
  const database = await getDb();
  const users = database.collection('user');

  const user = await users.findOne({ email: email.toLowerCase() });
  if (!user) return null;

  const isValid = await verifyPassword(password, user.password_hash);
  if (!isValid) return null;

  // Last login updaten
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

/** Hash für Passwort erzeugen */
export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

/** Passwort mit Hash vergleichen */
export async function verifyPassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}

//
// ─── PORTFOLIO-FUNKTIONEN ──────────────────────────────────────────────────────
//

/** Liest alle Portfolios eines Nutzers (inkl. berechnetem Gesamtwert) */
export async function getUserPortfolios(userId) {
  const database = await getDb();
  const portfoliosColl = database.collection('portfolios');

  const docs = await portfoliosColl
    .find({ customer_id: new ObjectId(userId) })
    .toArray();

  const portfoliosWithValues = await Promise.all(
    docs.map(async (doc) => {
      const totalValue = await calculatePortfolioValue(doc._id);
      return {
        id: doc._id.toString(),
        name: doc.name,
        created_at: doc.created_at,
        value: totalValue || 0
      };
    })
  );

  return portfoliosWithValues;
}

/** Legt ein neues Portfolio für einen User an */
export async function createPortfolio(userId, name) {
  const database = await getDb();
  const portfoliosColl = database.collection('portfolios');

  const newPortfolio = {
    customer_id: new ObjectId(userId),
    name,
    created_at: new Date()
  };

  const result = await portfoliosColl.insertOne(newPortfolio);
  return {
    id: result.insertedId.toString(),
    name: newPortfolio.name,
    created_at: newPortfolio.created_at,
    value: 0
  };
}

/** Hilfsfunktion: Berechnet für ein Portfolio (ObjectId) den Gesamtwert aller Positionen */
async function calculatePortfolioValue(portfolioObjectId) {
  try {
    const database = await getDb();
    const transactionsColl = database.collection('transactions');

    // Lade alle Transaktionen zu diesem Portfolio
    const transactions = await transactionsColl
      .find({ portfolio_id: new ObjectId(portfolioObjectId) })
      .toArray();

    // Gruppiere per Symbol: totalQuantity, totalCost
    const positions = {};
    for (const tx of transactions) {
      const symbol = tx.symbol;

      if (!positions[symbol]) {
        positions[symbol] = { totalQuantity: 0, totalCost: 0 };
      }

      if (tx.type === 'buy' || tx.type === 'purchase') {
        positions[symbol].totalQuantity += tx.quantity;
        positions[symbol].totalCost += tx.quantity * tx.price;
      } else if (tx.type === 'sell') {
        positions[symbol].totalQuantity -= tx.quantity;
        positions[symbol].totalCost -= tx.quantity * tx.price;
      }
    }

    // Gesamtwert = sum(quantity * aktueller Preis)
    let totalValue = 0;
    for (const [symbol, position] of Object.entries(positions)) {
      if (position.totalQuantity > 0) {
        const asset = await getAssetBySymbol(symbol);
        const currentPrice = asset ? asset.price : position.totalCost / position.totalQuantity;
        totalValue += position.totalQuantity * currentPrice;
      }
    }

    return totalValue;
  } catch (error) {
    console.error(`Fehler beim Berechnen des Portfolio-Werts:`, error);
    return 0;
  }
}

//
// ─── TRANSAKTIONS-FUNKTIONEN ────────────────────────────────────────────────────
//

/** Fügt eine neue Transaktion (buy/sell) in ein Portfolio ein */
export async function addTransaction(portfolioId, transactionData) {
  try {
    const database = await getDb();
    const transactionsColl = database.collection('transactions');

    const transaction = {
      portfolio_id: new ObjectId(portfolioId),
      symbol: transactionData.symbol,
      type: transactionData.type, // 'buy' oder 'sell'
      quantity: transactionData.quantity,
      price: transactionData.price,
      total_amount: transactionData.quantity * transactionData.price,
      currency: transactionData.currency || 'USD',
      transaction_date: transactionData.date || new Date(),
      created_at: new Date()
    };

    const result = await transactionsColl.insertOne(transaction);
    return {
      id: result.insertedId.toString(),
      ...transaction,
      portfolio_id: transaction.portfolio_id.toString()
    };
  } catch (error) {
    console.error('Fehler beim Hinzufügen der Transaktion:', error);
    throw new Error('Transaktion konnte nicht hinzugefügt werden');
  }
}

/** Liefert alle Transaktionen eines Portfolios (absteigend nach Datum) */
export async function getPortfolioTransactions(portfolioId) {
  try {
    const database = await getDb();
    const transactionsColl = database.collection('transactions');

    const transactions = await transactionsColl
      .find({ portfolio_id: new ObjectId(portfolioId) })
      .sort({ transaction_date: -1 })
      .toArray();

    return transactions.map((tx) => ({
      id: tx._id.toString(),
      portfolio_id: tx.portfolio_id.toString(),
      symbol: tx.symbol,
      type: tx.type,
      quantity: tx.quantity,
      price: tx.price,
      total_amount: tx.total_amount,
      currency: tx.currency,
      transaction_date: tx.transaction_date,
      created_at: tx.created_at
    }));
  } catch (error) {
    console.error(`Fehler beim Laden der Transaktionen:`, error);
    return [];
  }
}

/** Berechnet die aktiven Positionen in einem Portfolio (unrealized P&L) */
export async function getPortfolioPositions(portfolioId) {
  try {
    const database = await getDb();
    const transactionsColl = database.collection('transactions');

    const transactions = await transactionsColl
      .find({ portfolio_id: new ObjectId(portfolioId) })
      .toArray();

    const positions = {};
    for (const tx of transactions) {
      const symbol = tx.symbol;
      if (!positions[symbol]) {
        positions[symbol] = { totalQuantity: 0, totalCost: 0, transactions: [] };
      }
      positions[symbol].transactions.push(tx);
      if (tx.type === 'buy' || tx.type === 'purchase') {
        positions[symbol].totalQuantity += tx.quantity;
        positions[symbol].totalCost += tx.quantity * tx.price;
      } else if (tx.type === 'sell') {
        positions[symbol].totalQuantity -= tx.quantity;
        positions[symbol].totalCost -= tx.quantity * tx.price;
      }
    }

    const activePositions = [];
    for (const [symbol, pos] of Object.entries(positions)) {
      if (pos.totalQuantity > 0) {
        const asset = await getAssetBySymbol(symbol);
        const currentPrice = asset ? asset.price : pos.totalCost / pos.totalQuantity;
        const avgPrice = pos.totalCost / pos.totalQuantity;
        activePositions.push({
          symbol,
          name: asset ? asset.name : symbol,
          quantity: pos.totalQuantity,
          avg_price: avgPrice,
          current_price: currentPrice,
          total_value: pos.totalQuantity * currentPrice,
          unrealized_pnl: (currentPrice - avgPrice) * pos.totalQuantity,
          unrealized_pnl_percent: ((currentPrice - avgPrice) / avgPrice) * 100
        });
      }
    }

    return activePositions;
  } catch (error) {
    console.error(`Fehler beim Berechnen der Positionen:`, error);
    return [];
  }
}

//
// ─── ASSET‐FUNKTIONEN ────────────────────────────────────────────────────────────
//

/** Holt alle Assets aus der Sammlung “assets” */
export async function getAllAssets() {
  try {
    const database = await getDb();
    const assets = await database.collection('assets').find({}).toArray();

    return assets.map((asset) => ({
      _id: asset._id.toString(),
      symbol: asset.symbol,
      name: asset.name || asset.symbol,
      category: asset.category?.toLowerCase() || asset.type,
      price: asset.currentPrice || asset.price || 0,
      change: asset.change || 0,
      changePercent: asset.changePercent || 0,
      currency: asset.currency || (asset.type === 'stock' ? 'CHF' : 'USD'),
      marketCap: asset.marketCap || null,
      volume: asset.volume || null,
      lastUpdated: asset.lastUpdated || new Date(),
      description: asset.description || '',
      sector: asset.sector || null,
      exchange: asset.exchange || null
    }));
  } catch (error) {
    console.error('Fehler beim Laden der Assets:', error);
    throw new Error('Assets konnten nicht geladen werden');
  }
}

/** Holt ein einzelnes Asset nach Symbol (Großbuchstaben erwartet) */
export async function getAssetBySymbol(symbol) {
  try {
    const database = await getDb();
    const assetDoc = await database
      .collection('assets')
      .findOne({ symbol: symbol.toUpperCase() });

    if (!assetDoc) return null;

    return {
      _id: assetDoc._id.toString(),
      symbol: assetDoc.symbol,
      name: assetDoc.name || assetDoc.symbol,
      type: assetDoc.type,
      category: assetDoc.category || assetDoc.type,
      price: assetDoc.currentPrice || assetDoc.price || 0,
      change: assetDoc.change || 0,
      changePercent: assetDoc.changePercent || 0,
      currency: assetDoc.currency || (assetDoc.type === 'stock' ? 'CHF' : 'USD'),
      marketCap: assetDoc.marketCap || null,
      volume: assetDoc.volume || null,
      lastUpdated: assetDoc.lastUpdated || new Date(),
      description: assetDoc.description || '',
      sector: assetDoc.sector || null,
      exchange: assetDoc.exchange || null
    };
  } catch (error) {
    console.error(`Fehler beim Laden des Assets ${symbol}:`, error);
    throw new Error(`Asset ${symbol} konnte nicht geladen werden`);
  }
}

/** Holt alle Assets, die zu einer bestimmten Kategorie/Type gehören */
export async function getAssetsByCategory(category) {
  try {
    const database = await getDb();
    const filter =
      category === 'all'
        ? {}
        : { $or: [{ type: category }, { category: category }] };

    const assets = await database.collection('assets').find(filter).toArray();
    return assets.map((asset) => ({
      _id: asset._id.toString(),
      symbol: asset.symbol,
      name: asset.name || asset.symbol,
      type: asset.type,
      category: asset.category || asset.type,
      price: asset.currentPrice || asset.price || 0,
      change: asset.change || 0,
      changePercent: asset.changePercent || 0,
      currency: asset.currency || (asset.type === 'stock' ? 'CHF' : 'USD'),
      marketCap: asset.marketCap || null,
      volume: asset.volume || null,
      lastUpdated: asset.lastUpdated || new Date(),
      description: asset.description || '',
      sector: asset.sector || null,
      exchange: asset.exchange || null
    }));
  } catch (error) {
    console.error(`Fehler beim Laden der Assets für Kategorie ${category}:`, error);
    throw new Error(`Assets für Kategorie ${category} konnten nicht geladen werden`);
  }
}

/** Liefert alle unterschiedlichen Asset‐Typen als Liste (z. B. ['stock','crypto','etf']) */
export async function getAssetCategories() {
  try {
    const database = await getDb();
    const types = await database.collection('assets').distinct('type');
    const cats = await database.collection('assets').distinct('category');
    const combined = [...new Set([...types, ...cats])];
    return combined.filter((cat) => cat && cat.trim() !== '');
  } catch (error) {
    console.error('Fehler beim Laden der Asset-Kategorien:', error);
    return ['stock', 'crypto', 'etf'];
  }
}

/** Aktualisiert ein Asset (z. B. Preis, Change etc.), gibt true/false zurück */
export async function updateAssetData(symbol, updateData) {
  try {
    const database = await getDb();
    const result = await database.collection('assets').updateOne(
      { symbol: symbol.toUpperCase() },
      {
        $set: {
          ...updateData,
          lastUpdated: new Date()
        }
      }
    );
    return result.modifiedCount > 0;
  } catch (error) {
    console.error(`Fehler beim Aktualisieren des Assets ${symbol}:`, error);
    return false;
  }
}
export async function getUserPortfolioPositions(userId) {
  try {
    const database = await getDb();
    const portfoliosColl = database.collection('portfolios');
    const transactionsColl = database.collection('transactions');

    // 1) Alle Portfolios des Users abfragen
    const userPortfolios = await portfoliosColl
      .find({ customer_id: new ObjectId(userId) })
      .toArray();

    const positionsBySymbol = {};

    // 2) Für jedes Portfolio alle Transaktionen holen und Positionen berechnen
    for (const portfolio of userPortfolios) {
      const txs = await transactionsColl
        .find({ portfolio_id: new ObjectId(portfolio._id) })
        .toArray();

      for (const tx of txs) {
        const sym = tx.symbol;
        if (!positionsBySymbol[sym]) {
          positionsBySymbol[sym] = { symbol: sym, totalQuantity: 0, totalCost: 0 };
        }
        if (tx.type === 'buy' || tx.type === 'purchase') {
          positionsBySymbol[sym].totalQuantity += tx.quantity;
          positionsBySymbol[sym].totalCost += tx.quantity * tx.price;
        } else if (tx.type === 'sell') {
          positionsBySymbol[sym].totalQuantity -= tx.quantity;
          positionsBySymbol[sym].totalCost -= tx.quantity * tx.price;
        }
      }
    }

    // 3) Aus „positionsBySymbol“ ein Array fertiger Positionen bauen
    const result = [];
    for (const [sym, pos] of Object.entries(positionsBySymbol)) {
      if (pos.totalQuantity > 0) {
        // Optional: Aktuellen Preis aus der assets‐Sammlung holen
        const assetDoc = await database
          .collection('assets')
          .findOne({ symbol: sym.toUpperCase() });
        const currentPrice = assetDoc ? assetDoc.currentPrice || assetDoc.price : (pos.totalCost / pos.totalQuantity);
        const avgPrice = pos.totalCost / pos.totalQuantity;

        result.push({
          symbol: sym,
          amount: pos.totalQuantity,
          avg_price: avgPrice,
          total_value: pos.totalQuantity * currentPrice,
          currency: assetDoc ? assetDoc.currency : 'USD'
        });
      }
    }    return result;
  } catch (err) {
    console.error(`Fehler in getUserPortfolioPositions(${userId}):`, err);
    return [];
  }
}
//
// ─── PRICE‐CACHE - FUNKTIONEN ────────────────────────────────────────────────────
//

/** Holt einen zwischengespeicherten Preis (falls < 1 Minute alt) */
export async function getCachedPrice(symbol) {
  const database = await getDb();
  const priceCache = database.collection('priceCache');
  const cached = await priceCache.findOne({ symbol });

  if (cached && new Date() - cached.updatedAt < 60_000) {
    return cached.data;
  }
  return null;
}

/** Speichert/Update den Preis in der Collection „priceCache“ */
export async function setCachedPrice(symbol, data) {
  const database = await getDb();
  const priceCache = database.collection('priceCache');

  await priceCache.replaceOne(
    { symbol },
    { symbol, data, updatedAt: new Date() },
    { upsert: true }
  );
}


export async function getPortfolioById(portfolioId) {
  try {
    const database = await getDb();
    const portfolio = await database
      .collection('portfolios')
      .findOne({ _id: new ObjectId(portfolioId) });
    
    return portfolio;
  } catch (error) {
    console.error(`Fehler beim Laden des Portfolios ${portfolioId}:`, error);
    throw error;
  }
}

/** Holt alle Portfolios eines Kunden mit berechnetem Wert */
export async function getPortfolioByCustomerId(customerId) {
  try {
    const database = await getDb();
    const portfolios = await database
      .collection('portfolios')
      .find({ customer_id: new ObjectId(customerId) })
      .toArray();
    
    // Für jedes Portfolio die Positionen berechnen
    const result = [];
    for (const portfolio of portfolios) {
      const positions = await getPortfolioPositions(portfolio._id.toString());
      result.push(...positions);
    }
    
    return result;
  } catch (error) {
    console.error(`Fehler beim Laden der Portfolios für Kunde ${customerId}:`, error);
    return [];
  }
}

/** Löscht ein Portfolio */
export async function deletePortfolio(portfolioId, userId) {
  try {
    const database = await getDb();
    
    // Sicherheitsprüfung
    const portfolio = await getPortfolioById(portfolioId);
    if (!portfolio || portfolio.customer_id.toString() !== userId) {
      throw new Error('Unauthorized');
    }
    
    // Erst alle Transaktionen löschen
    await database
      .collection('transactions')
      .deleteMany({ portfolio_id: new ObjectId(portfolioId) });
    
    // Dann Portfolio löschen
    const result = await database
      .collection('portfolios')
      .deleteOne({ _id: new ObjectId(portfolioId) });
    
    return result.deletedCount > 0;
  } catch (error) {
    console.error(`Fehler beim Löschen des Portfolios ${portfolioId}:`, error);
    throw error;
  }
}

/** Aktualisiert ein Portfolio */
export async function updatePortfolio(portfolioId, userId, updates) {
  try {
    const database = await getDb();
    
    // Sicherheitsprüfung
    const portfolio = await getPortfolioById(portfolioId);
    if (!portfolio || portfolio.customer_id.toString() !== userId) {
      throw new Error('Unauthorized');
    }
    
    const result = await database
      .collection('portfolios')
      .updateOne(
        { _id: new ObjectId(portfolioId) },
        { 
          $set: {
            ...updates,
            updated_at: new Date()
          }
        }
      );
    
    return result.modifiedCount > 0;
  } catch (error) {
    console.error(`Fehler beim Aktualisieren des Portfolios ${portfolioId}:`, error);
    throw error;
  }
}

/** Löscht eine Transaktion */
export async function deleteTransaction(transactionId, userId) {
  try {
    const database = await getDb();
    
    // Erst Transaktion laden und Zugriff prüfen
    const transaction = await database
      .collection('transactions')
      .findOne({ _id: new ObjectId(transactionId) });
    
    if (!transaction) {
      throw new Error('Transaction not found');
    }
    
    // Portfolio-Zugriff prüfen
    const portfolio = await getPortfolioById(transaction.portfolio_id.toString());
    if (!portfolio || portfolio.customer_id.toString() !== userId) {
      throw new Error('Unauthorized');
    }
    
    const result = await database
      .collection('transactions')
      .deleteOne({ _id: new ObjectId(transactionId) });
    
    return result.deletedCount > 0;
  } catch (error) {
    console.error(`Fehler beim Löschen der Transaktion ${transactionId}:`, error);
    throw error;
  }
}

/** Holt Transaktionen für alle Portfolios eines Users */
export async function getUserTransactions(userId, limit = 50) {
  try {
    const database = await getDb();
    
    // Erst alle Portfolio-IDs des Users holen
    const portfolios = await database
      .collection('portfolios')
      .find({ customer_id: new ObjectId(userId) })
      .project({ _id: 1 })
      .toArray();
    
    const portfolioIds = portfolios.map(p => p._id);
    
    // Dann alle Transaktionen dieser Portfolios
    const transactions = await database
      .collection('transactions')
      .find({ portfolio_id: { $in: portfolioIds } })
      .sort({ transaction_date: -1 })
      .limit(limit)
      .toArray();
    
    // Portfolio-Namen hinzufügen
    const portfolioMap = {};
    for (const portfolio of portfolios) {
      const fullPortfolio = await getPortfolioById(portfolio._id.toString());
      portfolioMap[portfolio._id.toString()] = fullPortfolio.name;
    }
    
    return transactions.map(tx => ({
      id: tx._id.toString(),
      portfolio_id: tx.portfolio_id.toString(),
      portfolio_name: portfolioMap[tx.portfolio_id.toString()],
      symbol: tx.symbol,
      type: tx.type,
      quantity: tx.quantity,
      price: tx.price,
      total_amount: tx.total_amount,
      currency: tx.currency,
      transaction_date: tx.transaction_date,
      created_at: tx.created_at
    }));
  } catch (error) {
    console.error(`Fehler beim Laden der Transaktionen für User ${userId}:`, error);
    return [];
  }
}

/** Sucht Assets nach Text */
export async function searchAssets(query) {
  try {
    const database = await getDb();
    const searchRegex = new RegExp(query, 'i');
    
    const assets = await database
      .collection('assets')
      .find({
        $or: [
          { symbol: searchRegex },
          { name: searchRegex },
          { description: searchRegex }
        ]
      })
      .limit(20)
      .toArray();
    
    return assets.map(asset => ({
      _id: asset._id.toString(),
      symbol: asset.symbol,
      name: asset.name || asset.symbol,
      type: asset.type,
      category: asset.category || asset.type,
      price: asset.currentPrice || asset.price || 0,
      change: asset.change || 0,
      changePercent: asset.changePercent || 0,
      currency: asset.currency || 'USD'
    }));
  } catch (error) {
    console.error(`Fehler bei der Asset-Suche für "${query}":`, error);
    return [];
  }
}

/** Erstellt ein neues Asset */
export async function createAsset(assetData) {
  try {
    const database = await getDb();
    
    // Prüfen ob Asset bereits existiert
    const existing = await database
      .collection('assets')
      .findOne({ symbol: assetData.symbol.toUpperCase() });
    
    if (existing) {
      throw new Error('Asset already exists');
    }
    
    const newAsset = {
      symbol: assetData.symbol.toUpperCase(),
      name: assetData.name,
      type: assetData.type || 'stock',
      category: assetData.category || assetData.type,
      price: assetData.price || 0,
      currentPrice: assetData.price || 0,
      change: 0,
      changePercent: 0,
      currency: assetData.currency || 'USD',
      marketCap: assetData.marketCap || null,
      volume: assetData.volume || null,
      description: assetData.description || '',
      sector: assetData.sector || null,
      exchange: assetData.exchange || null,
      created_at: new Date(),
      lastUpdated: new Date()
    };
    
    const result = await database
      .collection('assets')
      .insertOne(newAsset);
    
    return {
      id: result.insertedId.toString(),
      ...newAsset
    };
  } catch (error) {
    console.error('Fehler beim Erstellen des Assets:', error);
    throw error;
  }
}



//
// ─── EXPORTIERTE FUNKTIONEN IN EINEM OBJECT ────────────────────────────────────
//
export default {
  connectToDatabase,
  getDb,

  getCustomerById,
  getUserByEmail,
  createUser,
  authenticateUser,

  getUserPortfolios,
  createPortfolio,

  addTransaction,
  getPortfolioTransactions,
  getUserPortfolioPositions,
  getPortfolioPositions,
  calculatePortfolioValue,

  getAllAssets,
  getAssetBySymbol,
  getAssetsByCategory,
  getAssetCategories,
  updateAssetData,

  getCachedPrice,
  setCachedPrice,

  getPortfolioById,
  getPortfolioByCustomerId,
  deletePortfolio,
  updatePortfolio,
  deleteTransaction,
  getUserTransactions,
  searchAssets,
  createAsset
};
