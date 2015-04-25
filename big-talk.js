exports.commands = {
	bigtalk: function (target, room, user) {
		if (!this.can('hotpatch')) return false;
		msg = target;
		if (!msg || msg === ' ') return this.sendReply('/bigtalk [target] - Makes u talk like a big boi.  Requires ~.');
		if (user.userid === 'panpawn') {
			if (user.hiding) return room.add('|raw|<div class="chat"><button class="astext" name="parseCommand" value="/user '+user.name+'" target="_blank"><strong><font color="#DA9D01" size="7"><span class="username" data-name="' + user.name + '">' + user.name + '</span>:</font></strong></button> <em class="mine">' + msg + '</em></div>');
			room.add('|raw|<div class="chat"><button class="astext" name="parseCommand" value="/user '+user.name+'" target="_blank"><strong><font color="#DA9D01" size="7">' + user.group + '<span class="username" data-name="' + user.group + user.name + '">' + user.name + '</span>:</font></strong></button> <em class="mine">' + msg + '</em></div>');
			return false;
		} else {
			if (user.hiding) return room.add('|raw|<div class="chat"><button class="astext" name="parseCommand" value="/user '+user.name+'" target="_blank"><strong><font color="' + hashColor(user.userid)+'" size="7"><span class="username" data-name="' + user.name + '">' + user.name + '</span>:</font></strong></button> <em class="mine">' + msg + '</em></div>');
			room.add('|raw|<div class="chat"><button class="astext" name="parseCommand" value="/user '+user.name+'" target="_blank"><strong><font color="' + hashColor(user.userid)+'" size="7">' + user.group + '<span class="username" data-name="' + user.group + user.name + '">' + user.name + '</span>:</font></strong></button> <em class="mine">' + msg + '</em></div>');
			return false;
		}
	}
};
