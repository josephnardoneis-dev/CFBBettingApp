// UI Components for College Football Betting App
class ComponentRenderer {
    constructor() {
        this.api = window.api;
    }

    // Render a game card
    renderGameCard(game) {
        const gameTime = this.api.formatTime(game.gameTime);
        const homeTeam = game.homeTeam;
        const awayTeam = game.awayTeam;
        
        // Get best odds for display
        const spreadOdds = this.getBestSpreadOdds(game.odds);
        const totalOdds = this.getBestTotalOdds(game.odds);
        const mlOdds = this.getBestMoneylineOdds(game.odds);

        return `
            <div class="game-card" data-game-id="${game._id}" onclick="app.showGameDetails('${game._id}')">
                <div class="game-header">
                    <div class="game-time">${gameTime}</div>
                    <div class="game-network">${game.tvBroadcast || 'TBA'}</div>
                </div>
                
                <div class="game-matchup">
                    <div class="teams">
                        <div class="team">
                            <div class="team-logo" style="background: ${this.getTeamColor(awayTeam.name)}">
                                ${this.getTeamEmoji(awayTeam.name)}
                            </div>
                            <div class="team-name">${awayTeam.abbreviation || awayTeam.name}</div>
                            ${awayTeam.ranking ? `<div class="team-ranking">#${awayTeam.ranking}</div>` : ''}
                        </div>
                        
                        <div class="vs-divider">@</div>
                        
                        <div class="team">
                            <div class="team-logo" style="background: ${this.getTeamColor(homeTeam.name)}">
                                ${this.getTeamEmoji(homeTeam.name)}
                            </div>
                            <div class="team-name">${homeTeam.abbreviation || homeTeam.name}</div>
                            ${homeTeam.ranking ? `<div class="team-ranking">#${homeTeam.ranking}</div>` : ''}
                        </div>
                    </div>
                    
                    <div class="betting-lines">
                        <div class="betting-line">
                            <div class="line-label">Spread</div>
                            <div class="line-value spread-value">
                                ${spreadOdds.display}
                            </div>
                        </div>
                        
                        <div class="betting-line">
                            <div class="line-label">Total</div>
                            <div class="line-value total-value">
                                ${totalOdds.display}
                            </div>
                        </div>
                        
                        <div class="betting-line">
                            <div class="line-label">ML</div>
                            <div class="line-value ml-value">
                                ${mlOdds.display}
                            </div>
                        </div>
                    </div>
                    
                    ${this.renderLineMovements(game.odds)}
                </div>
            </div>
        `;
    }

    getBestSpreadOdds(odds) {
        if (!odds || odds.length === 0) {
            return { display: '--' };
        }

        // Find the best spread odds
        let bestHome = null;
        let bestAway = null;

        odds.forEach(odd => {
            if (odd.spread && odd.spread.home !== null) {
                if (!bestHome || odd.spread.homeOdds > bestHome.odds) {
                    bestHome = { spread: odd.spread.home, odds: odd.spread.homeOdds, book: odd.sportsbook };
                }
                if (!bestAway || odd.spread.awayOdds > bestAway.odds) {
                    bestAway = { spread: odd.spread.away, odds: odd.spread.awayOdds, book: odd.sportsbook };
                }
            }
        });

        if (!bestHome && !bestAway) {
            return { display: '--' };
        }

        const homeSpread = bestHome ? this.api.formatSpread(bestHome.spread) : '--';
        const awaySpread = bestAway ? this.api.formatSpread(bestAway.spread) : '--';

        return {
            display: `${awaySpread} / ${homeSpread}`,
            home: bestHome,
            away: bestAway
        };
    }

    getBestTotalOdds(odds) {
        if (!odds || odds.length === 0) {
            return { display: '--' };
        }

        let bestTotal = null;
        odds.forEach(odd => {
            if (odd.total && odd.total.points !== null) {
                if (!bestTotal || odd.total.points !== bestTotal.points) {
                    bestTotal = odd.total;
                }
            }
        });

        return bestTotal ? 
            { display: `${bestTotal.points}` } : 
            { display: '--' };
    }

    getBestMoneylineOdds(odds) {
        if (!odds || odds.length === 0) {
            return { display: '--' };
        }

        let bestHome = null;
        let bestAway = null;

        odds.forEach(odd => {
            if (odd.moneyline) {
                if (odd.moneyline.home && (!bestHome || odd.moneyline.home > bestHome)) {
                    bestHome = odd.moneyline.home;
                }
                if (odd.moneyline.away && (!bestAway || odd.moneyline.away > bestAway)) {
                    bestAway = odd.moneyline.away;
                }
            }
        });

        if (!bestHome && !bestAway) {
            return { display: '--' };
        }

        return {
            display: `${bestAway ? this.api.formatOdds(bestAway) : '--'} / ${bestHome ? this.api.formatOdds(bestHome) : '--'}`
        };
    }

    renderLineMovements(odds) {
        if (!odds || odds.length === 0) return '';

        // Check for recent movements
        const movements = [];
        odds.forEach(odd => {
            if (odd.spread?.lastMovement && odd.spread.lastMovement !== 'none') {
                movements.push({
                    type: 'spread',
                    direction: odd.spread.lastMovement,
                    book: odd.sportsbook
                });
            }
            if (odd.total?.lastMovement && odd.total.lastMovement !== 'none') {
                movements.push({
                    type: 'total',
                    direction: odd.total.lastMovement,
                    book: odd.sportsbook
                });
            }
        });

        if (movements.length === 0) return '';

        return `
            <div class="line-movements">
                <div class="movement-indicators">
                    ${movements.map(move => `
                        <div class="movement-indicator ${move.direction}">
                            <i class="fas fa-arrow-${move.direction === 'up' ? 'up' : 'down'}"></i>
                            <span>${move.type}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Render an expert insight card
    renderInsightCard(insight) {
        const timeAgo = this.api.formatTimeAgo(insight.timestamp);
        const expertInitials = this.getExpertInitials(insight.expertName);

        return `
            <div class="insight-card" data-insight-id="${insight._id}">
                <div class="insight-header">
                    <div class="expert-avatar">${expertInitials}</div>
                    <div class="expert-info">
                        <div class="expert-name">
                            @${insight.twitterHandle}
                            ${insight.expertMetrics?.isVerified ? '<i class="fas fa-check-circle verified-badge"></i>' : ''}
                        </div>
                        <div class="insight-time">${timeAgo}</div>
                    </div>
                    ${this.renderSentimentIndicator(insight.sentiment)}
                </div>
                
                <div class="insight-content">
                    ${this.formatInsightContent(insight.content)}
                </div>
                
                ${this.renderInsightTags(insight.categories, insight.bettingContext)}
                
                <div class="insight-engagement">
                    <div class="engagement-stat">
                        <i class="fas fa-heart"></i>
                        <span>${this.formatNumber(insight.likes)}</span>
                    </div>
                    <div class="engagement-stat">
                        <i class="fas fa-retweet"></i>
                        <span>${this.formatNumber(insight.retweets)}</span>
                    </div>
                    <div class="engagement-stat">
                        <i class="fas fa-comment"></i>
                        <span>${this.formatNumber(insight.replies)}</span>
                    </div>
                </div>
                
                ${this.renderRelatedGames(insight.relatedGames)}
            </div>
        `;
    }

    renderSentimentIndicator(sentiment) {
        if (!sentiment) return '';

        const colors = {
            positive: '#34a853',
            negative: '#ea4335',
            neutral: '#8b949e'
        };

        return `
            <div class="sentiment-indicator" style="color: ${colors[sentiment.label]}">
                <i class="fas fa-circle" style="font-size: 0.6rem;"></i>
            </div>
        `;
    }

    formatInsightContent(content) {
        // Basic text formatting and link detection
        return content
            .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
            .replace(/#(\w+)/g, '<span class="hashtag">#$1</span>')
            .replace(/@(\w+)/g, '<span class="mention">@$1</span>');
    }

    renderInsightTags(categories, bettingContext) {
        const tags = [];

        if (categories && categories.length > 0) {
            categories.forEach(cat => {
                tags.push(this.formatCategoryTag(cat));
            });
        }

        if (bettingContext?.betType) {
            tags.push(bettingContext.betType.toUpperCase());
        }

        if (bettingContext?.confidence) {
            tags.push(`${bettingContext.confidence.toUpperCase()} CONF`);
        }

        if (tags.length === 0) return '';

        return `
            <div class="insight-tags">
                ${tags.map(tag => `<span class="insight-tag">${tag}</span>`).join('')}
            </div>
        `;
    }

    formatCategoryTag(category) {
        const labels = {
            'betting_pick': 'PICK',
            'line_movement': 'LINE MOVE',
            'injury_update': 'INJURY',
            'weather_impact': 'WEATHER',
            'value_bet': 'VALUE',
            'fade_public': 'FADE',
            'model_analysis': 'MODEL',
            'breaking_news': 'NEWS'
        };

        return labels[category] || category.toUpperCase().replace('_', ' ');
    }

    renderRelatedGames(relatedGames) {
        if (!relatedGames || relatedGames.length === 0) return '';

        return `
            <div class="related-games">
                ${relatedGames.map(game => `
                    <div class="related-game" onclick="app.showGameDetails('${game.gameId}')">
                        <i class="fas fa-football-ball"></i>
                        <span>${game.teams.join(' vs ')}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Render odds comparison table
    renderOddsComparison(gameData, market) {
        if (!gameData.odds || gameData.odds.length === 0) {
            return '<div class="no-data">No odds data available</div>';
        }

        const headers = this.getOddsHeaders(market);
        const rows = this.getOddsRows(gameData.odds, market);

        return `
            <div class="odds-table">
                <div class="table-header">
                    ${headers.map(header => `<div class="header-cell">${header}</div>`).join('')}
                </div>
                ${rows.map(row => `
                    <div class="table-row">
                        ${row.map((cell, index) => `
                            <div class="table-cell ${index === 0 ? 'sportsbook-cell' : 'odds-cell'}">
                                ${cell}
                            </div>
                        `).join('')}
                    </div>
                `).join('')}
            </div>
        `;
    }

    getOddsHeaders(market) {
        const headers = {
            spread: ['Sportsbook', 'Away Spread', 'Away Odds', 'Home Spread', 'Home Odds'],
            moneyline: ['Sportsbook', 'Away ML', 'Home ML'],
            total: ['Sportsbook', 'Total', 'Over', 'Under'],
            props: ['Sportsbook', 'Player', 'Market', 'Line', 'Over', 'Under']
        };

        return headers[market] || [];
    }

    getOddsRows(odds, market) {
        return odds.map(odd => {
            switch (market) {
                case 'spread':
                    return [
                        odd.sportsbook,
                        odd.spread?.away ? this.api.formatSpread(odd.spread.away) : '--',
                        odd.spread?.awayOdds ? this.api.formatOdds(odd.spread.awayOdds) : '--',
                        odd.spread?.home ? this.api.formatSpread(odd.spread.home) : '--',
                        odd.spread?.homeOdds ? this.api.formatOdds(odd.spread.homeOdds) : '--'
                    ];
                case 'moneyline':
                    return [
                        odd.sportsbook,
                        odd.moneyline?.away ? this.api.formatOdds(odd.moneyline.away) : '--',
                        odd.moneyline?.home ? this.api.formatOdds(odd.moneyline.home) : '--'
                    ];
                case 'total':
                    return [
                        odd.sportsbook,
                        odd.total?.points || '--',
                        odd.total?.over ? this.api.formatOdds(odd.total.over) : '--',
                        odd.total?.under ? this.api.formatOdds(odd.total.under) : '--'
                    ];
                default:
                    return [odd.sportsbook];
            }
        });
    }

    // Render game details modal content
    renderGameDetails(gameData) {
        const game = gameData.game;
        const odds = gameData.odds || [];
        const insights = gameData.insights || [];

        return `
            <div class="game-details">
                <div class="game-header-large">
                    <div class="team-section">
                        <div class="team-info">
                            <div class="team-logo-large" style="background: ${this.getTeamColor(game.awayTeam.name)}">
                                ${this.getTeamEmoji(game.awayTeam.name)}
                            </div>
                            <div class="team-details">
                                <h3>${game.awayTeam.name}</h3>
                                ${game.awayTeam.ranking ? `<div class="ranking">#${game.awayTeam.ranking}</div>` : ''}
                            </div>
                        </div>
                    </div>
                    
                    <div class="game-info-center">
                        <div class="game-time">${this.api.formatTime(game.gameTime)}</div>
                        <div class="vs-large">@</div>
                        <div class="venue">${game.venue?.name || 'TBA'}</div>
                        <div class="broadcast">${game.tvBroadcast || 'TBA'}</div>
                    </div>
                    
                    <div class="team-section">
                        <div class="team-info">
                            <div class="team-logo-large" style="background: ${this.getTeamColor(game.homeTeam.name)}">
                                ${this.getTeamEmoji(game.homeTeam.name)}
                            </div>
                            <div class="team-details">
                                <h3>${game.homeTeam.name}</h3>
                                ${game.homeTeam.ranking ? `<div class="ranking">#${game.homeTeam.ranking}</div>` : ''}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="game-content-tabs">
                    <div class="tab-buttons">
                        <button class="tab-btn active" data-tab="odds">Odds</button>
                        <button class="tab-btn" data-tab="insights">Expert Insights</button>
                        <button class="tab-btn" data-tab="props">Props</button>
                        <button class="tab-btn" data-tab="history">History</button>
                    </div>
                    
                    <div class="tab-content">
                        <div id="odds-tab" class="tab-pane active">
                            ${this.renderDetailedOdds(odds)}
                        </div>
                        <div id="insights-tab" class="tab-pane">
                            ${this.renderGameInsights(insights)}
                        </div>
                        <div id="props-tab" class="tab-pane">
                            <div class="loading-content">Loading props...</div>
                        </div>
                        <div id="history-tab" class="tab-pane">
                            <div class="loading-content">Loading history...</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderDetailedOdds(odds) {
        if (!odds || odds.length === 0) {
            return '<div class="no-data">No odds data available</div>';
        }

        return `
            <div class="detailed-odds">
                <div class="odds-markets">
                    <div class="market-section">
                        <h4>Point Spreads</h4>
                        ${this.renderMarketOdds(odds, 'spread')}
                    </div>
                    
                    <div class="market-section">
                        <h4>Moneylines</h4>
                        ${this.renderMarketOdds(odds, 'moneyline')}
                    </div>
                    
                    <div class="market-section">
                        <h4>Totals</h4>
                        ${this.renderMarketOdds(odds, 'total')}
                    </div>
                </div>
            </div>
        `;
    }

    renderMarketOdds(odds, market) {
        return `
            <div class="market-odds">
                ${odds.map(odd => this.renderSportsbookOdds(odd, market)).join('')}
            </div>
        `;
    }

    renderSportsbookOdds(odd, market) {
        let content = '';
        
        switch (market) {
            case 'spread':
                if (odd.spread) {
                    content = `
                        <div class="odds-values">
                            <span class="away-odds">${this.api.formatSpread(odd.spread.away)} (${this.api.formatOdds(odd.spread.awayOdds)})</span>
                            <span class="home-odds">${this.api.formatSpread(odd.spread.home)} (${this.api.formatOdds(odd.spread.homeOdds)})</span>
                        </div>
                    `;
                }
                break;
            case 'moneyline':
                if (odd.moneyline) {
                    content = `
                        <div class="odds-values">
                            <span class="away-odds">${this.api.formatOdds(odd.moneyline.away)}</span>
                            <span class="home-odds">${this.api.formatOdds(odd.moneyline.home)}</span>
                        </div>
                    `;
                }
                break;
            case 'total':
                if (odd.total) {
                    content = `
                        <div class="odds-values">
                            <span class="total-line">O/U ${odd.total.points}</span>
                            <span class="total-odds">O: ${this.api.formatOdds(odd.total.over)} U: ${this.api.formatOdds(odd.total.under)}</span>
                        </div>
                    `;
                }
                break;
        }

        if (!content) {
            content = '<div class="no-odds">--</div>';
        }

        return `
            <div class="sportsbook-odds">
                <div class="sportsbook-name">${odd.sportsbook}</div>
                ${content}
                <div class="last-update">${this.api.formatTimeAgo(odd.lastUpdated)}</div>
            </div>
        `;
    }

    renderGameInsights(insights) {
        if (!insights || insights.length === 0) {
            return '<div class="no-data">No expert insights available for this game</div>';
        }

        return `
            <div class="game-insights">
                ${insights.map(insight => this.renderInsightCard(insight)).join('')}
            </div>
        `;
    }

    // Utility methods
    getExpertInitials(name) {
        return name.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase();
    }

    getTeamColor(teamName) {
        const colors = this.api.getTeamColorScheme(teamName);
        return colors.primary;
    }

    getTeamEmoji(teamName) {
        // Simple emoji mapping - in production, use team logos
        const emojis = {
            'Alabama': '🐘',
            'Georgia': '🐶', 
            'Ohio State': '🌰',
            'Michigan': '〽️',
            'Oklahoma': '🌪️',
            'Texas': '🤘',
            'Clemson': '🐅',
            'Notre Dame': '☘️',
            'USC': '⚔️',
            'Oregon': '🦆'
        };

        return emojis[teamName] || '🏈';
    }

    formatNumber(num) {
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'k';
        }
        return num.toString();
    }
}

// Create global component renderer
window.components = new ComponentRenderer();