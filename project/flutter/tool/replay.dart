import 'dart:convert';
import 'dart:io';
import 'package:star_tower/game/engine.dart';

void main() {
  final engine =
      GameEngine(jsonDecode(File('assets/data/game.json').readAsStringSync()));
  final route = jsonDecode(File('test/route.json').readAsStringSync()) as List;
  for (var i = 0; i < route.length; i++) {
    final a = route[i];
    dynamic r;
    if (a['altar'] != null) {
      r = engine.buyAltar(a['altar']);
    } else if (a['shop'] != null) {
      r = engine.merchantBuy(a['shop']);
    } else if (a['item'] != null) {
      r = engine.useItem(a['item']);
    } else if (a['talk'] != null) {
      final dir = directions.keys.firstWhere((d) {
        final delta = directions[d]!;
        return engine.entity(engine.hero['x'] + delta[0],
                engine.hero['y'] + delta[1])?['id'] ==
            'guide';
      });
      r = engine.move(dir);
    } else if (a['step'] == 'compass') {
      r = engine.useItem('compass', a['to']);
    } else if (a['step'] == 'mirror') {
      r = engine.useItem('mirrorJump');
    } else {
      final d = directions[a['dir']]!,
          x = engine.hero['x'] + d[0],
          y = engine.hero['y'] + d[1];
      final t = engine.world['terr'][y][x];
      r = t == '%'
          ? engine.useItem('pickaxe')
          : t == '~'
              ? engine.useItem('frostCore')
              : engine.move(a['dir']);
    }
    final ok = r is List
        ? !['blocked', 'nofight', 'locked'].contains(r.first['type'])
        : r['ok'] == true;
    if (!ok) throw StateError('第 ${i + 1} 步失败：$a → $r');
  }
  if (engine.floor != 50 ||
      engine.state['ended'] != true ||
      engine.hero['hp'] != 1241 ||
      engine.hero['atk'] != 378 ||
      engine.hero['def'] != 501) throw StateError('通关结果不一致：${engine.hero}');
  final saved = engine.serialize();
  if (!engine.load(saved) || engine.history.isNotEmpty) {
    throw StateError('存档往返失败');
  }
  stdout.writeln('Dart 引擎通关：${route.length} 步；生命 1241，攻击 378，防御 501；存档往返通过。');
}
