class AssetStore {
    priceCache = $state(new Map());
    isLoading = $state(false);
    currentAsset = $state(null);
    
    // Derived state
    hasCachedPrices = $derived(this.priceCache.size > 0);
    
    async fetchPrice(symbol, type = 'auto') {
        this.isLoading = true;
        try {
            const response = await fetch(`/api/assets?symbol=${symbol}&type=${type}`);
            if (!response.ok) throw new Error(`Failed to fetch price for ${symbol}`);
            
            const priceData = await response.json();
            
            // Update cache using Runes
            const newCache = new Map(this.priceCache);
            newCache.set(symbol, {
                ...priceData,
                timestamp: Date.now()
            });
            this.priceCache = newCache;
            
            return priceData;
        } catch (error) {
            console.error(`Error fetching price for ${symbol}:`, error);
            throw error;
        } finally {
            this.isLoading = false;
        }
    }
    
    getCachedPrice(symbol) {
        const cached = this.priceCache.get(symbol);
        if (!cached) return null;
        
        // Check if cache is still valid (5 minutes)
        const isStale = Date.now() - cached.timestamp > 5 * 60 * 1000;
        return isStale ? null : cached;
    }
    
    setCurrentAsset(asset) {
        this.currentAsset = asset;
    }
}

export const assetStore = new AssetStore();