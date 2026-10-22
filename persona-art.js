/* Original 8-bit food friends. Shared pixel matrices power both SVG and canvas. */
(function () {
  'use strict';

  const P = Object.freeze({
    ink: '#3B292F', cream: '#FFF4D6', white: '#FFFDF2',
    yellow: '#F8C84D', light: '#FFE59A', gold: '#D78B3B',
    red: '#EC6B5E', rust: '#BE474C', pink: '#F4B5BB',
    mint: '#A4CFB1', green: '#639D80', brown: '#8B584A',
    dark: '#654238', latte: '#D9AB79', lilac: '#C9BEDD',
    blue: '#ADCDD6', shadow: '#E2CBAA'
  });
  const KINDS = ['fries', 'burger', 'cola', 'coffee', 'pie', 'icecream', 'nuggets', 'breakfast'];
  const LABELS = {
    fries: 'A happy pixel fries friend', burger: 'A cheerful pixel burger friend',
    cola: 'A playful pixel soda friend', coffee: 'A calm pixel coffee friend',
    pie: 'A curious pixel pie friend', icecream: 'A sweet pixel ice cream friend',
    nuggets: 'Two adventurous pixel nugget friends', breakfast: 'A sunny pixel breakfast friend'
  };
  const CACHE = new Map();

  function kindOf(kind) { return KINDS.includes(kind) ? kind : 'fries'; }
  function moodOf(variant) {
    if (typeof variant === 'number' && Number.isFinite(variant)) return ((Math.trunc(variant) % 4) + 4) % 4;
    return ({ happy: 0, wink: 1, romantic: 2, sleepy: 3 })[variant] || 0;
  }

  function make(kind, mood) {
    const grid = Array.from({ length: 32 }, () => Array(32).fill(null));
    const r = (x, y, w, h, color) => {
      for (let j = Math.max(0, y); j < Math.min(32, y + h); j++) {
        for (let i = Math.max(0, x); i < Math.min(32, x + w); i++) grid[j][i] = color;
      }
    };
    // Each string is a 2px-grid silhouette, with a one-pixel dark outline.
    const shape = (x, y, rows, color, outline = true) => {
      const cells = [];
      rows.forEach((row, j) => [...row].forEach((v, i) => { if (v !== '.') cells.push([x + i, y + j]); }));
      if (outline) cells.forEach(([i, j]) => {
        r(i - 1, j, 3, 1, P.ink); r(i, j - 1, 1, 3, P.ink);
      });
      cells.forEach(([i, j]) => r(i, j, 1, 1, color));
    };
    const heart = (x, y, color = P.red) => shape(x, y, ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'], color, false);
    const star = (x, y, color = P.yellow) => shape(x, y, ['..#..', '..#..', '#####', '.###.', '.#.#.'], color, false);
    const legs = (left, right, top, shoe = P.mint) => {
      r(left, top, 2, 4, P.ink); r(right, top, 2, 4, P.ink);
      r(left - 2, top + 3, 5, 3, P.ink); r(right, top + 3, 5, 3, P.ink);
      r(left - 1, top + 3, 3, 1, shoe); r(right + 1, top + 3, 3, 1, shoe);
    };
    const hands = (left, right, y, color = P.cream) => {
      r(left, y, 4, 2, P.ink); r(right - 2, y + 1, 4, 2, P.ink);
      shape(left - 2, y - 1, ['##', '##'], color);
      shape(right + 1, y, ['##', '##'], color);
    };
    const face = (x, y, width = 10, natural = 0) => {
      const expression = mood || natural;
      const right = x + width;
      r(x - 2, y + 3, 2, 1, P.pink); r(right + 1, y + 3, 2, 1, P.pink);
      if (expression === 2) {
        shape(x - 1, y, ['#.#', '###', '.#.'], P.rust, false);
        shape(right - 1, y, ['#.#', '###', '.#.'], P.rust, false);
      } else if (expression === 3) {
        r(x - 1, y + 1, 3, 1, P.ink); r(right - 1, y + 1, 3, 1, P.ink);
      } else {
        r(x, y, 1, 2, P.ink);
        if (expression === 1) { r(right - 1, y + 1, 3, 1, P.ink); r(right + 1, y, 1, 1, P.ink); }
        else r(right, y, 1, 2, P.ink);
      }
      const center = x + Math.floor(width / 2);
      if (expression === 3) r(center, y + 3, 2, 1, P.ink);
      else { r(center - 1, y + 3, 1, 1, P.ink); r(center + 2, y + 3, 1, 1, P.ink); r(center, y + 4, 2, 1, P.ink); }
    };

    if (kind === 'fries') {
      legs(12, 19, 25);
      hands(6, 25, 19);
      [[8, 8, 3, 11], [12, 5, 3, 14], [16, 7, 3, 13], [20, 4, 3, 15], [24, 9, 2, 10]].forEach(([x, y, w, h]) => {
        r(x - 1, y - 1, w + 2, h + 2, P.ink); r(x, y, w, h, P.yellow); r(x, y, 1, h - 2, P.light);
      });
      shape(8, 15, ['##################', '##################', '.################.', '.################.', '.################.', '..##############..', '..##############..', '..##############..', '...############...', '...############...', '....##########....'], P.red);
      r(9, 16, 3, 2, P.pink); r(23, 18, 1, 4, P.rust);
      face(12, 19, 9);
      r(16, 16, 3, 1, P.cream);
      star(3, 6, P.mint);
    } else if (kind === 'burger') {
      legs(11, 20, 25, P.red);
      hands(5, 26, 18);
      shape(7, 22, ['###################', '###################', '.#################.', '..###############..'], P.yellow);
      r(10, 25, 12, 1, P.gold);
      shape(6, 19, ['#####################', '#####################'], P.brown);
      r(8, 19, 4, 1, P.dark); r(20, 20, 4, 1, P.dark);
      shape(6, 17, ['#####################', '..####...#####..###..', '...##......##....#...'], P.yellow);
      shape(6, 15, ['.####.####.####.####..', '#####################', '##..####..####..####..'], P.mint);
      r(8, 16, 17, 1, P.red);
      shape(7, 7, ['......#######......', '...#############...', '..###############..', '.#################.', '###################', '###################', '###################', '.#################.'], P.yellow);
      r(12, 8, 9, 1, P.light); r(9, 10, 2, 1, P.light);
      [[14, 9], [19, 10], [11, 11], [22, 11], [16, 10]].forEach(([x, y]) => r(x, y, 1, 1, P.cream));
      face(11, 12, 10);
      heart(24, 3, P.pink);
    } else if (kind === 'cola') {
      legs(12, 19, 25, P.red);
      hands(6, 25, 18, P.mint);
      shape(9, 12, ['################', '################', '.##############.', '.##############.', '.##############.', '.##############.', '..############..', '..############..', '..############..', '..############..', '...##########...', '...##########...', '...##########...'], P.mint);
      r(11, 14, 2, 8, P.cream); r(22, 14, 1, 6, P.green);
      r(12, 17, 11, 6, P.red); r(13, 17, 2, 1, P.pink);
      shape(8, 10, ['##################', '##################'], P.cream);
      r(10, 10, 14, 1, P.white);
      r(19, 3, 3, 7, P.ink); r(20, 4, 1, 6, P.red);
      r(20, 2, 7, 3, P.ink); r(21, 3, 5, 1, P.red);
      face(13, 17, 7, 1);
      r(6, 7, 2, 2, P.blue); r(4, 11, 1, 1, P.blue); r(27, 14, 2, 2, P.blue);
    } else if (kind === 'coffee') {
      legs(11, 18, 25, P.lilac);
      hands(5, 26, 20);
      shape(24, 13, ['####', '#####', '##.##', '##.##', '##.##', '#####', '####'], P.latte);
      r(25, 15, 2, 3, P.ink); r(26, 15, 1, 3, P.cream);
      shape(7, 12, ['#################', '#################', '#################', '#################', '#################', '#################', '#################', '.###############.', '.###############.', '..#############..', '..#############..', '...###########...', '....#########....'], P.cream);
      r(8, 13, 15, 2, P.brown); r(9, 13, 13, 1, P.dark);
      r(8, 16, 2, 5, P.white); r(21, 18, 2, 3, P.latte);
      r(11, 23, 10, 1, P.latte);
      face(11, 18, 9, 3);
      r(10, 6, 1, 3, P.latte); r(11, 4, 1, 2, P.latte);
      r(16, 4, 1, 4, P.latte); r(17, 2, 1, 2, P.latte);
      r(22, 6, 1, 3, P.latte); r(21, 4, 1, 2, P.latte);
      r(3, 28, 25, 1, P.shadow);
    } else if (kind === 'pie') {
      legs(12, 19, 25, P.mint);
      hands(6, 25, 18);
      shape(9, 6, ['..############..', '.##############.', '################', '################', '################', '################', '################', '################', '################', '################', '################', '################', '################', '################', '################', '################', '.##############.', '..############..'], P.gold);
      r(10, 9, 13, 12, P.yellow); r(11, 8, 11, 1, P.light); r(11, 21, 11, 1, P.light);
      for (let y = 10; y < 21; y += 3) { r(9, y, 1, 1, P.cream); r(24, y, 1, 1, P.cream); }
      r(13, 10, 2, 3, P.gold); r(17, 10, 2, 3, P.gold); r(21, 10, 1, 3, P.gold);
      face(12, 15, 9, 1);
      shape(10, 22, ['##############', '.############.', '..##########..'], P.red);
      r(13, 23, 8, 1, P.pink);
      star(25, 7, P.mint);
    } else if (kind === 'icecream') {
      legs(13, 18, 25, P.red);
      hands(6, 25, 19);
      shape(10, 20, ['##############', '.############.', '.############.', '..##########..', '..##########..', '...########...', '...########...'], P.mint);
      r(12, 22, 2, 3, P.cream); r(21, 22, 1, 3, P.green);
      shape(7, 5, ['..........##........', '.........###........', '........#####.......', '.......#######......', '......########......', '.....##########.....', '....############....', '.....##########.....', '...##############...', '..################..', '...##############...', '.##################.', '####################', '.##################.', '..################..', '....############....'], P.cream);
      r(16, 9, 7, 1, P.pink); r(12, 12, 11, 1, P.pink); r(10, 15, 13, 1, P.pink);
      r(10, 17, 1, 2, P.white);
      face(12, 17, 9);
      r(16, 4, 2, 2, P.red); r(17, 3, 2, 1, P.red); r(19, 2, 1, 2, P.green);
      star(25, 4, P.yellow);
    } else if (kind === 'nuggets') {
      // A little duo: the smaller friend rides in the mint picnic box.
      legs(10, 21, 25, P.red);
      hands(5, 27, 20);
      shape(7, 9, ['..#######..', '.#########.', '###########', '###########', '###########', '###########', '###########', '.#########.', '..#######..'], P.yellow);
      r(9, 10, 5, 1, P.light); r(7, 12, 1, 3, P.gold);
      r(10, 13, 1, 2, P.ink); r(14, 13, 1, 2, P.ink); r(12, 16, 2, 1, P.ink);
      r(8, 15, 1, 1, P.pink); r(16, 15, 1, 1, P.pink);
      shape(18, 11, ['..#####..', '.#######.', '#########', '#########', '#########', '#########', '.#######.', '..#####..'], P.gold);
      r(20, 12, 4, 1, P.light); r(20, 15, 1, 1, P.ink); r(24, 15, 1, 1, P.ink);
      r(22, 17, 1, 1, P.ink);
      shape(6, 19, ['######################', '.####################.', '.####################.', '..##################..', '..##################..', '...################...', '....##############....'], P.mint);
      r(8, 20, 18, 1, P.cream); r(9, 22, 2, 2, P.cream); r(25, 22, 1, 2, P.green);
      heart(14, 21, P.cream);
      r(4, 7, 2, 2, P.pink); r(27, 8, 2, 2, P.yellow);
    } else {
      legs(11, 20, 25, P.mint);
      hands(5, 26, 19);
      shape(7, 8, ['..###############..', '.#################.', '###################', '###################', '###################', '###################', '###################', '###################', '###################', '###################', '###################', '###################', '###################', '###################', '###################', '.#################.', '..###############..'], P.gold);
      r(9, 10, 15, 12, P.light); r(10, 9, 13, 1, P.yellow); r(10, 22, 13, 1, P.yellow);
      shape(10, 12, ['....######....', '..##########..', '.############.', '##############', '##############', '##############', '.############.', '..##########..', '....######....'], P.cream, false);
      shape(14, 13, ['.####.', '######', '######', '######', '.####.'], P.yellow, false);
      r(15, 13, 2, 1, P.light);
      face(11, 17, 10);
      r(12, 5, 2, 2, P.yellow); r(8, 6, 1, 2, P.yellow); r(22, 4, 1, 3, P.yellow);
      r(26, 8, 2, 1, P.yellow); r(4, 11, 2, 1, P.yellow);
    }
    return grid;
  }

  function matrix(kind, variant) {
    const key = kindOf(kind) + ':' + moodOf(variant);
    if (!CACHE.has(key)) CACHE.set(key, make(kindOf(kind), moodOf(variant)));
    return CACHE.get(key);
  }
  function pixels(grid) {
    let output = '';
    grid.forEach((row, y) => row.forEach((color, x) => {
      if (color) output += `<rect x="${x * 2}" y="${y * 2}" width="2" height="2" fill="${color}"/>`;
    }));
    return output;
  }
  function svg(kind, variant) {
    kind = kindOf(kind);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="192" height="192" shape-rendering="crispEdges" role="img" aria-label="${LABELS[kind]}" class="persona-pixel-art">${pixels(matrix(kind, variant))}</svg>`;
  }

  // Hand-drawn five-by-seven lettering keeps the scene self-contained.
  const FONT = {
    A: ['01110','10001','10001','11111','10001','10001','10001'],
    C: ['01111','10000','10000','10000','10000','10000','01111'],
    E: ['11111','10000','10000','11110','10000','10000','11111'],
    I: ['111','010','010','010','010','010','111'],
    J: ['00111','00010','00010','00010','10010','10010','01100'],
    K: ['10001','10010','10100','11000','10100','10010','10001'],
    L: ['10000','10000','10000','10000','10000','10000','11111'],
    M: ['10001','11011','10101','10101','10001','10001','10001'],
    O: ['01110','10001','10001','10001','10001','10001','01110'],
    P: ['11110','10001','10001','11110','10000','10000','10000'],
    S: ['01111','10000','10000','01110','00001','00001','11110'],
    T: ['11111','00100','00100','00100','00100','00100','00100'],
    V: ['10001','10001','10001','10001','10001','01010','00100'],
    Y: ['10001','10001','01010','00100','00100','00100','00100']
  };
  function lettering(message, x, y, cell, color) {
    let output = '', cursor = x;
    for (const letter of message) {
      const rows = FONT[letter];
      if (rows) {
        rows.forEach((row, j) => [...row].forEach((v, i) => {
          if (v === '1') output += `<rect x="${cursor + i * cell}" y="${y + j * cell}" width="${cell}" height="${cell}" fill="${color}"/>`;
        }));
        cursor += (rows[0].length + 1) * cell;
      } else cursor += 3 * cell;
    }
    return output;
  }
  function scene() {
    const rect = (x, y, w, h, color) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}"/>`;
    const icon = (type, x, y, cell, color) => {
      const rows = type === 'heart' ? ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'] : ['..#..', '..#..', '#####', '.###.', '.#.#.'];
      return rows.map((row, j) => [...row].map((v, i) => v === '#' ? rect(x + i * cell, y + j * cell, cell, cell, color) : '').join('')).join('');
    };
    const friend = (kind, x, y, size, variant) => `<g transform="translate(${x} ${y}) scale(${size / 64})">${pixels(matrix(kind, variant))}</g>`;
    let decoration = '';
    [[44,322],[66,302],[156,330],[212,302],[284,326],[382,320],[462,306],[502,332]].forEach(([x,y], i) => {
      decoration += rect(x, y, 4, 4, i % 2 ? P.green : P.cream) + rect(x + 8, y + 4, 4, 4, P.green);
    });
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 380" width="560" height="380" shape-rendering="crispEdges" role="img" aria-label="McKeeps pixel joy collection station with five food friends" class="persona-pixel-scene">
      ${rect(16, 16, 528, 348, P.shadow)}${rect(8, 8, 536, 348, P.cream)}
      ${rect(8, 8, 536, 4, P.ink)}${rect(8, 352, 536, 4, P.ink)}${rect(8, 8, 4, 348, P.ink)}${rect(540, 8, 4, 348, P.ink)}
      ${lettering('MCKEEPS', 32, 30, 4, P.ink)}
      ${lettering('SAVE A LITTLE JOY', 34, 70, 2, P.brown)}
      ${rect(380, 48, 132, 106, P.ink)}${rect(384, 52, 124, 98, P.lilac)}
      ${rect(390, 58, 112, 82, P.white)}${rect(390, 58, 112, 20, P.pink)}
      ${rect(398, 64, 4, 4, P.cream)}${rect(408, 64, 4, 4, P.cream)}${rect(418, 64, 4, 4, P.cream)}
      ${rect(440, 78, 4, 62, P.lilac)}${rect(390, 108, 112, 4, P.lilac)}
      ${icon('heart', 408, 86, 2, P.red)}${icon('star', 464, 86, 2, P.yellow)}
      ${lettering('JOY', 452, 120, 2, P.brown)}
      ${rect(376, 150, 140, 6, P.ink)}${rect(380, 146, 132, 4, P.pink)}
      ${icon('star', 308, 32, 4, P.yellow)}${icon('star', 344, 90, 2, P.mint)}
      ${icon('heart', 160, 118, 3, P.pink)}${icon('star', 38, 120, 2, P.red)}
      ${rect(30, 278, 500, 62, P.green)}${rect(24, 282, 512, 48, P.mint)}
      ${rect(40, 270, 88, 12, P.mint)}${rect(194, 268, 124, 16, P.mint)}${rect(434, 274, 78, 12, P.mint)}
      ${decoration}
      ${rect(40, 266, 116, 8, P.shadow)}${rect(48, 262, 100, 8, P.white)}
      ${rect(208, 270, 132, 8, P.shadow)}${rect(216, 264, 116, 10, P.white)}
      ${rect(402, 286, 114, 8, P.shadow)}${rect(410, 282, 98, 8, P.white)}
      ${friend('burger', 28, 152, 128)}${friend('fries', 188, 114, 160, 'wink')}${friend('cola', 390, 172, 128)}
      ${friend('icecream', 106, 234, 96)}${friend('coffee', 306, 242, 96)}
      ${icon('heart', 348, 202, 2, P.red)}${icon('star', 512, 196, 2, P.yellow)}
      ${rect(26, 336, 100, 12, P.cream)}${lettering('PLAY', 32, 338, 1, P.brown)}
      ${rect(474, 338, 4, 4, P.red)}${rect(484, 338, 4, 4, P.yellow)}${rect(494, 338, 4, 4, P.mint)}
    </svg>`;
  }

  function draw(ctx, kind, x, y, size, variant) {
    if (!ctx || typeof ctx.fillRect !== 'function') return;
    x = Number.isFinite(x) ? x : 0;
    y = Number.isFinite(y) ? y : 0;
    size = Number.isFinite(size) && size > 0 ? size : 192;
    const unit = size / 32;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    matrix(kind, variant).forEach((row, j) => row.forEach((color, i) => {
      if (!color) return;
      ctx.fillStyle = color;
      const left = Math.round(x + i * unit), top = Math.round(y + j * unit);
      ctx.fillRect(left, top, Math.round(x + (i + 1) * unit) - left, Math.round(y + (j + 1) * unit) - top);
    }));
    ctx.restore();
  }

  window.KeepsPersonaArt = Object.freeze({ svg, scene, draw });
})();
