const m = document.querySelector('main'),
	clubs = ['c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9', 'c10', 'cj', 'cq', 'ck', 'ca'],
	diamonds = [...clubs].map(x => x.replace(/c/gm, 'd')),
	hearts = [...clubs].map(x => x.replace(/c/gm, 'h')),
	spades = [...clubs].map(x => x.replace(/c/gm, 's'));

let deck = localStorage.deck && localStorage.deck.split(',').length > 15 ? localStorage.deck.split(',') : [...clubs, ...diamonds, ...hearts, ...spades].sort(() => Math.random() - 0.5),
	r = localStorage.players ? Number(localStorage.players) : Math.floor(Math.random() * (12 - 2) + 2),
	players,
	buttons,
	si,
	seconds = localStorage.seconds && localStorage.scores ? Number(localStorage.seconds) : 0;

setInterval(() => {
	if (localStorage.scores) {
		seconds++;
		localStorage.seconds = seconds;
	}
}, 1e3);

console.log('Classic rules!');

localStorage.deck = deck;

if (window.location.search) {
	const q = window.location.search.split(/\W/),
	      x = q.filter(Number),
	      y = q.filter(Boolean);
	
	if (x.length && !isNaN(x[0])) {
		r = x[0];
		localStorage.clear();
	}
	
	if (y.length) history.pushState(null, null, 'https://rdmdk.github.io/cards/?classic');
}

r = r < 2 ? 2 : r > 12 ? 12 : r;

localStorage.players = r;

if (localStorage.scores) {
	localStorage.scores = localStorage.scores.replace(/-\d*/gm, '0');
	
	const scores = localStorage.scores.split(',');
	
	if (scores.length === r) {
		for (i = 0; i < r; i++) {
			const h = '<section class="player"><h2>&nbsp;</h2><div class="hand"></div><h3><span>' + scores[i] + '</span></h3><span class="actions"><button class="hit">hit</button><button class="stand">stand</button></span></section>';
			m.insertAdjacentHTML('beforeend', h);
		}
	} else {
		localStorage.clear();
		window.location.reload();
	}
} else {
	for (i = 0; i < r; i++) {
		const h = '<section class="player"><h2>&nbsp;</h2><div class="hand"></div><h3><span>100</span></h3><span class="actions"><button class="hit">hit</button><button class="stand">stand</button></span></section>';
		m.insertAdjacentHTML('beforeend', h);
	}
}

players = m.querySelectorAll('.player');
buttons = m.querySelectorAll('button');

setTimeout(() => {
	[...players].filter(p => Number(p.querySelector('h3 span').innerText) === 10).forEach(p => p.classList.add('poor'));
	[...players].filter(p => Number(p.querySelector('h3 span').innerText) <= 0).forEach(p => p.classList.add('out', 'done'));
	
	[...players].filter(p => !p.classList.contains('done'))[0].classList.add('active');
}, 0);

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
	localStorage.deck = deck;
}

function stand(a) {
	a.classList.add('standing', 'done');
}

function blackjack(a) {
	a.classList.add('blackjack', 'done');
	a.querySelector('h2').innerHTML = '&nbsp;<em>blackjack!</em>';
}

function bust(a) {
	a.classList.add('busted', 'done');
	a.querySelector('h2').innerHTML = '&nbsp;<em>busted</em>';
}

function next_turn() {
	const active_player = m.querySelector('.active'),
	      to = m.querySelectorAll('.done').length + 1 === players.length ? 100 : 200;

	active_player.classList.remove('active');
	m.classList.add('hold');
	setTimeout(() => m.classList.remove('hold'), to);

	setTimeout(() => {
		let condition = m.querySelector('.blackjack') || m.querySelectorAll('.done').length === players.length || m.querySelectorAll('.busted, .out').length + 1 === players.length;

		if (m.querySelectorAll('.done:not(.out)').length + 1 === players.length) {
			const score = Number(m.querySelector('.done:not(.out) h2').innerText);
			if (Number(active_player.querySelector('h2').innerText) > score) condition = true;
		}

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

	if (!deck.length) {
		deck = [...clubs, ...diamonds, ...hearts, ...spades].sort(() => Math.random() - 0.5);
		localStorage.deck = deck;
	}
}

function game_over(a) {
	let scores = [];
	
	m.classList.add('over');

	players.forEach(p => p.classList.add('done'));

	if (m.querySelector('.blackjack')) m.querySelector('.blackjack').classList.add('winner');
	else {
		let total = 0;

		players.forEach(p => {
			const h2 = Number(p.querySelector('h2').innerText),
			      player_total = !isNaN(h2) ? h2 : -1;

			if (!p.classList.contains('out') && player_total > total) total = player_total;
		});
		
		[...players].filter(p => Number(p.querySelector('h2').innerText) === total).forEach(p => p.classList.add('winner'));
	}

	setTimeout(() => {		
		players.forEach(p => {
			const s = p.querySelector('h3 span');
			if (p.classList.contains('winner')) setTimeout(() => p.querySelector('h2').innerHTML = '&nbsp;<em>winner!</em>', 1e3);
			else if (Number(s.innerText) >= 10) s.innerText = Number(s.innerText) - 10;
			scores.push(s.innerText);
		});
		
		localStorage.scores = scores;
		
		
		setTimeout(() => {
			[...players].filter(p => Number(p.querySelector('h3 span').innerText) === 10).forEach(p => p.classList.add('poor'));
			[...players].filter(p => Number(p.querySelector('h3 span').innerText) <= 0).forEach(p => p.classList.add('out', 'done'));
		}, 10);
	}, 500);

	setTimeout(() => {
		if (m.querySelectorAll('.out').length + 1 === players.length) {
			m.classList.add('end');
			console.log(game_time());
			localStorage.clear();
		} else setTimeout(() => window.location.reload(), 2500);
	}, 2e3);
}

function game_time() {
	let s = seconds,
		m = s / 60,
		h = m / 60,
		d = h / 24,
		x = s + ' seconds';
	
	if (h >= 24) x = Math.floor(d) + ' days, ' + Math.floor(h % 24) + ' hours, ' + Math.floor(m % 60) + ' minutes, ' + Math.floor(s % 60) + ' seconds';
	else if (m >= 60) x = Math.floor(h) + ' hours, ' + Math.floor(m % 60) + ' minutes, ' + Math.floor(s % 60) + ' seconds';
	else if (s >= 60) x = Math.floor(m) + ' minutes, ' + Math.floor(s % 60) + ' seconds';

	return 'Game duration: ' + x;
}

players.forEach(p => {
	if (p.classList.contains('out')) p.classList.add('done');
	else hit(p);
});

if ([...players].filter(p => p.classList.contains('done')).length + 1 === players.length) {
	game_over();
	localStorage.clear();
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
	else if (e.code === 'Shift') window.alert(game_time());
});

setTimeout(() => {
	if (!players.length) {
		localStorage.clear();
		window.location.reload();
	}
}, 4e3);
