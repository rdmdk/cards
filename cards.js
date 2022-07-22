const m = document.querySelector('main'),
r = window.location.search ? Number(window.location.search.substring(1)) : Math.random() * (12 - 2) + 2,
clubs = ['c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9', 'c10', 'cj', 'cq', 'ck', 'ca'],
diamonds = ['d2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8', 'd9', 'd10', 'dj', 'dq', 'dk', 'da'],
hearts = ['h2', 'h3', 'h4', 'h5', 'h6', 'h7', 'h8', 'h9', 'h10', 'hj', 'hq', 'hk', 'ha'],
spades = ['s2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10', 'sj', 'sq', 'sk', 'sa'];

let deck = [...clubs, ...diamonds, ...hearts, ...spades].sort(() => Math.random() - 0.5),
players, buttons;

for (i = 0; i < r; i++) {
	if (i === 12) { break; } 
	const h = '<section class="player"><h2></h2><div class="hand"></div><span class="actions"><button class="hit">hit</button><button class="stand">stand</button></span></section>';
	m.insertAdjacentHTML('beforeend', h);
}

players = m.querySelectorAll('.player');
buttons = m.querySelectorAll('button');

if (players.length > 2 && players.length % 2 === 0 || players.length > 3) m.classList.add('grid');

document.querySelector('html').dataset.players = players.length;

players[0].classList.add('active');

function hit(a) {
	const hand = a.querySelector('.hand');
	let total = 0;

	hand.insertAdjacentHTML('beforeend', '<span class="' + deck[0] + ' card"></span>');
	hand.querySelectorAll('.card').forEach(c => {
		let value = /[jqk]/gm.test(c.classList[0]) ? 10 : /a/gm.test(c.classList[0]) && total >= 10 ? 1 : /a/gm.test(c.classList[0]) ? 11 : Number(c.classList[0].substring(1));
		total += value;
	});

	if (total > 21) bust(a);
	else if (total === 21) blackjack(a);
	else a.querySelector('h2').innerText = total;

	deck.shift();
}

function stand(a) {
	a.classList.add('standing', 'done');
}

function blackjack(a) {
	a.classList.add('blackjack', 'done', 'winner');
	a.querySelector('h2').innerText = 'blackjack!';
}

function bust(a) {
	a.classList.add('busted', 'done');
	a.querySelector('h2').innerText = 'busted';
}

function next_turn() {
	const active_player = m.querySelector('.active');

	if (m.querySelector('.blackjack') || m.querySelectorAll('.busted').length + 1 === m.querySelectorAll('.player').length || m.querySelectorAll('.done').length === m.querySelectorAll('.player').length) game_over();
	else {
		let ii = [...players].indexOf(active_player);
		let iii = ++ii % players.length;

		m.querySelector('.active').classList.remove('active');
		players[iii].classList.add('active');

		if (players[iii].classList.contains('done')) next_turn();
	}
}

function game_over(a) {
	m.classList.add('over');

	players.forEach(p => p.classList.add('done'));

	if (m.querySelector('.winner')) setTimeout(() => m.querySelector('.winner h2').innerText = 'winner!', 1e3);
	else {
		let total = 0;

		players.forEach(p => {
			const player_total = Number(p.querySelector('h2').innerText);

			if (player_total > total) {
				total = player_total;

				if (m.querySelector('.winner')) m.querySelector('.winner').classList.remove('winner');
				p.classList.add('winner');
			}
		});

		setTimeout(() => m.querySelector('.winner h2').innerText = 'winner!', 1e3);
	}
}

players.forEach(p => hit(p));

buttons.forEach(b => {
	const player = b.closest('.player');

	b.addEventListener('click', () => {
		if (b.classList.contains('hit')) hit(player);
		else stand(player);
		setTimeout(() => next_turn(), 100);
	});
});

document.addEventListener('keydown', e => {
	if (e.code === 'KeyH' || e.code === 'KeyS') {
		const active_player = m.querySelector('.active');
		if (e.code === 'KeyH') hit(active_player);
		else stand(active_player);
		setTimeout(() => next_turn(), 100);
	} else if (e.code === 'Space') window.location.reload();
});
