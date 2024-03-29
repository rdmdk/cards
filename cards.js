const m = document.querySelector('main'),
	clubs = ['c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9', 'c10', 'cj', 'cq', 'ck', 'ca'],
	diamonds = [...clubs].map(x => x.replace(/c/gm, 'd')),
	hearts = [...clubs].map(x => x.replace(/c/gm, 'h')),
	spades = [...clubs].map(x => x.replace(/c/gm, 's'));

let deck = localStorage.cards_deck && localStorage.cards_deck.split(',').length > 15 ? localStorage.cards_deck.split(',') : [...clubs, ...diamonds, ...hearts, ...spades].sort(() => Math.random() - 0.5),
	r = window.location.search && window.location.search.split(/\W/).filter(Number) ? Number(window.location.search.split(/\W/).filter(Number)[0]) : localStorage.cards_players ? Number(localStorage.cards_players) : Math.floor(Math.random() * (12 - 2) + 2),
	players,
	buttons,
	si,
	st,
	seconds = localStorage.cards_seconds && localStorage.cards_banks ? Number(localStorage.cards_seconds) : 0;

setInterval(() => {
	if (localStorage.cards_banks) {
		seconds++;
		localStorage.cards_seconds = seconds;
	}
}, 1e3);

localStorage.cards_deck = deck;

r = r < 2 ? 2 : r > 12 ? 12 : r;

if (window.location.search !== '') {
	reset();
	history.pushState(null, null, 'https://rdmdk.github.io/cards/');
}

localStorage.cards_players = r;

for (i = 0; i < r; i++) {
	const h = '<section class="player"><h2>&nbsp;</h2><div class="hand"></div><h3><span class="bet">0</span><span class="bank">100</span></h3><span class="actions"><button class="hit">hit</button><button class="stand">stand</button></span></section>';
	m.insertAdjacentHTML('beforeend', h);
}

players = m.querySelectorAll('.player');
buttons = m.querySelectorAll('button');

if (players.length > 2 && players.length % 2 === 0 || players.length > 3) m.classList.add('grid');

m.dataset.layout = Math.floor(players.length / 2) * 2;

function draw(a) {

	if (a) {
		setTimeout(() => {
			m.querySelectorAll('.player:not(.out)').forEach(p => {
				p.classList.remove('active');
				p.classList.add('winner', 'done');
				p.querySelector('h2').innerHTML = '&nbsp;<em>winner!</em>';
			});
			game_time();
			reset();
		}, 2e3);
	} else {
		const banks = localStorage.cards_banks.split(','),
			b1 = banks.filter(b => b != 0),
			b2 = new Set(b1).size === 1;

		if (b2) {
			m.classList.add('hold');

			setTimeout(() => {
				if (window.confirm('Care to draw and split the winnings?')) {
					m.querySelectorAll('.player:not(.out)').forEach(p => {
						p.classList.remove('active');
						p.classList.add('winner', 'done');
						p.querySelector('h2').innerHTML = '&nbsp;<em>winner!</em>';
					});
					game_time();
					reset();

				} else m.classList.remove('hold');
			}, 2e3);
		}
	}
}

function hit(a) {
	const hand = a.querySelector('.hand'),
		bet = a.querySelector('.bet');
	let total = 0;

	hand.insertAdjacentHTML('beforeend', '<span style class="' + deck[0] + ' card"><span></span></span>');

	setTimeout(() => {
		hand.querySelectorAll('.card').forEach(c => {
			let value = /[jqk]/gm.test(c.classList[0]) ? 10 : /a/gm.test(c.classList[0]) && total >= 10 ? 1 : /a/gm.test(c.classList[0]) ? 11 : Number(c.classList[0].substring(1));
			total += value;
			c.removeAttribute('style');
		});

		if (hand.querySelectorAll('.card').length > 1) bet.innerText = Number(bet.innerText) === 5 ? 5 : Number(bet.innerText) - 5;

		setTimeout(() => {
			if (total > 21) bust(a);
			else if (total === 21) blackjack(a);
			else a.querySelector('h2').innerText = total;
		}, 200);
	}, 50);

	deck.shift();
	localStorage.cards_deck = deck;
}

function stand(a) {
	a.classList.add('standing', 'done');
}

function blackjack(a) {
	const payday = a.querySelectorAll('.card[class*="7 "]').length === 3;

	if (payday) a.classList.add('blackjack', 'payday', 'done');
	else a.classList.add('blackjack', 'done');

	a.querySelector('h2').innerHTML = payday ? '&nsbp;<em>payday!</em>' : '&nbsp;<em>blackjack!</em>';
}

function bust(a) {
	a.classList.add('busted', 'done');
	a.querySelector('h2').innerHTML = '&nbsp;<em>busted</em>';
}

function bet(a) {
	const banks = localStorage.cards_banks ? localStorage.cards_banks.split(',') : Array(r).fill(100),
		bank = Number(banks[[...players].indexOf(a)]),
		//min_bet = a.classList.contains('high_roller') ? bank * 0.25 : 5,
		//betting = bank <= 10 ? 5 : Math.floor((Math.random() * ((bank / 2) - min_bet) + min_bet) / 5) * 5;
		betting = bank <= 10 ? 5 : a.querySelector('.card[class*="a "]') ? Math.floor((bank / 2) / 5) * 5 : Math.floor((bank / 3) / 5) * 5;

	a.querySelector('.bank').innerText = bank;
	a.querySelector('.bet').innerText = betting;

	if (bank == 0) a.classList.add('out', 'done');
}

function winnings() {
	const payday = m.querySelector('.payday');

	let total = 0,
		banks = [];

	[...players].filter(p => !p.classList.contains('out')).forEach(p => {
		const source = payday ? p.querySelector('.bank') : p.querySelector('.bet');

		total += p.classList.contains('winner') ? 0 : !payday && p.classList.contains('busted') ? Number(source.innerText) * 2 : Number(source.innerText);
	});

	setTimeout(() => {
		players.forEach(p => {
			let bank = p.classList.contains('winner') ? Number(p.querySelector('.bank').innerText) + total : p.classList.contains('busted') ? Number(p.querySelector('.bank').innerText) - (Number(p.querySelector('.bet').innerText) * 2) : Number(p.querySelector('.bank').innerText) - Number(p.querySelector('.bet').innerText);

			bank = bank <= 0 ? 0 : bank;
			banks.push(bank);

			if (bank === 0) p.classList.add('out');
		});
	}, 100);

	setTimeout(() => {
		localStorage.cards_banks = banks;
		high_roller();
	}, 250);
}

function next_turn() {
	const active_player = m.querySelector('.active'),
		to = m.querySelectorAll('.done').length + 1 === players.length ? 100 : 200;

	if (st) clearTimeout(st);

	active_player.classList.remove('active');
	m.classList.add('hold');
	setTimeout(() => m.classList.remove('hold'), to);

	setTimeout(() => {
		let condition = m.querySelector('.blackjack') || m.querySelectorAll('.done').length === players.length || m.querySelectorAll('.busted, .out').length + 1 === players.length;

		if (m.querySelectorAll('.done:not(.out)').length + 1 === players.length) {
			let scores = [];
			
			m.querySelectorAll('.done:not(.out) h2').forEach(h => scores.push(Number(h.innerText)));
			if (Number(active_player.querySelector('h2').innerText) > Math.max(...scores.filter(Number))) condition = true;
		}

		if (condition) game_over();
		else {
			let ii = [...players].indexOf(active_player),
				iii = ++ii % players.length;

			players[iii].classList.add('active');
			//clearInterval(si);
			//si = setTimeout(() => hint(), 4e3);

			if (condition) game_over();
			else if (players[iii].classList.contains('done')) next_turn();
		}

		setTimeout(() => scroll_to_next_player(), 100);
	}, to);

	if (m.hasAttribute('style')) m.removeAttribute('style');

	if (!deck.length) {
		deck = [...clubs, ...diamonds, ...hearts, ...spades].sort(() => Math.random() - 0.5);
		localStorage.cards_deck = deck;
	}
}

function scroll_to_next_player() {
	const n_p = m.querySelector('.winner') ? m.querySelector('.winner') : m.querySelector('.active');
	const n_o = n_p.offsetTop + n_p.clientHeight;
	const n_s = n_o > m.scrollTop + window.innerHeight || n_p.offsetTop < m.scrollTop;

	if (n_s) m.scrollTo(0, n_p.offsetTop);
}

function high_roller() {
	const banks = localStorage.cards_banks.split(','),
		max = Math.max(...banks).toString(),
		min = Math.min(...banks).toString(),
		highroller = m.querySelector('.high_roller');

	if (highroller) highroller.classList.remove('high_roller');
	if (max !== min && banks.filter(b => b === max).length === 1) {
		const hr = players[banks.indexOf(max)];
		if (hr.classList.contains('poor')) {
			hr.classList.remove('poor');
			hr.classList.add('high_roller', 'cinderella');
		} else hr.classList.add('high_roller');
	}
	for (i = 0; i < banks.length; i++) {
		if (banks[i] == 5) players[i].classList.add('poor');
	}
}

function hint() {
	if (m.querySelector('.hint')) m.querySelector('.hint').classList.remove('hint');

	const active_player = m.querySelector('.active'),
		active_total = active_player.querySelector('h2').innerText,
		hit = active_player.querySelector('.hit'),
		stand = active_player.querySelector('.stand');

	let button, total = 0;

	m.querySelectorAll('.player h2').forEach(h => {
		const player_total = Number(h.innerText);
		if (player_total > total) total = player_total;
	});

	if (total < 14 || active_total < total) button = hit;
	else if (active_total === total) {
		if (active_player.classList.contains('high_roller')) button = stand;
		else {
			const active_index = [...players].indexOf(m.querySelector('.player.active')),
				next_index = [...players].indexOf([...players].filter(p => p.querySelector('h2').innerText == total && !p.classList.contains('active'))[0]);

			if (next_index !== -1) {
				if (players[next_index].classList.contains('high_roller') || active_index > next_index) button = hit;
				else button = stand;
			}
		}
	} else button = stand;

	if (button) button.classList.add('hint');
}

function game_over(a) {
	m.classList.add('over');

	players.forEach(p => p.classList.add('done'));

	if (m.querySelector('.blackjack')) m.querySelector('.blackjack').classList.add('winner');
	else {
		let total = 0;

		players.forEach(p => {
			const h2 = p.querySelector('h2').innerText,
				player_total = !isNaN(h2) ? Number(p.querySelector('h2').innerText) : -1,
				player_bank = Number(p.querySelector('.bank').innerText);

			if (p.classList.contains('high_roller') && player_total >= total || !p.classList.contains('out') && player_total > total) {
				total = player_total;

				if (m.querySelector('.winner')) m.querySelector('.winner').classList.remove('winner');
				p.classList.add('winner');
			}
		});
	}

	setTimeout(() => scroll_to_next_player(), 500);

	setTimeout(() => {
		const winner = m.querySelector('.winner');

		if (winner) {
			winnings();
			setTimeout(() => winner.querySelector('h2').innerHTML = '&nbsp;<em>winner!</em>', 1e3);
		} else players.forEach(p => p.querySelector('h2').innerHTML = '&nbsp;<em>Draw</em>');
	}, 500);

	setTimeout(() => {
		if (m.querySelectorAll('.out').length + 1 === players.length) {
			m.classList.add('end');
			console.log(game_time());
			reset();
		} else setTimeout(() => window.location.reload(), 2500);
	}, 2e3);
}

function game_time() {
	let s = seconds,
	    m = s / 60,
	    h = m / 60,
	    d = h / 24,
	    ss = Math.floor(s % 60) + ' second' + (Math.floor(s % 60) !== 1 ? 's' : ''),
	    mm = Math.floor(m % 60) + ' minute' + (Math.floor(m % 60) !== 1 ? 's' : ''),
	    hh = Math.floor(h % 24) + ' hour' + (Math.floor(h % 24) !== 1 ? 's' : ''),
	    dd = Math.floor(d) + ' day' + (Math.floor(d) !== 1 ? 's' : ''),
	    x = Math.floor(s) + ' second' + (Math.floor(s) !== 1 ? 's' : '');
	
	if (h >= 24) x = dd + ', ' + hh + ', ' + mm + ', ' + ss;
	else if (m >= 60) x = hh + ', ' + mm + ', ' + ss;
	else if (s >= 60) x = mm + ', ' + ss;

	return 'Game duration: ' + x;
}

function reset() {
	Object.keys(localStorage).filter(a => /cards(?!_classic)/.test(a)).forEach(a => localStorage.removeItem(a));
}

if (localStorage.cards_banks) {
	const ev = eval(localStorage.cards_banks.replace(/,/g, '+'));

	if (ev / 100 !== players.length) {
		if (ev % 2 !== 0) localStorage.cards_banks = localStorage.cards_banks.replace(/(\d{1,2})5/, '$10');
	}

	draw();
	high_roller();
}

players.forEach(p => {
	if (p.classList.contains('out')) p.classList.add('done');
	else {
		hit(p);
		bet(p);
	}
});

[...players].filter(p => !p.classList.contains('done'))[0].classList.add('active');

if ([...players].filter(p => p.classList.contains('done')).length + 1 === players.length) {
	game_over();
	reset();
}

//hint();

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
	else if (e.code === 'KeyT') window.alert(game_time());
});

document.querySelector('.refresh').addEventListener('click', () => window.location.reload());
document.querySelector('.time').addEventListener('click', () => alert(game_time()));

if (seconds >= 3600) {
	if (!localStorage.cards_got_it && window.confirm('This game has gone on long enough! Care to end it with a draw?')) {
		draw(true);
		reset();
	} else localStorage.cards_got_it = true;
}

setTimeout(() => {
	if (!players.length) {
		reset();
		window.location.reload();
	}
}, 4e3);

if ('serviceWorker' in navigator) navigator.serviceWorker.register('service-worker.js');
