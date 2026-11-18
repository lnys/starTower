import 'dart:convert';
import 'dart:math' as math;

typedef Json = Map<String, dynamic>;
const directions = <String, List<int>>{
  'up': [0, -1],
  'down': [0, 1],
  'left': [-1, 0],
  'right': [1, 0]
};
const terrain = ['.', '#', '%', 'w', '~', '*', 'y', 'b', 'r', 'a', '^', 'v'];
const doorKeys = {'y': 'yellowKey', 'b': 'blueKey', 'r': 'redKey'};
const altarTiers = {4: 1, 12: 2, 21: 3, 32: 4, 42: 5, 46: 5};
const zones = ['苔藓地窖', '潮汐机关城', '镜廊', '熔炉深处', '星穹'];

class GameEngine {
  final Json data;
  late Json state;
  GameEngine(this.data) {
    reset();
  }
  Json get defs => data['defs'];
  Json get hero => state['hero'];
  Json get monsters => data['MONSTERS'];
  int get floor => state['floor'];
  int get zone => (floor / 10).ceil();
  String get zoneName => zones[zone - 1];
  Json get world => ensureFloor(floor);
  List get history => state['history'];
  String name(String id) {
    for (final table in [
      'MONSTERS',
      'CONSUMABLES',
      'KEYS',
      'GEAR',
      'HOLD',
      'ACTIVE'
    ]) {
      if (data[table][id] != null) return data[table][id]['name'];
    }
    return {
          'guide': '引路人',
          'altar': '祭坛',
          'merchant': '商人',
          'goddess': '你的女神'
        }[id] ??
        id;
  }

  void reset() {
    final entry = defs['1']['entry'];
    state = {
      'version': 1,
      'floor': 1,
      'hero': {
        'x': entry['x'],
        'y': entry['y'],
        'hp': 1000,
        'atk': 10,
        'def': 10,
        'gold': 0,
        'keys': {'yellowKey': 0, 'blueKey': 0, 'redKey': 0},
        'flags': {
          'tideSpear': false,
          'charm': false,
          'dragonFang': false,
          'starShield': false
        }
      },
      'items': <String, dynamic>{},
      'altarBuys': 0,
      'world': <String, dynamic>{},
      'firedEvents': [],
      'visited': [1],
      'soldOut': [],
      'dead': false,
      'ended': false,
      'history': []
    };
    ensureFloor(1);
  }

  Json ensureFloor(int n) {
    final key = '$n';
    if (state['world'][key] == null) {
      final def = defs[key];
      if (def == null) throw StateError('没有第 $n 层');
      final grid =
          (def['grid'] as List).map((r) => (r as String).split('')).toList();
      final ents = <String, dynamic>{};
      final terr = List.generate(
          11,
          (y) => List.generate(11, (x) {
                final c = grid[y][x];
                if (terrain.contains(c)) return c;
                final id = def['legend'][c];
                if (id == null) throw StateError('第 $n 层缺少图例 $c');
                ents['$x,$y'] = {
                  'kind': monsters[id] != null
                      ? 'monster'
                      : ['guide', 'altar', 'merchant', 'goddess'].contains(id)
                          ? 'npc'
                          : 'item',
                  'id': id
                };
                return '.';
              }));
      state['world'][key] = {'terr': terr, 'ents': ents};
    }
    final w = state['world'][key];
    if (n == 50 && defs[key]['sceneVersion'] == 2 && w['sceneVersion'] != 2) {
      final def = defs[key];
      final grid =
          (def['grid'] as List).map((r) => (r as String).split('')).toList();
      w['terr'] = List.generate(
          11,
          (y) => List.generate(
              11, (x) => terrain.contains(grid[y][x]) ? grid[y][x] : '.'));
      for (var y = 0; y < 11; y++) {
        for (var x = 0; x < 11; x++) {
          final id = def['legend'][grid[y][x]];
          if (id != null && id != 'endLord') {
            w['ents']['$x,$y'] = {
              'kind': id == 'goddess' ? 'npc' : 'monster',
              'id': id
            };
          }
        }
      }
      w['sceneVersion'] = 2;
    }
    return w;
  }

  bool inBounds(int x, int y) => x >= 0 && y >= 0 && x < 11 && y < 11;
  List<List<int>> neighbours(int x, int y) => directions.values
      .map((d) => [x + d[0], y + d[1]])
      .where((p) => inBounds(p[0], p[1]))
      .toList();
  Json? entity(int x, int y) => world['ents']['$x,$y'];
  bool near(String id) => neighbours(hero['x'], hero['y'])
      .any((p) => entity(p[0], p[1])?['id'] == id);
  String body() => jsonEncode(Map.of(state)..remove('history'));
  void settle(String before) {
    if (body() != before) {
      history.add(before);
      if (history.length > 50) history.removeAt(0);
    }
  }

  Json undo() {
    if (history.isEmpty) return result(false, '没有可以撤销的操作');
    final prev = history.removeLast();
    final rest = history;
    state = jsonDecode(prev);
    state['history'] = rest;
    return result(true, '已撤销一步');
  }

  Json result(bool ok, String text, [List<Json>? events]) =>
      {'ok': ok, 'text': text, if (events != null) 'events': events};
  bool trait(Json m, String t) =>
      (m['traits'] as List? ?? []).any((v) => v['type'] == t);
  Json combat(Json m) {
    final pillars = m == monsters['endLord']
        ? (ensureFloor(49)['ents'] as Map)
            .values
            .where((e) => e['id'] == 'pillarGuard')
            .length
        : 0;
    final mdef = trait(m, 'starVeil') ? 280 + 125 * pillars : m['def'] as int;
    var atk = hero['atk'] as int;
    if (trait(m, 'sea') && hero['flags']['tideSpear'] == true) atk *= 2;
    if (trait(m, 'dragon') && hero['flags']['dragonFang'] == true) atk *= 2;
    final hit = atk - mdef;
    if (hit <= 0) {
      return {
        'canFight': false,
        'reason': 'unpierceable',
        'loss': null,
        'perHit': hit,
        'rounds': null,
        'perRound': null,
        'def': mdef
      };
    }
    final rounds = (m['hp'] / hit).ceil();
    var perRound = trait(m, 'magic')
        ? m['atk'] as int
        : math.max(0, (m['atk'] - hero['def']) as int);
    if (trait(m, 'doubleHit')) perRound *= 2;
    final loss = (trait(m, 'firstStrike') ? rounds : rounds - 1) * perRound;
    return {
      'canFight': loss < hero['hp'],
      'reason': loss < hero['hp'] ? null : 'lethal',
      'loss': loss,
      'rounds': rounds,
      'perRound': perRound,
      'perHit': hit,
      'def': mdef
    };
  }

  Json? preview(int x, int y) {
    final e = entity(x, y);
    if (e == null || e['kind'] != 'monster') return null;
    return {
      'id': e['id'],
      'monster': monsters[e['id']],
      ...combat(monsters[e['id']])
    };
  }

  void checkEvents(Json ctx, List<Json> out) {
    for (final ev in defs['$floor']['events'] ?? []) {
      final t = ev['trigger'];
      if ((state['firedEvents'] as List).contains(ev['id'])) {
        if (t['op'] == 'talked' && ctx['talked'] == t['npc']) {
          for (final eff in ev['effects']) {
            if (eff['op'] == 'say') {
              out.add({'type': 'say', 'text': eff['text']});
            }
          }
        }
        continue;
      }
      bool ok = false;
      switch (t['op']) {
        case 'talked':
          ok = ctx['talked'] == t['npc'];
          break;
        case 'enterTile':
          final p = ctx['entered'];
          ok = p != null && p['x'] == t['at']['x'] && p['y'] == t['at']['y'];
          break;
        case 'defeated':
          final p = ctx['defeated'];
          ok = p != null && p['x'] == t['at']['x'] && p['y'] == t['at']['y'];
          break;
        case 'allDefeated':
          ok = (t['at'] as List)
              .every((p) => entity(p['x'], p['y'])?['kind'] != 'monster');
          break;
      }
      if (!ok) continue;
      state['firedEvents'].add(ev['id']);
      for (final eff in ev['effects']) {
        switch (eff['op']) {
          case 'setTerrain':
            world['terr'][eff['y']][eff['x']] = eff['terrain'];
            break;
          case 'addStair':
            world['terr'][eff['y']][eff['x']] = eff['dir'] == 'up' ? '^' : 'v';
            out.add({'type': 'stair-created'});
            break;
          case 'spawnItem':
            world['ents']
                ['${eff['x']},${eff['y']}'] = {'kind': 'item', 'id': eff['id']};
            break;
          case 'grantItem':
            grant(eff['id'], out);
            break;
          case 'say':
            out.add({'type': 'say', 'text': eff['text']});
            break;
          case 'win':
            state['ended'] = true;
            out.add({'type': 'win'});
            break;
          default:
            throw StateError('未知事件 ${eff['op']}');
        }
      }
    }
  }

  void grant(String id, List<Json> out) {
    if (data['CONSUMABLES'][id] != null) {
      if (id == 'redCrystal') hero['atk'] += zone + 1;
      if (id == 'blueCrystal') hero['def'] += zone + 1;
      if (id == 'redPotion') hero['hp'] += 50 * zone;
      if (id == 'bluePotion') hero['hp'] += 150 * zone;
    } else if (data['KEYS'][id] != null) {
      hero['keys'][id] += 1;
    } else if (data['GEAR'][id] != null) {
      final g = data['GEAR'][id];
      hero['atk'] += g['atk'] ?? 0;
      hero['def'] += g['def'] ?? 0;
      if (g['immuneAura'] == true) hero['flags']['starShield'] = true;
    } else if (data['HOLD'][id] != null) {
      hero['flags'][data['HOLD'][id]['flag']] = true;
    } else if (data['ACTIVE'][id] != null) {
      state['items'][id] = (state['items'][id] ?? 0) + 1;
    } else {
      throw StateError('未知道具 $id');
    }
    out.add({'type': 'pickup', 'id': id});
  }

  void aura(List<Json> out) {
    if (hero['flags']['starShield'] == true) return;
    var raw = 0;
    for (final p in neighbours(hero['x'], hero['y'])) {
      final e = entity(p[0], p[1]);
      if (e?['kind'] != 'monster') continue;
      for (final t in monsters[e!['id']]['traits']) {
        if (t['type'] == 'aura') raw += t['damage'] as int;
      }
    }
    if (raw > 0) {
      final before = hero['hp'] as int;
      hero['hp'] = math.max(1, before - raw);
      out.add({'type': 'aura', 'damage': before - hero['hp']});
    }
  }

  List<Json> move(String dir) {
    if (state['dead'] == true || state['ended'] == true) {
      return [
        {'type': 'blocked', 'reason': '游戏已结束'}
      ];
    }
    if (!directions.containsKey(dir)) {
      return [
        {'type': 'blocked', 'reason': '无效方向'}
      ];
    }
    final before = body();
    final out = <Json>[];
    final r = step(directions[dir]!, out);
    settle(before);
    return [r, ...out];
  }

  Json step(List<int> d, List<Json> out) {
    final nx = hero['x'] + d[0] as int, ny = hero['y'] + d[1] as int;
    if (!inBounds(nx, ny)) return {'type': 'blocked', 'reason': '边界外'};
    final t = world['terr'][ny][nx], e = entity(nx, ny);
    if (['#', '%', '~', '*'].contains(t)) {
      return {'type': 'blocked', 'reason': '前方不能通行'};
    }
    if (t == 'w') {
      world['terr'][ny][nx] = '.';
      return {'type': 'false-wall'};
    }
    if (doorKeys.containsKey(t)) {
      final k = doorKeys[t]!;
      if (hero['keys'][k] <= 0) {
        return {'type': 'locked', 'reason': '需要${name(k)}才能打开'};
      }
      hero['keys'][k] -= 1;
      world['terr'][ny][nx] = '.';
      return {'type': 'door'};
    }
    if (t == 'a') return {'type': 'blocked', 'reason': '机关门，需要触发机关'};
    if (e?['kind'] == 'monster') {
      final p = preview(nx, ny)!;
      if (p['canFight'] != true) {
        return {
          'type': 'nofight',
          'reason':
              p['reason'] == 'unpierceable' ? '无法破防：攻击不大于防御' : '会死亡：损失不小于当前生命'
        };
      }
      hero['hp'] -= p['loss'];
      final gold =
          monsters[e!['id']]['gold'] * (hero['flags']['charm'] == true ? 2 : 1);
      hero['gold'] += gold;
      world['ents'].remove('$nx,$ny');
      out.add({'type': 'defeated', 'id': e['id']});
      if (e['id'] == 'endLord') {
        state['ended'] = true;
        out.add({'type': 'win'});
      }
      checkEvents({
        'defeated': {'x': nx, 'y': ny}
      }, out);
      return {'type': 'fight', 'id': e['id'], 'loss': p['loss'], 'gold': gold};
    }
    if (e?['kind'] == 'npc') {
      if (e!['id'] == 'goddess') {
        return {'type': 'blocked', 'reason': '击败门前的终焉女妖，即可解除封印、救回女神'};
      }
      if (e['id'] == 'guide') {
        checkEvents({'talked': 'guide'}, out);
        return {'type': 'talk'};
      }
      return {'type': 'shop', 'npc': e['id']};
    }
    hero['x'] = nx;
    hero['y'] = ny;
    if (e?['kind'] == 'item') {
      world['ents'].remove('$nx,$ny');
      grant(e!['id'], out);
    }
    checkEvents({
      'entered': {'x': nx, 'y': ny}
    }, out);
    if (t == '^' || t == 'v') {
      final target = (defs['$floor']['stairTo']?['$nx,$ny'] ??
          (floor + (t == '^' ? 1 : -1))) as int;
      final next = ensureFloor(target);
      final want = t == '^' ? 'v' : '^';
      List<int>? cp;
      for (final delta in [
        [0, 0],
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1]
      ]) {
        final x = nx + delta[0], y = ny + delta[1];
        if (inBounds(x, y) && next['terr'][y][x] == want) {
          cp = [x, y];
          break;
        }
      }
      Json at = defs['$target']['entry'];
      if (cp != null) {
        final p = neighbours(cp[0], cp[1]).firstWhere((p) =>
            next['terr'][p[1]][p[0]] == '.' &&
            next['ents']['${p[0]},${p[1]}'] == null);
        at = {'x': p[0], 'y': p[1]};
      }
      state['floor'] = target;
      if (!state['visited'].contains(target)) state['visited'].add(target);
      hero['x'] = at['x'];
      hero['y'] = at['y'];
      aura(out);
      return {'type': 'stairs', 'floor': target};
    }
    aura(out);
    return {'type': 'moved'};
  }

  int get altarPrice =>
      20 * (state['altarBuys'] + 1) * (state['altarBuys'] + 1) as int;
  int altarGain(String choice) =>
      (choice == 'hp'
          ? 150
          : choice == 'atk'
              ? 2
              : 3) *
      (altarTiers[floor] ?? 0);
  Json buyAltar(String choice) {
    if (!altarTiers.containsKey(floor) || !near('altar')) {
      return result(false, '需要站在祭坛旁边');
    }
    if (!['hp', 'atk', 'def'].contains(choice)) return result(false, '未知选项');
    final price = altarPrice;
    if (hero['gold'] < price) return result(false, '金币不足，需要 $price');
    final before = body();
    hero['gold'] -= price;
    state['altarBuys'] += 1;
    hero[choice] += altarGain(choice);
    settle(before);
    return result(true, '购买成功，花费 $price 金币');
  }

  Json merchantBuy(String id) {
    final list = data['MERCHANTS']['$floor'] as List? ?? [];
    final found = list.where((e) => e['id'] == id);
    if (found.isEmpty) return result(false, '这里没有这件商品');
    final item = found.first;
    if (!near('merchant')) return result(false, '需要站在商人旁边');
    if (item['unlimited'] != true && state['soldOut'].contains(id)) {
      return result(false, '已经售完');
    }
    final before = body();
    if (item['recycle'] != null) {
      final key = item['recycle'];
      if (hero['keys'][key] <= 0) return result(false, '没有可以回收的钥匙');
      hero['keys'][key] -= 1;
      hero['gold'] += item['gold'];
      settle(before);
      return result(true, '回收成功，获得 ${item['gold']} 金币');
    }
    if (hero['gold'] < item['price']) {
      return result(false, '金币不足，需要 ${item['price']}');
    }
    hero['gold'] -= item['price'];
    state['soldOut'].add(id);
    hero['hp'] += item['hp'] ?? 0;
    (item['items'] as Map? ?? {}).forEach((k, n) {
      final target = data['KEYS'][k] != null ? hero['keys'] : state['items'];
      target[k] = (target[k] ?? 0) + n;
    });
    settle(before);
    return result(true, '购买成功，花费 ${item['price']} 金币');
  }

  Json useItem(String id, [int? target]) {
    final def = data['ACTIVE'][id];
    if (def == null) return result(false, '这件道具不能主动使用');
    if ((state['items'][id] ?? 0) <= 0) return result(false, '没有${name(id)}');
    final before = body();
    final out = <Json>[];
    String text;
    switch (id) {
      case 'compass':
        final hidden = state['hiddenMode'] == true;
        if (target == null ||
            target < 1 ||
            target > 50 ||
            defs['$target'] == null) {
          return result(false, '楼层无效');
        }
        if (!hidden && floor == 50) return result(false, '第 50 层不能使用传送罗盘');
        if (!hidden && !state['visited'].contains(target)) {
          return result(false, '只能传送到已到过的楼层');
        }
        if (!hidden && (target == 44 || target == 50)) {
          return result(false, '罗盘不能传送到第 44、50 层');
        }
        ensureFloor(target);
        state['floor'] = target;
        if (!state['visited'].contains(target)) state['visited'].add(target);
        hero['x'] = defs['$target']['entry']['x'];
        hero['y'] = defs['$target']['entry']['y'];
        text = '传送到第 $target 层';
        break;
      case 'pickaxe':
        final hit = neighbours(hero['x'], hero['y'])
            .where((p) => world['terr'][p[1]][p[0]] == '%');
        if (hit.isEmpty) return result(false, '周围没有裂墙');
        final p = hit.first;
        world['terr'][p[1]][p[0]] = '.';
        text = '凿开了一面裂墙';
        break;
      case 'flask':
        hero['hp'] *= 2;
        text = '生命翻倍，现为 ${hero['hp']}';
        break;
      case 'mirrorJump':
        final x = 10 - hero['x'] as int, y = 10 - hero['y'] as int;
        if (world['terr'][y][x] != '.' || entity(x, y) != null) {
          return result(false, '对称位置不是没有东西的空地');
        }
        hero['x'] = x;
        hero['y'] = y;
        text = '镜面跃迁到 ($x, $y)';
        break;
      case 'frostCore':
        var n = 0;
        for (final row in world['terr']) {
          for (var x = 0; x < 11; x++) {
            if (row[x] == '~') {
              row[x] = '.';
              n++;
            }
          }
        }
        if (n == 0) return result(false, '本层没有熔岩');
        text = '清除了 $n 格熔岩';
        break;
      case 'bomb':
        var n = 0;
        for (final p in neighbours(hero['x'], hero['y'])) {
          final e = entity(p[0], p[1]);
          if (e?['kind'] == 'monster' && monsters[e!['id']]['boss'] != true) {
            world['ents'].remove('${p[0]},${p[1]}');
            n++;
            out.add({'type': 'defeated', 'id': e['id']});
            checkEvents({
              'defeated': {'x': p[0], 'y': p[1]}
            }, out);
          }
        }
        if (n == 0) return result(false, '周围没有可以炸的怪物');
        checkEvents({}, out);
        text = '炸掉了 $n 只怪物（不给金币）';
        break;
      default:
        return result(false, '未实现');
    }
    if (def['uses'] != 'unlimited') state['items'][id] -= 1;
    settle(before);
    return result(true, text, out);
  }

  String serialize() => jsonEncode(state);
  bool load(String text) {
    try {
      final obj = jsonDecode(text);
      if (obj is! Map<String, dynamic> ||
          obj['version'] != 1 ||
          obj['hero'] is! Map ||
          obj['world'] is! Map ||
          defs['${obj['floor']}'] == null) return false;
      if (!(obj['world'] as Map).keys.every((k) => defs['$k'] != null)) {
        return false;
      }
      final h = obj['hero'];
      if (h['hp'] is! int ||
          h['hp'] <= 0 ||
          h['x'] is! int ||
          h['y'] is! int ||
          !inBounds(h['x'], h['y'])) return false;
      obj['history'] = [];
      state = obj;
      if (state['world']['50'] != null) ensureFloor(50);
      ensureFloor(floor);
      return true;
    } catch (_) {
      return false;
    }
  }
}
