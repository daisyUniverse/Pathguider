var config = require("./dummy.json");
var clui = require('clui');
var fs = require("fs");
var fileName = './dummy.json';
var term = require( 'terminal-kit' ).terminal ;
const chalk = require('chalk')

term.clear();
updateBar();

var commands = [
	'test' , 'heal' , 'damage' , 'list' ,
	'xp' , 'gold' , 'spend' , 'attack' ,
    'spend' , 'rest', 'cast', 'clear' ,
    'wait', 'help'
] ;

function terminate() {
    term.grabInput( false ) ;
    term.clear();
    term.hideCursor(false);
	setTimeout( function() { process.exit() } , 100 ) ;
}

term.on( 'key' , function( name , matches , data ) {
	if ( name === 'CTRL_C' ) { terminate() ; }
} ) ;

function prompt(nl){

    if (nl != 0) {
        for (var i = 0; i < nl; i++){
            term.nextLine()
        }
    }

    term("\n^r"+config.stats[0].charName + " ^w> ");

    term.inputField( 
        { autoComplete: commands, autoCompleteHint: true },
        function( error, command ){

    if(command.startsWith("attack")){
        normAttack();
    }

    if(command.startsWith("cast")){
        cast();
    }

    if(command.startsWith("test")){
        term("\n"+scrollLimit+"\n")
        term(scrollProg+"\n")
        term(newLines)
        newLines = 4
        updateBar();
    }

    if(command.startsWith("wait")){
        progressTurn();
        prompt();
    }

    if(command.startsWith("help")){
        help();
        updateBar();
    }

    if(command.startsWith("exit")){
        exitCombat();
    }

    if(command.startsWith("xp")){
        var XP = command.replace( /^\D+/g, '');
        addXP(XP)
    }

    if(command.startsWith("gold")){
        var ggold = command.replace( /^\D+/g, '');
        gold(ggold);
    }

    if(command.startsWith("spend")){
        var sgold = command.replace( /^\D+/g, '');
        spend(sgold);
    }

    if(command.startsWith("damage")){
        var damage = command.replace( /^\D+/g, '');
        hurt(damage);
    }

    if(command.startsWith("heal")){
        var damage = command.replace( /^\D+/g, '');
        heal(damage);
    }

    if(command.startsWith("rest")){
        rest();
    }

    if(command.startsWith("clear")){
        term.clear();
        updateBar();
    } 

    if(command.startsWith("list")){
        if (command.includes("weapons") | command.includes("Weapons")){
        // List all owned weapons
            listWeapons();
        }
        if (command.includes("spells") | command.includes("Spells")){
        // List all known spells
            listSpells();
        }
        if (command.includes("stats") | command.includes("Stats")){
        // List all stats
            listStats();
        }        
    }
    if(command == ""){updateBar();}

}
)
}

function writeFile(){ // Writes changes to JSON
    fs.writeFile(fileName, JSON.stringify(config, null, 2), function (err) {
        if (err) return term(err);
      });
}

function progressTurn(){
    config.combat[0].inCombat = true
    config.combat[0].turnCount = (config.combat[0].turnCount + 1)

    for (var i = 0; i < config.weapons.length; i++) { // Looking to see if any weapons have an arcane bonus or not
        if (config.weapons[i].enchanted != false){
            config.weapons[i].enchanted-- // if it does start ticking down that value
            writeFile();
        }

        if (config.weapons[i].enchanted === 0){
            config.weapons[i].enchanted = false // if it hits zero, remove the enchant
            term("\n\nYour enchanted "+ config.weapons[i].weapName +" has run out of magic...\n")
            writeFile();
        }
    }

    if (config.casted != 0){ // This bit checks to see if any spells are casted, and ticks those down
        var n = 0
        for (i in config.casted){
            n++
            if (config.casted[i] == 0){
                term("\n\n"+ i +" has run out!\n")
                delete config.casted[i]
            }
            if (config.casted[i] != 0){
                config.casted[i]--
            }
        }
    }

    writeFile();
}

function normAttack(){
    var weaps = [];

    for (var i = 0; i < config.weapons.length; i++){
        weaps.push(config.weapons[i].weapName);
    }
    term.hideCursor(true);
    term.singleColumnMenu(weaps, function(error, response) {

        if (config.weapons[response.selectedIndex].enchanted != false){
            bonus = (config.weapons[response.selectedIndex].weapBonus + config.caster[0].arcaneBonus)
            term("\nYou attacked with your enchanted " + config.weapons[response.selectedIndex].weapName + "! Your attack bonus is " + bonus + "\n");
        }

        if (config.weapons[response.selectedIndex].enchanted == false){
            term("\nYou attacked with your " + config.weapons[response.selectedIndex].weapName + "! Your attack bonus is " + config.weapons[response.selectedIndex].weapBonus + "\n");
        }

        progressTurn();
        writeFile();
        term.hideCursor(false);
        updateBar();
    }
    )   
}

function cast(){

    var spells = [];

    for (var i = 0; i < config.spells.length; i++){
        spells.push(config.spells[i].spellName); // For each spell in the config, add it to a new Array called Spells
    }

    term.hideCursor(true);

    term.gridMenu(spells, function(error, response) { // show menu for picking the intended spell from that array
        next = castSpell(response.selectedIndex);
        term.hideCursor(false);
    })
}

function enchWeap(){
    term.red("\nPlease select weapon to enchant...\n")
        
    var weaps = [];
    for (var i = 0; i < config.weapons.length; i++) {
        weaps.push(config.weapons[i].weapName);
    }

    term.gridMenu(weaps, function(error, response) { // Give the player a choice of what weapon to enchant

        if (config.stats[0].currentAP == 0){

            term.red("\nNo Arcane bonus points left!\n");
            updateBar();
            return 0;

        }

        if (config.stats[0].currentAP != 0) {

            config.weapons[response.selectedIndex].enchanted = 10;
            term.red("\nYou have enchanted your "+ config.weapons[response.selectedIndex].weapName +"! You have 10 turns to use it\n" )
            config.stats[0].currentAP--
            writeFile();
            updateBar();
            return 0;

        }
    })
}

function castSpell(index){

    if (config.spells[index].spellLevel == "AB") { // Checks if the spell is actually an Arcane Enchantment
        enchWeap();
    }

    for (var i = 0; i < 7 ; i++){

        if (config.spells[index].spellLevel == i){

            if (config.caster[1][i] == 0){  // Player is out of selected spell level slots, print message and shut that shit down
                term("\nYou're out of "+i+" level spells!\n")
                updateBar();
                return 0;
            }

            if (config.caster[1][i] != 0){ // Player has spell slots remaining, continue casting.
                config.caster[1][i]--

                if(config.spells[index].perLevels != 0){ // If the spell has turns per level, multiply turns by player level.
                    turns = (config.spells[index].spellTurns * config.stats[0].playerLevel)
                    config.spells[index].turnsLeft = turns

                    if (turns == 1){ 
                        term("\nYou cast " + config.spells[index].spellName + "\n");
                        writeFile();
                        updateBar();
                        return 0;
                    }

                    if (turns > 1){
                        term("\nYou cast " + config.spells[index].spellName + "! Your spell will wear off in " + turns + " Turns!\n");

                        config.casted[config.spells[index].spellName] = turns

                        writeFile();
                        updateBar();
                        return 0;
                    }

                    return 0;
                }

                if (config.spells[index].perLevels == 0){ // If it doesnt, dont. Stupid.
                    config.spells[index].turnsLeft = config.spells[index].spellTurns

                    if (config.spells[index].spellTurns == 1){ 
                        term("\nYou cast " + config.spells[index].spellName + "\n"); 
                        writeFile();
                        updateBar();
                        return 0;
                    }

                    if (config.spells[index].spellTurns > 1) {
                        term("\nYou cast " + config.spells[index].spellName + "! Your spell will wear off in " + config.spells[index].spellTurns + " Turns!\n");
                        writeFile();
                        updateBar();
                        return 0;
                    }

                    return 0;
                }
            }
        }
    }
}

function exitCombat(){
    if(config.combat[0].inCombat == false){term("\nYou're already out of combat!")}else{
    config.combat[0].inCombat = false
    config.combat[0].turnCount = 0
    config.combat[0].spellsCast = false
    for (var i = 0; i < config.spells.length; i++){
        config.spells[i].turnsLeft = 0;
    }
    term("\nYou have exited combat")
    }
    writeFile();
    updateBar();
}

function addXP(XP){
    var newcurrentXP = (parseInt(config.stats[0].currentXP) + parseInt(XP));
    config.stats[0].currentXP = newcurrentXP;
    if(config.stats[0].currentXP >= config.stats[0].nextlevelXP){
        config.stats[0].playerLevel = (config.stats[0].playerLevel + 1)
        config.stats[0].nextlevelXP = (config.levels[0][(config.stats[0].playerLevel + 1)])
        term(chalk.green("\nYou leveled up! you are now level " + config.stats[0].playerLevel)+"\n")
    }
    writeFile();
    term("\nXP: "+config.stats[0].currentXP+"/"+config.stats[0].nextlevelXP+clui.Gauge((config.stats[0].currentXP - config.levels[0][config.stats[0].playerLevel]), (config.stats[0].nextlevelXP - config.levels[0][config.stats[0].playerLevel]), 22)+"\n");
    term("Gained " + chalk.green(XP) + " XP! New current XP: " + chalk.green(newcurrentXP) + " (Only " + chalk.green((parseInt(config.stats[0].nextlevelXP) - parseInt(config.stats[0].currentXP))) + " to next level!)");
    updateBar();
}

function gold(ggold){
    var newcurrentGP = (parseInt(config.stats[0].currentGP) + parseInt(ggold));
    config.stats[0].currentGP = newcurrentGP;
    writeFile();
    term("\nGained " + chalk.yellow(ggold) + " Gold! New current GP: " + chalk.yellow(newcurrentGP))
    updateBar();
}

function spend(sgold){
    var newcurrentGP = (parseInt(config.stats[0].currentGP) - parseInt(sgold));
    config.stats[0].currentGP = newcurrentGP;
    writeFile();
    term("\nSpent " + chalk.red(sgold) + " Gold! New current GP: " + chalk.red(newcurrentGP));
    updateBar();
}

function rest(){

    if(config.combat[0].inCombat == false){
    config.caster[1][0] = config.caster[0].cantripsPerDay; // Reset all remaining spell slots
    config.caster[1][1] = config.caster[0].firstPerDay;
    config.caster[1][2] = config.caster[0].secondPerDay;
    config.caster[1][3] = config.caster[0].thirdPerDay;
    config.caster[1][4] = config.caster[0].fourthPerDay;
    config.caster[1][5] = config.caster[0].fifthPerDay;
    config.caster[1][6] = config.caster[0]. sixthPerDay;
    config.stats[0].currentAP = config.stats[0].maxAP;

    for (var i = 0; i < config.weapons.length; i++) { // Removes weapon enchantments
        config.weapons[i].enchanted = false;
    }

    if (config.casted != 0){ // Decast all spells
        for (i in config.casted){
            delete config.casted[i]   
        }
    }

    if((config.stats[0].currentHP + 1*config.stats[0].playerLevel) <= config.stats[0].maxHP){ // Do calculations for restoring HP
    config.stats[0].currentHP = config.stats[0].currentHP + 1*config.stats[0].playerLevel;
    }else{config.stats[0].currentHP = config.stats[0].maxHP}
    term("\nYou are now well rested!")
    }else{
    term("\nYou cannot rest while enemies are nearby! please exit combat first...")
    }
    writeFile();
    
    updateBar();
}

function heal(hpd){
    if((config.stats[0].currentHP + parseInt(hpd)) <= config.stats[0].maxHP){
        config.stats[0].currentHP = config.stats[0].currentHP + parseInt(hpd);
        }else{config.stats[0].currentHP = config.stats[0].maxHP}

    writeFile();
    term("\nHP: "+config.stats[0].currentHP+"/"+config.stats[0].maxHP+clui.Gauge(config.stats[0].currentHP, config.stats[0].maxHP, 22)+"\n");
    term("Restored " + chalk.green(hpd) + " HP! Remaining HP: " + chalk.green(config.stats[0].currentHP));
    updateBar();
}

function hurt(hpd){
    var newcurrentHP = (parseInt(config.stats[0].currentHP) - parseInt(hpd));
    config.stats[0].currentHP = newcurrentHP;
    writeFile();
    term("\nHP: "+config.stats[0].currentHP+"/"+config.stats[0].maxHP+clui.Gauge(config.stats[0].currentHP, config.stats[0].maxHP, 22)+"\n");
    term("Lost " + chalk.red(hpd) + " HP! Remaining HP: " + chalk.red(newcurrentHP));
    newLines = 3
    updateBar();
}

function help(){
    term("\nPathguider by Robin Universe\n"+
    "\n^r<help>^w - Shows this"+
    "\n^r<cast>^w - Brings up menu to cast a spell"+
    "\n^r<attack>^w - brings up menu to attack"+
    "\n^r<heal> ^m<X>^w - heals ^mX^w damage"+
    "\n^r<damage> ^m<X>^w - removes ^mX^w health"+
    "\n^r<XP> ^m<X>^w - Adds ^mX^w experience points"+
    "\n^r<gold> ^m<X>^w - adds ^mX^w gold"+
    "\n^r<spend> ^m<X>^w - removes ^mX^w gold"+
    "\n^r<rest>^w - apply a full rest ( Restores spell slots, AP, and heals 1HP/LVL )"+
    "\n^r<wait>^w - skips a round of combat without doing anything"+
    "\n^r<exit>^w - Exits tracked combat"+
    "\n^r<clear>^w - clears the screen\n")
}

function updateBar(nl){
    HPbar = "HP: " + config.stats[0].currentHP+"/"+config.stats[0].maxHP+clui.Gauge(config.stats[0].currentHP, config.stats[0].maxHP, 22)
    GPbar = "GP: " + chalk.yellow(config.stats[0].currentGP)
    APbar = "AP: " + config.stats[0].currentAP+"/"+config.stats[0].maxAP
    SPbar = "0th: " + config.caster[1][0]+"/"+config.caster[0].cantripsPerDay + " 1st: " + config.caster[1][1]+"/"+config.caster[0].firstPerDay + " 2nd: " + config.caster[1][2]+"/"+config.caster[0].secondPerDay 
    XPbar = "XP: " + config.stats[0].currentXP+"/"+config.stats[0].nextlevelXP+clui.Gauge((config.stats[0].currentXP - config.levels[0][config.stats[0].playerLevel]), (config.stats[0].nextlevelXP - config.levels[0][config.stats[0].playerLevel]), 22)
    term.saveCursor();
    term.moveTo(1,term.height)
    term.bgBlack(HPbar +" | "+GPbar+" | "+XPbar+" | "+SPbar+" | "+APbar)
    term.restoreCursor();
    prompt(nl);
}

function listWeapons(){
    for (var i = 0; i < config.weapons.length; i++){
        term(
        config.weapons[i].weapName + 
        " - Bonus: " + 
        config.weapons[i].weapBonus+"\n")
    }
    updateBar();
}

function listSpells(){
    term("\n\n")
        for (var i = 0; i < config.spells.length; i++){
            term(
            config.spells[i].spellName + 
            " - Level: " + 
            config.spells[i].spellLevel+
            " - Turns Left: " +
            config.spells[i].turnsLeft+"\n")
        }
        updateBar();
}

function listStats(){
    term("\n")
    console.table(config.stats[0]);
    updateBar();
}
