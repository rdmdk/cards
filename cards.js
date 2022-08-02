const m = document.querySelector('main'),
      clubs = ['c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9', 'c10', 'cj', 'cq', 'ck', 'ca'],
      diamonds = ['d2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8', 'd9', 'd10', 'dj', 'dq', 'dk', 'da'],
      hearts = ['h2', 'h3', 'h4', 'h5', 'h6', 'h7', 'h8', 'h9', 'h10', 'hj', 'hq', 'hk', 'ha'],
      spades = ['s2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10', 'sj', 'sq', 'sk', 'sa'];

let deck = localStorage.deck && localStorage.deck.split(',').length > 15 ? localStorage.deck.split(',') : [...clubs, ...diamonds, ...hearts, ...spades].sort(() => Math.random() - 0.5),
    r = window.location.search ? Number(window.location.search.substring(1)) : localStorage.players ? Number(localStorage.players) : Math.floor(Math.random() * (12 - 2) + 2),
    players,
    buttons;

localStorage.deck = deck;

r = r < 2 ? 2 : r > 12 ? 12 : r;

if (window.location.search !== '') {
  localStorage.clear();
  history.pushState(null, null, 'https://rdmdk.github.io/cards/');
}

localStorage.players = r;

for (i = 0; i < r; i++) {
  const h = '<section class="player"><h2>&nbsp;</h2><div class="hand"></div><h3><span class="bet">0</span><span class="bank">100</span></h3><span class="actions"><button class="hit">hit</button><button class="stand">stand</button></span></section>';
  m.insertAdjacentHTML('beforeend', h);
}

players = m.querySelectorAll('.player');
buttons = m.querySelectorAll('button');

if (players.length > 2 && players.length % 2 === 0 || players.length > 3) m.classList.add('grid');

document.querySelector('html').dataset.players = players.length;

function draw() {
  const banks = localStorage.banks.split(','),
        b1 = banks.filter(b => b != 0),
        b2 = new Set(b1).size === 1;
	
  if (b2) {
    m.classList.add('hold');
    
    setTimeout(() => {
      if (window.confirm('Care to draw and split the winnings?')) {
        m.querySelectorAll('.player:not(.out)').forEach(p => p.querySelector('h2').innerHTML = '&nbsp;<em>Winner!</em>');
        localStorage.clear();
        window.location.reload();
      }
    }, 2e3);
  }
}

draw();

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
  const payday = a.querySelectorAll('.card[class$="7"]').length === 3;
	
  if (payday) a.classList.add('blackjack', 'payday', 'done');
  else a.classList.add('blackjack', 'done');
	
  a.querySelector('h2').innerHTML = payday ? '&nsbp;<em>Payday!</em>' : '&nbsp;<em>blackjack!</em>';
}

function bust(a) {
  a.classList.add('busted', 'done');
  a.querySelector('h2').innerHTML = '&nbsp;<em>busted</em>';
}

function bet(a) {
  const banks = localStorage.banks ? localStorage.banks.split(',') : Array(r).fill(100),
        bank = Number(banks[[...players].indexOf(a)]),
        betting = a.classList.contains('high_roller') ? Math.floor((Math.random() * (bank - (bank / 3)) + (bank / 3)) / 5) * 5 : bank === 10 || bank === 5 ? 5 : Math.floor((Math.random() * ((bank * (2/3)) - 5) + 5) / 5) * 5;
            
  a.querySelector('.bank').innerText = bank;
  a.querySelector('.bet').innerText = betting;
  
  if (bank == 0) a.classList.add('out', 'done');
}

function winnings() {
  const payday = m.querySelector('.payday');
	
  let total = 0,
      banks = [];
  
  players.forEach(p => {
    const source = payday ? p.querySelector('.bank') : p.querySelector('.bet');
	  total += p.classList.contains('winner') ? 0 : Number(source.innerText);
  });
    
  setTimeout(() => {
    players.forEach(p => {
      let bank = p.classList.contains('winner') ? Number(p.querySelector('.bank').innerText) + total : Number(p.querySelector('.bank').innerText) - Number(p.querySelector('.bet').innerText);
	    
      bank = bank <= 0 ? 0 : bank;
      banks.push(bank);
    
      if (bank === 0) p.classList.add('out');
    });
  }, 100);
	
  setTimeout(() => {
    localStorage.banks = banks;
    high_roller();
  }, 250);
}

function next_turn() {
  const active_player = m.querySelector('.active'),
        to = m.querySelectorAll('.done').length + 1 === players.length ? 100 : 400;
  
  active_player.classList.remove('active');
  m.classList.add('hold');
  setTimeout(() => m.classList.remove('hold'), 400);
    
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

function high_roller() {
  const banks = localStorage.banks.split(','),
        max = Math.max(...banks).toString(),
        min = Math.min(...banks).toString(),
        highroller = m.querySelector('.high_roller');
  
  if (highroller) highroller.classList.remove('high_roller');
  if (max !== min && banks.filter(b => b === max).length === 1) players[banks.indexOf(max)].classList.add('high_roller');
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
      localStorage.clear();
    } else setTimeout(() => window.location.reload(), 2500);
  }, 2e3);
}

if (localStorage.banks) high_roller();

players.forEach(p => {
  if (p.classList.contains('out')) p.classList.add('done');
  else {
    bet(p);
    hit(p);
  }
});

[...players].filter(p => !p.classList.contains('done'))[0].classList.add('active');

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
});
