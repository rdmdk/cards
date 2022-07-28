const m = document.querySelector('main'),
clubs = ['c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9', 'c10', 'cj', 'cq', 'ck', 'ca'],
diamonds = ['d2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8', 'd9', 'd10', 'dj', 'dq', 'dk', 'da'],
hearts = ['h2', 'h3', 'h4', 'h5', 'h6', 'h7', 'h8', 'h9', 'h10', 'hj', 'hq', 'hk', 'ha'],
spades = ['s2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10', 'sj', 'sq', 'sk', 'sa'];

let deck = [...clubs, ...diamonds, ...hearts, ...spades].sort(() => Math.random() - 0.5),
r = window.location.search ? Number(window.location.search.substring(1)) : sessionStorage.players ? Number(sessionStorage.players) : Math.floor(Math.random() * (12 - 2) + 2),
players,
buttons;

r = r < 2 ? 2 : r > 12 ? 12 : r;

if (window.location.search !== '') {
	if (sessionStorage.players !== window.location.search.substring(1)) sessionStorage.clear();
	history.pushState(null, null, 'https://rdmdk.github.io/cards/');
}

sessionStorage.players = r;

for (i = 0; i < r; i++) {
	const h = '<section class="player"><h2>&nbsp;</h2><div class="hand"></div><h3><span class="bet">0</span><span class="bank">100</span></h3><span class="actions"><button class="hit">hit</button><button class="stand">stand</button></span></section>';
	m.insertAdjacentHTML('beforeend', h);
}

players = m.querySelectorAll('.player');
buttons = m.querySelectorAll('button');

if (sessionStorage.winner) {
	if (sessionStorage.jackpot) players[sessionStorage.winner].querySelector('h3 .bank').innerText = sessionStorage.jackpot;
}

if (players.length > 2 && players.length % 2 === 0 || players.length > 3) m.classList.add('grid');

document.querySelector('html').dataset.players = players.length;

function hit(a) {
	const hand = a.querySelector('.hand');
	let total = 0;

	hand.insertAdjacentHTML('beforeend', '<span style class="' + deck[0] + ' card"><span></span></span>');
	
	setTimeout(() => {
		hand.querySelectorAll('.card').forEach(c => {
			let value = /[jqk]/gm.test(c.classList[0]) ? 10 : /a/gm.test(c.classList[0]) && total >= 10 ? 1 : /a/gm.test(c.classList[0]) ? 11 : Number(c.classList[0].substring(1));
			total += value;
			c.removeAttribute('style');
		});
		
		setTimeout(() => {
			if (total > 21) bust(a);
			else if (total === 21) blackjack(a);
			else a.querySelector('h2').innerText = total;
		}, 200);
	}, 50);
	
	deck.shift();
}

function stand(a) {
	a.classList.add('standing', 'done');
}

function blackjack(a) {
	a.classList.add('blackjack', 'winner', 'done');
	a.querySelector('h2').innerHTML = '&nbsp;<em>blackjack!</em>';
	//setTimeout(() => game_over(), 100);
}

function bust(a) {
	a.classList.add('busted', 'done');
	a.querySelector('h2').innerHTML = '&nbsp;<em>busted</em>';
}

function bet(a) {
	const banks = sessionStorage.banks ? sessionStorage.banks.split(',') : Array(r).fill(100),
	      bank = Number(banks[[...players].indexOf(a)]),
	      betting = Math.floor((Math.random() * (bank - 5) + 5) / 5) * 5;
	      		
	a.querySelector('.bank').innerText = bank;
	a.querySelector('.bet').innerText = betting;
	
	if (bank == 0) a.classList.add('done');
}

function winnings() {
	let total = 0,
	    banks = [];
	
	players.forEach(p => total += Number(p.querySelector('.bet').innerText));

	setTimeout(() => {
		const winning_bank = m.querySelector('.winner .bank');
		
		winning_bank.innerText = Number(winning_bank.innerText) + total;
		
		players.forEach(p => {
			const bank = Number(p.querySelector('.bank').innerText) - Number(p.querySelector('.bet').innerText);
			banks.push(bank);
		});
		
		sessionStorage.banks = banks;
	}, 100);
}

function next_turn() {
	const active_player = m.querySelector('.active'),
	      to = m.querySelectorAll('.done').length + 1 === players.length ? 100 : 400;
	
	active_player.classList.remove('active');
	m.classList.add('hold');
	setTimeout(() => m.classList.remove('hold'), 400);
		
	setTimeout(() => {
		const condition = m.querySelector('.blackjack') || m.querySelectorAll('.busted').length + 1 === players.length || m.querySelectorAll('.done').length === players.length;
		
		if (condition) game_over();
		else {
			let ii = [...players].indexOf(active_player),
			    iii = ++ii % players.length;

			players[iii].classList.add('active');

			if (condition) game_over();
			else if (players[iii].classList.contains('done')) next_turn();
		}
	}, to);
	
	if (m.hasAttribute('style')) m.removeAttribute('style');
}

function game_over(a) {
	m.classList.add('over');

	players.forEach(p => p.classList.add('done'));

	if (m.querySelector('.blackjack')) m.querySelector('.blackjack').classList.add('winner');
	else {
		let total = 0;

		[...players].filter(p => p.querySelector('.bank').innerText !== 0).forEach(p => {
			const h2 = p.querySelector('h2').innerText;
			const player_total = !isNaN(h2) ? Number(p.querySelector('h2').innerText) : -1;

			if (player_total > total) {
				total = player_total;

				if (m.querySelector('.winner')) m.querySelector('.winner').classList.remove('winner');
				p.classList.add('winner');
			}
		});
	}
	
	setTimeout(() => {
		const winner = m.querySelector('.winner');
		
		if (winner) {
			winner.querySelector('h2').innerHTML = '&nbsp;<em>winner!</em>';
			setTimeout(() => winnings(), 250);
		} else players.forEach(p => p.querySelector('h2').innerHTML = '&nbsp;<em>Draw</em>');
	}, 1500);
}

players.forEach(p => {
	if (p.querySelector('.bank').innerText == 0) p.classList.add('done');
	else {
		bet(p);
		hit(p);
	}
});

if (sessionStorage.banks) {
	const banks = sessionStorage.banks.split(',');
	const max = Math.max(...banks).toString();
	
	players[banks.indexOf(max)].classList.add('high_roller');
}

[...players].filter(p => !p.classList.contains('done'))[0].classList.add('active');

if ([...players].filter(p => p.classList.contains('done')).length + 1 === players.length) {
	sessionStorage.clear();
	setTimeout(() => window.location.reload(), 5e3);
}

buttons.forEach(b => {
	const player = b.closest('.player');

	b.addEventListener('click', () => {
		if (!player.classList.contains('done')) {
			if (b.classList.contains('hit')) hit(player);
			else stand(player);
			setTimeout(() => next_turn(), 100);
		}
	});
});

document.addEventListener('keydown', e => {
	if (e.code === 'KeyH' || e.code === 'KeyS') {
		const active_player = m.querySelector('.active');
		
		if (!active_player.classList.contains('done') && !m.classList.contains('hold')) {		
			if (e.code === 'KeyH') hit(active_player);
			else stand(active_player);
			setTimeout(() => next_turn(), 100);
		}
	} else if (e.code === 'Space') window.location.reload();
});
