// Main Application Logic for College Football Betting App
class CollegeFootballBettingApp {
    constructor() {
        this.api = window.api;
        this.components = window.components;
        this.currentSection = 'today';
        this.refreshInterval = null;
        this.lastUpdate = null;
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.startAutoRefresh();
        await this.loadInitialData();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                this.showSection(section);
                this.updateNavigation(section);
            });
        });

        // Refresh button
        document.getElementById('refreshData')?.addEventListener('click', () => {
            this.refreshCurrentSection();
        });

        // Filter dropdown
        const filterBtn = document.getElementById('filterBtn');
        const filterMenu = document.getElementById('filterMenu');
        
        filterBtn?.addEventListener('click', () => {
            filterMenu?.classList.toggle('active');
        });

        // Close filter menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!filterBtn?.contains(e.target) && !filterMenu?.contains(e.target)) {
                filterMenu?.classList.remove('active');
            }
        });

        // Filter options
        document.querySelectorAll('.filter-option input').forEach(input => {
            input.addEventListener('change', () => {
                this.applyFilters();
            });
        });

        // Odds tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const market = btn.dataset.market;
                if (market) {
                    this.showOddsMarket(market);
                    this.updateTabs(btn);
                }
            });
        });

        // Insights filters
        document.querySelectorAll('.filter-pill').forEach(pill => {
            pill.addEventListener('click', () => {
                const category = pill.dataset.category;
                this.filterInsights(category);
                this.updateFilterPills(pill);
            });
        });

        // Modal
        const modal = document.getElementById('gameModal');
        const closeModal = document.getElementById('closeModal');
        
        closeModal?.addEventListener('click', () => {
            this.hideModal();
        });
        
        modal?.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideModal();
            }
        });

        // Escape key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideModal();
            }
        });
    }

    async loadInitialData() {
        this.showLoadingSpinner();
        
        try {
            // Load data for all sections
            await Promise.allSettled([
                this.loadTodaysGames(),
                this.loadExpertInsights(),
                this.loadTrendingData(),
                this.updateStats()
            ]);

            this.updateLastRefreshTime();
            
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.showToast('Failed to load initial data', 'error');
        } finally {
            this.hideLoadingSpinner();
        }
    }

    async loadTodaysGames() {
        try {
            const games = await this.api.getTodaysGames();
            this.renderGames(games);
            return games;
        } catch (error) {
            console.error('Error loading today\'s games:', error);
            this.showToast('Failed to load games', 'error');
            return [];
        }
    }

    async loadExpertInsights() {
        try {
            const insights = await this.api.getLatestInsights(30);
            this.renderInsights(insights);
            return insights;
        } catch (error) {
            console.error('Error loading insights:', error);
            this.showToast('Failed to load expert insights', 'error');
            return [];
        }
    }

    async loadTrendingData() {
        try {
            const [hotPicks, lineMovements, topExperts] = await Promise.allSettled([
                this.api.getBettingPicks('betting_pick', 10),
                this.api.getLineMovements(),
                this.api.getExpertRankings()
            ]);

            if (hotPicks.status === 'fulfilled') {
                this.renderHotPicks(hotPicks.value);
            }
            if (lineMovements.status === 'fulfilled') {
                this.renderLineMovements(lineMovements.value);
            }
            if (topExperts.status === 'fulfilled') {
                this.renderTopExperts(topExperts.value);
            }

        } catch (error) {
            console.error('Error loading trending data:', error);
        }
    }

    async updateStats() {
        try {
            const [games, insights, movements] = await Promise.allSettled([
                this.api.getTodaysGames(),
                this.api.getLatestInsights(100),
                this.api.getLineMovements()
            ]);

            // Update hero stats
            document.getElementById('totalGames').textContent = 
                games.status === 'fulfilled' ? games.value.length : '--';
                
            document.getElementById('totalInsights').textContent = 
                insights.status === 'fulfilled' ? insights.value.length : '--';
                
            document.getElementById('lineMovements').textContent = 
                movements.status === 'fulfilled' ? movements.value.length : '--';

        } catch (error) {
            console.error('Error updating stats:', error);
        }
    }

    renderGames(games) {
        const container = document.getElementById('gamesContainer');
        if (!container) return;

        if (!games || games.length === 0) {
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-calendar-times"></i>
                    <h3>No games scheduled for today</h3>
                    <p>Check back tomorrow for upcoming games</p>
                </div>
            `;
            return;
        }

        container.innerHTML = games
            .map(game => this.components.renderGameCard(game))
            .join('');
    }

    renderInsights(insights) {
        const container = document.getElementById('insightsGrid');
        if (!container) return;

        if (!insights || insights.length === 0) {
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-brain"></i>
                    <h3>No expert insights available</h3>
                    <p>Check back later for expert analysis</p>
                </div>
            `;
            return;
        }

        container.innerHTML = insights
            .map(insight => this.components.renderInsightCard(insight))
            .join('');
    }

    renderHotPicks(picks) {
        const container = document.getElementById('hotPicks');
        if (!container) return;

        if (!picks || picks.length === 0) {
            container.innerHTML = '<div class="no-trending">No hot picks available</div>';
            return;
        }

        container.innerHTML = picks.slice(0, 5)
            .map(pick => `
                <div class="trending-item">
                    <div class="trending-content">
                        <div class="expert-name">@${pick.twitterHandle}</div>
                        <div class="pick-content">${pick.bettingContext?.pick || 'View details'}</div>
                    </div>
                    <div class="engagement-count">${pick.likes + pick.retweets}</div>
                </div>
            `).join('');
    }

    renderLineMovements(movements) {
        const container = document.getElementById('lineMovements');
        if (!container) return;

        if (!movements || movements.length === 0) {
            container.innerHTML = '<div class="no-trending">No line movements</div>';
            return;
        }

        container.innerHTML = movements.slice(0, 5)
            .map(movement => `
                <div class="trending-item">
                    <div class="trending-content">
                        <div class="game-matchup">${movement.gameId?.homeTeam?.name || 'Game'}</div>
                        <div class="movement-detail">
                            ${movement.spread?.lastMovement ? `Spread ${movement.spread.lastMovement}` : ''}
                            ${movement.total?.lastMovement ? `Total ${movement.total.lastMovement}` : ''}
                        </div>
                    </div>
                    <div class="movement-time">${this.api.formatTimeAgo(movement.lastUpdated)}</div>
                </div>
            `).join('');
    }

    renderTopExperts(experts) {
        const container = document.getElementById('topExperts');
        if (!container) return;

        if (!experts || experts.length === 0) {
            container.innerHTML = '<div class="no-trending">No expert data</div>';
            return;
        }

        container.innerHTML = experts.slice(0, 5)
            .map((expert, index) => `
                <div class="trending-item">
                    <div class="trending-content">
                        <div class="expert-rank">#${index + 1}</div>
                        <div class="expert-details">
                            <div class="expert-name">@${expert._id}</div>
                            <div class="expert-accuracy">${Math.round(expert.avgAccuracy || 0)}% accuracy</div>
                        </div>
                    </div>
                    <div class="expert-picks">${expert.totalPicks} picks</div>
                </div>
            `).join('');
    }

    showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        // Show target section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionId;
        }

        // Load section-specific data
        this.loadSectionData(sectionId);
    }

    updateNavigation(activeSection) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.section === activeSection) {
                link.classList.add('active');
            }
        });
    }

    async loadSectionData(sectionId) {
        switch (sectionId) {
            case 'odds':
                await this.loadOddsData();
                break;
            case 'insights':
                await this.loadExpertInsights();
                break;
            case 'trends':
                await this.loadTrendingData();
                break;
            // 'today' data is loaded by default
        }
    }

    async loadOddsData() {
        const container = document.getElementById('oddsContent');
        if (!container) return;

        try {
            const games = await this.api.getTodaysGames();
            if (games.length > 0) {
                // Show odds for the first game by default
                const gameData = await this.api.getGameDetails(games[0]._id);
                container.innerHTML = this.components.renderOddsComparison(gameData, 'spread');
            } else {
                container.innerHTML = '<div class="no-data">No games available for odds comparison</div>';
            }
        } catch (error) {
            console.error('Error loading odds data:', error);
            container.innerHTML = '<div class="error-message">Failed to load odds data</div>';
        }
    }

    async showOddsMarket(market) {
        const container = document.getElementById('oddsContent');
        if (!container) return;

        container.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Loading ${market} odds...</p>
            </div>
        `;

        try {
            const games = await this.api.getTodaysGames();
            if (games.length > 0) {
                const gameData = await this.api.getGameDetails(games[0]._id);
                container.innerHTML = this.components.renderOddsComparison(gameData, market);
            }
        } catch (error) {
            console.error('Error loading odds market:', error);
            container.innerHTML = '<div class="error-message">Failed to load odds data</div>';
        }
    }

    updateTabs(activeTab) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        activeTab.classList.add('active');
    }

    async filterInsights(category) {
        const container = document.getElementById('insightsGrid');
        if (!container) return;

        container.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Loading insights...</p>
            </div>
        `;

        try {
            let insights;
            if (category === 'all') {
                insights = await this.api.getLatestInsights(30);
            } else {
                insights = await this.api.getInsightsByCategory(category, 30);
            }
            
            this.renderInsights(insights);
        } catch (error) {
            console.error('Error filtering insights:', error);
            container.innerHTML = '<div class="error-message">Failed to load insights</div>';
        }
    }

    updateFilterPills(activePill) {
        document.querySelectorAll('.filter-pill').forEach(pill => {
            pill.classList.remove('active');
        });
        activePill.classList.add('active');
    }

    async showGameDetails(gameId) {
        const modal = document.getElementById('gameModal');
        const modalBody = document.getElementById('modalBody');
        
        if (!modal || !modalBody) return;

        // Show modal with loading
        modalBody.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Loading game details...</p>
            </div>
        `;
        modal.classList.add('active');

        try {
            const gameData = await this.api.getGameDetails(gameId);
            modalBody.innerHTML = this.components.renderGameDetails(gameData);
            
            // Setup modal tabs
            this.setupModalTabs(gameId);
            
        } catch (error) {
            console.error('Error loading game details:', error);
            modalBody.innerHTML = '<div class="error-message">Failed to load game details</div>';
        }
    }

    setupModalTabs(gameId) {
        const tabButtons = document.querySelectorAll('.modal-content .tab-btn');
        const tabPanes = document.querySelectorAll('.modal-content .tab-pane');

        tabButtons.forEach(btn => {
            btn.addEventListener('click', async () => {
                const tabName = btn.dataset.tab;
                
                // Update active tab
                tabButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Show corresponding pane
                tabPanes.forEach(pane => pane.classList.remove('active'));
                const targetPane = document.getElementById(`${tabName}-tab`);
                if (targetPane) {
                    targetPane.classList.add('active');
                    
                    // Load tab-specific data
                    await this.loadModalTabData(tabName, gameId, targetPane);
                }
            });
        });
    }

    async loadModalTabData(tabName, gameId, container) {
        switch (tabName) {
            case 'props':
                try {
                    const props = await this.api.getPlayerProps(gameId);
                    container.innerHTML = this.renderPlayerProps(props);
                } catch (error) {
                    container.innerHTML = '<div class="error-message">Failed to load props</div>';
                }
                break;
                
            case 'history':
                try {
                    // Load odds history for major sportsbooks
                    const histories = await Promise.allSettled([
                        this.api.getOddsHistory(gameId, 'DraftKings'),
                        this.api.getOddsHistory(gameId, 'FanDuel'),
                        this.api.getOddsHistory(gameId, 'BetMGM')
                    ]);
                    
                    container.innerHTML = this.renderOddsHistory(histories);
                } catch (error) {
                    container.innerHTML = '<div class="error-message">Failed to load history</div>';
                }
                break;
        }
    }

    renderPlayerProps(props) {
        if (!props || Object.keys(props).length === 0) {
            return '<div class="no-data">No player props available</div>';
        }

        return Object.entries(props).map(([key, propList]) => {
            const [playerName, market] = key.split('_');
            return `
                <div class="prop-section">
                    <h4>${playerName} - ${market.replace(/_/g, ' ').toUpperCase()}</h4>
                    <div class="prop-options">
                        ${propList.map(prop => `
                            <div class="prop-option">
                                <div class="sportsbook">${prop.sportsbook}</div>
                                <div class="prop-line">
                                    <span class="line-value">${prop.line}</span>
                                    <span class="over-under">
                                        O: ${this.api.formatOdds(prop.overOdds)} 
                                        U: ${this.api.formatOdds(prop.underOdds)}
                                    </span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }

    renderOddsHistory(histories) {
        const validHistories = histories
            .filter(h => h.status === 'fulfilled' && h.value)
            .map(h => h.value);

        if (validHistories.length === 0) {
            return '<div class="no-data">No odds history available</div>';
        }

        return `
            <div class="odds-history">
                ${validHistories.map(history => `
                    <div class="history-section">
                        <h4>${history.sportsbook} History</h4>
                        <div class="history-timeline">
                            ${history.history.slice(0, 10).map(entry => `
                                <div class="history-entry">
                                    <div class="entry-time">${this.api.formatTimeAgo(entry.timestamp)}</div>
                                    <div class="entry-values">
                                        <span>Spread: ${this.api.formatSpread(entry.spread?.home)}</span>
                                        <span>Total: ${entry.total}</span>
                                        <span>ML: ${this.api.formatOdds(entry.moneylineHome)}</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    hideModal() {
        const modal = document.getElementById('gameModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    applyFilters() {
        const rankedOnly = document.getElementById('rankedOnly')?.checked;
        const primetime = document.getElementById('primetime')?.checked;
        const conferences = document.getElementById('conferences')?.checked;

        // Apply filters to current games display
        // This is a simplified implementation
        if (this.currentSection === 'today') {
            this.loadTodaysGames();
        }
    }

    async refreshCurrentSection() {
        const refreshBtn = document.getElementById('refreshData');
        if (refreshBtn) {
            refreshBtn.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Refreshing...';
            refreshBtn.disabled = true;
        }

        try {
            // Clear cache
            this.api.clearCache();
            
            // Reload current section
            await this.loadSectionData(this.currentSection);
            await this.updateStats();
            
            this.updateLastRefreshTime();
            this.showToast('Data refreshed successfully', 'success');
            
        } catch (error) {
            console.error('Error refreshing data:', error);
            this.showToast('Failed to refresh data', 'error');
        } finally {
            if (refreshBtn) {
                refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
                refreshBtn.disabled = false;
            }
        }
    }

    startAutoRefresh() {
        // Refresh data every 5 minutes
        this.refreshInterval = setInterval(() => {
            this.refreshCurrentSection();
        }, 5 * 60 * 1000);
    }

    updateLastRefreshTime() {
        this.lastUpdate = new Date();
        const lastUpdateElement = document.getElementById('lastUpdate');
        if (lastUpdateElement) {
            lastUpdateElement.textContent = this.lastUpdate.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        }
    }

    showLoadingSpinner() {
        // Implementation depends on current section
    }

    hideLoadingSpinner() {
        // Implementation depends on current section
    }

    showToast(message, type = 'info', duration = 5000) {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${this.getToastIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;

        toastContainer.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // Remove after duration
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
    }

    getToastIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new CollegeFootballBettingApp();
});