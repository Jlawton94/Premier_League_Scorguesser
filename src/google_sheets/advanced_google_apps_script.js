/**
 * Advanced FPL Prediction Game - Google Apps Script
 * 
 * Features:
 * - 8/3 point scoring system with bonuses
 * - Captain mechanics (2x points per gameweek)
 * - Triple Captain & All Captain chips (once per season)
 * - Upset bonuses based on favorite predictions
 * - Weekly goals total bonus
 * - Season-end table accuracy bonus
 * - Automatic league table generation from predictions
 */

// Advanced Configuration
const ADVANCED_CONFIG = {
    MASTER_SHEET: "Game Weeks",
    SCORING_SHEET: "Scoring Rules",
    LEADERBOARD_SHEET: "Leaderboard",
    TABLE_PREDICTIONS_SHEET: "Table Predictions",
    PLAYER_PREFIX: "Player_",

    // Scoring points
    POINTS: {
        EXACT_SCORE: 10,
        CORRECT_RESULT: 3,
        CORRECT_GOAL_DIFF: 2,
        UPSET_SLIGHT: 2,      // Slight favorite loses
        UPSET_FAVORITE: 4,    // Favorite loses  
        UPSET_STRONG: 8,      // Strong favorite loses
        WEEKLY_GOALS: 5,      // Correct total goals in gameweek
    },

    // Multipliers
    CAPTAIN_MULTIPLIER: 2,
    TRIPLE_CAPTAIN_MULTIPLIER: 3,
    ALL_CAPTAIN_MULTIPLIER: 2,

    // Column positions in player sheets
    PLAYER_COLS: {
        GAMEWEEK: 1,        // A
        HOME_TEAM: 2,       // B
        AWAY_TEAM: 3,       // C  
        DATE: 4,            // D
        KICKOFF: 5,         // E
        HOME_PRED: 6,       // F
        AWAY_PRED: 7,       // G
        CAPTAIN: 8,         // H (checkbox)
        MATCH_POINTS: 9,    // I
        BREAKDOWN: 10       // J
    },

    // Master sheet columns
    MASTER_COLS: {
        GAMEWEEK: 1,
        HOME_TEAM: 2,
        AWAY_TEAM: 3,
        DATE: 4,
        KICKOFF: 5,
        MATCH_PREDICTION: 6,  // Favorite prediction
        ACTUAL_HOME: 7,
        ACTUAL_AWAY: 8
    }
};

// Example: updateAfterGamesJacob() for convenience
function updateAfterGamesJacob() {
    updateAfterGamesForPlayer('Jacob');
}

function updateAfterGamesShez() {
    updateAfterGamesForPlayer('Shez');
}

function updateAfterGamesRyan() {
    updateAfterGamesForPlayer('Ryan');
}

function updateAfterGames2_1_Mo() {
    updateAfterGamesForPlayer('2_1_Mo');
}

function updateAfterGamesManU_Hair_Guy() {
    updateAfterGamesForPlayer('ManU_Hair_Guy');
}

/**
 * MASTER UPDATE FUNCTION - RUN AFTER EACH GAME
 */

/**
 * Master function to run after each completed game/gameweek
 * Updates all player scores, bonuses, and predicted league tables
 */
function updateAfterGames() {
    const startTime = Date.now();
    Logger.log("🚀 STARTING COMPREHENSIVE UPDATE AFTER GAMES...");
    Logger.log("=".repeat(50));

    try {
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        const gameWeeksSheet = ss.getSheetByName(ADVANCED_CONFIG.MASTER_SHEET);

        if (!gameWeeksSheet) {
            throw new Error("Game Weeks sheet not found!");
        }

        // Step 1: Get all player sheets
        Logger.log("📋 Step 1: Finding player sheets...");
        const allSheets = ss.getSheets();
        const playerSheets = allSheets.filter(sheet =>
            sheet.getName().startsWith(ADVANCED_CONFIG.PLAYER_PREFIX) &&
            !sheet.getName().includes(" - Stats") &&
            !sheet.getName().includes(" - Table")
        );

        if (playerSheets.length === 0) {
            throw new Error("No player prediction sheets found!");
        }

        Logger.log(`✅ Found ${playerSheets.length} player sheets to update`);

        // Step 3: Calculate scores for all players
        Logger.log("🎯 Step 3: Calculating match scores for all players...");
        let scoresUpdated = 0;

        for (const playerSheet of playerSheets) {
            const playerName = playerSheet.getName().replace(ADVANCED_CONFIG.PLAYER_PREFIX, "");
            try {
                Logger.log(`   📊 Calculating scores for ${playerName}...`);
                // Use defaults (formatting ON for UX, verbose logs OFF)
                calculatePlayerScores(playerSheet, gameWeeksSheet);
                scoresUpdated++;
            } catch (error) {
                Logger.log(`   ❌ Error calculating scores for ${playerName}: ${error.toString()}`);
            }
        }

        Logger.log(`✅ Updated scores for ${scoresUpdated}/${playerSheets.length} players`);

        // Step 4: Calculate weekly bonuses
        Logger.log("🎁 Step 4: Calculating weekly bonuses...");
        let bonusesUpdated = 0;

        for (const playerSheet of playerSheets) {
            const playerName = playerSheet.getName().replace(ADVANCED_CONFIG.PLAYER_PREFIX, "");
            try {
                Logger.log(`   ✨ Calculating bonuses for ${playerName}...`);
                calculateWeeklyBonuses(playerSheet);
                bonusesUpdated++;
            } catch (error) {
                Logger.log(`   ❌ Error calculating bonuses for ${playerName}: ${error.toString()}`);
            }
        }

        Logger.log(`✅ Updated bonuses for ${bonusesUpdated}/${playerSheets.length} players`);

        // Step 5: Regenerate all player league tables
        Logger.log("🏆 Step 5: Regenerating predicted league tables...");
        try {
            generateAllPlayerTableSheets();
            Logger.log("✅ All league table sheets updated");
        } catch (error) {
            Logger.log(`❌ Error updating league tables: ${error.toString()}`);
        }

        // Step 6: Update stats sheets
        Logger.log("📈 Step 6: Updating player statistics sheets...");
        try {
            generateAllPlayerStatsSheets();
            Logger.log("✅ All stats sheets updated");
        } catch (error) {
            Logger.log(`❌ Error updating stats sheets: ${error.toString()}`);
        }

        // Step 7: Update leaderboard
        Logger.log("🏅 Step 7: Updating leaderboard...");
        try {
            updateAdvancedLeaderboard();
            Logger.log("✅ Leaderboard updated");
        } catch (error) {
            Logger.log(`❌ Error updating leaderboard: ${error.toString()}`);
        }

        // Step 8: Lock predictions for completed/started matches
        Logger.log("🔒 Step 8: Locking played/started matches...");
        try {
            const lockSummary = lockPlayedOrStartedMatches(gameWeeksSheet, playerSheets);
            Logger.log(`🔒 Locks applied: ${lockSummary.totalRows} rows across ${lockSummary.totalRanges} ranges`);
        } catch (error) {
            Logger.log(`❌ Error locking matches: ${error.toString()}`);
        }

        // Final summary
        const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
        Logger.log("=".repeat(50));
        Logger.log("🎉 COMPREHENSIVE UPDATE COMPLETE!");
        Logger.log(`⏱️  Total execution time: ${totalTime} seconds`);
        Logger.log(`📊 Players processed: ${playerSheets.length}`);
        Logger.log(`🎯 Scores updated: ${scoresUpdated}`);
        Logger.log(`🎁 Bonuses updated: ${bonusesUpdated}`);
        Logger.log("✅ League tables: Updated");
        Logger.log("✅ Stats sheets: Updated");
        Logger.log("✅ Leaderboard: Updated");
        Logger.log("🔒 Locks applied: Completed/Started matches");
        Logger.log("=".repeat(50));

    } catch (error) {
        const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
        Logger.log("=".repeat(50));
        Logger.log("❌ COMPREHENSIVE UPDATE FAILED!");
        Logger.log(`⏱️  Execution time before failure: ${totalTime} seconds`);
        Logger.log(`🚨 Error: ${error.toString()}`);
        Logger.log("=".repeat(50));
        throw error;
    }
}

/**
 * Update after games for a single player by name
 * Usage: updateAfterGamesForPlayer('Jacob')
 */
function updateAfterGamesForPlayer(playerName) {
    const startTime = Date.now();
    Logger.log(`🚀 STARTING UPDATE AFTER GAMES FOR PLAYER: ${playerName}`);
    Logger.log("=".repeat(50));
    try {
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        const gameWeeksSheet = ss.getSheetByName(ADVANCED_CONFIG.MASTER_SHEET);
        if (!gameWeeksSheet) {
            throw new Error("Game Weeks sheet not found!");
        }
        const playerSheetName = ADVANCED_CONFIG.PLAYER_PREFIX + playerName;
        const playerSheet = ss.getSheetByName(playerSheetName);
        if (!playerSheet) {
            throw new Error(`Player sheet not found: ${playerSheetName}`);
        }

        // Step 1: Calculate scores for this player
        Logger.log(`🎯 Calculating match scores for ${playerName}...`);
        calculatePlayerScores(playerSheet, gameWeeksSheet);

        // Step 2: Calculate weekly bonuses
        Logger.log(`🎁 Calculating weekly bonuses for ${playerName}...`);
        calculateWeeklyBonuses(playerSheet);

        // Step 3: Regenerate league table for this player
        Logger.log(`🏆 Regenerating predicted league table for ${playerName}...`);
        generatePlayerTableSheet(playerName);

        // Step 4: Update stats sheet for this player
        Logger.log(`📈 Updating player statistics sheet for ${playerName}...`);
        generateSinglePlayerStatsSheet(playerName);

        // Step 5: Update leaderboard (global)
        Logger.log("🏅 Updating leaderboard...");
        updateAdvancedLeaderboard();

        // Step 6: Lock predictions for completed/started matches for this player only
        Logger.log("🔒 Locking played/started matches for this player...");
        lockPlayedOrStartedMatchesForPlayer(gameWeeksSheet, playerSheet);

        // Final summary
        const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
        Logger.log("=".repeat(50));
        Logger.log(`🎉 UPDATE COMPLETE FOR PLAYER: ${playerName}`);
        Logger.log(`⏱️  Total execution time: ${totalTime} seconds`);
        Logger.log("=".repeat(50));
    } catch (error) {
        const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
        Logger.log("=".repeat(50));
        Logger.log(`❌ UPDATE FAILED FOR PLAYER: ${playerName}`);
        Logger.log(`⏱️  Execution time before failure: ${totalTime} seconds`);
        Logger.log(`🚨 Error: ${error.toString()}`);
        Logger.log("=".repeat(50));
        throw error;
    }
}

/**
 * Lock predictions for a single player (helper for per-player update)
 */
function lockPlayedOrStartedMatchesForPlayer(gameWeeksSheet, playerSheet) {
    const LOCK_DESC = "Locked after kickoff/completion";
    const now = new Date();
    const data = gameWeeksSheet.getDataRange().getValues();
    if (data.length <= 1) return;

    // Build lookup: `${gw}||${home}||${away}` -> started:boolean
    const startedLookup = {};
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const gw = row[ADVANCED_CONFIG.MASTER_COLS.GAMEWEEK - 1];
        const home = row[ADVANCED_CONFIG.MASTER_COLS.HOME_TEAM - 1];
        const away = row[ADVANCED_CONFIG.MASTER_COLS.AWAY_TEAM - 1];
        const dateCell = row[ADVANCED_CONFIG.MASTER_COLS.DATE - 1];
        const timeCell = row[ADVANCED_CONFIG.MASTER_COLS.KICKOFF - 1];
        const finishedFlag = row.length > 8 ? (row[8] === true || row[8] === 'TRUE') : false;
        const hasActualScores = typeof row[ADVANCED_CONFIG.MASTER_COLS.ACTUAL_HOME - 1] === 'number' &&
            typeof row[ADVANCED_CONFIG.MASTER_COLS.ACTUAL_AWAY - 1] === 'number';
        let started = !!finishedFlag || hasActualScores;
        if (!started && dateCell) {
            try {
                const dt = buildDateTime(dateCell, timeCell);
                if (dt && dt instanceof Date && !isNaN(dt.getTime())) {
                    started = dt.getTime() <= now.getTime();
                }
            } catch (_) { }
        }
        if (gw && home && away) {
            startedLookup[`${gw}||${home}||${away}`] = started;
        }
    }

    // Remove old protections set by this step
    const protections = playerSheet.getProtections(SpreadsheetApp.ProtectionType.RANGE) || [];
    for (const p of protections) {
        try {
            if (p.getDescription && p.getDescription() === LOCK_DESC) p.remove();
        } catch (_) { }
    }

    const values = playerSheet.getDataRange().getValues();
    const rowsToLock = [];
    for (let r = 2; r <= values.length; r++) {
        const row = values[r - 1];
        const gw = row[ADVANCED_CONFIG.PLAYER_COLS.GAMEWEEK - 1];
        const home = row[ADVANCED_CONFIG.PLAYER_COLS.HOME_TEAM - 1];
        const away = row[ADVANCED_CONFIG.PLAYER_COLS.AWAY_TEAM - 1];
        const isFixture = (typeof gw === 'number' || (typeof gw === 'string' && /^\d+$/.test(gw))) &&
            typeof home === 'string' && home &&
            typeof away === 'string' && away;
        if (!isFixture) continue;
        const key = `${gw}||${home}||${away}`;
        if (startedLookup[key]) rowsToLock.push(r);
    }
    // Helper to group consecutive row numbers
    function group(rows) {
        if (!rows.length) return [];
        rows.sort((a, b) => a - b);
        const out = [];
        let s = rows[0], p = rows[0];
        for (let i = 1; i < rows.length; i++) {
            if (rows[i] === p + 1) {
                p = rows[i];
            } else {
                out.push({ start: s, end: p });
                s = p = rows[i];
            }
        }
        out.push({ start: s, end: p });
        return out;
    }
    for (const { start, end } of group(rowsToLock)) {
        const num = end - start + 1;
        const range = playerSheet.getRange(start, 6, num, 3); // F:G:H
        const prot = range.protect();
        prot.setDescription(LOCK_DESC);
        prot.setWarningOnly(false);
    }
}



/**
 * INITIALIZATION FUNCTIONS
 */

/**
 * Set up the advanced prediction game
 */
function initializeAdvancedGame() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Create required sheets
    createSheetIfNotExists(ADVANCED_CONFIG.SCORING_SHEET);
    createSheetIfNotExists(ADVANCED_CONFIG.LEADERBOARD_SHEET);
    createSheetIfNotExists(ADVANCED_CONFIG.TABLE_PREDICTIONS_SHEET);

    // Set up each sheet
    setupAdvancedScoringSheet();
    setupAdvancedLeaderboard();
    setupTablePredictionsSheet();

    Logger.log("Advanced prediction game initialized!");
}

/**
 * Add a player with advanced features
 */
function addAdvancedPlayer(playerName) {
    const startTime = Date.now();
    Logger.log(`🚀 ADDING NEW PLAYER: ${playerName}`);
    Logger.log("=".repeat(50));

    try {
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        const playerSheetName = ADVANCED_CONFIG.PLAYER_PREFIX + playerName;

        // Check if player already exists
        const existingSheet = ss.getSheetByName(playerSheetName);
        if (existingSheet) {
            Logger.log(`⚠️  Player sheet already exists: ${playerSheetName}`);
            Logger.log("❌ Cannot add duplicate player");
            throw new Error(`Player "${playerName}" already exists!`);
        }

        Logger.log(`📋 Creating player sheet: ${playerSheetName}`);

        // Create player sheet
        const playerSheet = createSheetIfNotExists(playerSheetName);
        Logger.log("✅ Player sheet created");

        // Populate with advanced structure
        Logger.log("📊 Populating player sheet with fixtures and structure...");
        populateAdvancedPlayerSheet(playerSheet, playerName);
        Logger.log("✅ Player sheet populated");

        // Add to table predictions
        Logger.log("🏆 Adding to table predictions...");
        addPlayerToTablePredictions(playerName);
        Logger.log("✅ Added to table predictions");

        // Update leaderboard
        Logger.log("🏅 Updating leaderboard...");
        updateAdvancedLeaderboard();
        Logger.log("✅ Leaderboard updated");

        const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
        Logger.log("=".repeat(50));
        Logger.log(`🎉 PLAYER ADDED SUCCESSFULLY!`);
        Logger.log(`👤 Player: ${playerName}`);
        Logger.log(`📊 Sheet: ${playerSheetName}`);
        Logger.log(`⏱️  Time: ${totalTime} seconds`);
        Logger.log("✅ Ready for predictions!");
        Logger.log("=".repeat(50));

        return playerSheetName;

    } catch (error) {
        const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
        Logger.log("=".repeat(50));
        Logger.log(`❌ FAILED TO ADD PLAYER: ${playerName}`);
        Logger.log(`🚨 Error: ${error.toString()}`);
        Logger.log(`⏱️  Time before failure: ${totalTime} seconds`);
        Logger.log("=".repeat(50));
        throw error;
    }
}

/**
 * Add a new player to an ongoing game (enhanced version with validation)
 */
function addPlayerToOngoingGame(playerName) {
    const startTime = Date.now();
    Logger.log(`🎮 ADDING PLAYER TO ONGOING GAME: ${playerName}`);
    Logger.log("=".repeat(60));

    try {
        // Validate player name
        if (!playerName || typeof playerName !== 'string' || playerName.trim() === '') {
            throw new Error("Player name is required and must be a non-empty string");
        }

        const cleanPlayerName = playerName.trim();
        Logger.log(`👤 Validated player name: "${cleanPlayerName}"`);

        const ss = SpreadsheetApp.getActiveSpreadsheet();

        // Check game status - see what gameweeks have been played
        const gameWeeksSheet = ss.getSheetByName(ADVANCED_CONFIG.MASTER_SHEET);
        if (!gameWeeksSheet) {
            throw new Error("Game Weeks sheet not found! Game may not be initialized.");
        }

        const gameWeeksData = gameWeeksSheet.getDataRange().getValues();
        let maxGameweek = 0;
        let playedMatches = 0;

        for (let i = 1; i < gameWeeksData.length; i++) {
            const row = gameWeeksData[i];
            const gameweek = row[ADVANCED_CONFIG.MASTER_COLS.GAMEWEEK - 1];
            const actualHome = row[ADVANCED_CONFIG.MASTER_COLS.ACTUAL_HOME - 1];
            const actualAway = row[ADVANCED_CONFIG.MASTER_COLS.ACTUAL_AWAY - 1];

            if (gameweek && gameweek > maxGameweek) {
                maxGameweek = gameweek;
            }

            if (typeof actualHome === 'number' && typeof actualAway === 'number') {
                playedMatches++;
            }
        }

        Logger.log(`📊 Game status: ${playedMatches} matches played across ${maxGameweek} gameweeks`);

        // Check existing players
        const allSheets = ss.getSheets();
        const existingPlayers = allSheets
            .filter(sheet => sheet.getName().startsWith(ADVANCED_CONFIG.PLAYER_PREFIX) &&
                !sheet.getName().includes(" - Stats") &&
                !sheet.getName().includes(" - Table"))
            .map(sheet => sheet.getName().replace(ADVANCED_CONFIG.PLAYER_PREFIX, ""));

        Logger.log(`👥 Existing players (${existingPlayers.length}): ${existingPlayers.join(', ')}`);

        if (existingPlayers.includes(cleanPlayerName)) {
            throw new Error(`Player "${cleanPlayerName}" already exists in the game!`);
        }

        // Add the player using the main function
        Logger.log(`➕ Adding player using addAdvancedPlayer function...`);
        const playerSheetName = addAdvancedPlayer(cleanPlayerName);

        // Additional setup for mid-game entry
        if (playedMatches > 0) {
            Logger.log(`⚠️  Mid-game entry detected (${playedMatches} matches already played)`);
            Logger.log("🔄 Recalculating scores for new player sheet...");

            try {
                const newPlayerSheet = ss.getSheetByName(playerSheetName);
                calculatePlayerScores(newPlayerSheet, gameWeeksSheet);
                Logger.log("✅ Scores calculated for existing matches");
            } catch (scoreError) {
                Logger.log(`⚠️  Could not calculate historical scores: ${scoreError.toString()}`);
                Logger.log("ℹ️  Player can start predicting from current gameweek");
            }
        }

        const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
        Logger.log("=".repeat(60));
        Logger.log(`🎉 PLAYER SUCCESSFULLY ADDED TO ONGOING GAME!`);
        Logger.log(`👤 Player: ${cleanPlayerName}`);
        Logger.log(`📊 Sheet: ${playerSheetName}`);
        Logger.log(`🎮 Game Status: ${playedMatches} matches played, GW${maxGameweek} current`);
        Logger.log(`👥 Total Players: ${existingPlayers.length + 1}`);
        Logger.log(`⏱️  Total Time: ${totalTime} seconds`);
        Logger.log("✅ Player can now make predictions!");
        Logger.log("=".repeat(60));

        return {
            success: true,
            playerName: cleanPlayerName,
            playerSheetName: playerSheetName,
            gameStatus: {
                maxGameweek: maxGameweek,
                playedMatches: playedMatches,
                totalPlayers: existingPlayers.length + 1
            }
        };

    } catch (error) {
        const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
        Logger.log("=".repeat(60));
        Logger.log(`❌ FAILED TO ADD PLAYER TO ONGOING GAME`);
        Logger.log(`👤 Attempted Player: ${playerName}`);
        Logger.log(`🚨 Error: ${error.toString()}`);
        Logger.log(`⏱️  Time before failure: ${totalTime} seconds`);
        Logger.log("=".repeat(60));

        return {
            success: false,
            error: error.toString(),
            playerName: playerName
        };
    }
}

/**
 * Generate stats sheets for all existing players (without touching prediction sheets)
 */
function generateAllPlayerStatsSheets() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const startTime = Date.now();

    Logger.log("🔍 Looking for existing player sheets...");

    // Find all existing player sheets
    const allSheets = ss.getSheets();
    const playerSheets = allSheets.filter(sheet =>
        sheet.getName().startsWith(ADVANCED_CONFIG.PLAYER_PREFIX) &&
        !sheet.getName().includes(" - Stats") &&
        !sheet.getName().includes(" - Table")
    );

    if (playerSheets.length === 0) {
        Logger.log("❌ No player prediction sheets found!");
        return;
    }

    Logger.log(`📋 Found ${playerSheets.length} player sheets to process`);

    // Step 1: Delete all existing stats sheets first
    Logger.log("🗑️ Deleting existing stats sheets...");
    const statsSheets = allSheets.filter(sheet =>
        sheet.getName().includes(" - Stats") &&
        sheet.getName().startsWith(ADVANCED_CONFIG.PLAYER_PREFIX)
    );

    let deletedCount = 0;
    for (const statsSheet of statsSheets) {
        try {
            const sheetName = statsSheet.getName();
            ss.deleteSheet(statsSheet);
            Logger.log(`🗑️ Deleted: ${sheetName}`);
            deletedCount++;
        } catch (error) {
            Logger.log(`❌ Error deleting ${statsSheet.getName()}: ${error.toString()}`);
        }
    }

    if (deletedCount > 0) {
        Logger.log(`✅ Deleted ${deletedCount} existing stats sheets`);
    } else {
        Logger.log("ℹ️ No existing stats sheets found to delete");
    }

    // Step 2: Generate fresh stats sheets
    Logger.log("📊 Generating fresh stats sheets...");
    let successCount = 0;
    let errorCount = 0;    // Process each player
    for (const playerSheet of playerSheets) {
        try {
            // Extract player name from sheet name
            const playerName = playerSheet.getName().replace(ADVANCED_CONFIG.PLAYER_PREFIX, "");

            Logger.log(`📊 Creating stats sheet for ${playerName}...`);

            // Generate the stats sheet
            createPlayerSummarySheet(playerName);

            successCount++;
            Logger.log(`✅ Stats sheet created for ${playerName}`);

        } catch (error) {
            errorCount++;
            const playerName = playerSheet.getName().replace(ADVANCED_CONFIG.PLAYER_PREFIX, "");
            Logger.log(`❌ Error creating stats sheet for ${playerName}: ${error.toString()}`);
        }
    }

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    Logger.log(`🎉 Stats sheet regeneration complete!`);
    Logger.log(`🗑️ Deleted: ${deletedCount} old stats sheets`);
    Logger.log(`� Successfully created: ${successCount} new stats sheets`);
    if (errorCount > 0) {
        Logger.log(`⚠️ Errors encountered: ${errorCount} failed`);
    }
    Logger.log(`⏱️ Total time: ${totalTime} seconds`);
}

/**
 * Generate stats sheet for a specific player only
 */
function generateSinglePlayerStatsSheet(playerName) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const startTime = Date.now();

    Logger.log(`🔍 Looking for player sheet: ${playerName}...`);

    // Check if the player prediction sheet exists
    const predictionSheetName = ADVANCED_CONFIG.PLAYER_PREFIX + playerName;
    const predictionSheet = ss.getSheetByName(predictionSheetName);

    if (!predictionSheet) {
        Logger.log(`❌ Player prediction sheet not found: ${predictionSheetName}`);
        Logger.log(`Available sheets: ${ss.getSheets().map(s => s.getName()).join(', ')}`);
        return;
    }

    try {
        Logger.log(`📊 Creating stats sheet for ${playerName}...`);

        // Generate the stats sheet
        createPlayerSummarySheet(playerName);

        const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
        Logger.log(`✅ Stats sheet created successfully for ${playerName} in ${totalTime}s`);

    } catch (error) {
        Logger.log(`❌ Error creating stats sheet for ${playerName}: ${error.toString()}`);
    }
}

/**
 * PLAYER SHEET SETUP
 */

/**
 * Create advanced player sheet with captain selection and chip tracking
 */
function populateAdvancedPlayerSheet(playerSheet, playerName) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const masterSheet = ss.getSheetByName(ADVANCED_CONFIG.MASTER_SHEET);

    if (!masterSheet) {
        throw new Error("Master sheet not found!");
    }

    playerSheet.clear();

    // Set up headers
    const headers = [
        "Gameweek", "Home Team", "Away Team", "Date", "Kickoff",
        "Home Pred", "Away Pred", "Captain?", "Match Points", "Breakdown"
    ];

    playerSheet.getRange(1, 1, 1, headers.length).setValues([headers]);

    // Style headers
    const headerRange = playerSheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground("#1e3a8a");
    headerRange.setFontColor("white");
    headerRange.setFontWeight("bold");

    // Get fixtures from master sheet
    const masterData = masterSheet.getDataRange().getValues();
    const fixtures = masterData.slice(1); // Skip header

    // Prepare all data for batch processing
    const checkboxCells = [];
    const predictionBackgrounds = [];
    const captainBackgrounds = [];

    // Build the sheet sequentially, processing each gameweek completely
    let currentRow = 2;
    let currentGameweek = null;
    let gameweekStartRow = null;
    let masterRowIndex = 2; // Start from row 2 in master sheet (after header)

    const allSheetRows = []; // Store all rows in order for batch writing

    for (const fixture of fixtures) {
        const gameweek = fixture[ADVANCED_CONFIG.MASTER_COLS.GAMEWEEK - 1];

        // Handle gameweek transitions
        if (gameweek !== currentGameweek) {
            // If we just finished a gameweek, add its summary and chip rows
            if (currentGameweek !== null) {
                const gameweekEndRow = currentRow - 1;

                // Add summary row
                const summaryRow = [
                    `GW${currentGameweek} TOTAL:`,
                    "", "", "", "",
                    "", "", "",
                    `=SUM(I${gameweekStartRow}:I${gameweekEndRow})`,
                    "Captain + Bonuses"
                ];
                allSheetRows.push({
                    row: currentRow,
                    data: summaryRow,
                    type: 'summary',
                    gameweek: currentGameweek
                });
                currentRow++;

                // Add bonus row
                const bonusRow = [
                    `GW${currentGameweek} Goals Bonus:`,
                    "", "", "", "",
                    "", "", "",
                    0,
                    "5pts if total goals correct"
                ];
                allSheetRows.push({
                    row: currentRow,
                    data: bonusRow,
                    type: 'bonus',
                    gameweek: currentGameweek
                });
                currentRow++;

                // Add blank row
                allSheetRows.push({
                    row: currentRow,
                    data: ["", "", "", "", "", "", "", "", "", ""],
                    type: 'blank'
                });
                currentRow++;

                // Add chip selection row
                const chipRow = [
                    "Chip Used:",
                    "☐ Triple Captain",
                    "",
                    "☐ All Captain",
                    "",
                    "", "", "", "", ""
                ];
                allSheetRows.push({
                    row: currentRow,
                    data: chipRow,
                    type: 'chip',
                    gameweek: currentGameweek
                });
                currentRow++;

                // Add blank row after chip
                allSheetRows.push({
                    row: currentRow,
                    data: ["", "", "", "", "", "", "", "", "", ""],
                    type: 'blank'
                });
                currentRow++;
            }

            // Add gameweek header
            const headerRow = [`--- GAMEWEEK ${gameweek} ---`, "", "", "", "", "", "", "", "", ""];
            allSheetRows.push({
                row: currentRow,
                data: headerRow,
                type: 'header',
                gameweek: gameweek
            });
            currentRow++;

            currentGameweek = gameweek;
            gameweekStartRow = currentRow;
        }

        // Add fixture row
        const fixtureRow = [
            `='${ADVANCED_CONFIG.MASTER_SHEET}'!A${masterRowIndex}`,
            `='${ADVANCED_CONFIG.MASTER_SHEET}'!B${masterRowIndex}`,
            `='${ADVANCED_CONFIG.MASTER_SHEET}'!C${masterRowIndex}`,
            `='${ADVANCED_CONFIG.MASTER_SHEET}'!D${masterRowIndex}`,
            `='${ADVANCED_CONFIG.MASTER_SHEET}'!E${masterRowIndex}`,
            "",
            "",
            "",
            "",
            ""
        ];

        allSheetRows.push({
            row: currentRow,
            data: fixtureRow,
            type: 'fixture',
            homeTeam: fixture[ADVANCED_CONFIG.MASTER_COLS.HOME_TEAM - 1],
            awayTeam: fixture[ADVANCED_CONFIG.MASTER_COLS.AWAY_TEAM - 1],
            matchPrediction: fixture[ADVANCED_CONFIG.MASTER_COLS.MATCH_PREDICTION - 1] || ""
        });

        // Only add checkboxes and styling for actual fixture rows
        checkboxCells.push(currentRow);
        predictionBackgrounds.push(currentRow);
        captainBackgrounds.push(currentRow);

        currentRow++;
        masterRowIndex++;
    }

    // Add final gameweek summary if we ended on a gameweek
    if (currentGameweek !== null) {
        const gameweekEndRow = currentRow - 1;

        // Add summary row
        const summaryRow = [
            `GW${currentGameweek} TOTAL:`,
            "", "", "", "",
            "", "", "",
            `=SUM(I${gameweekStartRow}:I${gameweekEndRow})`,
            "Captain + Bonuses"
        ];
        allSheetRows.push({
            row: currentRow,
            data: summaryRow,
            type: 'summary',
            gameweek: currentGameweek
        });
        currentRow++;

        // Add bonus row
        const bonusRow = [
            `GW${currentGameweek} Goals Bonus:`,
            "", "", "", "",
            "", "", "",
            0,
            "5pts if total goals correct"
        ];
        allSheetRows.push({
            row: currentRow,
            data: bonusRow,
            type: 'bonus',
            gameweek: currentGameweek
        });
        currentRow++;

        // Add blank row
        allSheetRows.push({
            row: currentRow,
            data: ["", "", "", "", "", "", "", "", "", ""],
            type: 'blank'
        });
        currentRow++;

        // Add chip selection row
        const chipRow = [
            "Chip Used:",
            "☐ Triple Captain",
            "",
            "☐ All Captain",
            "",
            "", "", "", "", ""
        ];
        allSheetRows.push({
            row: currentRow,
            data: chipRow,
            type: 'chip',
            gameweek: currentGameweek
        });
        currentRow++;
    }

    // Batch write all data in the correct order
    for (const rowData of allSheetRows) {
        // Write the data
        playerSheet.getRange(rowData.row, 1, 1, rowData.data.length).setValues([rowData.data]);

        // Apply type-specific formatting and functionality
        switch (rowData.type) {
            case 'header':
                playerSheet.getRange(rowData.row, 1, 1, headers.length).setBackground("#fef3c7");
                break;

            case 'fixture':
                // Apply favorite coloring immediately since we have the correct row number
                colorFavoriteTeams(playerSheet, rowData.row, rowData.matchPrediction,
                    rowData.homeTeam, rowData.awayTeam);
                break;

            case 'summary':
                playerSheet.getRange(rowData.row, 1, 1, rowData.data.length).setBackground("#e5e7eb");
                playerSheet.getRange(rowData.row, 1, 1, 1).setFontWeight("bold");
                break;

            case 'bonus':
                playerSheet.getRange(rowData.row, 1, 1, rowData.data.length).setBackground("#f3f4f6");
                playerSheet.getRange(rowData.row, 1, 1, 1).setFontWeight("bold");
                break;

            case 'chip':
                // Add chip checkboxes
                playerSheet.getRange(rowData.row, 3).insertCheckboxes(); // Triple Captain checkbox
                playerSheet.getRange(rowData.row, 5).insertCheckboxes(); // All Captain checkbox

                // Style the chip row
                playerSheet.getRange(rowData.row, 1, 1, 5).setBackground("#fecaca");
                playerSheet.getRange(rowData.row, 1, 1, 1).setFontWeight("bold");
                break;
        }
    }    // 2. Batch insert all captain checkboxes in the most efficient way possible
    if (checkboxCells.length > 0) {
        // Try to create all checkboxes in one operation if they form a contiguous range
        const firstRow = Math.min(...checkboxCells);
        const lastRow = Math.max(...checkboxCells);
        const expectedLength = lastRow - firstRow + 1;

        // Check if all rows between first and last are included (contiguous)
        const isContiguous = checkboxCells.length === expectedLength &&
            checkboxCells.every((row, index) => row === firstRow + index);

        if (isContiguous) {
            // All checkboxes are in consecutive rows - create them all at once
            playerSheet.getRange(firstRow, 8, checkboxCells.length, 1).insertCheckboxes();
        } else {
            // Some gaps exist - group consecutive ranges
            let currentGroup = [checkboxCells[0]];

            for (let i = 1; i < checkboxCells.length; i++) {
                if (checkboxCells[i] === currentGroup[currentGroup.length - 1] + 1) {
                    currentGroup.push(checkboxCells[i]);
                } else {
                    // Insert checkboxes for current consecutive group
                    if (currentGroup.length > 0) {
                        const startRow = currentGroup[0];
                        const numRows = currentGroup.length;
                        playerSheet.getRange(startRow, 8, numRows, 1).insertCheckboxes();
                    }
                    currentGroup = [checkboxCells[i]];
                }
            }

            // Insert checkboxes for final group
            if (currentGroup.length > 0) {
                const startRow = currentGroup[0];
                const numRows = currentGroup.length;
                playerSheet.getRange(startRow, 8, numRows, 1).insertCheckboxes();
            }
        }
    }

    // 3. Batch apply styling more efficiently
    if (predictionBackgrounds.length > 0) {
        // Group consecutive prediction background rows
        let currentGroup = [predictionBackgrounds[0]];

        for (let i = 1; i < predictionBackgrounds.length; i++) {
            if (predictionBackgrounds[i] === currentGroup[currentGroup.length - 1] + 1) {
                currentGroup.push(predictionBackgrounds[i]);
            } else {
                // Apply background to current group
                if (currentGroup.length > 0) {
                    playerSheet.getRange(currentGroup[0], 6, currentGroup.length, 2).setBackground("#dcfce7");
                }
                currentGroup = [predictionBackgrounds[i]];
            }
        }

        // Apply final group
        if (currentGroup.length > 0) {
            playerSheet.getRange(currentGroup[0], 6, currentGroup.length, 2).setBackground("#dcfce7");
        }
    }

    if (captainBackgrounds.length > 0) {
        // Group consecutive captain background rows
        let currentGroup = [captainBackgrounds[0]];

        for (let i = 1; i < captainBackgrounds.length; i++) {
            if (captainBackgrounds[i] === currentGroup[currentGroup.length - 1] + 1) {
                currentGroup.push(captainBackgrounds[i]);
            } else {
                // Apply background to current group
                if (currentGroup.length > 0) {
                    playerSheet.getRange(currentGroup[0], 8, currentGroup.length, 1).setBackground("#fef3c7");
                }
                currentGroup = [captainBackgrounds[i]];
            }
        }

        // Apply final group
        if (currentGroup.length > 0) {
            playerSheet.getRange(currentGroup[0], 8, currentGroup.length, 1).setBackground("#fef3c7");
        }
    }

    // 5. Create separate summary/stats sheet for this player
    createPlayerSummarySheet(playerName);

    // 6. Add instructions
    addAdvancedInstructions(playerSheet, currentRow + 10, playerName);

    // 7. Protect non-editable areas
    protectAdvancedPlayerSheet(playerSheet);
}

/**
 * Color favorite teams based on prediction strength
 */
function colorFavoriteTeams(playerSheet, row, matchPrediction, homeTeam, awayTeam) {
    const { favoriteTeam, strength } = parsePrediction(matchPrediction);

    if (!favoriteTeam) return;

    // Define colors for different favorite strengths
    let favoriteColor, favoriteTextColor;
    switch (strength) {
        case 'Strong Favorites':
            favoriteColor = "#dc2626"; // Strong red
            favoriteTextColor = "white";
            break;
        case 'Favorites':
            favoriteColor = "#f97316"; // Medium orange
            favoriteTextColor = "white";
            break;
        case 'Slight Favorites':
            favoriteColor = "#fbbf24"; // Light yellow/orange
            favoriteTextColor = "black";
            break;
        default:
            return; // No coloring for even matches
    }

    // Color the favorite team cell
    if (favoriteTeam === homeTeam) {
        // Home team is favorite - color column B (index 2)
        const homeCell = playerSheet.getRange(row, 2);
        homeCell.setBackground(favoriteColor);
        homeCell.setFontColor(favoriteTextColor);
        homeCell.setFontWeight("bold");
    } else if (favoriteTeam === awayTeam) {
        // Away team is favorite - color column C (index 3)
        const awayCell = playerSheet.getRange(row, 3);
        awayCell.setBackground(favoriteColor);
        awayCell.setFontColor(favoriteTextColor);
        awayCell.setFontWeight("bold");
    }
}

/**
 * Add gameweek summary row with automatic calculations
 */
function addGameweekSummaryRow(playerSheet, row, gameweek, startRow, endRow) {
    const summaryRow = [
        `GW${gameweek} TOTAL:`,
        "", "", "", "",
        "", "", "",
        `=SUM(I${startRow}:I${endRow})`, // Sum points for this gameweek's matches
        "Captain + Bonuses"
    ];

    playerSheet.getRange(row, 1, 1, summaryRow.length).setValues([summaryRow]);
    playerSheet.getRange(row, 1, 1, summaryRow.length).setBackground("#e5e7eb");
    playerSheet.getRange(row, 1, 1, 1).setFontWeight("bold");

    // Add weekly goals bonus row
    const bonusRow = [
        `GW${gameweek} Goals Bonus:`,
        "", "", "", "",
        "", "", "",
        0, // Will be updated by calculateWeeklyBonuses
        "5pts if total goals correct"
    ];

    playerSheet.getRange(row + 1, 1, 1, bonusRow.length).setValues([bonusRow]);
    playerSheet.getRange(row + 1, 1, 1, bonusRow.length).setBackground("#f3f4f6");
    playerSheet.getRange(row + 1, 1, 1, 1).setFontWeight("bold");
}

/**
 * Add chip selection row for gameweek
 */
function addChipSelectionRow(playerSheet, row, gameweek) {
    // Set up the chip selection row with clear labels and separate checkbox columns
    const chipRow = [
        "Chip Used:",                    // A: Label
        "☐ Triple Captain",             // B: Triple Captain label  
        "",                             // C: Triple Captain checkbox
        "☐ All Captain",                // D: All Captain label
        "",                             // E: All Captain checkbox
        "", "", "", "", ""              // F-J: Empty columns
    ];

    playerSheet.getRange(row, 1, 1, chipRow.length).setValues([chipRow]);

    // Add both checkboxes in a single operation using separate ranges
    const checkboxRanges = [
        playerSheet.getRange(row, 3), // Triple Captain checkbox in column C
        playerSheet.getRange(row, 5)  // All Captain checkbox in column E
    ];

    // Insert checkboxes for both ranges
    for (const range of checkboxRanges) {
        range.insertCheckboxes();
    }

    // Style the entire row
    playerSheet.getRange(row, 1, 1, 5).setBackground("#fecaca");
    playerSheet.getRange(row, 1, 1, 1).setFontWeight("bold"); // Bold the "Chip Used:" label
}

/**
 * Add season summary section
 */
function addSeasonSummarySection(playerSheet, startRow, playerName) {
    const summaryData = [
        [`--- ${playerName.toUpperCase()} SEASON SUMMARY ---`, ""],
        ["", ""],
        ["Total Points:", "=SUM(all gameweek totals)"],
        ["Gameweeks Played:", "=COUNT(gameweek totals)"],
        ["Average Per Week:", "=Total/Played"],
        ["Exact Scores:", "=COUNTIF(breakdown, '*Exact*')"],
        ["Correct Results:", "=COUNTIF(breakdown, '*Result*')"],
        ["Captain Bonus Points:", "=SUM(captain bonuses)"],
        ["Chips Used:", "Triple: [ ] All: [ ]"],
        ["Table Accuracy Bonus:", "(Calculated at season end)"],
        ["FINAL SCORE:", "=Total + Table Bonus"]
    ];

    playerSheet.getRange(startRow, 1, summaryData.length, 2).setValues(summaryData);

    // Style summary section
    playerSheet.getRange(startRow, 1, 1, 2).setBackground("#1e3a8a");
    playerSheet.getRange(startRow, 1, 1, 2).setFontColor("white");
    playerSheet.getRange(startRow, 1, 1, 2).setFontWeight("bold");
}

/**
 * Create a separate summary/stats sheet for a player
 */
function createPlayerSummarySheet(playerName) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const summarySheetName = `${ADVANCED_CONFIG.PLAYER_PREFIX}${playerName} - Stats`;
    const predictionSheetName = `${ADVANCED_CONFIG.PLAYER_PREFIX}${playerName}`;

    // Create or get the summary sheet
    let summarySheet = ss.getSheetByName(summarySheetName);
    if (!summarySheet) {
        summarySheet = ss.insertSheet(summarySheetName);
    } else {
        summarySheet.clear();
    }

    // Set up the comprehensive stats sheet
    const statsData = [
        // Header Section
        [`${playerName.toUpperCase()} - SEASON STATISTICS`, "", "", ""],
        ["Generated:", `=NOW()`, "", ""],
        ["", "", "", ""],

        // Overall Season Summary
        ["SEASON OVERVIEW", "", "", ""],
        ["Total Points:", `=SUMIF('${predictionSheetName}'!A:A, "*TOTAL*", '${predictionSheetName}'!I:I)`, "", ""],
        ["Gameweeks Played:", `=COUNTIFS('${predictionSheetName}'!A:A, "*TOTAL*", '${predictionSheetName}'!I:I, ">0")`, "", ""],
        ["Average Points Per Week:", `=IF(B6>0, B5/B6, 0)`, "", ""],
        ["Current Position:", "(Updated by leaderboard)", "", ""],
        ["", "", "", ""],

        // Prediction Accuracy
        ["PREDICTION ACCURACY", "", "", ""],
        ["Exact Score Predictions:", `=COUNTIF('${predictionSheetName}'!J:J, "*Exact*")`, "", ""],
        ["Correct Result Predictions:", `=COUNTIF('${predictionSheetName}'!J:J, "*Result*")`, "", ""],
        ["Total Predictions Made:", `=SUMPRODUCT((ISNUMBER('${predictionSheetName}'!F:F))*(ISNUMBER('${predictionSheetName}'!G:G)))`, "", ""],
        ["Exact Score Accuracy:", "=IF(B13>0, B11/B13*100, 0)", "% accuracy", ""],
        ["Result Accuracy:", "=IF(B13>0, (B11+B12)/B13*100, 0)", "% accuracy", ""],
        ["", "", "", ""],

        // Captain Performance
        ["CAPTAIN PERFORMANCE", "", "", ""],
        ["Total Captain Picks:", `=COUNTIF('${predictionSheetName}'!H:H, TRUE)`, "", ""],
        ["Successful Captain Picks:", `=SUMPRODUCT(('${predictionSheetName}'!H:H=TRUE)*(ISNUMBER('${predictionSheetName}'!I:I))*(IF(ISNUMBER('${predictionSheetName}'!I:I), '${predictionSheetName}'!I:I, 0)>0))`, "", ""],
        ["Captain Success Rate:", "=IF(B18>0, B19/B18*100, 0)", "% success", ""],
        ["Average Points Per Captain:", `=IF(B18>0, SUMPRODUCT(('${predictionSheetName}'!H:H=TRUE)*(ISNUMBER('${predictionSheetName}'!I:I))*(IF(ISNUMBER('${predictionSheetName}'!I:I), '${predictionSheetName}'!I:I, 0)))/B18, 0)`, "", ""],
        ["", "", "", ""],

        // Bonus Tracking
        ["BONUS POINTS", "", "", ""],
        ["Weekly Goals Bonuses:", `=COUNTIF('${predictionSheetName}'!A:A, "*Goals Bonus*")`, "", ""],
        ["Goals Bonus Points:", `=SUMPRODUCT((ISNUMBER(SEARCH("Goals Bonus", '${predictionSheetName}'!A:A)))*(ISNUMBER('${predictionSheetName}'!I:I))*(IF(ISNUMBER('${predictionSheetName}'!I:I), '${predictionSheetName}'!I:I, 0)))`, "", ""],
        ["Upset Bonus Points:", `=SUMIF('${predictionSheetName}'!J:J, "*Upset*", '${predictionSheetName}'!I:I)`, "", ""],
        ["Table Prediction Bonus:", "(Calculated at season end)", "", ""],
        ["Total Bonus Points:", "=B24+B25+B26", "", ""],
        ["", "", "", ""],

        // Chip Usage
        ["CHIP USAGE", "", "", ""],
        ["Triple Captain Used:", `=IF(COUNTIF('${predictionSheetName}'!C:C, TRUE)>0, "YES", "NO")`, "", ""],
        ["All Captain Used:", `=IF(COUNTIF('${predictionSheetName}'!E:E, TRUE)>0, "YES", "NO")`, "", ""],
        ["Triple Captain GW:", `=IF(B30="YES", INDEX('${predictionSheetName}'!A:A, MATCH(TRUE, '${predictionSheetName}'!C:C, 0)), "Not Used")`, "", ""],
        ["All Captain GW:", `=IF(B31="YES", INDEX('${predictionSheetName}'!A:A, MATCH(TRUE, '${predictionSheetName}'!E:E, 0)), "Not Used")`, "", ""],
        ["", "", "", ""],

        // Gameweek Breakdown
        ["GAMEWEEK BREAKDOWN", "", "", ""],
        ["Best Gameweek:", `=MAX(FILTER('${predictionSheetName}'!I:I, ISNUMBER(SEARCH("TOTAL", '${predictionSheetName}'!A:A))))`, "points", ""],
        ["Worst Gameweek:", `=MIN(FILTER('${predictionSheetName}'!I:I, ISNUMBER(SEARCH("TOTAL", '${predictionSheetName}'!A:A)), '${predictionSheetName}'!I:I>0))`, "points", ""],
        ["Most Consistent GWs:", `=STDEV(FILTER('${predictionSheetName}'!I:I, ISNUMBER(SEARCH("TOTAL", '${predictionSheetName}'!A:A))))`, "std dev", ""],
        ["", "", "", ""],

        // Team Performance Analysis
        ["FAVORITE TEAMS ANALYSIS", "", "", ""],
        ["Strong Favorites Backed:", `=COUNTIF('${predictionSheetName}'!J:J, "*Strong Fav*")`, "", ""],
        ["Strong Favorites Correct:", `=COUNTIFS('${predictionSheetName}'!J:J, "*Strong Fav*", '${predictionSheetName}'!I:I, ">0")`, "", ""],
        ["Slight Favorites Backed:", `=COUNTIF('${predictionSheetName}'!J:J, "*Slight Fav*")`, "", ""],
        ["Slight Favorites Correct:", `=COUNTIFS('${predictionSheetName}'!J:J, "*Slight Fav*", '${predictionSheetName}'!I:I, ">0")`, "", ""],
        ["", "", "", ""],

        // Recent Form (Last 5 GWs)
        ["RECENT FORM (LAST 5 GWs)", "", "", ""],
        ["Recent Average:", `=LET(r, FILTER('${predictionSheetName}'!I:I, ISNUMBER(SEARCH("TOTAL", '${predictionSheetName}'!A:A)), '${predictionSheetName}'!I:I>0), IF(ROWS(r)>=5, AVERAGE(TAKE(r, -5)), IF(ROWS(r)>0, AVERAGE(r), 0)))`, "", ""],
        ["Recent vs Season Average:", "=B45-B7", "point difference", ""],
        ["Form Trend:", `=IF(B46>0, "Improving", IF(B46<0, "Declining", "Stable"))`, "", ""],
    ];

    // Write all data at once
    summarySheet.getRange(1, 1, statsData.length, 4).setValues(statsData);

    // Apply formatting
    applyStatsSheetFormatting(summarySheet, playerName);

    Logger.log(`✅ Created summary sheet for ${playerName}: ${summarySheetName}`);
}

/**
 * Apply formatting to the stats sheet
 */
function applyStatsSheetFormatting(summarySheet, playerName) {
    // Header formatting
    summarySheet.getRange(1, 1, 1, 4).setBackground("#1e3a8a");
    summarySheet.getRange(1, 1, 1, 4).setFontColor("white");
    summarySheet.getRange(1, 1, 1, 4).setFontWeight("bold");
    summarySheet.getRange(1, 1, 1, 4).setFontSize(14);

    // Section headers (no longer have === but still styled as section headers)
    const sectionRows = [4, 10, 17, 23, 29, 34, 39, 44];
    for (const row of sectionRows) {
        summarySheet.getRange(row, 1, 1, 4).setBackground("#374151");
        summarySheet.getRange(row, 1, 1, 4).setFontColor("white");
        summarySheet.getRange(row, 1, 1, 4).setFontWeight("bold");
    }

    // Key metrics highlighting
    const keyMetricRows = [5, 7, 14, 15, 20, 27]; // Total points, average, accuracy rates, etc.
    for (const row of keyMetricRows) {
        summarySheet.getRange(row, 2, 1, 1).setBackground("#dcfce7"); // Light green
        summarySheet.getRange(row, 2, 1, 1).setFontWeight("bold");
    }

    // Column widths
    summarySheet.setColumnWidth(1, 250); // Labels
    summarySheet.setColumnWidth(2, 150); // Values  
    summarySheet.setColumnWidth(3, 100); // Units
    summarySheet.setColumnWidth(4, 100); // Extra space

    // Freeze the first row
    summarySheet.setFrozenRows(1);
}

/**
 * SCORING CALCULATIONS
 */

/**
 * Calculate points for a single match with advanced scoring
 */
function calculateAdvancedMatchPoints(
    predHome, predAway, actualHome, actualAway,
    homeTeam, awayTeam, matchPrediction, isCaptain = false, chipMultiplier = 1
) {
    let points = 0;
    let breakdown = [];

    // Core scoring
    if (predHome === actualHome && predAway === actualAway) {
        points += ADVANCED_CONFIG.POINTS.EXACT_SCORE;
        breakdown.push(`Exact: ${ADVANCED_CONFIG.POINTS.EXACT_SCORE}`);
    } else if (getResult(predHome, predAway) === getResult(actualHome, actualAway)) {
        points += ADVANCED_CONFIG.POINTS.CORRECT_RESULT;
        breakdown.push(`Result: ${ADVANCED_CONFIG.POINTS.CORRECT_RESULT}`);
    }

    // Goal difference bonus (excluding draws)
    const actualGD = actualHome - actualAway;
    const predGD = predHome - predAway;
    if (actualGD !== 0 && predGD === actualGD) {
        points += ADVANCED_CONFIG.POINTS.CORRECT_GOAL_DIFF;
        breakdown.push(`GD: ${ADVANCED_CONFIG.POINTS.CORRECT_GOAL_DIFF}`);
    }

    // Upset bonus
    const upsetBonus = calculateUpsetBonus(
        predHome, predAway, actualHome, actualAway,
        homeTeam, awayTeam, matchPrediction
    );
    if (upsetBonus > 0) {
        points += upsetBonus;
        breakdown.push(`Upset: ${upsetBonus}`);
    }

    // Apply multipliers
    let multiplier = 1;
    if (isCaptain) multiplier *= ADVANCED_CONFIG.CAPTAIN_MULTIPLIER;
    multiplier *= chipMultiplier;

    if (multiplier > 1) {
        breakdown.push(`x${multiplier}`);
    }

    const finalPoints = points * multiplier;

    return {
        points: finalPoints,
        breakdown: breakdown.join(", ")
    };
}

/**
 * Calculate upset bonus based on favorite predictions
 */
function calculateUpsetBonus(predHome, predAway, actualHome, actualAway, homeTeam, awayTeam, matchPrediction) {
    const { favoriteTeam, strength } = parsePrediction(matchPrediction);

    if (!favoriteTeam) return 0;

    const predResult = getResult(predHome, predAway);
    const actualResult = getResult(actualHome, actualAway);

    // Check if player predicted underdog to win and they did
    let isUpsetPrediction = false;
    let isDrawUpsetPrediction = false;

    if (favoriteTeam === homeTeam && predResult === 'A' && actualResult === 'A') {
        isUpsetPrediction = true; // Predicted away (underdog) to win
    } else if (favoriteTeam === awayTeam && predResult === 'H' && actualResult === 'H') {
        isUpsetPrediction = true; // Predicted home (underdog) to win
    } else if (predResult === 'D' && actualResult === 'D') {
        // Predicted draw and it was a draw - upset because draw goes against favorite
        isDrawUpsetPrediction = true;
    }

    if (isUpsetPrediction) {
        // Full upset bonus for predicting underdog to win
        switch (strength) {
            case 'Strong Favorites': return ADVANCED_CONFIG.POINTS.UPSET_STRONG;
            case 'Favorites': return ADVANCED_CONFIG.POINTS.UPSET_FAVORITE;
            case 'Slight Favorites': return ADVANCED_CONFIG.POINTS.UPSET_SLIGHT;
        }
    } else if (isDrawUpsetPrediction) {
        // Half upset bonus for predicting draw (going against favorite)
        switch (strength) {
            case 'Strong Favorites': return Math.floor(ADVANCED_CONFIG.POINTS.UPSET_STRONG / 2);
            case 'Favorites': return Math.floor(ADVANCED_CONFIG.POINTS.UPSET_FAVORITE / 2);
            case 'Slight Favorites': return Math.floor(ADVANCED_CONFIG.POINTS.UPSET_SLIGHT / 2);
        }
    }

    return 0;
}

/**
 * Parse match prediction to extract favorite and strength
 */
function parsePrediction(matchPrediction) {
    if (matchPrediction.includes('Strong Favorites')) {
        return {
            favoriteTeam: matchPrediction.replace(' Strong Favorites', ''),
            strength: 'Strong Favorites'
        };
    } else if (matchPrediction.includes('Favorites') && !matchPrediction.includes('Slight')) {
        return {
            favoriteTeam: matchPrediction.replace(' Favorites', ''),
            strength: 'Favorites'
        };
    } else if (matchPrediction.includes('Slight Favorites')) {
        return {
            favoriteTeam: matchPrediction.replace(' Slight Favorites', ''),
            strength: 'Slight Favorites'
        };
    }

    return { favoriteTeam: null, strength: 'Even Match' };
}

/**
 * Calculate weekly goals bonus
 */
function calculateWeeklyGoalsBonus(playerSheet, gameweek) {
    // Get all predictions from player sheet and actuals from Game Weeks sheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const gameWeeksSheet = ss.getSheetByName(ADVANCED_CONFIG.MASTER_SHEET);

    if (!gameWeeksSheet) {
        Logger.log("Game Weeks sheet not found for weekly bonus calculation");
        return 0;
    }

    const playerData = playerSheet.getDataRange().getValues();
    const gameWeeksData = gameWeeksSheet.getDataRange().getValues();

    // Create lookup for actual results
    const actualResults = {};
    for (let i = 1; i < gameWeeksData.length; i++) {
        const row = gameWeeksData[i];
        if (row[0] === gameweek) {
            const homeTeam = row[1];
            const awayTeam = row[2];
            const actualHome = row[6];
            const actualAway = row[7];

            if (homeTeam && awayTeam && typeof actualHome === 'number' && typeof actualAway === 'number') {
                const matchKey = `${homeTeam}-${awayTeam}`;
                actualResults[matchKey] = { actualHome, actualAway };
            }
        }
    }

    let predTotal = 0;
    let actualTotal = 0;
    let matchCount = 0;

    // Get player predictions for this gameweek
    for (let i = 1; i < playerData.length; i++) {
        const row = playerData[i];
        const gw = row[ADVANCED_CONFIG.PLAYER_COLS.GAMEWEEK - 1];

        if (gw === gameweek) {
            const homeTeam = row[ADVANCED_CONFIG.PLAYER_COLS.HOME_TEAM - 1];
            const awayTeam = row[ADVANCED_CONFIG.PLAYER_COLS.AWAY_TEAM - 1];
            const predHome = row[ADVANCED_CONFIG.PLAYER_COLS.HOME_PRED - 1];
            const predAway = row[ADVANCED_CONFIG.PLAYER_COLS.AWAY_PRED - 1];

            if (typeof predHome === 'number' && typeof predAway === 'number') {
                predTotal += predHome + predAway;
                matchCount++;

                // Get actual result for this match
                const matchKey = `${homeTeam}-${awayTeam}`;
                const actualResult = actualResults[matchKey];
                if (actualResult) {
                    actualTotal += actualResult.actualHome + actualResult.actualAway;
                }
            }
        }
    }

    // Award bonus if predicted total matches actual total and player made predictions
    const bonus = (predTotal === actualTotal && matchCount > 0 && actualTotal > 0) ? ADVANCED_CONFIG.POINTS.WEEKLY_GOALS : 0;

    return {
        bonus: bonus,
        predTotal: predTotal,
        actualTotal: actualTotal,
        matchCount: matchCount
    };
}

/**
 * TABLE PREDICTION FUNCTIONS
 */

/**
 * Generate league table from player predictions
 */
function generateTableFromPredictions(playerName) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const playerSheet = ss.getSheetByName(ADVANCED_CONFIG.PLAYER_PREFIX + playerName);

    if (!playerSheet) return null;

    const teams = {};
    const data = playerSheet.getDataRange().getValues();

    // Get current Premier League teams from FPL API
    const teamNames = getCurrentPremierLeagueTeams();

    teamNames.forEach(team => {
        teams[team] = {
            team: team,
            played: 0, won: 0, drawn: 0, lost: 0,
            goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0
        };
    });

    // Process matches
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const homeTeam = row[ADVANCED_CONFIG.PLAYER_COLS.HOME_TEAM - 1];
        const awayTeam = row[ADVANCED_CONFIG.PLAYER_COLS.AWAY_TEAM - 1];
        const homeScore = row[ADVANCED_CONFIG.PLAYER_COLS.HOME_PRED - 1];
        const awayScore = row[ADVANCED_CONFIG.PLAYER_COLS.AWAY_PRED - 1];

        if (teams[homeTeam] && teams[awayTeam] &&
            typeof homeScore === 'number' && typeof awayScore === 'number') {

            // Update stats
            teams[homeTeam].played++;
            teams[awayTeam].played++;
            teams[homeTeam].goalsFor += homeScore;
            teams[homeTeam].goalsAgainst += awayScore;
            teams[awayTeam].goalsFor += awayScore;
            teams[awayTeam].goalsAgainst += homeScore;

            // Determine result
            if (homeScore > awayScore) {
                teams[homeTeam].won++;
                teams[homeTeam].points += 3;
                teams[awayTeam].lost++;
            } else if (awayScore > homeScore) {
                teams[awayTeam].won++;
                teams[awayTeam].points += 3;
                teams[homeTeam].lost++;
            } else {
                teams[homeTeam].drawn++;
                teams[awayTeam].drawn++;
                teams[homeTeam].points++;
                teams[awayTeam].points++;
            }
        }
    }

    // Calculate goal difference and sort
    const sortedTeams = Object.values(teams)
        .map(team => {
            team.goalDifference = team.goalsFor - team.goalsAgainst;
            return team;
        })
        .sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
            return b.goalsFor - a.goalsFor;
        });

    // Add positions
    sortedTeams.forEach((team, index) => {
        team.position = index + 1;
    });

    return sortedTeams;
}

/**
 * Set up table predictions sheet
 */
function setupTablePredictionsSheet() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(ADVANCED_CONFIG.TABLE_PREDICTIONS_SHEET);

    sheet.clear();

    const headers = ["Position", "Team", "Predicted By", "Actual Position", "Variance", "Points"];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

    // Style headers
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground("#059669");
    headerRange.setFontColor("white");
    headerRange.setFontWeight("bold");
}

/**
 * UTILITY FUNCTIONS
 */

/**
 * Fetch current Premier League teams from FPL API
 */
function fetchCurrentPremierLeagueTeams() {
    try {
        Logger.log("🔄 Fetching current Premier League teams from FPL API...");

        const response = UrlFetchApp.fetch("https://fantasy.premierleague.com/api/bootstrap-static/");
        const data = JSON.parse(response.getContentText());

        const teams = data.teams.map(team => ({
            id: team.id,
            name: team.name,
            shortName: team.short_name,
            code: team.code
        }));

        const teamNames = teams.map(team => team.name).sort();

        Logger.log(`✅ Fetched ${teamNames.length} teams from FPL API:`);
        Logger.log(teamNames.join(", "));

        return teamNames;

    } catch (error) {
        Logger.log(`❌ Error fetching teams from FPL API: ${error.toString()}`);
        Logger.log("🔄 Falling back to manual 2025-26 team list...");

        // Fallback to manual team list for 2025-26 season
        return [
            "Arsenal", "Aston Villa", "Bournemouth", "Brentford", "Brighton",
            "Burnley", "Chelsea", "Crystal Palace", "Everton", "Fulham",
            "Leeds", "Liverpool", "Man City", "Man Utd", "Newcastle",
            "Nott'm Forest", "Spurs", "Sunderland", "West Ham", "Wolves"
        ];
    }
}

/**
 * Get current Premier League teams with caching
 */
function getCurrentPremierLeagueTeams() {
    // Try to get from cache first
    const cache = CacheService.getScriptCache();
    const cachedTeams = cache.get('premier_league_teams');

    if (cachedTeams) {
        Logger.log("📋 Using cached Premier League teams");
        return JSON.parse(cachedTeams);
    }

    // Fetch fresh data
    const teams = fetchCurrentPremierLeagueTeams();

    // Cache for 24 hours (86400 seconds)
    cache.put('premier_league_teams', JSON.stringify(teams), 86400);

    return teams;
}

function getResult(homeScore, awayScore) {
    if (homeScore > awayScore) return 'H';
    if (awayScore > homeScore) return 'A';
    return 'D';
}

function createSheetIfNotExists(sheetName) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
        sheet = ss.insertSheet(sheetName);
    }

    return sheet;
}

function setupAdvancedScoringSheet() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(ADVANCED_CONFIG.SCORING_SHEET);

    sheet.clear();

    const content = [
        ["ADVANCED FPL PREDICTION GAME - SCORING RULES"],
        [""],
        ["CORE SCORING:"],
        [`Exact scoreline: ${ADVANCED_CONFIG.POINTS.EXACT_SCORE} points`],
        [`Correct result (W/L/D): ${ADVANCED_CONFIG.POINTS.CORRECT_RESULT} points`],
        [""],
        ["BONUS POINTS:"],
        [`Correct goal difference (non-draws): +${ADVANCED_CONFIG.POINTS.CORRECT_GOAL_DIFF} points`],
        [`Predict slight favorite to lose: +${ADVANCED_CONFIG.POINTS.UPSET_SLIGHT} points`],
        [`Predict favorite to lose: +${ADVANCED_CONFIG.POINTS.UPSET_FAVORITE} points`],
        [`Predict strong favorite to lose: +${ADVANCED_CONFIG.POINTS.UPSET_STRONG} points`],
        [`Predict draw vs slight favorite: +${Math.floor(ADVANCED_CONFIG.POINTS.UPSET_SLIGHT / 2)} points`],
        [`Predict draw vs favorite: +${Math.floor(ADVANCED_CONFIG.POINTS.UPSET_FAVORITE / 2)} points`],
        [`Predict draw vs strong favorite: +${Math.floor(ADVANCED_CONFIG.POINTS.UPSET_STRONG / 2)} points`],
        [`Correct total goals in gameweek: +${ADVANCED_CONFIG.POINTS.WEEKLY_GOALS} points`],
        [""],
        ["CAPTAIN & CHIPS:"],
        [`Captain (one per gameweek): x${ADVANCED_CONFIG.CAPTAIN_MULTIPLIER} multiplier`],
        [`Triple Captain (once per season): x${ADVANCED_CONFIG.TRIPLE_CAPTAIN_MULTIPLIER} multiplier`],
        [`All Captain (once per season): All matches x${ADVANCED_CONFIG.ALL_CAPTAIN_MULTIPLIER}`],
        [""],
        ["SEASON BONUS:"],
        ["Table accuracy: Up to 100 bonus points based on final league position predictions"],
        [""],
        ["RULES:"],
        ["- Predictions must be submitted before first game of gameweek kicks off"],
        ["- Captain selection can be changed until first game starts"],
        ["- Chips can only be used once per season"],
        ["- Cannot use both chips in same gameweek"],
        ["- Table predictions generated automatically from scoreline predictions"]
    ];

    sheet.getRange(1, 1, content.length, 1).setValues(content);
}

function setupAdvancedLeaderboard() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(ADVANCED_CONFIG.LEADERBOARD_SHEET);

    const headers = ["Rank", "Player", "Total Points", "This Week", "Avg/Week", "Exact Scores", "Captain Pts", "Chips Used"];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

    // Style headers
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground("#7c2d12");
    headerRange.setFontColor("white");
    headerRange.setFontWeight("bold");
}

function updateAdvancedLeaderboard() {
    const startTime = Date.now();
    Logger.log("🚀 STARTING LEADERBOARD UPDATE...");
    Logger.log("=".repeat(50));

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const leaderboardSheet = ss.getSheetByName(ADVANCED_CONFIG.LEADERBOARD_SHEET);

    if (!leaderboardSheet) {
        Logger.log("❌ Leaderboard sheet not found");
        return;
    }

    Logger.log("✅ Leaderboard sheet found");

    // Get all player sheets
    const allSheets = ss.getSheets();
    Logger.log(`📋 Total sheets in spreadsheet: ${allSheets.length}`);

    const playerSheets = allSheets.filter(sheet =>
        sheet.getName().startsWith(ADVANCED_CONFIG.PLAYER_PREFIX) &&
        !sheet.getName().includes(" - Stats") &&
        !sheet.getName().includes(" - Table")
    );

    Logger.log(`🔍 Player sheets found: ${playerSheets.map(s => s.getName()).join(', ')}`);

    if (playerSheets.length === 0) {
        Logger.log("❌ No player sheets found for leaderboard");
        return;
    }

    Logger.log(`📊 Calculating leaderboard for ${playerSheets.length} players...`);

    const playerStats = [];
    let processedCount = 0;
    let errorCount = 0;

    // Calculate stats for each player
    for (const playerSheet of playerSheets) {
        const playerName = playerSheet.getName().replace(ADVANCED_CONFIG.PLAYER_PREFIX, "");
        Logger.log(`\n🔍 Processing player: ${playerName}`);

        try {
            // Get data with error handling
            let data;
            try {
                data = playerSheet.getDataRange().getValues();
                Logger.log(`   📊 Sheet data: ${data.length} rows x ${data[0] ? data[0].length : 0} columns`);
            } catch (dataError) {
                Logger.log(`   ❌ Error reading sheet data for ${playerName}: ${dataError.toString()}`);
                errorCount++;
                continue;
            }

            if (!data || data.length === 0) {
                Logger.log(`   ⚠️ No data found in sheet for ${playerName}`);
                continue;
            }

            let totalPoints = 0;
            let thisWeekPoints = 0;
            let exactScores = 0;
            let captainPoints = 0;
            let gameweeksPlayed = 0;
            let chipsUsed = [];

            // Find the most recent gameweek for "This Week" calculation
            let maxGameweek = 0;
            Logger.log(`   🔍 Scanning for maximum gameweek...`);

            for (let i = 1; i < data.length; i++) {
                try {
                    const row = data[i];
                    if (!row || row.length === 0) continue;

                    const gameweek = row[0];
                    if (typeof gameweek === 'number' && gameweek > maxGameweek) {
                        maxGameweek = gameweek;
                    }
                } catch (gwError) {
                    Logger.log(`   ⚠️ Error processing row ${i} for gameweek scan: ${gwError.toString()}`);
                }
            }

            Logger.log(`   📅 Maximum gameweek found: ${maxGameweek}`);

            // Process each row to calculate stats
            Logger.log(`   🔍 Processing ${data.length - 1} data rows...`);
            let totalRows = 0;
            let gameweekTotalRows = 0;
            let exactScoreRows = 0;
            let captainRows = 0;
            let chipRows = 0;

            for (let i = 1; i < data.length; i++) {
                try {
                    const row = data[i];
                    if (!row || row.length === 0) continue;

                    totalRows++;
                    const cellA = row[0];
                    const points = row[8]; // Column I (Match Points)
                    const breakdown = row[9]; // Column J (Breakdown)
                    const isCaptain = row[7] === true; // Column H (Captain)

                    // Count gameweek totals
                    if (typeof cellA === 'string' && cellA.includes('TOTAL:')) {
                        gameweekTotalRows++;
                        if (typeof points === 'number') {
                            totalPoints += points;
                            gameweeksPlayed++;

                            // Extract gameweek number from the total row
                            const gwMatch = cellA.match(/GW(\d+)/);
                            if (gwMatch && parseInt(gwMatch[1]) === maxGameweek) {
                                thisWeekPoints = points;
                                Logger.log(`   📈 This week (GW${maxGameweek}) points: ${points}`);
                            }
                        } else {
                            Logger.log(`   ⚠️ TOTAL row found but points not a number: ${points} (type: ${typeof points})`);
                        }
                    }

                    // Count exact scores from breakdown
                    if (typeof breakdown === 'string' && breakdown.includes('Exact:')) {
                        exactScores++;
                        exactScoreRows++;
                    }

                    // Count captain points (points from matches where captain was selected)
                    if (isCaptain && typeof points === 'number' && points > 0) {
                        captainPoints += points;
                        captainRows++;
                    }

                    // Check for chip usage
                    if (typeof cellA === 'string' && cellA.includes('Chip Used:')) {
                        chipRows++;
                        // Check Triple Captain (column C)
                        if (row[2] === true) {
                            chipsUsed.push('TC');
                            Logger.log(`   🎯 Triple Captain chip found`);
                        }
                        // Check All Captain (column E)  
                        if (row[4] === true) {
                            chipsUsed.push('AC');
                            Logger.log(`   🎯 All Captain chip found`);
                        }
                    }
                } catch (rowError) {
                    Logger.log(`   ⚠️ Error processing row ${i}: ${rowError.toString()}`);
                }
            }

            Logger.log(`   📊 Row analysis: ${totalRows} total, ${gameweekTotalRows} GW totals, ${exactScoreRows} exact scores, ${captainRows} captain, ${chipRows} chip`);

            const avgPerWeek = gameweeksPlayed > 0 ? (totalPoints / gameweeksPlayed).toFixed(1) : "0.0";
            const chipsUsedStr = chipsUsed.length > 0 ? chipsUsed.join(', ') : 'None';

            const playerData = {
                name: playerName,
                totalPoints: totalPoints,
                thisWeekPoints: thisWeekPoints,
                avgPerWeek: parseFloat(avgPerWeek),
                exactScores: exactScores,
                captainPoints: captainPoints,
                chipsUsed: chipsUsedStr
            };

            Logger.log(`   ✅ Final stats - Total: ${totalPoints}, This Week: ${thisWeekPoints}, Avg: ${avgPerWeek}, Exact: ${exactScores}, Captain: ${captainPoints}, Chips: ${chipsUsedStr}`);

            playerStats.push(playerData);
            processedCount++;

        } catch (playerError) {
            Logger.log(`   ❌ CRITICAL ERROR processing ${playerName}: ${playerError.toString()}`);
            Logger.log(`   📍 Error stack: ${playerError.stack || 'No stack trace'}`);
            errorCount++;
            // Continue processing other players instead of stopping
        }
    }

    Logger.log(`\n📈 Processing complete: ${processedCount} successful, ${errorCount} errors`);
    Logger.log(`🎯 Player stats collected: ${playerStats.length} players`);

    // Sort by total points (descending), then by average per week as tiebreaker
    Logger.log(`\n🔀 Sorting ${playerStats.length} players...`);
    try {
        playerStats.sort((a, b) => {
            if (b.totalPoints !== a.totalPoints) {
                return b.totalPoints - a.totalPoints;
            }
            return b.avgPerWeek - a.avgPerWeek;
        });
        Logger.log("✅ Sorting completed successfully");
    } catch (sortError) {
        Logger.log(`❌ Error during sorting: ${sortError.toString()}`);
        throw sortError;
    }

    // Clear existing data (except headers)
    Logger.log("🧹 Clearing existing leaderboard data...");
    try {
        if (leaderboardSheet.getLastRow() > 1) {
            leaderboardSheet.getRange(2, 1, leaderboardSheet.getLastRow() - 1, 8).clear();
            Logger.log("✅ Existing data cleared");
        } else {
            Logger.log("ℹ️ No existing data to clear");
        }
    } catch (clearError) {
        Logger.log(`❌ Error clearing data: ${clearError.toString()}`);
        throw clearError;
    }

    // Prepare leaderboard data
    Logger.log("📝 Preparing leaderboard data...");
    const leaderboardData = [];
    for (let i = 0; i < playerStats.length; i++) {
        const player = playerStats[i];
        const rank = i + 1;

        leaderboardData.push([
            rank,                           // Rank
            player.name,                    // Player
            player.totalPoints,             // Total Points
            player.thisWeekPoints,          // This Week
            player.avgPerWeek,              // Avg/Week
            player.exactScores,             // Exact Scores
            player.captainPoints,           // Captain Pts
            player.chipsUsed                // Chips Used
        ]);
    }

    Logger.log(`📊 Leaderboard data prepared: ${leaderboardData.length} rows`);

    // Debug: Log the actual leaderboard data structure
    if (leaderboardData.length > 0) {
        Logger.log("🔍 DEBUGGING: Sample leaderboard data structure:");
        for (let i = 0; i < Math.min(3, leaderboardData.length); i++) {
            const row = leaderboardData[i];
            Logger.log(`   Row ${i}: [${row.map(cell => `"${cell}"`).join(', ')}]`);
        }
    }

    // Write all data at once
    if (leaderboardData.length > 0) {
        Logger.log("💾 Writing leaderboard data to sheet...");

        // Debug: Verify sheet and range details
        Logger.log(`🔍 Sheet details: ${leaderboardSheet.getName()}, Last row: ${leaderboardSheet.getLastRow()}, Last column: ${leaderboardSheet.getLastColumn()}`);
        Logger.log(`🔍 Target range: Row 2, Col 1, ${leaderboardData.length} rows, 8 columns`);

        try {
            // Write the data
            const targetRange = leaderboardSheet.getRange(2, 1, leaderboardData.length, 8);
            Logger.log(`🔍 Target range address: ${targetRange.getA1Notation()}`);

            targetRange.setValues(leaderboardData);
            Logger.log("✅ Data written successfully");

            // Apply formatting
            Logger.log("🎨 Applying formatting...");
            formatLeaderboard(leaderboardSheet, leaderboardData.length);
            Logger.log("✅ Formatting applied");

            // Verify the data was actually written
            const verifyRange = leaderboardSheet.getRange(2, 1, Math.min(3, leaderboardData.length), 8);
            const writtenData = verifyRange.getValues();
            Logger.log("🔍 VERIFICATION: Data actually written to sheet:");
            for (let i = 0; i < writtenData.length; i++) {
                const row = writtenData[i];
                Logger.log(`   Written row ${i}: [${row.map(cell => `"${cell}"`).join(', ')}]`);
            }

            const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
            Logger.log("=".repeat(50));
            Logger.log(`🎉 LEADERBOARD UPDATE COMPLETE!`);
            Logger.log(`⏱️  Total execution time: ${totalTime} seconds`);
            Logger.log(`👥 Players processed: ${processedCount}/${playerSheets.length}`);
            if (errorCount > 0) {
                Logger.log(`⚠️  Errors encountered: ${errorCount}`);
            }
            Logger.log(`📊 Final leaderboard: ${leaderboardData.length} players`);

            // Log top 3 for verification
            Logger.log("\n🏆 TOP 3 LEADERBOARD:");
            for (let i = 0; i < Math.min(3, leaderboardData.length); i++) {
                const player = leaderboardData[i];
                Logger.log(`   ${player[0]}. ${player[1]}: ${player[2]} pts (avg: ${player[4]})`);
            }
            Logger.log("=".repeat(50));

        } catch (writeError) {
            Logger.log(`❌ Error writing data to sheet: ${writeError.toString()}`);
            Logger.log(`📍 Write error stack: ${writeError.stack || 'No stack trace'}`);
            throw writeError;
        }
    } else {
        Logger.log("⚠️ No player data found for leaderboard");
        const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
        Logger.log("=".repeat(50));
        Logger.log(`❌ LEADERBOARD UPDATE FAILED - NO DATA`);
        Logger.log(`⏱️  Execution time: ${totalTime} seconds`);
        Logger.log(`👥 Players found: ${playerSheets.length}`);
        Logger.log(`👥 Players processed: ${processedCount}`);
        Logger.log(`⚠️  Errors: ${errorCount}`);
        Logger.log("=".repeat(50));
    }
}

function formatLeaderboard(leaderboardSheet, numPlayers) {
    if (numPlayers === 0) return;

    Logger.log(`🎨 Formatting leaderboard for ${numPlayers} players...`);

    try {
        // Format the data range
        const dataRange = leaderboardSheet.getRange(2, 1, numPlayers, 8);

        // Alternate row colors and special formatting for top 3
        for (let i = 0; i < numPlayers; i++) {
            const rowNum = i + 2;
            const rowRange = leaderboardSheet.getRange(rowNum, 1, 1, 8);

            if (i === 0) {
                // Gold for 1st place
                rowRange.setBackground("#fbbf24").setFontWeight("bold");
                Logger.log("   🥇 Applied gold formatting to 1st place");
            } else if (i === 1) {
                // Silver for 2nd place
                rowRange.setBackground("#e5e7eb").setFontWeight("bold");
                Logger.log("   🥈 Applied silver formatting to 2nd place");
            } else if (i === 2) {
                // Bronze for 3rd place
                rowRange.setBackground("#d97706").setFontWeight("bold");
                Logger.log("   🥉 Applied bronze formatting to 3rd place");
            } else if (i % 2 === 1) {
                // Alternate light gray for other rows
                rowRange.setBackground("#f9fafb");
            }
        }

        // Center align rank and score columns
        leaderboardSheet.getRange(2, 1, numPlayers, 1).setHorizontalAlignment("center"); // Rank
        leaderboardSheet.getRange(2, 3, numPlayers, 1).setHorizontalAlignment("center"); // Total Points
        leaderboardSheet.getRange(2, 4, numPlayers, 1).setHorizontalAlignment("center"); // This Week
        leaderboardSheet.getRange(2, 5, numPlayers, 1).setHorizontalAlignment("center"); // Avg/Week
        leaderboardSheet.getRange(2, 6, numPlayers, 1).setHorizontalAlignment("center"); // Exact Scores
        leaderboardSheet.getRange(2, 7, numPlayers, 1).setHorizontalAlignment("center"); // Captain Pts

        // Set column widths
        leaderboardSheet.setColumnWidth(1, 60);  // Rank
        leaderboardSheet.setColumnWidth(2, 150); // Player
        leaderboardSheet.setColumnWidth(3, 100); // Total Points
        leaderboardSheet.setColumnWidth(4, 100); // This Week
        leaderboardSheet.setColumnWidth(5, 100); // Avg/Week
        leaderboardSheet.setColumnWidth(6, 100); // Exact Scores
        leaderboardSheet.setColumnWidth(7, 100); // Captain Pts
        leaderboardSheet.setColumnWidth(8, 120); // Chips Used

        Logger.log("✅ Leaderboard formatting completed successfully");

    } catch (formatError) {
        Logger.log(`❌ Error formatting leaderboard: ${formatError.toString()}`);
        // Don't throw - formatting is not critical
    }
}

function addPlayerToTablePredictions(playerName) {
    // Add player to table predictions tracking
    Logger.log(`${playerName} added to table predictions`);
}

function protectAdvancedPlayerSheet(playerSheet) {
    // Protect everything except prediction columns, captain checkboxes, and chip selections
    const protection = playerSheet.protect();

    // Set unprotected ranges for user input
    const predictionRanges = [
        playerSheet.getRange("F:G"), // Predictions
        playerSheet.getRange("H:H"), // Captain checkboxes
        // Chip selection checkboxes (columns C and E on chip rows; safe to open whole columns)
        playerSheet.getRange("C:C"),
        playerSheet.getRange("E:E")
    ];

    protection.setUnprotectedRanges(predictionRanges);
    protection.setDescription("Advanced player sheet - only predictions and captain selection editable");
    // Use warning-only so collaborators aren't hard-blocked if protection conflicts occur
    protection.setWarningOnly(true);
}

function addAdvancedInstructions(playerSheet, startRow, playerName) {
    const instructions = [
        [`INSTRUCTIONS FOR ${playerName.toUpperCase()}:`],
        [""],
        ["🎯 PREDICTIONS:"],
        ["- Enter scoreline predictions in green columns"],
        ["- Check ONE captain box per gameweek (2x points)"],
        ["- Select chips carefully (once per season only)"],
        [""],
        ["📊 SCORING:"],
        [`- ${ADVANCED_CONFIG.POINTS.EXACT_SCORE} pts: Exact score | ${ADVANCED_CONFIG.POINTS.CORRECT_RESULT} pts: Correct result`],
        ["- Bonuses: Goal difference, upsets, weekly goals"],
        [`- Captain x${ADVANCED_CONFIG.CAPTAIN_MULTIPLIER} for one match per GW`],
        [""],
        ["🏆 CHIPS:"],
        [`- Triple Captain: x${ADVANCED_CONFIG.TRIPLE_CAPTAIN_MULTIPLIER} on your captain (once only)`],
        [`- All Captain: All your matches x${ADVANCED_CONFIG.ALL_CAPTAIN_MULTIPLIER} for one week`],
        [""],
        ["⏰ DEADLINES:"],
        ["- Submit before first match of gameweek kicks off"],
        ["- Can change captain until first game starts"],
        [""],
        ["📈 LEAGUE TABLE:"],
        ["- Generated automatically from your predictions"],
        ["- Season-end bonus for table accuracy"],
        [""],
        ["Good luck! 🍀"]
    ];

    playerSheet.getRange(startRow, 1, instructions.length, 1).setValues(instructions);
}

/**
 * EXAMPLE SETUP FUNCTION
 */
function exampleAdvancedSetup() {
    initializeAdvancedGame();

    // Add example players
    addAdvancedPlayer("Alice");
    addAdvancedPlayer("Bob");
    addAdvancedPlayer("Charlie");

    Logger.log("Advanced example setup complete!");
}

/**
 * COMPREHENSIVE UPDATE FUNCTION
 * Processes everything for all players in one go
 */

function updateAllPlayersComprehensive() {
    /**
     * Master function that updates everything for all players:
     * - Calculates scores for each game
     * - Calculates weekly scores with bonuses
     * - Generates/updates table predictions
     * - Updates leaderboard
     */

    Logger.log("Starting comprehensive update for all players...");

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const gameWeeksSheet = ss.getSheetByName("Game Weeks");

    if (!gameWeeksSheet) {
        Logger.log("Error: Game Weeks sheet not found");
        return;
    }

    // Get all player sheets
    const allSheets = ss.getSheets();
    const playerSheets = allSheets.filter(sheet =>
        sheet.getName().startsWith(ADVANCED_CONFIG.PLAYER_PREFIX)
    );

    if (playerSheets.length === 0) {
        Logger.log("No player sheets found");
        return;
    }

    Logger.log(`Found ${playerSheets.length} player sheets`);

    // Process each player
    for (const playerSheet of playerSheets) {
        const playerName = playerSheet.getName().replace(ADVANCED_CONFIG.PLAYER_PREFIX, "");
        Logger.log(`Processing player: ${playerName}`);

        try {
            // 1. Calculate scores for all games
            calculatePlayerScores(playerSheet, gameWeeksSheet);

            // 2. Calculate weekly bonuses
            calculateWeeklyBonuses(playerSheet);

            // 3. Generate/update table predictions
            generateTableFromPredictions(playerName);

            Logger.log(`✅ Completed processing for ${playerName}`);

        } catch (error) {
            Logger.log(`❌ Error processing ${playerName}: ${error.toString()}`);
        }
    }

    // 4. Update leaderboard
    try {
        updateAdvancedLeaderboard();
        Logger.log("✅ Leaderboard updated");
    } catch (error) {
        Logger.log(`❌ Error updating leaderboard: ${error.toString()}`);
    }

    Logger.log("🎉 Comprehensive update complete for all players!");
}

function calculatePlayerScores(playerSheet, gameWeeksSheet, options) {
    /**
     * Calculate scores for all matches for a specific player
     */

    const playerName = playerSheet.getName().replace(ADVANCED_CONFIG.PLAYER_PREFIX, "");
    const opts = options || {};
    const formatCells = opts.formatCells !== undefined ? !!opts.formatCells : true; // default ON for UX
    const verboseLogs = opts.verboseLogs !== undefined ? !!opts.verboseLogs : false; // default OFF
    if (verboseLogs) Logger.log(`🔍 Starting score calculation for ${playerName}`);

    const playerData = playerSheet.getDataRange().getValues();
    const gameWeeksData = gameWeeksSheet.getDataRange().getValues();
    // Pre-scan chip usage per gameweek
    const chipsByGameweek = buildChipUsageMap(playerData);


    if (verboseLogs) Logger.log(`📊 Player sheet has ${playerData.length} rows, Game Weeks sheet has ${gameWeeksData.length} rows`);

    // Create lookup for actual results
    const actualResults = {};
    let actualResultsCount = 0;

    for (let i = 1; i < gameWeeksData.length; i++) {
        const row = gameWeeksData[i];
        if (row[0] && !row[0].toString().startsWith("GAMEWEEK")) {
            const homeTeam = row[1];
            const awayTeam = row[2]; // Fixed: should be column 2, not 3
            const actualHome = row[6]; // Actual Home column
            const actualAway = row[7]; // Actual Away column

            if (homeTeam && awayTeam) {
                const matchKey = `${homeTeam}-${awayTeam}`;
                actualResults[matchKey] = {
                    homeScore: actualHome,
                    awayScore: actualAway,
                    matchPrediction: row[5] || ""
                };

                // Log completed matches only
                if (typeof actualHome === 'number' && typeof actualAway === 'number') {
                    actualResultsCount++;
                    if (actualResultsCount <= 3) { // Log first 3 for debugging
                        Logger.log(`✅ Found result: ${homeTeam} ${actualHome}-${actualAway} ${awayTeam}`);
                    }
                }
            }
        }
    }

    if (verboseLogs) Logger.log(`🎯 Found ${actualResultsCount} completed matches in Game Weeks sheet`);

    // Process player predictions
    let predictionsProcessed = 0;
    let scoresCalculated = 0;

    // Collect batched updates to minimize setValue calls
    const batchedRows = [];

    for (let i = 1; i < playerData.length; i++) {
        const row = playerData[i];

        // Skip header rows and empty rows
        if (!row[1] || row[1].toString().startsWith("---") || row[0] === "Gameweek") {
            continue;
        }

        const gameweek = row[0];
        const homeTeam = row[1];
        const awayTeam = row[2];
        const predHome = row[5];
        const predAway = row[6];
        let isCaptain = row[7] === true || row[7] === "TRUE";

        // Determine chip effects for this gameweek
        let chipMultiplier = 1;
        const gwChips = chipsByGameweek[gameweek];
        if (gwChips) {
            if (gwChips.allCaptain) {
                // All matches x2; ignore captain checkbox to prevent stacking
                isCaptain = false;
                chipMultiplier = ADVANCED_CONFIG.ALL_CAPTAIN_MULTIPLIER;
            } else if (gwChips.tripleCaptain && isCaptain) {
                // Triple applies only to the captain pick; replace the x2 with x3
                isCaptain = false;
                chipMultiplier = ADVANCED_CONFIG.TRIPLE_CAPTAIN_MULTIPLIER;
            }
        }

        const matchKey = `${homeTeam}-${awayTeam}`;
        const actualResult = actualResults[matchKey];

        if (!actualResult) {
            if (predictionsProcessed <= 3) {
                Logger.log(`⚠️ No actual result found for match key: ${matchKey}`);
            }
            continue;
        }

        // Check if game is finished (has actual results)
        const gameFinished = actualResult &&
            typeof actualResult.homeScore === 'number' &&
            typeof actualResult.awayScore === 'number';

        // Check if player made a prediction
        const hasPrediction = predHome !== "" && predAway !== "" &&
            typeof predHome === 'number' && typeof predAway === 'number';

        if (gameFinished && hasPrediction) {
            // Game finished and player made prediction - calculate score
            predictionsProcessed++;
            scoresCalculated++;

            if (verboseLogs && scoresCalculated <= 3) {
                Logger.log(`🎲 Processing prediction ${predictionsProcessed}: GW${gameweek} ${homeTeam} ${predHome}-${predAway} ${awayTeam} (Captain: ${isCaptain})`);
                Logger.log(`⚽ Calculating score for: ${homeTeam} ${predHome}-${predAway} vs actual ${actualResult.homeScore}-${actualResult.awayScore}`);
            }

            // Calculate match points
            const points = calculateAdvancedMatchPoints(
                predHome, predAway,
                actualResult.homeScore, actualResult.awayScore,
                homeTeam, awayTeam,
                actualResult.matchPrediction,
                isCaptain,
                chipMultiplier
            );

            if (verboseLogs && scoresCalculated <= 3) {
                Logger.log(`📊 Calculated points: ${points.points} (${points.breakdown})`);
            }

            // Queue batched write for points and breakdown (cols I & J)
            batchedRows.push({
                row: i + 1, points: points.points, breakdown: points.breakdown,
                predHome, predAway, actualHome: actualResult.homeScore, actualAway: actualResult.awayScore
            });

            // Optional: format cells (can be slow). Default off for performance.
            if (formatCells) {
                const pointsCell = playerSheet.getRange(i + 1, 9);
                const breakdownCell = playerSheet.getRange(i + 1, 10);
                const earnedUpsetBonus = points.breakdown.includes('Upset:');
                if (predHome === actualResult.homeScore && predAway === actualResult.awayScore) {
                    if (earnedUpsetBonus) {
                        pointsCell.setBackground("#10b981").setFontColor("white");
                        breakdownCell.setBackground("#10b981").setFontColor("white");
                    } else {
                        pointsCell.setBackground("#d1fae5").setFontColor("black");
                        breakdownCell.setBackground("#d1fae5").setFontColor("black");
                    }
                } else if (getResult(predHome, predAway) === getResult(actualResult.homeScore, actualResult.awayScore)) {
                    if (earnedUpsetBonus) {
                        pointsCell.setBackground("#3b82f6").setFontColor("white");
                        breakdownCell.setBackground("#3b82f6").setFontColor("white");
                    } else {
                        pointsCell.setBackground("#dbeafe").setFontColor("black");
                        breakdownCell.setBackground("#dbeafe").setFontColor("black");
                    }
                } else {
                    pointsCell.setBackground("#fee2e2").setFontColor("black");
                    breakdownCell.setBackground("#fee2e2").setFontColor("black");
                }
            }
        } else if (gameFinished && !hasPrediction) {
            // Queue empty values; optionally grey formatting if enabled
            batchedRows.push({ row: i + 1, points: "", breakdown: "" });
            if (verboseLogs && predictionsProcessed <= 3) {
                Logger.log(`⭕ Game finished but no prediction: ${homeTeam} vs ${awayTeam} (actual: ${actualResult.homeScore}-${actualResult.awayScore})`);
            }
            if (formatCells) {
                playerSheet.getRange(i + 1, 9, 1, 2).setBackground("#f3f4f6");
            }
        } else {
            if (verboseLogs && predictionsProcessed <= 3) {
                Logger.log(`⏳ Match not finished yet: ${matchKey}`);
            }
        }
    }

    // Batch write points and breakdown columns grouping consecutive rows into large rectangles
    if (batchedRows.length > 0) {
        batchedRows.sort((a, b) => a.row - b.row);
        let start = 0;
        while (start < batchedRows.length) {
            let end = start;
            let expected = batchedRows[start].row;
            // extend contiguous block
            while (end < batchedRows.length && batchedRows[end].row === expected) {
                expected++;
                end++;
            }
            const block = batchedRows.slice(start, end);
            const values = block.map(br => [br.points, br.breakdown]);
            playerSheet.getRange(block[0].row, 9, block.length, 2).setValues(values);
            start = end;
        }
    }

    if (verboseLogs) Logger.log(`📈 ${playerName} summary: ${predictionsProcessed} predictions processed, ${scoresCalculated} scores calculated`);
}

function calculateWeeklyBonuses(playerSheet, options) {
    /**
     * Calculate weekly goals bonuses for all completed gameweeks and update summary rows
     */
    const opts = options || {};
    const formatRows = !!opts.formatRows; // default false for speed
    const verboseLogs = !!opts.verboseLogs;

    const data = playerSheet.getDataRange().getValues();
    const processedWeeks = new Set();
    const pendingWrites = [];

    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const cellValue = row[0];

        // Look for gameweek goals bonus rows
        if (typeof cellValue === 'string' && cellValue.includes('Goals Bonus:')) {
            const gameweek = parseInt(cellValue.match(/GW(\d+)/)[1]);

            if (!processedWeeks.has(gameweek)) {
                try {
                    const bonusResult = calculateWeeklyGoalsBonus(playerSheet, gameweek);
                    const bonus = bonusResult.bonus;

                    // Queue write of the bonus amount
                    pendingWrites.push({ row: i + 1, value: bonus, text: bonusResult.matchCount > 0 ? `Goals Bonus: GW${gameweek} - Predicted: ${bonusResult.predTotal} goals, Actual: ${bonusResult.actualTotal} goals` : null });

                    // Update the description with detailed information
                    if (bonusResult.matchCount > 0) {
                        const detailedDescription = `Goals Bonus: GW${gameweek} - Predicted: ${bonusResult.predTotal} goals, Actual: ${bonusResult.actualTotal} goals`;
                        playerSheet.getRange(i + 1, 1).setValue(detailedDescription);
                    }

                    // Highlight with vibrant color if bonus earned
                    if (formatRows) {
                        const bonusRowRange = playerSheet.getRange(i + 1, 1, 1, 10);
                        if (bonus > 0) {
                            bonusRowRange.setBackground("#f59e0b").setFontColor("white").setFontWeight("bold");
                            if (verboseLogs) Logger.log(`✨ ${playerSheet.getName().replace(ADVANCED_CONFIG.PLAYER_PREFIX, "")} earned weekly goals bonus for GW${gameweek}: ${bonus} points`);
                        } else {
                            bonusRowRange.setBackground("#f3f4f6").setFontColor("black").setFontWeight("bold");
                        }
                    }

                    processedWeeks.add(gameweek);
                } catch (error) {
                    if (verboseLogs) Logger.log(`Error calculating weekly bonus for GW${gameweek}: ${error.toString()}`);
                }
            }
        }
    }

    // Apply batched writes for bonus values and optional description text
    if (pendingWrites.length > 0) {
        // Group consecutive bonus rows to set column I in blocks
        pendingWrites.sort((a, b) => a.row - b.row);
        let start = 0;
        while (start < pendingWrites.length) {
            let end = start;
            let expected = pendingWrites[start].row;
            while (end < pendingWrites.length && pendingWrites[end].row === expected) {
                expected++;
                end++;
            }
            const block = pendingWrites.slice(start, end);
            const values = block.map(w => [w.value]);
            playerSheet.getRange(block[0].row, 9, block.length, 1).setValues(values);
            // Write descriptions in column A where present (cannot batch holes well; write individually only when needed)
            for (const w of block) {
                if (w.text) playerSheet.getRange(w.row, 1).setValue(w.text);
            }
            start = end;
        }
    }
}

/**
 * Build a map of chip usage per gameweek by scanning special chip rows.
 * Chip rows look like: ["Chip Used:", "☐ Triple Captain", <C checkbox>, "☐ All Captain", <E checkbox>, ...]
 */
function buildChipUsageMap(playerData) {
    const chips = {};

    // We infer the gameweek by scanning back to the last header row like "--- GAMEWEEK X ---"
    let currentGW = null;
    for (let i = 0; i < playerData.length; i++) {
        const row = playerData[i];
        const colA = row[0];
        const colB = row[1];

        // Update current gameweek when encountering header row
        if (typeof colA === 'string' && colA.startsWith('--- GAMEWEEK')) {
            const m = colA.match(/GAMEWEEK\s+(\d+)/i);
            if (m) currentGW = parseInt(m[1], 10);
            continue;
        }

        // Detect chip row
        if (typeof colA === 'string' && colA.startsWith('Chip Used:')) {
            if (currentGW != null) {
                const triple = row[2] === true || row[2] === 'TRUE'; // column C
                const allCap = row[4] === true || row[4] === 'TRUE';  // column E
                if (!chips[currentGW]) chips[currentGW] = { tripleCaptain: false, allCaptain: false };
                chips[currentGW].tripleCaptain = !!triple;
                chips[currentGW].allCaptain = !!allCap;
            }
        }
    }

    return chips;
}

/**
 * AUTO-FILL MISSING PREDICTIONS
 */

/**
 * Auto-fill missing predictions with default scores for games that have started
 */
function autoFillMissingPredictions(defaultHomeScore = 2, defaultAwayScore = 1) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const masterSheet = ss.getSheetByName(ADVANCED_CONFIG.MASTER_SHEET);

    if (!masterSheet) {
        Logger.log("❌ Master sheet not found");
        return;
    }

    Logger.log(`🔄 Auto-filling missing predictions with default score ${defaultHomeScore}-${defaultAwayScore}...`);

    // Get current date/time
    const now = new Date();

    // Get master sheet data to check kickoff times
    const masterData = masterSheet.getDataRange().getValues();
    const fixtures = masterData.slice(1); // Skip header

    // Get all player sheets
    const allSheets = ss.getSheets();
    const playerSheets = allSheets.filter(sheet =>
        sheet.getName().startsWith(ADVANCED_CONFIG.PLAYER_PREFIX) &&
        !sheet.getName().includes(" - Stats")
    );

    if (playerSheets.length === 0) {
        Logger.log("❌ No player sheets found");
        return;
    }

    let totalFilled = 0;

    // Process each player
    for (const playerSheet of playerSheets) {
        const playerName = playerSheet.getName().replace(ADVANCED_CONFIG.PLAYER_PREFIX, "");
        Logger.log(`📝 Checking ${playerName} for missing predictions...`);

        const playerData = playerSheet.getDataRange().getValues();
        let playerFilled = 0;

        // Check each row in player sheet
        for (let i = 1; i < playerData.length; i++) {
            const row = playerData[i];

            // Skip non-fixture rows (headers, summaries, etc.)
            if (!row[1] || row[1].toString().startsWith("---") || row[0] === "Gameweek") {
                continue;
            }

            const homeTeam = row[ADVANCED_CONFIG.PLAYER_COLS.HOME_TEAM - 1];
            const awayTeam = row[ADVANCED_CONFIG.PLAYER_COLS.AWAY_TEAM - 1];
            const homePred = row[ADVANCED_CONFIG.PLAYER_COLS.HOME_PRED - 1];
            const awayPred = row[ADVANCED_CONFIG.PLAYER_COLS.AWAY_PRED - 1];

            // Check if prediction is missing (empty or not a number)
            const missingHomePred = homePred === "" || !Number.isInteger(homePred);
            const missingAwayPred = awayPred === "" || !Number.isInteger(awayPred);

            if (missingHomePred || missingAwayPred) {
                // Find corresponding fixture in master sheet to check kickoff time
                const matchingFixture = fixtures.find(fixture =>
                    fixture[ADVANCED_CONFIG.MASTER_COLS.HOME_TEAM - 1] === homeTeam &&
                    fixture[ADVANCED_CONFIG.MASTER_COLS.AWAY_TEAM - 1] === awayTeam
                );

                if (matchingFixture) {
                    const kickoffTime = matchingFixture[ADVANCED_CONFIG.MASTER_COLS.KICKOFF - 1];
                    const matchDate = matchingFixture[ADVANCED_CONFIG.MASTER_COLS.DATE - 1];

                    // Determine if game has started based on date+time in various possible formats
                    let gameStarted = false;
                    try {
                        const gameDateTime = buildDateTime(matchDate, kickoffTime);
                        if (gameDateTime) {
                            gameStarted = now > gameDateTime;
                        }
                    } catch (error) {
                        Logger.log(`⚠️ Could not parse kickoff time for ${homeTeam} vs ${awayTeam}: ${error}`);
                    }

                    // If game has started and prediction is missing, auto-fill
                    if (gameStarted) {
                        if (missingHomePred) {
                            playerSheet.getRange(i + 1, ADVANCED_CONFIG.PLAYER_COLS.HOME_PRED).setValue(defaultHomeScore);
                        }
                        if (missingAwayPred) {
                            playerSheet.getRange(i + 1, ADVANCED_CONFIG.PLAYER_COLS.AWAY_PRED).setValue(defaultAwayScore);
                        }

                        playerFilled++;
                        Logger.log(`✅ Auto-filled ${homeTeam} vs ${awayTeam} with ${defaultHomeScore}-${defaultAwayScore} for ${playerName}`);
                    }
                }
            }
        }

        if (playerFilled > 0) {
            Logger.log(`📊 Filled ${playerFilled} missing predictions for ${playerName}`);
        } else {
            Logger.log(`✅ ${playerName} has no missing predictions for started games`);
        }

        totalFilled += playerFilled;
    }

    Logger.log(`🎉 Auto-fill complete! Total predictions filled: ${totalFilled}`);
}

/**
 * Build a Date from a date cell and a time cell that may be string ("HH:MM"), number (minutes), or Date.
 */
function buildDateTime(dateCell, timeCell) {
    if (!dateCell) return null;

    // Clone date keeping date-only portion
    const d = new Date(dateCell);
    if (isNaN(d.getTime())) return null;

    // If timeCell is empty, assume midnight
    if (!timeCell && timeCell !== 0) return d;

    if (typeof timeCell === 'string') {
        // Expect formats like "15:00" or "15:00:00"
        const parts = timeCell.split(':').map(x => parseInt(x, 10));
        const h = parts[0] || 0;
        const m = parts[1] || 0;
        const s = parts[2] || 0;
        d.setHours(h, m, s, 0);
        return d;
    }

    if (typeof timeCell === 'number') {
        // Could be minutes since midnight (common in CSV) or Excel time fraction
        if (timeCell > 1) {
            // Treat as minutes since midnight
            const h = Math.floor(timeCell / 60);
            const m = Math.floor(timeCell % 60);
            d.setHours(h, m, 0, 0);
        } else {
            // Excel time fraction (0..1)
            const totalSeconds = Math.round(timeCell * 24 * 60 * 60);
            const h = Math.floor(totalSeconds / 3600);
            const m = Math.floor((totalSeconds % 3600) / 60);
            const s = totalSeconds % 60;
            d.setHours(h, m, s, 0);
        }
        return d;
    }

    if (timeCell instanceof Date) {
        d.setHours(timeCell.getHours(), timeCell.getMinutes(), timeCell.getSeconds(), 0);
        return d;
    }

    return d;
}

/**
 * LEAGUE TABLE GENERATION FOR PLAYERS
 */

/**
 * Generate league table sheets for all players based on their predictions
 */
function generateAllPlayerTableSheets() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const allSheets = ss.getSheets();

    // Find all player prediction sheets (exclude stats and table sheets)
    const playerSheets = allSheets.filter(sheet =>
        sheet.getName().startsWith(ADVANCED_CONFIG.PLAYER_PREFIX) &&
        !sheet.getName().includes(" - Stats") &&
        !sheet.getName().includes(" - Table")
    );

    if (playerSheets.length === 0) {
        Logger.log("❌ No player prediction sheets found");
        return;
    }

    Logger.log(`🏆 Generating league table sheets for ${playerSheets.length} players...`);

    let successCount = 0;
    let errorCount = 0;

    for (const playerSheet of playerSheets) {
        try {
            const playerName = playerSheet.getName().replace(ADVANCED_CONFIG.PLAYER_PREFIX, "");
            Logger.log(`📊 Creating table sheet for ${playerName}...`);

            generatePlayerTableSheet(playerName);
            successCount++;

        } catch (error) {
            errorCount++;
            const playerName = playerSheet.getName().replace(ADVANCED_CONFIG.PLAYER_PREFIX, "");
            Logger.log(`❌ Error creating table sheet for ${playerName}: ${error.toString()}`);
        }
    }

    Logger.log(`🎉 Table sheet generation complete!`);
    Logger.log(`✅ Successfully created: ${successCount} table sheets`);
    if (errorCount > 0) {
        Logger.log(`⚠️ Errors encountered: ${errorCount} failed`);
    }
}

/**
 * Generate a league table sheet for a specific player based on their predictions
 */
function generatePlayerTableSheet(playerName) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const playerSheetName = ADVANCED_CONFIG.PLAYER_PREFIX + playerName;
    const tableSheetName = `${ADVANCED_CONFIG.PLAYER_PREFIX}${playerName} - Table`;

    const playerSheet = ss.getSheetByName(playerSheetName);
    if (!playerSheet) {
        throw new Error(`Player sheet not found: ${playerSheetName}`);
    }

    // Create or clear the table sheet
    let tableSheet = ss.getSheetByName(tableSheetName);
    if (!tableSheet) {
        tableSheet = ss.insertSheet(tableSheetName);
    } else {
        tableSheet.clear();
    }

    Logger.log(`📋 Processing predictions for ${playerName}...`);

    // Get current Premier League teams from FPL API
    const teams = {};
    const teamNames = getCurrentPremierLeagueTeams();

    // Initialize team stats
    teamNames.forEach(team => {
        teams[team] = {
            name: team,
            played: 0,
            won: 0,
            drawn: 0,
            lost: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            goalDifference: 0,
            points: 0,
            recentForm: [] // Store last 5 results
        };
    });

    // Process all predictions from the player sheet
    const playerData = playerSheet.getDataRange().getValues();
    const matches = [];

    for (let i = 1; i < playerData.length; i++) {
        const row = playerData[i];

        // Skip non-fixture rows (headers, summaries, etc.)
        if (!row[1] || row[1].toString().startsWith("---") || row[0] === "Gameweek") {
            continue;
        }

        const homeTeam = row[ADVANCED_CONFIG.PLAYER_COLS.HOME_TEAM - 1];
        const awayTeam = row[ADVANCED_CONFIG.PLAYER_COLS.AWAY_TEAM - 1];
        const homeScore = row[ADVANCED_CONFIG.PLAYER_COLS.HOME_PRED - 1];
        const awayScore = row[ADVANCED_CONFIG.PLAYER_COLS.AWAY_PRED - 1];

        // Only process if both teams exist and both scores are numbers
        if (teams[homeTeam] && teams[awayTeam] &&
            typeof homeScore === 'number' && typeof awayScore === 'number') {

            // Store the match for recent form calculation
            matches.push({
                homeTeam: homeTeam,
                awayTeam: awayTeam,
                homeScore: homeScore,
                awayScore: awayScore
            });

            // Update team statistics
            teams[homeTeam].played++;
            teams[awayTeam].played++;
            teams[homeTeam].goalsFor += homeScore;
            teams[homeTeam].goalsAgainst += awayScore;
            teams[awayTeam].goalsFor += awayScore;
            teams[awayTeam].goalsAgainst += homeScore;

            // Determine result and update points
            if (homeScore > awayScore) {
                // Home win
                teams[homeTeam].won++;
                teams[homeTeam].points += 3;
                teams[awayTeam].lost++;

                // Add to recent form
                teams[homeTeam].recentForm.push('W');
                teams[awayTeam].recentForm.push('L');
            } else if (awayScore > homeScore) {
                // Away win
                teams[awayTeam].won++;
                teams[awayTeam].points += 3;
                teams[homeTeam].lost++;

                // Add to recent form
                teams[awayTeam].recentForm.push('W');
                teams[homeTeam].recentForm.push('L');
            } else {
                // Draw
                teams[homeTeam].drawn++;
                teams[awayTeam].drawn++;
                teams[homeTeam].points++;
                teams[awayTeam].points++;

                // Add to recent form
                teams[homeTeam].recentForm.push('D');
                teams[awayTeam].recentForm.push('D');
            }
        }
    }

    // Calculate goal difference and limit recent form to last 5 games
    Object.values(teams).forEach(team => {
        team.goalDifference = team.goalsFor - team.goalsAgainst;
        // Keep only last 5 games for recent form
        if (team.recentForm.length > 5) {
            team.recentForm = team.recentForm.slice(-5);
        }
    });

    // Sort teams by points, then goal difference, then goals for
    const sortedTeams = Object.values(teams).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        return b.goalsFor - a.goalsFor;
    });

    // Set up the table sheet
    setupPlayerTableSheet(tableSheet, playerName, sortedTeams);

    Logger.log(`✅ League table sheet created for ${playerName}: ${tableSheetName}`);
}

/**
 * Set up the league table sheet with proper formatting
 */
function setupPlayerTableSheet(tableSheet, playerName, sortedTeams) {
    // Set up headers
    const headers = [
        "Pos", "Team", "Played", "Won", "Drawn", "Lost",
        "GF", "GA", "GD", "Pts", "Last 5"
    ];

    tableSheet.getRange(1, 1, 1, headers.length).setValues([headers]);

    // Style headers
    const headerRange = tableSheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground("#1e3a8a");
    headerRange.setFontColor("white");
    headerRange.setFontWeight("bold");
    headerRange.setFontSize(11);

    // Add title
    tableSheet.insertRowBefore(1);
    const titleCell = tableSheet.getRange(1, 1, 1, headers.length);
    titleCell.merge();
    titleCell.setValue(`${playerName.toUpperCase()}'S PREDICTED LEAGUE TABLE`);
    titleCell.setBackground("#374151");
    titleCell.setFontColor("white");
    titleCell.setFontWeight("bold");
    titleCell.setFontSize(14);
    titleCell.setHorizontalAlignment("center");

    // Prepare table data
    const tableData = [];

    for (let i = 0; i < sortedTeams.length; i++) {
        const team = sortedTeams[i];
        const position = i + 1;

        // Build recent form string (we'll format this with colors later)
        const recentFormText = team.recentForm.join(' ');

        const row = [
            position,
            team.name,
            team.played,
            team.won,
            team.drawn,
            team.lost,
            team.goalsFor,
            team.goalsAgainst,
            team.goalDifference,
            team.points,
            recentFormText
        ];

        tableData.push(row);
    }

    // Write all data at once (starting from row 3, since we have title and headers)
    if (tableData.length > 0) {
        tableSheet.getRange(3, 1, tableData.length, headers.length).setValues(tableData);
    }

    // Apply formatting
    formatPlayerTableSheet(tableSheet, sortedTeams, headers.length);

    // Set column widths
    tableSheet.setColumnWidth(1, 50);   // Position
    tableSheet.setColumnWidth(2, 120);  // Team name
    tableSheet.setColumnWidth(3, 60);   // Played
    tableSheet.setColumnWidth(4, 50);   // Won
    tableSheet.setColumnWidth(5, 60);   // Drawn
    tableSheet.setColumnWidth(6, 50);   // Lost
    tableSheet.setColumnWidth(7, 40);   // GF
    tableSheet.setColumnWidth(8, 40);   // GA
    tableSheet.setColumnWidth(9, 50);   // GD
    tableSheet.setColumnWidth(10, 50);  // Points
    tableSheet.setColumnWidth(11, 80);  // Last 5

    // Freeze headers
    tableSheet.setFrozenRows(2);
}

/**
 * Apply formatting to the league table sheet
 */
function formatPlayerTableSheet(tableSheet, sortedTeams, numCols) {
    const numTeams = sortedTeams.length;

    // Style position-based backgrounds (Champions League, Europa, Relegation)
    for (let i = 0; i < numTeams; i++) {
        const rowNum = i + 3; // Account for title and header rows
        const rowRange = tableSheet.getRange(rowNum, 1, 1, numCols);

        if (i < 4) {
            // Top 4 - Champions League (light blue)
            rowRange.setBackground("#dbeafe");
        } else if (i < 6) {
            // 5th and 6th - Europa League (light orange)
            rowRange.setBackground("#fed7aa");
        } else if (i >= numTeams - 3) {
            // Bottom 3 - Relegation (light red)
            rowRange.setBackground("#fee2e2");
        } else {
            // Mid-table (light grey)
            rowRange.setBackground("#f9fafb");
        }

        // Make position and points columns bold
        tableSheet.getRange(rowNum, 1).setFontWeight("bold"); // Position
        tableSheet.getRange(rowNum, 10).setFontWeight("bold"); // Points
    }

    // Format the Last 5 column with colored results
    for (let i = 0; i < numTeams; i++) {
        const rowNum = i + 3;
        const team = sortedTeams[i];
        const lastFiveCell = tableSheet.getRange(rowNum, 11);

        // Create rich text for colored form
        if (team.recentForm.length > 0) {
            formatRecentForm(lastFiveCell, team.recentForm);
        }
    }

    // Add borders
    const dataRange = tableSheet.getRange(2, 1, numTeams + 1, numCols);
    dataRange.setBorder(true, true, true, true, true, true);

    // Center align numeric columns
    const numericCols = [1, 3, 4, 5, 6, 7, 8, 9, 10]; // Position, Played, Won, Drawn, Lost, GF, GA, GD, Points
    for (const col of numericCols) {
        tableSheet.getRange(3, col, numTeams, 1).setHorizontalAlignment("center");
    }
}

/**
 * Format the recent form column with colored W/L/D indicators
 */
function formatRecentForm(cell, recentForm) {
    if (recentForm.length === 0) {
        cell.setValue("No games");
        return;
    }

    // Create individual colored characters for each result
    const formattedResults = [];

    for (const result of recentForm) {
        switch (result) {
            case 'W':
                formattedResults.push({ text: 'W', color: '#10b981' }); // Green
                break;
            case 'L':
                formattedResults.push({ text: 'L', color: '#ef4444' }); // Red
                break;
            case 'D':
                formattedResults.push({ text: 'D', color: '#6b7280' }); // Grey
                break;
        }
    }

    // Build rich text value
    const richTextValue = SpreadsheetApp.newRichTextValue();
    let fullText = '';

    // First, build the complete text string
    for (let i = 0; i < formattedResults.length; i++) {
        if (i > 0) {
            fullText += ' ';
        }
        fullText += formattedResults[i].text;
    }

    // Set the text first (required before setTextStyle)
    richTextValue.setText(fullText);

    // Then apply styles to each character
    let currentIndex = 0;
    for (let i = 0; i < formattedResults.length; i++) {
        const result = formattedResults[i];

        if (i > 0) {
            currentIndex += 1; // Account for space
        }

        // Create text style
        const textStyle = SpreadsheetApp.newTextStyle()
            .setForegroundColor(result.color)
            .setBold(true)
            .build();

        // Apply style to this character
        richTextValue.setTextStyle(currentIndex, currentIndex + 1, textStyle);

        currentIndex += 1; // Move to next character
    }

    cell.setRichTextValue(richTextValue.build());
    cell.setHorizontalAlignment("center");
}

/**
 * Lock predictions (F:G) and captain (H) for any fixture that is finished or has passed kickoff time.
 * Assumes Game Weeks has Date (D), Kickoff (E), and optionally a Finished flag (I/index 8) if present.
 */
function lockPlayedOrStartedMatches(gameWeeksSheet, playerSheets) {
    const LOCK_DESC = "Locked after kickoff/completion";
    const now = new Date();

    const data = gameWeeksSheet.getDataRange().getValues();
    if (data.length <= 1) {
        return { totalRows: 0, totalRanges: 0 };
    }

    // Build lookup: `${gw}||${home}||${away}` -> started:boolean
    const startedLookup = {};
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const gw = row[ADVANCED_CONFIG.MASTER_COLS.GAMEWEEK - 1];
        const home = row[ADVANCED_CONFIG.MASTER_COLS.HOME_TEAM - 1];
        const away = row[ADVANCED_CONFIG.MASTER_COLS.AWAY_TEAM - 1];
        const dateCell = row[ADVANCED_CONFIG.MASTER_COLS.DATE - 1];
        const timeCell = row[ADVANCED_CONFIG.MASTER_COLS.KICKOFF - 1];

        // Support an optional Finished flag (commonly column I). If not present, derive from score presence
        const finishedFlag = row.length > 8 ? (row[8] === true || row[8] === 'TRUE') : false;
        const hasActualScores = typeof row[ADVANCED_CONFIG.MASTER_COLS.ACTUAL_HOME - 1] === 'number' &&
            typeof row[ADVANCED_CONFIG.MASTER_COLS.ACTUAL_AWAY - 1] === 'number';

        let started = !!finishedFlag || hasActualScores;
        if (!started && dateCell) {
            try {
                const dt = buildDateTime(dateCell, timeCell);
                if (dt && dt instanceof Date && !isNaN(dt.getTime())) {
                    started = dt.getTime() <= now.getTime();
                }
            } catch (_) {
                // ignore parse errors
            }
        }

        if (gw && home && away) {
            startedLookup[`${gw}||${home}||${away}`] = started;
        }
    }

    // Helper to group consecutive row numbers
    function group(rows) {
        if (!rows.length) return [];
        rows.sort((a, b) => a - b);
        const out = [];
        let s = rows[0], p = rows[0];
        for (let i = 1; i < rows.length; i++) {
            if (rows[i] === p + 1) {
                p = rows[i];
            } else {
                out.push({ start: s, end: p });
                s = p = rows[i];
            }
        }
        out.push({ start: s, end: p });
        return out;
    }

    let totalRows = 0;
    let totalRanges = 0;

    for (const playerSheet of playerSheets) {
        try {
            // Remove old protections set by this step
            const protections = playerSheet.getProtections(SpreadsheetApp.ProtectionType.RANGE) || [];
            for (const p of protections) {
                try {
                    if (p.getDescription && p.getDescription() === LOCK_DESC) p.remove();
                } catch (_) { }
            }

            const values = playerSheet.getDataRange().getValues();
            const rowsToLock = [];

            for (let r = 2; r <= values.length; r++) {
                const row = values[r - 1];
                const gw = row[ADVANCED_CONFIG.PLAYER_COLS.GAMEWEEK - 1];
                const home = row[ADVANCED_CONFIG.PLAYER_COLS.HOME_TEAM - 1];
                const away = row[ADVANCED_CONFIG.PLAYER_COLS.AWAY_TEAM - 1];

                const isFixture = (typeof gw === 'number' || (typeof gw === 'string' && /^\d+$/.test(gw))) &&
                    typeof home === 'string' && home &&
                    typeof away === 'string' && away;
                if (!isFixture) continue;

                const key = `${gw}||${home}||${away}`;
                if (startedLookup[key]) rowsToLock.push(r);
            }

            if (!rowsToLock.length) continue;

            for (const { start, end } of group(rowsToLock)) {
                const num = end - start + 1;
                const range = playerSheet.getRange(start, 6, num, 3); // F:G:H
                const prot = range.protect();
                prot.setDescription(LOCK_DESC);
                prot.setWarningOnly(false);
                totalRows += num;
                totalRanges += 1;
            }
        } catch (e) {
            Logger.log(`⚠️ Locking failed for ${playerSheet.getName()}: ${e}`);
        }
    }

    return { totalRows, totalRanges };
}
