exports.dice = {
    compareRolls: function(players, room) {
		var ran = function() {return Math.floor(Math.random() * 6) + 1;};
		var rolls = [ran(), ran()];
		var winner = Users.users[players[1]].userid;
		var loser = Users.users[players[0]].userid;
		if (rolls[0] > rolls[1]) { 
			winner = Users.users[players[0]].userid; 
			loser = Users.users[players[1]].userid;
		}
		if (rolls[1] != rolls[0]) {
			var insides = '<table>';
			insides += "<tr>";
			insides += "<td>" + Users.users[players[0]].name + "</td>";
			insides += "<td>" + Users.users[players[1]].name + "</td>";
			insides += "</tr>";
			insides += "<tr>";
			insides += "<td>" + rolls[0] + "</td>";
			insides += "<td>" + rolls[1] + "</td>";
			insides += "</tr>";
			insides += "</table>";
			insides += ('<font color=#24678d> ' + winner + ' wins the dice game and ' +'<font color=red>'+ dice[room.id].bet +'</font> bucks.</font>');
			room.addRaw(insides);
			var giveMoney = Number(dice[room.id].bet);
			shop.giveMoney(Users.users[winner].userid, giveMoney);

			var takeMoney = Number(dice[room.id].bet);
			shop.takeMoney(Users.users[loser].userid, takeMoney);
		} else { 
			room.add('It was a draw, both frens keep their money');
		}
		delete dice[room.id];
	}
};
var cmds = {
	dice: function(target, room, user) {
		if (target == "join") return this.parse('/joindice');
		if (target == "end") return this.parse('/enddice');
		if (dice[room.id]) return this.parse('/joindice');
		if (!dice[room.id]) return this.parse('/startdice ' + target);
	 },
 
	startdice: function(target, room, user) {
		if(!this.can('broadcast') && !room.auth[user.userid]) return;
		if(isNaN(target) || !target || target == 0) return this.sendReply('Please use a real number fren.');
		if(dice[room.id]) return this.sendReply('There is already a dice game in this room fren.');
		var target = parseInt(target)
		if(shop.money(user.userid) < target) return this.sendReply('You cannot bet more than you have fren.');
		 var b = shop.currency;
		 if(target === 1)  b = shop.symbol;
		dice[room.id] = {
			bet: target,
			players: []
		};
		this.add('|raw|<div class="infobox"><h2><center><font color=#24678d>' + user.name + ' has started a dice game for </font><font color=red>' + dice[room.id].bet  + ' </font><font color=#24678d>'+ b + '.</font><br /> <button name="send" value="/joindice">Click to join.</button></center></h2></div> ');
	 },
 
	joindice: function(target, room, user) {
		if(!dice[room.id]) return this.sendReply('There is no dice game in this room fren.');
		if(shop.money(user.userid) < dice[room.id].bet || isNaN(Number(shop.money(user.userid)))) return this.sendReply('You cannot bet more than you have fren.');
		if(dice[room.id].players.indexOf(user.userid) > -1) {
			this.sendReply('You\'re already in this game fren.');
			return false;
		}
		room.addRaw('<b>'+ user.name + ' has joined the game of dice.</b>');
		dice[room.id].players.push(user.userid);
		if(dice[room.id].players.length === 2) {
			dice.compareRolls(dice[room.id].players, room);
		}
	},

	enddice: function(target, room, user) {
		if(!this.can('broadcast') && !room.auth[user.userid]) return;
		if(!dice[room.id]) return this.sendReply('There is no dice game, why don\'t you start one with /startdice.');
		room.addRaw('<b>'+ user.name + ' has ended the dice game</b>');
		delete dice[room.id];
	}
};
for (var i in cmds) CommandParser.commands[i] = cmds[i];
