// API Service for College Football Betting App
class APIService {
    constructor() {
        this.baseUrl = '/api';
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    // Generic fetch with error handling and caching
    async fetchData(endpoint, options = {}) {
        const cacheKey = `${endpoint}_${JSON.stringify(options)}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }

        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            // Cache successful responses
            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });

            return data;
        } catch (error) {
            console.error(`API Error [${endpoint}]:`, error);
            throw error;
        }
    }

    // Clear cache
    clearCache() {
        this.cache.clear();
    }

    // Games API
    async getTodaysGames() {
        return this.fetchData('/games/today');
    }

    async getGamesByDate(date) {
        return this.fetchData(`/games/date/${date}`);
    }

    async getGamesByWeek(week, season) {
        return this.fetchData(`/games/week/${week}/${season}`);
    }

    async getGameDetails(gameId) {
        return this.fetchData(`/games/${gameId}`);
    }

    async getUpcomingGames() {
        return this.fetchData('/games/upcoming/week');
    }

    async searchGamesByTeam(teamName) {
        return this.fetchData(`/games/team/${encodeURIComponent(teamName)}`);
    }

    // Odds API
    async getGameOdds(gameId) {
        return this.fetchData(`/odds/game/${gameId}`);
    }

    async compareOdds(gameId, market) {
        return this.fetchData(`/odds/compare/${gameId}/${market}`);
    }

    async getBestOdds(gameId, betType, selection) {
        return this.fetchData(`/odds/best/${gameId}/${betType}/${selection}`);
    }

    async getOddsHistory(gameId, sportsbook) {
        return this.fetchData(`/odds/history/${gameId}/${sportsbook}`);
    }

    async getPlayerProps(gameId) {
        return this.fetchData(`/odds/props/players/${gameId}`);
    }

    async getLineMovements() {
        return this.fetchData('/odds/movements/today');
    }

    // Insights API
    async getLatestInsights(limit = 20) {
        return this.fetchData(`/insights/latest?limit=${limit}`);
    }

    async getGameInsights(gameId) {
        return this.fetchData(`/insights/game/${gameId}`);
    }

    async getExpertInsights(twitterHandle, limit = 20) {
        return this.fetchData(`/insights/expert/${twitterHandle}?limit=${limit}`);
    }

    async getBettingPicks(category = null, limit = 50) {
        const query = category ? `?category=${category}&limit=${limit}` : `?limit=${limit}`;
        return this.fetchData(`/insights/picks${query}`);
    }

    async getInsightsByCategory(category, limit = 30) {
        return this.fetchData(`/insights/category/${category}?limit=${limit}`);
    }

    async getTrendingInsights(hours = 24) {
        return this.fetchData(`/insights/trending?hours=${hours}`);
    }

    async getExpertRankings() {
        return this.fetchData('/insights/experts/rankings');
    }

    async searchInsights(query, limit = 20) {
        return this.fetchData(`/insights/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    }

    // Utility methods
    formatOdds(odds) {
        if (!odds) return '--';
        
        if (odds > 0) {
            return `+${odds}`;
        }
        return odds.toString();
    }

    formatSpread(spread) {
        if (!spread) return '--';
        
        if (spread > 0) {
            return `+${spread}`;
        }
        return spread.toString();
    }

    calculateImpliedProbability(odds) {
        if (!odds) return 0;
        
        if (odds > 0) {
            return 100 / (odds + 100) * 100;
        } else {
            return Math.abs(odds) / (Math.abs(odds) + 100) * 100;
        }
    }

    formatTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        
        // If it's today, show time only
        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        }
        
        // If it's this week, show day and time
        const diffTime = date - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 7 && diffDays >= -7) {
            return date.toLocaleDateString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' });
        }
        
        // Otherwise show full date
        return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    }

    formatTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = now - date;
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffMinutes < 1) {
            return 'just now';
        } else if (diffMinutes < 60) {
            return `${diffMinutes}m ago`;
        } else if (diffHours < 24) {
            return `${diffHours}h ago`;
        } else if (diffDays < 7) {
            return `${diffDays}d ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    getTeamColorScheme(teamName) {
        const colors = {
            'Alabama': { primary: '#9E1B32', secondary: '#FFFFFF' },
            'Georgia': { primary: '#BA0C2F', secondary: '#000000' },
            'Ohio State': { primary: '#BB0000', secondary: '#FFFFFF' },
            'Michigan': { primary: '#00274C', secondary: '#FFCB05' },
            'Oklahoma': { primary: '#841617', secondary: '#FDF8F2' },
            'Texas': { primary: '#BF5700', secondary: '#FFFFFF' },
            'Clemson': { primary: '#F56600', secondary: '#522D80' },
            'Notre Dame': { primary: '#0C2340', secondary: '#C99700' },
            'USC': { primary: '#990000', secondary: '#FFCC00' },
            'Oregon': { primary: '#154733', secondary: '#FEE123' }
        };

        return colors[teamName] || { primary: '#1a73e8', secondary: '#ffffff' };
    }

    // Error handling helper
    handleError(error, context = '') {
        console.error(`API Error ${context}:`, error);
        
        // Show user-friendly error message
        this.showToast(`Failed to load ${context}. Please try again.`, 'error');
        
        return null;
    }

    // Toast notification helper
    showToast(message, type = 'info', duration = 5000) {
        // This will be implemented in app.js
        if (window.app && window.app.showToast) {
            window.app.showToast(message, type, duration);
        }
    }
}

// Create global API instance
window.api = new APIService();