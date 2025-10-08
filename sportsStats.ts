/**
 * SportsStats Concept - AI Augmented Version
 */

import { GeminiLLM } from './gemini-llm';

// a sport where key stats are stored
export interface Sport {
    name: string;
    source: string;
    keyStats: string[];
}

// storage of stats for TeamStats
export interface TeamStats {
    teamName: string;
    sport: Sport;
    stats: Record<string, number>;
}

/**
 * AISportsStats class
 * Stores and analyzes team statistics with LLM-powered summaries
 */
export class AISportsStats {
    private sports: Sport[] = [];
    private teams: TeamStats[] = [];

    /**
     * Add a new sport to the system
     */
    addSport(name: string, source: string, defaultStats: string[]): Sport {
        if (this.sports.some(s => s.name === name)) {
            throw new Error(`Sport "${name}" already exists.`);
        }
        const sport: Sport = { name, source, keyStats: defaultStats };
        this.sports.push(sport);
        console.log(`✅ Added sport: ${name}`);
        return sport;
    }

    /**
     * Delete a sport (only if no teams are associated)
     */
    deleteSport(name: string): Sport {
        const sport = this.sports.find(s => s.name === name);
        if (!sport) {
            throw new Error(`Sport "${name}" does not exist.`);
        }
        const hasTeams = this.teams.some(t => t.sport.name === name);
        if (hasTeams) {
            throw new Error(`Cannot delete sport "${name}" — teams are still associated.`);
        }
        this.sports = this.sports.filter(s => s.name !== name);
        console.log(`🗑️ Deleted sport: ${name}`);
        return sport;
    }

    /**
     * Add a new team for a given sport
     */
    addTeam(teamName: string, sport: Sport): TeamStats {
        const exists = this.teams.some(
            t => t.teamName === teamName && t.sport.name === sport.name
        );
        if (exists) {
            throw new Error(`Team "${teamName}" already exists for sport "${sport.name}".`);
        }
        const newTeam: TeamStats = { teamName, sport, stats: {} };
        this.teams.push(newTeam);
        console.log(`✅ Added team: ${teamName} (${sport.name})`);
        return newTeam;
    }

    /**
     * Remove a team
     */
    removeTeam(teamName: string, sport: Sport): TeamStats {
        const team = this.findTeam(teamName, sport);
        this.teams = this.teams.filter(t => t !== team);
        console.log(`🗑️ Removed team: ${teamName} (${sport.name})`);
        return team;
    }

    /**
     * Add a key stat to a sport
     */
    addKeyStat(sportName: string, stat: string): void {
        const sport = this.findSport(sportName);
        if (sport.keyStats.includes(stat)) {
            throw new Error(`Stat "${stat}" already exists for sport "${sportName}".`);
        }
        sport.keyStats.push(stat);
        console.log(`➕ Added key stat "${stat}" to ${sportName}`);
    }

    /**
     * Remove a key stat from a sport
     */
    removeKeyStat(sportName: string, stat: string): void {
        const sport = this.findSport(sportName);
        sport.keyStats = sport.keyStats.filter(s => s !== stat);
        console.log(`➖ Removed key stat "${stat}" from ${sportName}`);
    }

    /**
     * Update a team's stat value
     */
    updateStat(teamName: string, sport: Sport, stat: string, value: number): void {
        const team = this.findTeam(teamName, sport);
        if (!team.sport.keyStats.includes(stat)) {
            throw new Error(`"${stat}" is not a key stat for sport "${sport.name}".`);
        }
        team.stats[stat] = value;
        console.log(`📊 Updated ${teamName} - ${stat}: ${value}`);
    }

    /**
     * Fetch a team's stats
     */
    fetchTeamStats(teamName: string, sport: Sport): Record<string, number> {
        const team = this.findTeam(teamName, sport);
        return { ...team.stats };
    }

    /**
     * Analyze team performance using the LLM
     */
    async analyzeTeamPerformance(teamName: string, sport: Sport, llm: GeminiLLM): Promise<string> {
        try{
        const team = this.findTeam(teamName, sport);
        const stats = this.fetchTeamStats(teamName, sport);

        console.log(`🤖 Generating AI summary for ${teamName} (${sport.name})...`);
        const prompt = this.createSummaryPrompt(team, stats);

        console.log(`🤖 Sending stats for ${teamName} to LLM...`);
        const response = await llm.executeLLM(prompt);

        const summary = response.trim();
        console.log(`✅ Received AI summary for ${teamName}!`);
        console.log('===============================');
        console.log(summary);
        console.log('===============================\n');

        // Run validator right after AI generation
        this.validateSummary(summary, stats, Object.keys(stats));
        return summary
        } catch (error) {
            console.error('❌ Error calling Gemini API:', (error as Error).message);
            throw error;
        }

    }

    /**
     * Create the prompt for Gemini with hardwired preferences
     */
    private createSummaryPrompt(team: TeamStats,  stats: Record<string, number>): string {

        return `
  You are a professional sports analyst.
Write a single cohesive summary of the team’s performance in 3–5 sentences total (45-200 words).

Before writing your 3–5 sentence summary, check if any values are inconsistent or impossible. If such inconsistencies exist, explicitly state that the data may be inaccurate before giving your summary.

Integrate all provided statistics into one unified paragraph rather than listing them individually.
Focus on the overall narrative of how the team is performing based on these stats. Focus on key statistics.

Explain what the following stats suggest about the performance of the ${team.teamName} in ${team.sport.name}.

Use clear, conversational language suitable for casual fans. Be as concise as possible while still mention standout metrics or areas to improve along with overall narrative. If writing out statistic names (ex batting avg instead of AVG), say the abbreivation as well.

Team: ${team.teamName}
Sport: ${team.sport.name}
Stats: ${JSON.stringify(stats, null, 2)}
  `;
    }


    /**
     * Ensures the AI summary is concise, references given stats, and avoids hallucinated stats
     */
    private validateSummary(summary: string, stats: Record<string, number>, keyStats: string[]): void {
        const wordCount = summary.trim().split(/\s+/).length;

        // Length Validator
        if (wordCount < 45 || wordCount > 200) {
            throw new Error('❌ Invalid summary length: should be 45–200 words (≈3–5 sentences).');
        }

        // Key Stat Inclusion Validator
        const mentionsStat = keyStats.some(k => summary.includes(k));
        if (!mentionsStat) {
            throw new Error('❌ Summary does not reference any key stats (e.g., OPS, ERA, AVG).');
        }

        // No-Hallucination Validator
        const uppercaseTokens = Array.from(summary.matchAll(/\b[A-Z]{2,5}\b/g)).map(m => m[0]);
        const unrecognized = uppercaseTokens.filter(token => !keyStats.includes(token));

        const hallucinated = unrecognized.filter(token => {
            // Only flag if the stat has a number nearby (within a few tokens)
            const regex = new RegExp(`${token}[^\\d]{0,10}\\d+(\\.\\d+)?`, 'g');
            return regex.test(summary);
        });

        if (hallucinated.length > 0) {
            throw new Error(`❌ Summary mentions unrecognized stats with numeric values: ${hallucinated.join(', ')}.`);
        }

        console.log('✅ All validation checks passed.');
    }

    /**
     * Helper: find a sport by name
     */
    private findSport(name: string): Sport {
        const sport = this.sports.find(s => s.name === name);
        if (!sport) throw new Error(`Sport "${name}" not found.`);
        return sport;
    }

    /**
     * Helper: find a team by name and sport
     */
    private findTeam(teamName: string, sport: Sport): TeamStats {
        const team = this.teams.find(
            t => t.teamName === teamName && t.sport.name === sport.name
        );
        if (!team) {
            throw new Error(`Team "${teamName}" not found for sport "${sport.name}".`);
        }
        return team;
    }
}
