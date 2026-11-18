import 'dart:convert';
import 'dart:io';
import 'package:flutter_test/flutter_test.dart';
import 'package:star_tower/game/engine.dart';
import '../tool/replay.dart' as replay;

void main() {
  GameEngine fresh() =>
      GameEngine(jsonDecode(File('assets/data/game.json').readAsStringSync()));
  test('完整 3779 步真实通关，与 Vue 数值一致', replay.main);
  test('旧存档仍可复读引路人对白，且不会重复领取奖励', () {
    final e = fresh();
    e.state['floor'] = 3;
    final guide = (e.world['ents'] as Map)
        .entries
        .firstWhere((entry) => entry.value['id'] == 'guide');
    final xy = (guide.key as String).split(',').map(int.parse).toList();
    e.hero['x'] = xy[0] - 1;
    e.hero['y'] = xy[1];
    final message = e.move('right').singleWhere((ev) => ev['type'] == 'say');
    expect(e.state['items']['compass'], 1);
    expect(e.load(e.serialize()), isTrue);
    expect(e.move('right').singleWhere((ev) => ev['type'] == 'say'), message);
    expect(e.state['items']['compass'], 1);
    expect(
        e.state['firedEvents'].where((id) => id == 'f3-guide'), hasLength(1));
  });
  test('撞墙不占用或丢失撤销记录', () {
    final e = fresh();
    e.move('left');
    final count = e.history.length;
    final x = e.hero['x'];
    e.move('up');
    expect(e.history.length, count);
    e.undo();
    expect(e.hero['x'], x + 1);
  });
  test('无法破防与致死战斗均禁止', () {
    final e = fresh();
    final monster = {'hp': 100, 'atk': 1000, 'def': 10, 'traits': []};
    expect(e.combat(monster)['reason'], 'unpierceable');
    monster['def'] = 0;
    expect(e.combat(monster)['reason'], 'lethal');
  });
  test('坏存档不覆盖当前游戏', () {
    final e = fresh();
    final before = e.serialize();
    expect(e.load('{broken'), false);
    expect(e.load('{"version":1}'), false);
    expect(e.serialize(), before);
  });
  test('NPC和全部怪物都有实际图标文件', () {
    final e = fresh();
    for (final id in e.monsters.keys) {
      final sprite = e.data['art']['MONSTER_ART'][id];
      expect(sprite, isNotNull, reason: '$id 缺少图标');
      expect(File('assets/images/$sprite.svg').existsSync(), isTrue);
    }
    for (final id in ['guide', 'altar', 'merchant']) {
      final sprite = e.data['art']['NPC_ART'][id];
      expect(sprite, isNotNull, reason: '$id 缺少图标');
      expect(File('assets/images/$sprite.svg').existsSync(), isTrue);
    }
  });
  test('隐藏罗盘可往返未到过及禁用层，普通模式限制保留', () {
    final e = fresh();
    e.state['items']['compass'] = 1;
    e.state['visited'].addAll([44, 50]);
    for (final f in [35, 44, 50]) {
      expect(e.useItem('compass', f)['ok'], false);
    }
    e.state['floor'] = 50;
    expect(e.useItem('compass', 1)['ok'], false);
    e.state['hiddenMode'] = true;
    for (final f in [35, 44, 50, 1]) {
      expect(e.useItem('compass', f)['ok'], true);
      expect(e.floor, f);
      expect(e.state['visited'], contains(f));
      expect(e.hero['x'], e.defs['$f']['entry']['x']);
      expect(e.hero['y'], e.defs['$f']['entry']['y']);
    }
    for (final f in [null, 0, 51]) {
      final before = e.serialize();
      expect(e.useItem('compass', f)['ok'], false);
      expect(e.serialize(), before);
    }
    final copy = fresh();
    expect(copy.load(e.serialize()), true);
    expect(copy.state['hiddenMode'], true);
    e.undo();
    expect(e.floor, 50);
    expect(e.state['hiddenMode'], true);
    e.reset();
    expect(e.state['hiddenMode'], isNot(true));
  });
  test('终层女神不可拾取，守卫可战斗，击败女妖即可营救', () {
    final e = fresh();
    e.state['floor'] = 50;
    e.ensureFloor(50);
    e.hero['x'] = 5;
    e.hero['y'] = 4;
    e.hero['hp'] = 10000;
    e.hero['atk'] = 10000;
    e.hero['def'] = 10000;
    expect(e.entity(5, 2)?['kind'], 'npc');
    expect(
        (e.world['ents'] as Map)
            .values
            .where((v) => v['id'] == 'pillarGuard')
            .length,
        4);
    e.hero['x'] = 5;
    e.hero['y'] = 1;
    expect(e.move('down').first['type'], 'blocked');
    expect(e.entity(5, 2)?['id'], 'goddess');
    e.hero['x'] = 2;
    e.hero['y'] = 4;
    expect(e.move('right').first['type'], 'fight');
    expect(e.entity(3, 4), isNull);
    e.hero['x'] = 5;
    e.hero['y'] = 4;
    expect(e.move('up').any((ev) => ev['type'] == 'win'), true);
    expect(e.state['ended'], true);
  });
  test('旧终层存档升级场景，保留属性及击败状态且不重复生成守卫', () {
    final e = fresh();
    e.state['floor'] = 50;
    e.ensureFloor(50);
    e.hero['x'] = 5;
    e.hero['y'] = 4;
    final oldWorld = e.world;
    oldWorld.remove('sceneVersion');
    oldWorld['ents'] = {
      '5,3': {'kind': 'monster', 'id': 'endLord'}
    };
    final hp = e.hero['hp'];
    expect(e.load(e.serialize()), true);
    expect(e.hero['hp'], hp);
    expect(e.entity(5, 2)?['id'], 'goddess');
    expect(e.entity(5, 3)?['id'], 'endLord');
    e.world['ents'].remove('3,4');
    expect(e.load(e.serialize()), true);
    expect(e.entity(3, 4), isNull);
    final completedWorld = e.world;
    completedWorld.remove('sceneVersion');
    completedWorld['ents'].remove('5,3');
    e.state['ended'] = true;
    expect(e.load(e.serialize()), true);
    expect(e.entity(5, 3), isNull);
    expect(e.state['ended'], true);
  });
  test('全部 50 层可实例化', () {
    final e = fresh();
    for (var floor = 1; floor <= 50; floor++) {
      final w = e.ensureFloor(floor);
      expect(w['terr'].length, 11);
      for (final row in w['terr']) {
        expect(row.length, 11);
      }
    }
  });
}
