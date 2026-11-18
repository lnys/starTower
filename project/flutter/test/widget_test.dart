import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:star_tower/main.dart';
import 'package:star_tower/game/engine.dart';
import 'package:star_tower/ui/rescue_ending.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  setUp(() {
    SharedPreferences.setMockInitialValues({});
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(
            const MethodChannel('xyz.luan/audioplayers.global'),
            (call) async => 1);
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(
            const MethodChannel('xyz.luan/audioplayers'), (call) async => 1);
  });
  for (final size in [
    const Size(375, 812),
    const Size(320, 568),
    const Size(270, 590),
    const Size(360, 698),
    const Size(480, 864),
    const Size(1280, 800)
  ]) {
    testWidgets('游戏布局与操作 ${size.width}×${size.height}', (tester) async {
      tester.view.physicalSize = size;
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      final engine = GameEngine(
          jsonDecode(File('assets/data/game.json').readAsStringSync()));
      final prefs = await SharedPreferences.getInstance();
      await tester.pumpWidget(TowerApp(engine: engine, prefs: prefs));
      await tester.pumpAndSettle();
      expect(find.text('新的冒险'), findsOneWidget);
      await tester.tap(find.text('新的冒险'));
      await tester.pumpAndSettle();
      expect(find.text('第 1 层'), findsOneWidget);
      expect(find.text('快速存档'), findsOneWidget);
      final saveText = tester.widget<Text>(find.text('快速存档'));
      expect(saveText.maxLines, 1);
      expect(saveText.softWrap, false);
      for (var tap = 0; tap < 9; tap++) {
        await tester.tap(find.byKey(const ValueKey('hidden-mode-trigger')));
        await tester.pump();
      }
      expect(engine.state['hiddenMode'], isNot(true));
      await tester.tap(find.byKey(const ValueKey('hidden-mode-trigger')));
      await tester.pumpAndSettle();
      expect(engine.state['hiddenMode'], true);
      expect(engine.state['items']['compass'], 1);
      final saved = jsonDecode(prefs.getString('save_auto')!);
      expect(saved['hiddenMode'], true);
      for (final floor in [50, 44, 1]) {
        await tester.tap(find.text('罗盘'));
        await tester.pumpAndSettle();
        final target = find.text('$floor 层');
        await tester.ensureVisible(target);
        await tester.tap(target);
        await tester.pumpAndSettle();
        expect(engine.floor, floor);
        if (floor == 50) {
          expect(find.bySemanticsLabel('终焉女妖'), findsOneWidget);
          expect(find.bySemanticsLabel('你的女神'), findsOneWidget);
          expect(find.bySemanticsLabel(RegExp('星柱守卫')), findsNWidgets(4));
        }
      }
      expect(tester.takeException(), isNull);
      final startX = engine.hero['x'];
      await tester.sendKeyEvent(LogicalKeyboardKey.arrowLeft);
      await tester.pump();
      expect(engine.hero['x'], startX - 1);
      await tester.sendKeyEvent(LogicalKeyboardKey.keyZ);
      await tester.pump();
      expect(engine.hero['x'], startX);
      await tester.tap(find.text('菜单'));
      await tester.pumpAndSettle();
      expect(find.text('暂停'), findsOneWidget);
      await tester.tap(find.text('关闭'));
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
      await tester.pumpWidget(const SizedBox());
      await tester.pump(const Duration(seconds: 4));
    });
  }
  testWidgets('NPC 提示位于棋盘下方且不阻挡方向操作', (tester) async {
    tester.view.physicalSize = const Size(360, 698);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    final engine = GameEngine(
        jsonDecode(File('assets/data/game.json').readAsStringSync()));
    engine.hero['atk'] = 1000;
    engine.hero['x'] = 9;
    engine.hero['y'] = 10;
    SharedPreferences.setMockInitialValues({'save_auto': engine.serialize()});
    final prefs = await SharedPreferences.getInstance();
    await tester.pumpWidget(TowerApp(engine: engine, prefs: prefs));
    await tester.pumpAndSettle();
    await tester.tap(find.text('继续冒险'));
    await tester.pumpAndSettle();
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowRight);
    await tester.pumpAndSettle();
    expect(find.byType(AlertDialog), findsNothing);
    expect(find.textContaining('你的女神被终焉女妖囚禁'), findsOneWidget);
    final board = tester.getRect(find.byKey(const ValueKey('game-board')));
    final notice = tester.getRect(find.byKey(const ValueKey('board-notice')));
    final controls =
        tester.getRect(find.byKey(const ValueKey('game-controls')));
    expect(notice.top, greaterThanOrEqualTo(board.bottom));
    expect(notice.bottom, lessThanOrEqualTo(controls.top));
    final before = engine.hero['x'];
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowLeft);
    await tester.pump();
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowLeft);
    await tester.pump();
    expect(engine.hero['x'], before - 1);
    expect(tester.takeException(), isNull);
    await tester.pumpWidget(const SizedBox());
    await tester.pump(const Duration(seconds: 4));
  });
  for (final size in [const Size(320, 568), const Size(1280, 800)]) {
    testWidgets('通关存档可重看结局和拆信 ${size.width}', (tester) async {
      tester.view.physicalSize = size;
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      final engine = GameEngine(
          jsonDecode(File('assets/data/game.json').readAsStringSync()));
      engine.state['floor'] = 50;
      engine.ensureFloor(50);
      engine.hero['hp'] = 137;
      engine.state['ended'] = true;
      SharedPreferences.setMockInitialValues({'save_auto': engine.serialize()});
      final prefs = await SharedPreferences.getInstance();
      await tester.pumpWidget(TowerApp(engine: engine, prefs: prefs));
      await tester.pumpAndSettle();
      await tester.tap(find.text('继续冒险'));
      await tester.pump();
      await tester.pump(const Duration(seconds: 1));
      await tester.pump(const Duration(milliseconds: 400));
      expect(find.byType(RescueEnding), findsOneWidget);
      final letter = find.text('拆开这份惊喜');
      await tester.ensureVisible(letter);
      await tester.pump();
      await tester.tap(letter);
      await tester.pump(const Duration(seconds: 1));
      expect(find.text('纪念称号 · 她的唯一勇者'), findsOneWidget);
      final back = find.text('带着约定，返回标题');
      await tester.ensureVisible(back);
      await tester.pump();
      await tester.tap(back);
      await tester.pumpAndSettle();
      expect(find.text('新的冒险'), findsOneWidget);
      expect(tester.takeException(), isNull);
      await tester.pumpWidget(const SizedBox());
      await tester.pump(const Duration(seconds: 4));
    });
  }
}
