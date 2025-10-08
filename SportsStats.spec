<concept_spec>

concept AISportsStats[Source, Stat, Data]

purpose
    store team statistics in a structured way, where each sport defines which stats are tracked and which are considered key

principle
    each sport defines a set of stats relevant to it (with some marked as key);
    teams belonging to that sport inherit those stat types and maintain their own current values;
    users can view a team’s current stats and use an LLM to generate an explanatory summary

state
    a set of TeamStats with ...
        a name String
        a Sport
        a stats Record<Stat, Data>  // stored locally in this prototype for testing

    a set of Sports with ...
        a name String
        a Source
        a KeyStats set of Stats

actions
    addTeam (teamname: String, sport: Sport): (teamStats: TeamStat)
        requires no TeamStats for this teamname with this sport already exists
        effects creates a new TeamStats for this teamname for sport

    removeTeam (teamname: String, sport: Sport): (teamStats: TeamStat)
        requires TeamStats for this teamname with this sport exists
        effects removes TeamStats for this teamname for sport

    updateStat (teamname: String, sport: Sport, stat: Stat, value: Data)
        requires TeamStats for this teamname and sport exist and stat in sport’s KeyStats
        effects updates the value of that stat for the specified team

    addSport (sportName: String, source: Source, default: Set of Stats): (sport: Sport)
        requires no Sport with this name exists
        effects creates a new Sport with this source with KeyStats set as default

    deleteSport (sportName: String): (sport: Sport)
        requires Sport with this name exists and no teams associated with the sport exist
        effects removes sportName from state

    addKeyStat (sportName: String, stat: Stat)
        requires Sport with this name exists and stat is not already in its KeyStats
        effects adds stat to sportName’s KeyStats

    removeKeyStat (sportName: String, stat: Stat)
        requires Sport with this name exists and stat is in its KeyStats
        effects removes stat from sportName’s KeyStats

    fetchTeamStats (teamname: String, sport: Sport): (keyStatsData: Map<Stat, Data>)
        requires TeamStats for this teamname and sport exist
        effects for each KeyStat in the sport’s KeyStats, fetches Data for this specific team from the Sport’s Source

    analyzeTeamPerformance (teamname: String, sport: Sport): (summary: String)
        requires TeamStats for this teamname and sport exist
        effects calls an LLM using the team’s key stats to produce a textual performance summary
        note the summary provides context

notes
    In this prototype, stats are stored locally in the TeamStats state and updated manually via `updateStat`.
    In a full implementation, these values would be gathered dynamically from each sport’s external Source (e.g., an API or live database).

    This concept extends the original SportsStats design by adding an AI-based analysis action that generates readable summaries
    of a team’s performance based on their key stats.

</concept_spec>
