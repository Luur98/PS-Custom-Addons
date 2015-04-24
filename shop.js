var shop = {
	host: "45.56.82.40",
	port: 8000,
	currency: "Goats",
	symbol: "G",
	dailyLogins: new Object(),
	gains: {
		battle: 0.5,
		perHour: 1,
		twistWin: 0.1,
		rebusWin: 0.25,
		dailyLogins: 2,
		tour: "goats won = number of players in tournaments"
	},
	items: {
		"symbol": {
			name: "Custom Symbol",
			cost: 25,
			daily: 2.5,
			desc: "Get a symbol by your name (Cannot be a symbol of authority)"
		},
		"avatar": {
			name: "Custom Avatar",
			cost: 100,
			daily: 10,
			desc: "Get your own avatar (/buy avatar, url) (if animated 25 daily)"
		},
		"glow": {
			name: "Name Glow",
			cost: 50,
			daily: 15,
			desc: "Adds a 'glow' effect to your name of your specified color. (/buy glow, color)"
		},
	},
	userInit: function(name, connection) {
		var oneDayMilliseconds = 1000 * 1 * 60 * 60 * 24;
		var cmilliseconds = (new Date() / 1);
		if (typeof name == "object" && name.name) name = name.name;
		var uid = toId(name);
		//daily join shit
		if (!this.dailyLogins[uid]) {
			this.dailyLogins[uid] = {
				firstJoinOfDay: cmilliseconds,
				lastSeen: cmilliseconds
			};
			this.giveMoney(uid, this.gains.dailyLogins, connection);
		} else {
			this.dailyLogins[uid].lastSeen = cmilliseconds;
			var lastTime = this.dailyLogins[uid].firstJoinOfDay;
			if (cmilliseconds - lastTime >= oneDayMilliseconds) {
				//a day or more since last coming
				this.dailyLogins[uid].firstJoinOfDay = cmilliseconds;
				this.giveMoney(uid, this.gains.dailyLogins, connection);
			}
		}
		
		//set up their shit
		var user = Users.users[toId(name)];
		if (!user) return false;
		var wallet = this.wallets[uid];
		if (!wallet) return;
		//avatar
		if (wallet.items.avatar) {
			var changeAvy = true;
			if (cmilliseconds - wallet.items.avatar.lastPayment >= oneDayMilliseconds) {
				if (wallet.money < wallet.items.avatar.daily) {
					user.send('You don\'t have anymore funds to maintain your custom avatar.');
					changeAvy = false;
					delete wallet.items.avatar;
				} else {
					//take out funds
					wallet.money = wallet.money - wallet.items.avatar.daily;
					wallet.items.avatar.lastPayment = cmilliseconds;
					user.send(wallet.items.avatar.daily + shop.avatar + '\'s were taken from your wallet to maintain your custom avatar.');
				}
			}
			if (changeAvy) user.avatar = wallet.items.avatar.val;
		}
		//symbol
		if (wallet.items.symbol) {
			if (cmilliseconds - wallet.items.symbol.lastPayment >= oneDayMilliseconds) {
				if (wallet.money < wallet.items.symbol.daily) {
					user.send('You don\'t have anymore funds to maintain your custom symbol.');
					wallet.items.symbol.val = " ";
				} else {
					//take out funds
					wallet.money = wallet.money - wallet.items.symbol.daily;
					wallet.items.symbol.lastPayment = cmilliseconds;
					user.send(wallet.items.symbol.daily + shop.symbol + '\'s were taken from your wallet to maintain your custom symbol.');
				}
			}
			user.getIdentity = function (roomid) {
					if (!roomid) roomid = 'lobby';
					var name = this.name + (this.away ? " - \u0410\u051d\u0430\u0443" : "");
					if (this.locked) {
							return '‽' + name;
					}
					if (this.mutedRooms[roomid]) {
							return '!' + name;
					}
					var room = Rooms.rooms[roomid];
					if (room.auth) {
							if (room.auth[this.userid]) {
									return room.auth[this.userid] + name;
							}
							if (room.isPrivate) return ' ' + name;
					}
					var symbol = wallet.items.symbol;
					if (symbol) symbol = symbol.val; else symbol = this.group;
					return symbol + name;
			};
			user.updateIdentity();
			if (wallet.items.symbol.val == " ") {
				delete wallet.items.symbol;
			}
		}
		//name glow
		if (wallet.items.glow) {
			if (cmilliseconds - wallet.items.glow.lastPayment >= oneDayMilliseconds) {
				if (wallet.money < wallet.items.glow.daily) {
					user.send('You don\'t have anymore funds to maintain your custom name glow.');
					wallet.items.glow.val = " ";
					delete wallet.items.glow;
				} else {
					//take out funds
					wallet.money = wallet.money - wallet.items.glow.daily;
					wallet.items.glow.lastPayment = cmilliseconds;
					user.send(wallet.items.glow.daily + shop.symbol + '\'s were taken from your wallet to maintain your name glow.');
				}
			}
		}
	},
	wallets: new Object(),
	openWallets: function() {
		if (typeof fs == "undefined") fs = require('fs');
		fs.readFile('./config/wallets.txt', function(err, data) {
			data = '' + data;
			var wallets = new Object();
			//import wallets
					//ITEMS = Glow]red]1403095657559|Symbol]M]123456789
					//"bootybot":{"money":87,"items":{"glow":{"name":"glow","val":"red","lastPayment":1403095657559,"daily":15},"symbol":{"name":"Symbol","val":"M","lastPayment":123456789,"daily":3}},"hours":87,"minutes":46}
					//^that === bootybot[87[ITEMS[87[46@
			var usersRay = data.split('@');
			for (var i in usersRay) {
				var ray = usersRay[i].split('[');
				var items = new Object();
				var itemsRay = ray[2].split('|');
				if (itemsRay.length) {
					for (var x in itemsRay) {
						var itemRay = itemsRay[x].split(']');
						if (itemRay.length) {
							if (shop.items[toId(itemRay[0])]) {
								items[toId(itemRay[0])] = {
									name: itemRay[0],
									val: itemRay[1],
									lastPayment: Math.abs(itemRay[2]),
									daily: shop.items[toId(itemRay[0])].daily
								};
							}
						}
					}
				}
				wallets[ray[0]] = {
					money: Math.abs(ray[1]),
					items: items,
					hours: Math.abs(ray[3]),
					minutes: Math.abs(ray[4])
				};
			}
			
			//add parsed data wallets to shop.wallets
			for (var i in wallets) {
				shop.wallets[i] = new Object();
				for (var x in wallets[i]) {
					if (x == "items") {
						//items is an object, maybe we can loop? idk
						shop.wallets[i].items = JSON.parse(JSON.stringify(wallets[i].items));
					} else {
						shop.wallets[i][x] = wallets[i][x];
					}
				}
			}
		});
	},
	loopitaFunk: function() {
		var loopita = function() {
			for (var i in Users.users) {
				var u = Users.users[i];
				if (u.connected) {
					var wallet = shop.wallets[u.userid];
					if (!wallet) shop.newWallet(u.userid);
					wallet = shop.wallets[u.userid];
					wallet.minutes = wallet.minutes + 1;
					if (wallet.minutes == 60) {
						shop.giveMoney(u.userid, shop.gains.perHour);
						wallet.minutes = 0;
						wallet.hours = wallet.hours + 1;
					}
				}
			}
			shop.loopitaFunk();
		};
		shopLoopita = setTimeout(loopita, 1000 * 60);
	},
	money: function(name) {
		if (typeof name == "object" && name.name) name = name.name;
		var uid = toId(name);
		var wallet = this.wallets[uid];
		if (!wallet) return 0;
		return wallet.money;
	},
	userItems: function(name) {
		if (typeof name == "object" && name.name) name = name.name;
		var uid = toId(name);
		var wallet = this.wallets[uid];
		if (!wallet) return 0;
		return Object.keys(wallet.items);
	},
	minutes: function(name) {
		if (typeof name == "object" && name.name) name = name.name;
		var uid = toId(name);
		var wallet = this.wallets[uid];
		if (!wallet) return 0;
		return wallet.hours + " hour(s) and " + wallet.minutes + " minutes";
	},
	newWallet: function(uid) {
		var uid = toId(uid);
		if (!Users.users[uid]) return "That user doesn't exist.";
		this.wallets[uid] = {
			money: 0,
			items: new Object(),
			hours: 0,
			minutes: 0,
		};
		return this.wallets[uid];
	},
	round: function(num, places) {
		if (typeof places == "undefined") places = 2; //because money only has two decimals :3
		var multiplier = Math.pow(10, places);
		return Math.round(num * multiplier) / multiplier;
	},
	giveMoney: function(name, amount, connection) {
		if (typeof name == "object" && name.name) name = name.name;
		var uid = toId(name);
		if (!this.wallets[uid]) this.newWallet(name);
		var wallet = this.wallets[uid];
		if (typeof wallet == "string") return wallet;
		if (typeof amount == "string") amount = Math.abs(amount);
		if (isNaN(amount)) return "Not a number.";
		if (amount < 0) return "Less than 0.";
		if (!wallet) return "no wallet still :s";
		wallet.money = this.round(Math.abs(wallet.money) + Math.abs(amount));
		var socket;
		if (Users.users[uid]) socket = Users.users[uid];
		if (connection) socket = connection;
		if (socket.send) socket.send('|raw|+' + amount + this.currency + '\'s. You now have <b>' + wallet.money + this.currency + '\'s</b>');
		return wallet.money;
	},
	takeMoney: function(name, amount, item) {
		if (typeof name == "object" && name.name) name = name.name;
		var uid = toId(name);
		var wallet = this.wallets[uid];
		if (!wallet) return "User has no wallet.";
		if (typeof amount == "string") amount = Math.abs(amount);
		if (isNaN(amount)) return "Not a number.";
		if (amount < 0) return "Less than 0.";
		wallet.money = this.round(wallet.money - amount);
		if (wallet.money < 0) wallet.money = 0;
		if (item) wallet.items[item.name] = item;
		return wallet.money;
	},
	stringifyWallets: function() {
		var insides = '',
				wallets = this.wallets,
				currentWallet = 0,
				lastWallet = Object.keys(this.wallets).length;
		for (var i in wallets) {
			currentWallet++;
			if (i.substr(0, 5) == "guest") delete wallets[i]; else {
				//ITEMS = Glow]red]1403095657559|Symbol]M]123456789
				//"bootybot":{"money":87,"items":{"glow":{"name":"glow","val":"red","lastPayment":1403095657559,"daily":15},"symbol":{"name":"Symbol","val":"M","lastPayment":123456789,"daily":3}},"hours":87,"minutes":46}
				//^that === bootybot[87[ITEMS[87[46@
				var wallet = wallets[i], items = '';
				for (var x in wallet.items) {
					var item = wallet.items[x];
					items += item.name + "]";
					items += item.val + "]";
					items += item.lastPayment;
					items += "|";
				}
				items = items.slice(0, -1);
				insides += i + "["; //userid
				insides += wallet.money + "["; //money
				insides += items + "["; //items
				insides += wallet.hours + "["; //hours
				insides += wallet.minutes; //minutes
				if (lastWallet != currentWallet) insides += "@";
			}
		}
		insides = insides.slice(0, -1);
		return insides;
	},
	commands: {
		transfer: function(target, room, user) {
			if (!target) return this.sendReply('User does not exist.');
			if (target.split(',').length != 2) return this.sendReply('The correct syntax for this command is /givemoney user, amount');
			var tar = user,
					targ = target.split(',')[0],
					amount = Math.abs(target.split(',')[1]);
			if (tar) tar = Users.users[toId(targ)];
			if (!tar) return this.sendReply('user does not exist.');
			if (isNaN(amount)) return this.sendReply('That\'s not a number.');
			if (amount > shop.money(user.userid)) return this.sendReply('That\'s more ' + shop.currency + '\'s than you actually have.');
			if (amount == 0) return this.sendReply('You can\'t give 0' + shop.currency + '\'s.');
			room.add(user.name + ' just transfered ' + amount + shop.currency + '\'s to ' + tar.name + '.');
			shop.giveMoney(tar.userid, amount);
			shop.takeMoney(user.userid, amount);
		},
		givemoney: function(target, room, user) {
			if (!this.can('hotpatch')) return this.sendReply('Not enough auth.');
			if (!target) return this.sendReply('User does not exist.');
			if (target.split(',').length != 2) return this.sendReply('The correct syntax for this command is /givemoney user, amount');
			var tar = user,
					targ = target.split(',')[0],
					amount = Math.abs(target.split(',')[1]);
			if (tar) tar = Users.users[toId(targ)];
			if (!tar) return this.sendReply('user does not exist.');
			if (isNaN(amount)) return this.sendReply('That\'s not a number.');
			if (amount == 0) return this.sendReply('You can\'t give 0' + shop.currency + '\'s.');
			room.add(user.name + ' just gave ' + tar.name + ' ' + amount + shop.currency + '\'s. They now have ' + shop.giveMoney(tar.userid, amount) + shop.currency + '\'s.');
		},
		takemoney: function(target, room, user) {
			if (!this.can('hotpatch')) return this.sendReply('Not enough auth.');
			if (!target) return this.sendReply('User does not exist.');
			if (target.split(',').length != 2) return this.sendReply('The correct syntax for this command is /takemoney user, amount');
			var tar = user,
					targ = target.split(',')[0],
					amount = Math.abs(target.split(',')[1]);
			if (tar) tar = Users.users[toId(targ)];
			if (!tar) return this.sendReply('user does not exist.');
			if (isNaN(amount)) return this.sendReply('That\'s not a number.');
			if (amount == 0) return this.sendReply('You can\'t take 0' + shop.currency + '\'s.');
			room.add(user.name + ' just took from ' + tar.name + ' ' + amount + shop.currency + '\'s. They now have ' + shop.takeMoney(tar.userid, amount) + shop.currency + '\'s.');
		},
		seen: function(target, room, user) {
			if (!this.canBroadcast()) return;
			var tar = user;
			if (target) tar = Users.users[toId(target)];
			if (!tar) return this.sendReply('user does not exist.');
			var uid = tar.userid;
			this.sendReply(((shop.dailyLogins[uid]) ? ("Last seen: " + (((new Date() / 1 - shop.dailyLogins[uid].lastSeen) / 1000 / 60)) + " minutes ago.") : "Hasn't come... :c"));
		},
		profile: function(target, room, user) {
			if (!this.canBroadcast()) return;
			var tar = user;
			if (target) tar = Users.users[toId(target)];
			if (!tar) return this.sendReply('user does not exist.');
			var uid = tar.userid;
			var avvy, name, group, lastSeen, money, items;
			if (!isNaN(Math.abs(tar.avatar))) avvy = 'http://play.pokemonshowdown.com/sprites/trainers/' + tar.avatar + '.png'; else {
				avvy = 'http://' + shop.host + ':' + shop.port + '/avatars/' + tar.avatar;
			}
			name = tar.name;
			group = Config.groups[tar.group];
			if (group) group = group.name;
			if (!group) group = 'User';
			lastSeen = "Hasn't been seen";
			money = 0;
			if (shop.wallets[uid]) {
				if (shop.dailyLogins[uid]) {
					var minutes = (new Date() / 1 - shop.dailyLogins[uid].lastSeen) / 1000 / 60;
					lastSeen = minutes + " minutes ago";
				}
				money = shop.wallets[uid].money + shop.currency + '\'s';
			}
			if (tar.connected) lastSeen = "Currently Online";
			items = shop.userItems(tar.name);
			if (!items || items.length == 0) items = 'None';
			var insides = '';
			insides += '<img src="' + avvy + '" align="left" height="80" />';
			insides += '&nbsp;&nbsp;<font color="blueviolet"><b>Name:</b></font> ' + name;
			insides += '<br />&nbsp;&nbsp;<font color="blueviolet"><b>Group:</b></font> ' + group;
			insides += '<br />&nbsp;&nbsp;<font color="blueviolet"><b>Last Seen:</b></font> ' + lastSeen;
			insides += '<br />&nbsp;&nbsp;<font color="blueviolet"><b>Money:</b></font> ' + money;
			insides += '<br />&nbsp;&nbsp;<font color="blueviolet"><b>Items:</b></font> ' + items;
			insides += '<br /><br />';
			this.sendReplyBox(insides);
		},
		updateshop: function(target, room, user) {
			if (!this.can('hotpatch')) return false;
			var funky = this.sendReply;
			var cachewallets = shop.wallets;
			var cachedailyLogins = shop.dailyLogins;
			shop = undefined;
			clearTimeout(shopLoopita);
			CommandParser.uncacheTree('./shop.js');
			shop = require('./shop.js').shop;
			shop.wallets = cachewallets;
			shop.dailyLogins = cachedailyLogins;
			funky('Updated shop.');
			fs.writeFile('./config/wallets.txt', shop.stringifyWallets());
		},
		minutes: function(target, room, user) {
			if (!this.canBroadcast()) return;
			var tar = user;
			if (target) tar = Users.users[toId(target)];
			if (!tar) return this.sendReply('user does not exist.');
			this.sendReply(shop.minutes(tar.name));
		},
		wallet: 'purse',
		money: 'purse',
		purse: function(target, room, user, connection, cmd) {
			if (!this.canBroadcast()) return;
			var purse = 'http://www.pursepage.com/wp-content/uploads/2008/02/gucci-hysteria-top-handle-bag.gif';
			if (cmd == "wallet" || cmd == "money") purse = 'http://informationng.com/wp-content/uploads/2013/11/wallet.jpg'; //if command == wallet
			var tar = user;
			if (target) tar = Users.users[toId(target)];
			if (!tar) return this.sendReply('user does not exist.');
			var insides = '';
			insides += '<img src="' + purse + '" height="100" align="left" />';
			insides += '&nbsp;&nbsp;Money: ' + shop.money(tar.name) + '<br />';
			insides += '&nbsp;&nbsp;Items: ' + shop.userItems(tar.name) + '<br /><br /><br /><br /><br /><br /><br />';
			this.sendReplyBox(insides);
		},
		shop: function(target, room, user) {
			if (!this.canBroadcast()) return;
			var insides = '';
			insides += '<center><h4><u>Shop</h4></b></center>';
			insides += '<table border="1" width="100%" cellspacing="0" cellpadding="5">';
			insides += '<tr bgcolor="#947bff"><th>Item</th><th>Description</th><th>Cost</th><th>Daily Cost</th></tr>';
			for (var i in shop.items) {
				insides += '<tr>'
				insides += '<td>' + shop.items[i].name + '</td>';
				insides += '<td>' + shop.items[i].desc + '</td>';
				insides += '<td align="center">' + shop.items[i].cost + '</td>';
				insides += '<td align="center">' + shop.items[i].daily + '</td>';
				insides += '</tr>';
			}
			insides += '</table>';
			insides += 'You have: ' + shop.money(user.name) + shop.currency + '\'s';
			this.sendReply('|raw|' + insides);
		},
		buy: function(target, room, user) {
			if (!target) return this.sendReply('Invalid item.');
			var item = target;
			if (item.split(',').length - 1 > 0) item = toId(target.split(',')[0]);
			var alternateNames = {
				"customavatar": "avatar",
				"custom avatar": "avatar",
				"avvy": "avatar",
				"customsymbol": "symbol",
				"custom symbol": "symbol",
				"group": "symbol",
				"nameglow": "glow",
				"name glow": "glow",
				"namecolor": "glow",
				"name color": "glow",
			};
			if (alternateNames[toId(item)]) item = alternateNames[toId(item)];
			if (!shop.items[item]) return this.sendReply('Invalid item.');
			var value = target.substr(item.length + 1);
			if (!value) return this.sendReply('You\'re not gonna tell me HOW you want the item?');
			function in_it(needle, haystack) {
				if (typeof needle != "string" || typeof haystack != "string") return 0;
				return haystack.toLowerCase().split(needle.toLowerCase()).length - 1;
			}
			if (item == "avatar") {
				if (!in_it(".jpg", value) && !in_it(".png", value) && !in_it(".gif", value)) return this.sendReply('The image has to be a png, jpg, or gif. (gif = 25' + shop.symbol + '\'s/day, rest = 10' + shop.symbol + '\'s/day)');
				var daily = shop.items[item].daily;
				var cost = shop.items[item].cost;
				if (in_it(".gif")) daily = 25;
				var rightnowcost = daily + cost;
				if (shop.money(user.name) < rightnowcost) return this.sendReply('You don\'t have enough ' + shop.currency + '\'s');
				if (!global.fs) global.fs = require('fs');
				if (!global.request) global.request = require('request');
				var download = function(uri, filename, callback) {
					request.head(uri, function(err, res, body) {
						if (err) return false;
						console.log('content-type:', res.headers['content-type']);
						console.log('content-length:', res.headers['content-length']);
						request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
					});
				};
				var type;
				if (in_it(".jpg", value)) type = ".jpg";
				if (in_it(".png", value)) type = ".png";
				if (in_it(".gif", value)) type = ".gif";
				shop.takeMoney(user.name, rightnowcost, {
					name: item,
					val: user.userid + type,
					lastPayment: new Date() / 1,
					daily: daily
				});
				var that = this;
				function doneDownload(that, user, fileType) {
					user.avatar = user.userid + fileType;
					that.sendReply('Download complete. Your avatar is set.');
				}
				download(value, "./config/avatars/" + user.userid + type, function() {doneDownload(that, user, type);});
			}
			if (item == "symbol") {
				var symbol = value.substr(0, 1);
				if (symbol == " ") symbol = value.substr(1, 2);
				if (symbol == "") return this.sendReply('Well, actually pick a symbol now.');
				if (Config.groups[symbol] || symbol.match(/[A-Za-z\d]+/g) || '‽!+%@\u2605&~#'.indexOf(symbol) >= 0) return this.sendReply('You can\'t use that symbol... sorry!');
				var daily = shop.items[item].daily;
				var cost = shop.items[item].cost;
				var rightnowcost = daily + cost;
				if (shop.money(user.name) < rightnowcost) return this.sendReply('You don\'t have enough ' + shop.currency + '\'s');
				shop.takeMoney(user.name, rightnowcost, {
					name: item,
					val: symbol,
					lastPayment: new Date() / 1,
					daily: daily
				});
				this.sendReply('Now just refresh and your new symbol will be set!');
			}
			if (item == "glow") {
				var color = toId(value);
				var colorsAvailable = {
					"yellow": true,
					"red": true,
					"black": true,
					"pink": true,
					"salmon": true,
					"lightgreen": true,
					"green": true,
					"orange": true,
					"blue": true,
					"darkblue": true,
					"purple": true,
				};
				if (color == "") return this.sendReply('Well, actually pick a color now.');
				if (!colorsAvailable[color]) return this.sendReply('We don\'t have that color... sorry! Maybe you should suggest it? We only have... ' + Object.keys(colorsAvailable).join(', '));
				var daily = shop.items[item].daily;
				var cost = shop.items[item].cost;
				var rightnowcost = daily + cost;
				if (shop.money(user.name) < rightnowcost) return this.sendReply('You don\'t have enough ' + shop.currency + '\'s');
				shop.takeMoney(user.name, rightnowcost, {
					name: item,
					val: color,
					lastPayment: new Date() / 1,
					daily: daily
				});
				this.sendReply('Your name glow has been set. Talk away!');
			}
			room.add("|c|Booty-Bot|" + user.name + " just bought a " + shop.items[item].name + ". - " + value);
		},
	}
};
exports.shop = shop;
Users.User.prototype.rename = (function() {
	if (typeof cached_renameFunction == "undefined") cached_renameFunction = Users.User.prototype.rename;
	return function(name, token, auth, connection) {
		//shop line
		if (toId(name).substr(0, 5) != "guest") shop.userInit(name, connection);
		cached_renameFunction.apply(this, arguments);
	};
}());
if (global.CommandParser) for (var i in exports.shop.commands) global.CommandParser.commands[i] = exports.shop.commands[i];
if (typeof shopLoopita != "undefined") clearTimeout(shopLoopita);
shop.loopitaFunk();
shop.openWallets();
