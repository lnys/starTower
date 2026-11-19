import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:star_tower/main.dart';
import 'package:star_tower/game/engine.dart';
import 'package:star_tower/ui/rescue_ending.dart';
import 'package:star_tower/ui/localization.dart';
import 'package:star_tower/ui/style_catalog.dart';
import 'package:star_tower/ui/title_backdrop.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  setUp(() {
    SharedPreferences.setMockInitialValues({});
    final dispatcher = TestWidgetsFlutterBinding.instance.platformDispatcher;
    dispatcher.accessibilityFeaturesTestValue =
        const FakeAccessibilityFeatures(disableAnimations: true);
    addTearDown(dispatcher.clearAccessibilityFeaturesTestValue);
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(
            const MethodChannel('xyz.luan/audioplayers.global'),
            (call) async => 1);
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(
            const MethodChannel('xyz.luan/audioplayers'), (call) async => 1);
  });
  testWidgets('三语即时切换、保留进度并在重新启动后恢复', (tester) async {
    tester.view.devicePixelRatio = 1;
    tester.view.physicalSize = const Size(320, 568);
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    final engine = GameEngine(
        jsonDecode(File('assets/data/game.json').readAsStringSync()));
    final raw =
        jsonDecode(File('assets/data/translations.json').readAsStringSync())
            as Map<String, dynamic>;
    final translations = TowerTranslations(raw
        .map((key, value) => MapEntry(key, List<String>.from(value as List))));
    final prefs = await SharedPreferences.getInstance();
    Widget app() =>
        TowerApp(engine: engine, prefs: prefs, translations: translations);
    await tester.pumpWidget(app());
    expect(find.text('新的冒险'), findsOneWidget);
    await tester.tap(find.text('新的冒险'));
    await tester.pumpAndSettle();
    final save = prefs.getString('save_auto');
    expect(save, isNotNull);
    await tester.tap(find.text('菜单'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('设置'));
    await tester.pumpAndSettle();
    Future<void> choose(String text) async {
      await tester.tap(find.byKey(const ValueKey('tower-language')));
      await tester.pumpAndSettle();
      await tester.tap(find.text(text).last);
      await tester.pumpAndSettle();
    }

    await choose('English');
    expect(find.text('Settings'), findsOneWidget);
    expect(find.text('Visual Style'), findsOneWidget);
    expect(prefs.getString('language'), 'en');
    await choose('日本語');
    expect(find.text('設定'), findsOneWidget);
    expect(find.text('外観テーマ'), findsOneWidget);
    expect(prefs.getString('language'), 'ja');
    await tester.tap(find.text('閉じる'));
    await tester.pumpAndSettle();
    expect(find.text('メニュー'), findsOneWidget);
    expect(prefs.getString('save_auto'), save);
    await tester.pumpWidget(const SizedBox());
    await tester.pumpWidget(app());
    expect(find.text('新しい冒険'), findsOneWidget);
    expect(translations.message('ja', '需要蓝钥匙才能打开'), '開けるには青い鍵が必要です。');
    expect(tester.takeException(), isNull);
  },
      variant:
          const TargetPlatformVariant({TargetPlatform.iOS, TargetPlatform.android}));

  testWidgets('标题背景会移动，但不会移动按钮或挡住点击，并支持减少动态效果', (tester) async {
    final dispatcher = tester.binding.platformDispatcher;
    dispatcher.accessibilityFeaturesTestValue =
        const FakeAccessibilityFeatures();
    final engine = GameEngine(
        jsonDecode(File('assets/data/game.json').readAsStringSync()));
    final prefs = await SharedPreferences.getInstance();
    await tester.pumpWidget(TowerApp(
        engine: engine, prefs: prefs, translations: TowerTranslations()));
    final landscape = find.byKey(const ValueKey('title-landscape'));
    Offset offset() =>
        tester.widget<FractionalTranslation>(landscape).translation;
    final start = find.text('新的冒险');
    final buttonRect = tester.getRect(start);
    final before = offset();
    await tester.pump(const Duration(seconds: 4));
    expect(offset(), isNot(before));
    expect(tester.getRect(start), buttonRect);
    await tester.tap(find.text('设置'));
    await tester.pumpAndSettle();
    final paused = offset();
    await tester.pump(const Duration(seconds: 2));
    expect(offset(), paused);
    await tester.tap(find.text('关闭'));
    await tester.pump(const Duration(milliseconds: 300));
    dispatcher.accessibilityFeaturesTestValue =
        const FakeAccessibilityFeatures(disableAnimations: true);
    await tester.pumpAndSettle();
    final still = offset();
    await tester.pump(const Duration(seconds: 4));
    expect(offset(), still);
    await tester.tap(start);
    await tester.pumpAndSettle();
    expect(find.byType(TitleBackdrop), findsNothing);
    expect(find.byKey(const ValueKey('game-board')), findsOneWidget);
  });

  for (final platform in [
    TargetPlatform.iOS,
    TargetPlatform.android,
    TargetPlatform.macOS,
  ]) {
    testWidgets('$platform 音量设置与静音', (tester) async {
      final volumes = <double>[];
      TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
          .setMockMethodCallHandler(
              const MethodChannel('xyz.luan/audioplayers'), (call) async {
        if (call.method == 'setVolume') {
          volumes.add(call.arguments['volume'] as double);
        }
        return 1;
      });
      final engine = GameEngine(
          jsonDecode(File('assets/data/game.json').readAsStringSync()));
      final prefs = await SharedPreferences.getInstance();
      await tester.pumpWidget(TowerApp(
          engine: engine, prefs: prefs, translations: TowerTranslations()));
      await tester.pumpAndSettle();
      await tester.tap(find.text('设置'));
      await tester.pumpAndSettle();
      expect(tester.widget<Slider>(find.byType(Slider)).value, .85);
      tester.widget<Slider>(find.byType(Slider)).onChanged!(.6);
      await tester.pumpAndSettle();
      expect(volumes.last, closeTo(.57, .0001));
      await tester.tap(find.text('静音'));
      await tester.pumpAndSettle();
      expect(volumes.last, 0);
      expect(prefs.getBool('muted'), isTrue);
      await tester.tap(find.text('静音'));
      await tester.pumpAndSettle();
      expect(volumes.last, closeTo(.57, .0001));
      await tester.pumpWidget(const SizedBox.shrink());
      await tester.pumpAndSettle();
      await tester.pumpWidget(TowerApp(
          engine: engine, prefs: prefs, translations: TowerTranslations()));
      await tester.pumpAndSettle();
      await tester.tap(find.text('设置'));
      await tester.pumpAndSettle();
      expect(tester.widget<Slider>(find.byType(Slider)).value, .6);
    }, variant: TargetPlatformVariant({platform}));
  }
  testWidgets('五款风格即时切换、保留存档并在重启后恢复', (tester) async {
    tester.view.physicalSize = const Size(320, 568);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    SharedPreferences.setMockInitialValues({'style': 'obsolete-style'});
    final prefs = await SharedPreferences.getInstance();
    final engine = GameEngine(
        jsonDecode(File('assets/data/game.json').readAsStringSync()));
    final app = TowerApp(
        engine: engine, prefs: prefs, translations: TowerTranslations());
    MaterialApp materialApp() =>
        tester.widget<MaterialApp>(find.byType(MaterialApp));
    Finder choice(String id) => find.byKey(ValueKey('style-$id'));
    await tester.pumpWidget(app);
    await tester.pumpAndSettle();
    expect(materialApp().theme!.scaffoldBackgroundColor,
        towerStyles.first.background);
    await tester.tap(find.text('新的冒险'));
    await tester.pumpAndSettle();
    final saved = prefs.getString('save_auto');
    expect(saved, isNotNull);
    final board = find.byKey(const ValueKey('game-board'));
    final size = tester.getSize(board);
    await tester.tap(find.text('菜单'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('设置'));
    await tester.pumpAndSettle();
    final dialog = find.byType(AlertDialog);
    expect(find.text('界面风格'), findsOneWidget);
    for (final style in [
      ...towerStyles.skip(1),
      towerStyles.first,
      towerStyles.last
    ]) {
      await tester.ensureVisible(choice(style.id));
      await tester.tap(choice(style.id));
      await tester.pumpAndSettle();
      expect(materialApp().theme!.scaffoldBackgroundColor, style.background);
      if (!style.classic) {
        expect(Theme.of(tester.element(dialog)).dialogTheme.backgroundColor,
            style.panel);
      }
      expect(prefs.getString('style'), style.id);
      expect(prefs.getString('save_auto'), saved);
      expect(tester.getSize(board), size);
    }
    await tester.tap(find.text('关闭'));
    await tester.pumpAndSettle();
    expect(
        find.byWidgetPredicate((widget) =>
            widget is Image &&
            widget.image is AssetImage &&
            (widget.image as AssetImage).assetName ==
                'assets/images/pixel/hero/hero.png'),
        findsWidgets);
    await tester.tap(find.text('菜单'));
    await tester.pumpAndSettle();
    final back = find.text('返回游戏主界面');
    final homeIcon = find.byIcon(Icons.home_outlined);
    expect(tester.getRect(homeIcon).right, lessThan(tester.getRect(back).left));
    await tester.tap(back);
    await tester.pumpAndSettle();
    expect(board, findsNothing);
    expect(
        tester
            .widget<OutlinedButton>(find.ancestor(
              of: find.text('继续冒险'),
              matching: find.byType(OutlinedButton),
            ))
            .onPressed,
        isNotNull);
    await tester.pumpWidget(const SizedBox.shrink());
    await tester.pumpAndSettle();
    await tester.pumpWidget(app);
    await tester.pumpAndSettle();
    expect(materialApp().theme!.scaffoldBackgroundColor,
        towerStyles.last.background);
    expect(find.text('继续冒险'), findsOneWidget);
  },
      variant: const TargetPlatformVariant(
          {TargetPlatform.iOS, TargetPlatform.android}));

  for (final size in [
    const Size(375, 812),
    const Size(430, 932),
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
      await tester.pumpWidget(TowerApp(
          engine: engine, prefs: prefs, translations: TowerTranslations()));
      await tester.pumpAndSettle();
      expect(find.text('新的冒险'), findsOneWidget);
      await tester.tap(find.text('新的冒险'));
      await tester.pumpAndSettle();
      expect(find.text('第 1 层'), findsOneWidget);
      expect(find.text('快速存档'), findsOneWidget);
      if (size.width < 600) {
        final logo = find.byKey(const ValueKey('tower-logo'));
        expect(logo, findsOneWidget);
        final title = tester.getRect(find.text('星穹塔'));
        expect(title.left, greaterThan(tester.getRect(logo).right));
        expect(
            title.right,
            closeTo(
                tester.getRect(find.byKey(const ValueKey('game-header'))).right,
                10.01));
      }
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
    },
        variant: TargetPlatformVariant({
          size.width < 600 ? TargetPlatform.iOS : TargetPlatform.macOS,
        }));
  }
  for (final platform in [TargetPlatform.iOS, TargetPlatform.android]) {
    testWidgets('手机棋盘大小不受提示影响 $platform', (tester) async {
      tester.view.physicalSize = const Size(320, 568);
      tester.view.devicePixelRatio = 1;
      tester.view.padding = const FakeViewPadding(top: 24, bottom: 24);
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      addTearDown(tester.view.resetPadding);
      final engine = GameEngine(
          jsonDecode(File('assets/data/game.json').readAsStringSync()));
      engine.hero['atk'] = 1000;
      engine.hero['x'] = 9;
      engine.hero['y'] = 10;
      SharedPreferences.setMockInitialValues({'save_auto': engine.serialize()});
      final prefs = await SharedPreferences.getInstance();
      await tester.pumpWidget(TowerApp(
          engine: engine, prefs: prefs, translations: TowerTranslations()));
      await tester.pumpAndSettle();
      await tester.tap(find.text('继续冒险'));
      await tester.pumpAndSettle();
      await tester.pump(const Duration(seconds: 4));
      final board = find.byKey(const ValueKey('game-board'));
      final notice = find.byKey(const ValueKey('compact-notice'));
      final controls = find.byKey(const ValueKey('game-controls'));
      final boardRect = tester.getRect(board);
      expect(boardRect.width, greaterThanOrEqualTo(240));
      expect(tester.getRect(notice).top, greaterThan(boardRect.bottom));
      expect(tester.getRect(notice).bottom,
          lessThanOrEqualTo(tester.getRect(controls).top));
      expect(find.byKey(const ValueKey('board-notice')), findsNothing);
      await tester.tap(notice);
      await tester.pumpAndSettle();
      expect(find.text('操作说明'), findsOneWidget);
      await tester.tap(find.text('关闭'));
      await tester.pumpAndSettle();
      await tester.sendKeyEvent(LogicalKeyboardKey.arrowRight);
      await tester.pumpAndSettle();
      expect(find.byType(AlertDialog), findsNothing);
      expect(find.textContaining('你的女神被终焉女妖囚禁'), findsOneWidget);
      expect(tester.getRect(board), boardRect);
      await tester.tap(notice);
      await tester.pumpAndSettle();
      final story = find.descendant(
          of: find.byType(AlertDialog),
          matching: find.textContaining('你的女神被终焉女妖囚禁'));
      expect(tester.widget<Text>(story).maxLines, isNull);
      await tester.tap(find.text('关闭'));
      await tester.pumpAndSettle();
      await tester.sendKeyEvent(LogicalKeyboardKey.arrowLeft);
      await tester.pumpAndSettle();
      expect(tester.getRect(board), boardRect);
      tester.view.physicalSize = const Size(568, 320);
      await tester.pumpAndSettle();
      expect(tester.getRect(board).width, greaterThan(200));
      expect(tester.takeException(), isNull);
      await tester.pumpWidget(const SizedBox());
    }, variant: TargetPlatformVariant({platform}));
  }
  testWidgets('手机商店弹窗交易不改变棋盘尺寸', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    final engine = GameEngine(
        jsonDecode(File('assets/data/game.json').readAsStringSync()));
    engine.state['floor'] = 6;
    engine.hero['x'] = 1;
    engine.hero['y'] = 2;
    engine.hero['gold'] = 30;
    SharedPreferences.setMockInitialValues({'save_auto': engine.serialize()});
    final prefs = await SharedPreferences.getInstance();
    await tester.pumpWidget(TowerApp(
        engine: engine, prefs: prefs, translations: TowerTranslations()));
    await tester.pumpAndSettle();
    await tester.tap(find.text('继续冒险'));
    await tester.pumpAndSettle();
    final board = find.byKey(const ValueKey('game-board'));
    final before = tester.getRect(board);
    await tester.tap(find.text('商人'));
    await tester.pumpAndSettle();
    expect(find.byType(AlertDialog), findsOneWidget);
    await tester.tap(find.textContaining('30 金币'));
    await tester.pumpAndSettle();
    expect(engine.hero['gold'], 0);
    await tester.tap(find.text('关闭'));
    await tester.pumpAndSettle();
    expect(tester.getRect(board), before);
    expect(tester.takeException(), isNull);
    await tester.pumpWidget(const SizedBox());
  }, variant: const TargetPlatformVariant({TargetPlatform.android}));
  testWidgets('桌面 NPC 提示位于棋盘下方且不阻挡方向操作', (tester) async {
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
    await tester.pumpWidget(TowerApp(
        engine: engine, prefs: prefs, translations: TowerTranslations()));
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
  }, variant: const TargetPlatformVariant({TargetPlatform.macOS}));
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
      await tester.pumpWidget(TowerApp(
          engine: engine, prefs: prefs, translations: TowerTranslations()));
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
