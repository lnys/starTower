import 'dart:convert';
import 'dart:io';
import 'package:flutter_test/flutter_test.dart';
import 'package:star_tower/game/engine.dart';
import '../tool/replay.dart' as replay;

void main() {
  GameEngine fresh() =>
      GameEngine(jsonDecode(File('assets/data/game.json').readAsStringSync()));
  test('完整 3774 步真实通关，与 Vue 数值一致', replay.main);
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
