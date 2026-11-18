import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:star_tower/main.dart';
import 'package:star_tower/game/engine.dart';

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
}
