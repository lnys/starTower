import 'dart:async';
import 'dart:convert';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:audioplayers/audioplayers.dart';
import 'game/engine.dart';
import 'ui/rescue_ending.dart';
import 'ui/style_catalog.dart';
import 'ui/title_backdrop.dart';

bool get fixedGameViewport =>
    kIsWeb ||
    {TargetPlatform.macOS, TargetPlatform.windows, TargetPlatform.linux}
        .contains(defaultTargetPlatform);

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(SystemUiOverlayStyle.light);
  final data =
      jsonDecode(await rootBundle.loadString('assets/data/game.json')) as Json;
  final prefs = await SharedPreferences.getInstance();
  if (kIsWeb) {
    await (FontLoader('Tower Chinese')
          ..addFont(rootBundle.load('assets/fonts/tower-chinese.otf')))
        .load();
  }
  runApp(TowerApp(engine: GameEngine(data), prefs: prefs));
}

class TowerApp extends StatefulWidget {
  final GameEngine engine;
  final SharedPreferences prefs;
  const TowerApp({super.key, required this.engine, required this.prefs});

  @override
  State<TowerApp> createState() => _TowerAppState();
}

class _TowerAppState extends State<TowerApp> {
  late TowerStyle style;

  @override
  void initState() {
    super.initState();
    style = resolveTowerStyle(widget.prefs.getString('style'));
  }

  void changeStyle(TowerStyle next) {
    if (style == next) return;
    setState(() => style = next);
    unawaited(widget.prefs.setString('style', next.id));
  }

  @override
  Widget build(BuildContext context) {
    final shape = RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(style.radius));
    return MaterialApp(
        title: '星穹塔',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
            brightness: Brightness.dark,
            scaffoldBackgroundColor: style.background,
            colorScheme: ColorScheme.dark(
                primary: style.accent,
                secondary: style.accent,
                surface: style.panel),
            useMaterial3: true,
            fontFamilyFallback: const [
              if (kIsWeb) 'Tower Chinese',
              'PingFang SC',
              'Microsoft YaHei',
              'Noto Sans CJK SC'
            ],
            textTheme: const TextTheme(
                bodyMedium: TextStyle(color: Color(0xffeee6d5))),
            dialogTheme: style.classic
                ? null
                : DialogTheme(
                    backgroundColor: style.panel,
                    surfaceTintColor: Colors.transparent,
                    shape: shape.copyWith(side: BorderSide(color: style.trim))),
            filledButtonTheme: FilledButtonThemeData(
                style: FilledButton.styleFrom(
                    backgroundColor: style.button,
                    foregroundColor: style.accent,
                    shape: style.classic ? null : shape,
                    minimumSize: const Size(0, 44))),
            outlinedButtonTheme: OutlinedButtonThemeData(
                style: OutlinedButton.styleFrom(
                    foregroundColor: style.accent,
                    side: BorderSide(color: style.trim),
                    backgroundColor: style.classic ? null : style.panel,
                    shape: style.classic ? null : shape,
                    minimumSize: const Size(0, 44)))),
        home: TowerScreen(
            engine: widget.engine,
            prefs: widget.prefs,
            style: style,
            onStyleChanged: changeStyle));
  }
}

class TowerScreen extends StatefulWidget {
  final GameEngine engine;
  final SharedPreferences prefs;
  final TowerStyle style;
  final ValueChanged<TowerStyle> onStyleChanged;
  const TowerScreen(
      {super.key,
      required this.engine,
      required this.prefs,
      required this.style,
      required this.onStyleChanged});
  @override
  State<TowerScreen> createState() => _TowerScreenState();
}

class _TowerScreenState extends State<TowerScreen> with WidgetsBindingObserver {
  GameEngine get e => widget.engine;
  SharedPreferences get prefs => widget.prefs;
  TowerStyle get skin => widget.style;
  Color get gold => skin.accent;
  Color get muted => skin.muted;
  Color get panel => skin.panel;
  double radius(double classic) => skin.classic ? classic : skin.radius;
  bool playing = false, modal = false, mutedAudio = false;
  late double volume;
  double get musicVolume => mutedAudio ? 0 : volume * .95;
  int peak = 1000;
  int dialogCount = 0;
  int brandTaps = 0;

  void tapBrand() {
    if (modal || e.state['hiddenMode'] == true) return;
    if (++brandTaps < 10) return;
    setState(() {
      e.state['hiddenMode'] = true;
      e.state['items']['compass'] =
          math.max<int>(1, (e.state['items']['compass'] ?? 0) as int);
      e.history.clear();
    });
    save('auto', quiet: true);
    toast('隐藏测试模式已开启：罗盘可传送至任意楼层');
  }

  Offset swipe = Offset.zero;
  String message = '';
  String npcMessage = '';
  String? activeShop;
  Timer? toastTimer, repeat;
  final focus = FocusNode();
  final music = AudioPlayer(), sound = AudioPlayer();
  int? track;
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    mutedAudio = prefs.getBool('muted') ?? false;
    volume = prefs.getDouble('volume') ?? .85;
  }

  Future<void> bgm(int floor) async {
    if (track == floor) return;
    track = floor;
    try {
      await music.setReleaseMode(ReleaseMode.loop);
      await music.setVolume(musicVolume);
      await music.play(AssetSource('audio/bgm_$floor.wav'));
    } catch (_) {}
  }

  Future<void> sfx(String id) async {
    if (mutedAudio) return;
    try {
      await sound.play(AssetSource('audio/$id.wav'), volume: volume);
    } catch (_) {}
  }

  void stopHold() {
    repeat?.cancel();
    repeat = null;
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state != AppLifecycleState.resumed) {
      stopHold();
      if (playing) save('auto', quiet: true);
      music.pause();
    } else if (track != null) {
      music.resume();
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    stopHold();
    toastTimer?.cancel();
    focus.dispose();
    music.dispose();
    sound.dispose();
    super.dispose();
  }

  void toast(String text) {
    if (!mounted) return;
    setState(() => message = text);
    toastTimer?.cancel();
    toastTimer = Timer(const Duration(seconds: 3), () {
      if (mounted) setState(() => message = '');
    });
  }

  Future<void> save(String slot, {bool quiet = false}) async {
    try {
      final ok = await prefs.setString('save_$slot', e.serialize());
      if (!quiet) toast(ok ? '存档成功' : '存档失败');
    } catch (_) {
      if (!quiet) toast('存档失败，请检查存储空间');
    }
  }

  void start() {
    e.reset();
    brandTaps = 0;
    setState(() {
      playing = true;
      peak = 1000;
      message = '';
      npcMessage = '';
      activeShop = null;
    });
    bgm(1);
    save('auto', quiet: true);
    focus.requestFocus();
  }

  bool load(String slot) {
    brandTaps = 0;
    final text = prefs.getString('save_$slot');
    if (text == null || !e.load(text)) {
      toast('这个存档无法读取');
      return false;
    }
    setState(() {
      playing = true;
      peak = e.hero['hp'];
    });
    bgm(e.floor);
    toast('已读取存档 · 第 ${e.floor} 层');
    if (e.state['ended'] == true) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) showRescueEnding();
      });
    }
    return true;
  }

  Future<void> showRescueEnding() async {
    stopHold();
    setState(() => modal = true);
    await Navigator.of(context).push<void>(MaterialPageRoute(
        builder: (ctx) => RescueEnding(
            hp: e.hero['hp'],
            atk: e.hero['atk'],
            def: e.hero['def'],
            onReturn: () => Navigator.pop(ctx))));
    if (!mounted) return;
    setState(() {
      playing = false;
      modal = false;
    });
    bgm(0);
  }

  Future<void> dialog(
      String title, List<Widget> Function(StateSetter) content) async {
    stopHold();
    dialogCount++;
    setState(() => modal = true);
    try {
      await showDialog<void>(
          context: context,
          builder: (ctx) => StatefulBuilder(
              builder: (ctx, refresh) => AlertDialog(
                      title: Text(title,
                          style: TextStyle(
                              color: Theme.of(ctx).colorScheme.primary)),
                      content: SizedBox(
                          width: 360,
                          child: SingleChildScrollView(
                              child:
                                  Column(
                                      mainAxisSize: MainAxisSize.min,
                                      crossAxisAlignment:
                                          CrossAxisAlignment.stretch,
                                      children: content(refresh)))),
                      actions: [
                        TextButton(
                            onPressed: () => Navigator.pop(ctx),
                            child: const Text('关闭'))
                      ])));
    } finally {
      dialogCount--;
      if (mounted) setState(() => modal = dialogCount > 0);
      focus.requestFocus();
    }
  }

  void feedback(List<Json> events) {
    final says = <String>[];
    String? shop;
    bool won = false, talked = false;
    for (final ev in events) {
      switch (ev['type']) {
        case 'fight':
          toast(
              '击败 ${e.name(ev['id'])} · 生命 -${ev['loss']} · 金币 +${ev['gold']}');
          sfx('hit');
          break;
        case 'pickup':
          toast('获得 ${e.name(ev['id'])}');
          sfx('pick');
          break;
        case 'false-wall':
          toast('这面墙是假的，已经打通');
          sfx('door');
          break;
        case 'door':
          sfx('door');
          break;
        case 'locked':
        case 'nofight':
          toast(ev['reason']);
          sfx('denied');
          break;
        case 'blocked':
          if (!['边界外', '前方不能通行'].contains(ev['reason'])) toast(ev['reason']);
          break;
        case 'stairs':
          toast('第 ${e.floor} 层 · ${e.zoneName}');
          sfx('stairs');
          bgm(e.floor);
          break;
        case 'aura':
          toast('灼域灼伤 -${ev['damage']} 生命');
          break;
        case 'say':
          says.add(ev['text']);
          break;
        case 'talk':
          talked = true;
          break;
        case 'shop':
          shop = ev['npc'];
          break;
        case 'win':
          won = true;
          break;
      }
    }
    if (won) {
      music.stop();
      sfx('win');
      showRescueEnding();
    } else if (says.isNotEmpty || talked) {
      stopHold();
      setState(() {
        activeShop = null;
        npcMessage = says.isEmpty ? '愿星光照亮你的前路。' : says.join('\n');
      });
    } else if (shop != null) {
      openShop(shop);
    }
  }

  bool move(String dir) {
    if (!playing || modal || e.state['ended'] == true) return false;
    final x = e.hero['x'], y = e.hero['y'], floor = e.floor;
    setState(() {
      activeShop = null;
      npcMessage = '';
    });
    final events = e.move(dir);
    setState(() => peak = math.max(peak, e.hero['hp'] as int));
    feedback(events);
    if (events.first['type'] != 'blocked') save('auto', quiet: true);
    return !modal && (e.hero['x'] != x || e.hero['y'] != y || e.floor != floor);
  }

  void hold(String dir) {
    stopHold();
    if (!move(dir)) return;
    repeat = Timer(const Duration(milliseconds: 320), () {
      repeat = Timer.periodic(const Duration(milliseconds: 130), (_) {
        if (!move(dir)) stopHold();
      });
    });
  }

  void undo() {
    if (modal) return;
    final r = e.undo();
    setState(() {});
    toast(r['text']);
    bgm(e.floor);
    save('auto', quiet: true);
  }

  void use(String id, [int? target]) {
    final r = e.useItem(id, target);
    setState(() => peak = math.max(peak, e.hero['hp'] as int));
    toast(r['text']);
    if (r['ok'] == true) {
      sfx('pick');
      save('auto', quiet: true);
      bgm(e.floor);
      feedback((r['events'] as List).cast<Json>());
    }
  }

  Widget button(String text, VoidCallback? action, {Widget? icon}) => Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: OutlinedButton(
          onPressed: action,
          style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 8)),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            if (icon != null) ...[icon, const SizedBox(width: 6)],
            Flexible(
                child: Text(text,
                    maxLines: 1,
                    softWrap: false,
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 12)))
          ])));
  bool get compactGameUi =>
      kIsWeb ||
      ((defaultTargetPlatform == TargetPlatform.iOS ||
              defaultTargetPlatform == TargetPlatform.android) &&
          MediaQuery.sizeOf(context).shortestSide < 600);

  void openShop(String id) {
    if (compactGameUi) {
      String? result;
      dialog(
          id == 'altar' ? '祭坛' : '商人',
          (refresh) => [
                ...shopContent(id, refresh, onResult: (text) => result = text),
                if (result != null)
                  Text(result!, style: TextStyle(color: gold, fontSize: 12)),
              ]);
      return;
    }
    stopHold();
    setState(() {
      activeShop = id;
      npcMessage = '';
    });
  }

  List<Widget> shopContent(String id, StateSetter refresh,
      {ValueChanged<String>? onResult}) {
    if (id == 'altar') {
      return [
        Text('金币 ${e.hero['gold']} · 本次价格 ${e.altarPrice}'),
        for (final c in ['hp', 'atk', 'def'])
          button(
              '${{'hp': '生命', 'atk': '攻击', 'def': '防御'}[c]} +${e.altarGain(c)}',
              () {
            final r = e.buyAltar(c);
            refresh(() => onResult?.call(r['text']));
            setState(() => peak = math.max(peak, e.hero['hp'] as int));
            toast(r['text']);
            if (r['ok'] == true) {
              sfx('buy');
              save('auto', quiet: true);
            }
          })
      ];
    }
    final list = e.data['MERCHANTS']['${e.floor}'] as List? ?? [];
    return [
      Text('金币 ${e.hero['gold']}'),
      for (final item in list)
        button(
            item['recycle'] != null
                ? '回收${e.name(item['recycle'])} · +${item['gold']} 金币'
                : '${item['hp'] != null ? '生命 +${item['hp']}' : (item['items'] as Map).entries.map((v) => '${e.name(v.key)} ×${v.value}').join('、')} · ${item['price']} 金币${e.state['soldOut'].contains(item['id']) ? '（售完）' : ''}',
            e.state['soldOut'].contains(item['id'])
                ? null
                : () {
                    final r = e.merchantBuy(item['id']);
                    refresh(() => onResult?.call(r['text']));
                    setState(() => peak = math.max(peak, e.hero['hp'] as int));
                    toast(r['text']);
                    if (r['ok'] == true) {
                      sfx('buy');
                      save('auto', quiet: true);
                    }
                  })
    ];
  }

  void compass() {
    final hidden = e.state['hiddenMode'] == true;
    final floors = hidden
        ? List.generate(50, (i) => i + 1)
        : ((e.state['visited'] as List).cast<int>().toList()..sort());
    dialog(
        hidden ? '传送罗盘 · 隐藏测试模式' : '传送罗盘',
        (refresh) => [
              (e.state['items']['compass'] ?? 0) <= 0
                  ? const Text('还未获得传送罗盘')
                  : !hidden && e.floor == 50
                      ? const Text('第 50 层不能使用罗盘')
                      : Wrap(spacing: 8, children: [
                          for (final f in floors)
                            if (f != e.floor &&
                                (hidden || (f != 44 && f != 50)))
                              OutlinedButton(
                                  onPressed: () {
                                    Navigator.pop(context);
                                    use('compass', f);
                                  },
                                  child: Text('$f 层'))
                        ])
            ]);
  }

  void bag() {
    dialog(
        '背包',
        (refresh) => [
              for (final id in (e.data['ACTIVE'] as Map).keys)
                if ((e.state['items'][id] ?? 0) > 0)
                  button(
                      '${e.name(id)}${e.data['ACTIVE'][id]['uses'] == 'unlimited' ? '' : ' ×${e.state['items'][id]}'}',
                      () {
                    Navigator.pop(context);
                    if (id == 'compass') {
                      Future.microtask(compass);
                    } else {
                      use(id);
                    }
                  }, icon: art(e.data['art']['ITEM_ART'][id], size: 22)),
              for (final id in (e.data['HOLD'] as Map).keys)
                if (e.hero['flags'][e.data['HOLD'][id]['flag']] == true)
                  Padding(
                      padding: const EdgeInsets.all(8),
                      child: Row(children: [
                        art(e.data['art']['ITEM_ART'][id], size: 22),
                        const SizedBox(width: 6),
                        Text('${e.name(id)} · 持有生效')
                      ])),
              if ((e.state['items'] as Map).values.every((v) => v == 0))
                const Text('主动道具会在冒险中获得。')
            ]);
  }

  void saves(bool saving) {
    dialog(
        saving ? '保存进度' : '读取存档',
        (refresh) => [
              for (final slot in ['auto', '1', '2', '3']) ...[
                Builder(builder: (context) {
                  final text = prefs.getString('save_$slot');
                  Json? state;
                  try {
                    if (text != null) state = jsonDecode(text);
                  } catch (_) {}
                  return Text(
                      '${slot == 'auto' ? '自动存档' : '存档 $slot'} · ${state == null ? '空' : '第 ${state['floor']} 层 · 生命 ${state['hero']['hp']}'}');
                }),
                button(
                    saving
                        ? '保存到${slot == 'auto' ? '自动存档' : '存档 $slot'}'
                        : '读取${slot == 'auto' ? '自动存档' : '存档 $slot'}',
                    saving
                        ? () {
                            save(slot);
                            refresh(() {});
                          }
                        : prefs.getString('save_$slot') == null
                            ? null
                            : () {
                                Navigator.pop(context);
                                load(slot);
                              }),
                const SizedBox(height: 8)
              ]
            ]);
  }

  void settings() {
    dialog(
        '设置',
        (refresh) => [
              const Text('界面风格'),
              const SizedBox(height: 6),
              LayoutBuilder(builder: (context, box) {
                final width =
                    box.maxWidth < 190 ? box.maxWidth : (box.maxWidth - 6) / 2;
                return Wrap(spacing: 6, runSpacing: 6, children: [
                  for (final option in towerStyles)
                    SizedBox(
                        width: width,
                        child: Semantics(
                            selected: skin == option,
                            child: OutlinedButton(
                                key: ValueKey('style-${option.id}'),
                                style: OutlinedButton.styleFrom(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 5),
                                    backgroundColor: option.panel,
                                    foregroundColor: Colors.white,
                                    shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(
                                            option.radius)),
                                    side: BorderSide(
                                        color: skin == option
                                            ? option.accent
                                            : option.trim,
                                        width: skin == option ? 2 : 1)),
                                onPressed: () => refresh(
                                    () => widget.onStyleChanged(option)),
                                child: Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Container(
                                          width: 8,
                                          height: 8,
                                          color: option.accent),
                                      const SizedBox(width: 5),
                                      Flexible(
                                          child: Text(option.name,
                                              textAlign: TextAlign.center,
                                              style: const TextStyle(
                                                  fontSize: 12))),
                                    ])))),
                ]);
              }),
              const SizedBox(height: 12),
              SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('静音'),
                  value: mutedAudio,
                  onChanged: (v) {
                    refresh(() => mutedAudio = v);
                    prefs.setBool('muted', v);
                    music.setVolume(musicVolume);
                  }),
              const Text('音量'),
              Slider(
                  value: volume,
                  onChanged: (v) {
                    refresh(() => volume = v);
                    prefs.setDouble('volume', v);
                    music.setVolume(musicVolume);
                  })
            ]);
  }

  void help() {
    dialog(
        '操作说明',
        (refresh) => [
              const Text(
                  '点击方向盘、滑动棋盘，或使用键盘方向键 / WASD 移动。方向盘中间和 Z 键可以撤销，最多保留 50 步。\n\n碰到怪物先战斗、碰到门先开门，再走一步才会进入。无法破防或会死亡时禁止战斗。点击怪物可查看完整预判。\n\n撞击引路人触发剧情；在祭坛或商人旁边交易。背包中使用主动道具，罗盘可返回到过的楼层。每次操作自动保存，菜单可手动存读档。\n\n快捷键：B 背包，C 罗盘，Esc 菜单。')
            ]);
  }

  void menu() {
    dialog(
        '暂停',
        (refresh) => [
              button('保存进度', () {
                Navigator.pop(context);
                Future.microtask(() => saves(true));
              }),
              button('读取存档', () {
                Navigator.pop(context);
                Future.microtask(() => saves(false));
              }),
              button('设置', () {
                Navigator.pop(context);
                Future.microtask(settings);
              }),
              button('操作说明', () {
                Navigator.pop(context);
                Future.microtask(help);
              }),
              button('返回游戏主界面', () {
                save('auto', quiet: true);
                Navigator.pop(context);
                setState(() => playing = false);
                bgm(0);
              }, icon: const Icon(Icons.home_outlined, size: 17))
            ]);
  }

  KeyEventResult key(FocusNode node, KeyEvent event) {
    if (modal || !playing || event is KeyUpEvent) return KeyEventResult.ignored;
    final map = {
      LogicalKeyboardKey.arrowUp: 'up',
      LogicalKeyboardKey.keyW: 'up',
      LogicalKeyboardKey.arrowDown: 'down',
      LogicalKeyboardKey.keyS: 'down',
      LogicalKeyboardKey.arrowLeft: 'left',
      LogicalKeyboardKey.keyA: 'left',
      LogicalKeyboardKey.arrowRight: 'right',
      LogicalKeyboardKey.keyD: 'right'
    };
    final dir = map[event.logicalKey];
    if (dir != null) {
      move(dir);
      return KeyEventResult.handled;
    }
    if (event is KeyDownEvent) {
      if (event.logicalKey == LogicalKeyboardKey.keyZ) undo();
      if (event.logicalKey == LogicalKeyboardKey.keyB) bag();
      if (event.logicalKey == LogicalKeyboardKey.keyC) compass();
      if (event.logicalKey == LogicalKeyboardKey.escape) menu();
    }
    return KeyEventResult.ignored;
  }

  @override
  Widget build(BuildContext context) {
    final viewport = MediaQuery.sizeOf(context);
    final wideWeb = kIsWeb && viewport.shortestSide >= 600;
    return Focus(
        focusNode: focus,
        autofocus: true,
        onKeyEvent: key,
        child: Scaffold(
            body: SafeArea(
                child: Center(
                    child: ConstrainedBox(
                        constraints: BoxConstraints(
                            maxWidth: wideWeb
                                ? 480
                                : fixedGameViewport
                                    ? double.infinity
                                    : 600,
                            maxHeight: wideWeb
                                ? viewport.height * .94
                                : double.infinity),
                        child: Stack(children: [
                          Positioned.fill(
                              child: playing && !skin.classic
                                  ? DecoratedBox(
                                      decoration: BoxDecoration(
                                          gradient: RadialGradient(
                                              center: Alignment.topCenter,
                                              radius: 1.4,
                                              colors: [
                                            panel,
                                            skin.background
                                          ])),
                                      child: game())
                                  : playing
                                      ? game()
                                      : title()),
                          if (!playing && message.isNotEmpty)
                            Positioned(
                                left: 16,
                                right: 16,
                                bottom: 16,
                                child: Material(
                                    color: panel,
                                    borderRadius: BorderRadius.circular(12),
                                    child: Padding(
                                        padding: const EdgeInsets.all(12),
                                        child: Text(message,
                                            textAlign: TextAlign.center,
                                            style: TextStyle(
                                                color: gold, fontSize: 12)))))
                        ]))))));
  }

  Widget art(String path, {double? size}) {
    if (skin.pixel &&
        const ['hero', 'items', 'monsters', 'tiles']
            .contains(path.split('/').first)) {
      return Image.asset('assets/images/pixel/$path.png',
          width: size,
          height: size,
          fit: BoxFit.contain,
          filterQuality: FilterQuality.none);
    }
    return SvgPicture.asset('assets/images/$path.svg',
        width: size, height: size, fit: BoxFit.contain);
  }

  Widget title() => Stack(fit: StackFit.expand, children: [
        TitleBackdrop(style: skin, paused: modal),
        Center(
            child: SingleChildScrollView(
                child: Padding(
                    padding: const EdgeInsets.all(32),
                    child: Column(mainAxisSize: MainAxisSize.min, children: [
                      Icon(Icons.auto_awesome, color: gold, size: 48),
                      const SizedBox(height: 24),
                      Text('星穹塔',
                          style: TextStyle(
                              color: gold,
                              fontSize: 54,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 10)),
                      Text('STAR DOME TOWER · 50 层',
                          style: TextStyle(
                              color: muted, fontSize: 12, letterSpacing: 2)),
                      const SizedBox(height: 16),
                      const Text('登上五十层，救回你的女神。',
                          style: TextStyle(color: Color(0xffe8c6da))),
                      const SizedBox(height: 28),
                      SizedBox(
                          width: 280,
                          child: Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                FilledButton(
                                    onPressed: start,
                                    child: const Padding(
                                        padding: EdgeInsets.all(8),
                                        child: Text('新的冒险',
                                            style: TextStyle(fontSize: 18)))),
                                button(
                                    '继续冒险',
                                    prefs.getString('save_auto') != null
                                        ? () => load('auto')
                                        : null),
                                button('读取存档', () => saves(false)),
                                button('设置', settings),
                                button('操作说明', help)
                              ])),
                      const SizedBox(height: 24),
                      Text('方向键 / 滑动移动 · 预判战斗损失',
                          style: TextStyle(color: muted, fontSize: 11))
                    ]))))
      ]);
  Widget noticePanel() => Container(
      key: const ValueKey('board-notice'),
      margin: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
          color: panel,
          border: Border.all(color: gold.withOpacity(.35)),
          borderRadius: BorderRadius.circular(radius(10))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        if (activeShop != null || npcMessage.isNotEmpty)
          Row(children: [
            Expanded(
                child: Text(
                    activeShop == null
                        ? '引路人'
                        : activeShop == 'altar'
                            ? '祭坛'
                            : '商人',
                    style: TextStyle(color: gold, fontSize: 12))),
            InkWell(
                onTap: () => setState(() {
                      activeShop = null;
                      npcMessage = '';
                    }),
                child: const Padding(
                    padding: EdgeInsets.all(4),
                    child: Text('收起', style: TextStyle(fontSize: 12))))
          ]),
        Expanded(
            child: SingleChildScrollView(
                child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
              if (activeShop != null) ...shopContent(activeShop!, setState),
              if (npcMessage.isNotEmpty)
                Text(npcMessage, style: const TextStyle(fontSize: 13)),
              if (message.isNotEmpty)
                Text(message, style: TextStyle(color: gold, fontSize: 12)),
              if (activeShop == null && npcMessage.isEmpty && message.isEmpty)
                Text('旅途提示将显示在这里', style: TextStyle(color: muted, fontSize: 12))
            ])))
      ]));

  Widget compactNotice() {
    final isStory = npcMessage.isNotEmpty;
    final text = isStory ? npcMessage : message;
    return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
        child: Material(
            key: const ValueKey('compact-notice'),
            color: panel,
            shape: RoundedRectangleBorder(
                side: BorderSide(color: gold.withOpacity(.25)),
                borderRadius: BorderRadius.circular(radius(8))),
            clipBehavior: Clip.antiAlias,
            child: InkWell(
                onTap: text.isEmpty
                    ? help
                    : () =>
                        dialog(isStory ? '引路人' : '旅途提示', (_) => [Text(text)]),
                child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 9),
                    child: Row(children: [
                      Icon(
                          isStory
                              ? Icons.chat_bubble_outline
                              : Icons.info_outline,
                          size: 15,
                          color: gold),
                      const SizedBox(width: 7),
                      Expanded(
                          child: Text(text.isEmpty ? '旅途提示 · 点击查看操作说明' : text,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                  color: text.isEmpty ? muted : gold,
                                  fontSize: 12))),
                      Icon(Icons.chevron_right, size: 16, color: muted),
                    ])))));
  }

  Widget gameBrand() => Row(mainAxisSize: MainAxisSize.min, children: [
        SvgPicture.asset('assets/images/ui/tower-logo.svg',
            key: const ValueKey('tower-logo'),
            width: 32,
            height: 32,
            excludeFromSemantics: true),
        const SizedBox(width: 6),
        Text('星穹塔',
            style: TextStyle(
                color: gold, fontSize: 17, fontWeight: FontWeight.bold)),
      ]);

  Widget game() => LayoutBuilder(builder: (context, box) {
        if (box.maxWidth < 320) {
          return FittedBox(
              fit: BoxFit.contain,
              child: SizedBox(
                  width: 320,
                  height: box.maxHeight * 320 / box.maxWidth,
                  child: game()));
        }
        final compactUi = compactGameUi;
        final compact = box.maxHeight < 650;
        final headerHeight = compact ? (compactUi ? 106.0 : 112.0) : 130.0;
        final controlsHeight = compact ? (compactUi ? 122.0 : 130.0) : 164.0;
        final hintHeight = compactUi ? 44.0 : (compact ? 92.0 : 156.0);

        Widget boardAndNotice() => LayoutBuilder(builder: (context, space) {
              final boardSize = math.max(
                  0.0,
                  math.min(
                      space.maxWidth - 12, space.maxHeight - hintHeight - 4));
              return Center(
                  child: Column(mainAxisSize: MainAxisSize.min, children: [
                SizedBox(
                    key: const ValueKey('game-board'),
                    width: boardSize,
                    height: boardSize,
                    child: board()),
                const SizedBox(height: 4),
                SizedBox(height: hintHeight, child: compactNotice()),
              ]));
            });

        Widget controls(double width) => gameControls(controlsHeight,
            math.min(compact ? (compactUi ? 114 : 122) : 148, width - 190));

        if (compactUi && box.maxWidth > box.maxHeight) {
          final sideWidth = math.min(box.maxWidth * .44, 380.0);
          final controlWidth = math.max(320.0, sideWidth);
          return Row(children: [
            Expanded(child: boardAndNotice()),
            SizedBox(
                width: sideWidth,
                child: FittedBox(
                    fit: BoxFit.scaleDown,
                    child: SizedBox(
                        width: controlWidth,
                        child:
                            Column(mainAxisSize: MainAxisSize.min, children: [
                          gameHeader(headerHeight, compactUi),
                          controls(controlWidth),
                        ])))),
          ]);
        }
        return Column(children: [
          gameHeader(headerHeight, compactUi),
          Expanded(
              child: compactUi
                  ? boardAndNotice()
                  : Center(
                      child: SizedBox.square(
                          key: const ValueKey('game-board'),
                          dimension: math.max(
                              110.0,
                              math.min(
                                  box.maxWidth - 12,
                                  box.maxHeight -
                                      headerHeight -
                                      controlsHeight -
                                      hintHeight -
                                      20)),
                          child: board()))),
          if (!compactUi) SizedBox(height: hintHeight, child: noticePanel()),
          controls(box.maxWidth),
        ]);
      });

  Widget gameHeader(double headerHeight, bool compactUi) => SizedBox(
      key: const ValueKey('game-header'),
      height: headerHeight,
      child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
          child: Column(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                Row(children: [
                  Text('第 ${e.floor} 层',
                      style: TextStyle(
                          color: gold,
                          fontSize: 23,
                          fontWeight: FontWeight.bold)),
                  const SizedBox(width: 8),
                  if (compactUi)
                    Expanded(child: zoneLabel())
                  else ...[
                    Flexible(child: zoneLabel()),
                    const Spacer(),
                  ],
                  Semantics(
                      button: true,
                      label: '星穹塔',
                      child: GestureDetector(
                          key: const ValueKey('hidden-mode-trigger'),
                          behavior: HitTestBehavior.opaque,
                          onTap: tapBrand,
                          child: compactUi
                              ? gameBrand()
                              : Text('✦ 星穹塔',
                                  style: TextStyle(
                                      color: gold,
                                      fontSize: 19,
                                      fontWeight: FontWeight.bold))))
                ]),
                Row(children: [
                  art('hero/hero', size: compactUi ? 40 : 46),
                  const SizedBox(width: 10),
                  Expanded(
                      child: Column(children: [
                    Row(children: [
                      const Text('生命 ', style: TextStyle(fontSize: 12)),
                      Expanded(
                          child: Stack(alignment: Alignment.center, children: [
                        ClipRRect(
                            borderRadius: BorderRadius.circular(6),
                            child: LinearProgressIndicator(
                                value: e.hero['hp'] /
                                    math.max(peak, e.hero['hp'] as int),
                                minHeight: 19,
                                color: const Color(0xffbd4359),
                                backgroundColor: const Color(0xff3a1a2c))),
                        Text('${e.hero['hp']} / $peak',
                            style: const TextStyle(
                                fontSize: 12, fontWeight: FontWeight.bold))
                      ]))
                    ]),
                    const SizedBox(height: 5),
                    heroStats(compactUi),
                  ]))
                ]),
                Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      resource('ui/icon_gold', '${e.hero['gold']}', gold),
                      resource('items/key_y', '${e.hero['keys']['yellowKey']}',
                          gold),
                      resource('items/key_b', '${e.hero['keys']['blueKey']}',
                          const Color(0xff8ec8ff)),
                      resource('items/key_r', '${e.hero['keys']['redKey']}',
                          const Color(0xffff919b))
                    ])
              ])));

  Widget zoneLabel() => Text(e.zoneName,
      maxLines: 1,
      overflow: TextOverflow.ellipsis,
      style: TextStyle(color: muted, fontSize: 11));

  Widget heroStats(bool compactUi) {
    final stats =
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
      Text('⚔ 攻击 ${e.hero['atk']}',
          style: const TextStyle(color: Color(0xffff9d89), fontSize: 12)),
      Text('◈ 防御 ${e.hero['def']}',
          style: const TextStyle(color: Color(0xff9ecbff), fontSize: 12)),
      Text('撤销 ${e.history.length}/50',
          style: TextStyle(color: muted, fontSize: 10)),
    ]);
    if (!compactUi) return stats;
    return LayoutBuilder(
        builder: (context, box) => FittedBox(
            fit: BoxFit.scaleDown,
            child: ConstrainedBox(
                constraints: BoxConstraints(minWidth: box.maxWidth),
                child: stats)));
  }

  Widget gameControls(double controlsHeight, double padSize) => SizedBox(
      key: const ValueKey('game-controls'),
      height: controlsHeight,
      child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          child:
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            SizedBox(
                width: 85,
                child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      button('快速存档', () => saves(true)),
                      button('菜单', menu)
                    ])),
            pad(padSize),
            SizedBox(
                width: 85,
                child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      smallButton(
                          '罗盘',
                          (e.state['items']['compass'] ?? 0) > 0
                              ? compass
                              : null),
                      smallButton(
                          e.near('altar') ? '祭坛' : '商人',
                          e.near('altar')
                              ? () => openShop('altar')
                              : e.near('merchant')
                                  ? () => openShop('merchant')
                                  : null),
                      smallButton('背包', bag)
                    ]))
          ])));

  Widget resource(String path, String value, Color color) => Row(children: [
        art(path, size: 19),
        const SizedBox(width: 4),
        Text(value,
            style: TextStyle(
                color: color, fontSize: 13, fontWeight: FontWeight.bold))
      ]);
  Widget smallButton(String text, VoidCallback? action) => Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: OutlinedButton(
          style: OutlinedButton.styleFrom(
              minimumSize: const Size(0, 34),
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              padding: const EdgeInsets.symmetric(horizontal: 8)),
          onPressed: action,
          child: Text(text, style: const TextStyle(fontSize: 12))));
  Widget pad(double size) => Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: Border.all(color: gold.withOpacity(.45)),
          gradient: const RadialGradient(
              colors: [Color(0xff3a3030), Color(0xff141018)])),
      child: Stack(children: [
        Positioned(
            top: 0,
            left: size / 3,
            width: size / 3,
            height: size / 3,
            child: padKey('up', Icons.arrow_drop_up)),
        Positioned(
            bottom: 0,
            left: size / 3,
            width: size / 3,
            height: size / 3,
            child: padKey('down', Icons.arrow_drop_down)),
        Positioned(
            left: 0,
            top: size / 3,
            width: size / 3,
            height: size / 3,
            child: padKey('left', Icons.arrow_left)),
        Positioned(
            right: 0,
            top: size / 3,
            width: size / 3,
            height: size / 3,
            child: padKey('right', Icons.arrow_right)),
        Positioned(
            left: size / 3,
            top: size / 3,
            width: size / 3,
            height: size / 3,
            child: IconButton(
                tooltip: '撤销一步',
                onPressed: undo,
                icon: Icon(Icons.undo, color: gold, size: 22)))
      ]));
  Widget padKey(String dir, IconData icon) => Semantics(
      label: {'up': '上', 'down': '下', 'left': '左', 'right': '右'}[dir],
      button: true,
      child: Listener(
          onPointerDown: (_) => hold(dir),
          onPointerUp: (_) => stopHold(),
          onPointerCancel: (_) => stopHold(),
          child: MouseRegion(
              onExit: (_) => stopHold(),
              child: Container(
                  color: Colors.transparent,
                  child: Icon(icon, color: gold, size: 38)))));
  Widget board() {
    final tiles = e.data['art']['ZONE_TILES']['${e.zone}'];
    return GestureDetector(
        onPanStart: (_) => swipe = Offset.zero,
        onPanUpdate: (details) => swipe += details.delta,
        onPanEnd: (details) {
          final v =
              swipe.distance > 18 ? swipe : details.velocity.pixelsPerSecond;
          if (v.distance < 18) return;
          move(v.dx.abs() > v.dy.abs()
              ? (v.dx > 0 ? 'right' : 'left')
              : (v.dy > 0 ? 'down' : 'up'));
        },
        child: Container(
            decoration: BoxDecoration(
                border: Border.all(
                    color: skin.classic ? const Color(0xff7b5b36) : skin.trim,
                    width: 3),
                boxShadow: const [
                  BoxShadow(color: Colors.black54, blurRadius: 18)
                ],
                borderRadius: BorderRadius.circular(radius(4))),
            child: LayoutBuilder(builder: (context, constraints) {
              final cell = constraints.maxWidth / 11;
              final bosses = (e.world['ents'] as Map)
                  .entries
                  .where((entry) => entry.value['id'] == 'endLord');
              return Stack(children: [
                if (e.floor == 50)
                  Positioned.fill(
                      child: IgnorePointer(child: art('bg/rescue-garden'))),
                for (var y = 0; y < 11; y++)
                  for (var x = 0; x < 11; x++)
                    Positioned(
                        left: x * cell,
                        top: y * cell,
                        width: cell + .2,
                        height: cell + .2,
                        child: tile(x, y, tiles, cell)),
                for (final boss in bosses)
                  Positioned(
                      left: (int.parse(boss.key.split(',')[0]) - .75) * cell,
                      top: (int.parse(boss.key.split(',')[1]) - .3) * cell,
                      width: cell * 2.5,
                      height: cell * 2.2,
                      child: IgnorePointer(
                          child: Semantics(
                              label: '终焉女妖', child: art('monsters/endLord')))),
                if (bosses.isNotEmpty)
                  Positioned(
                      left: e.hero['x'] * cell,
                      top: e.hero['y'] * cell,
                      width: cell,
                      height: cell,
                      child: IgnorePointer(child: art('hero/hero')))
              ]);
            })));
  }

  Widget tile(int x, int y, Json tiles, double size) {
    final t = e.world['terr'][y][x],
        entity = e.entity(x, y),
        isHero = e.hero['x'] == x && e.hero['y'] == y;
    final artData = e.data['art'];
    String? overlay = artData['TERRAIN_ART'][t];
    String? sprite;
    String? label;
    Color color = gold;
    if (entity != null) {
      final id = entity['id'];
      sprite = artData[entity['kind'] == 'monster'
          ? 'MONSTER_ART'
          : entity['kind'] == 'npc'
              ? 'NPC_ART'
              : 'ITEM_ART'][id];
      if (sprite == null) {
        label = e.name(id).substring(0, 1);
        color = entity['kind'] == 'monster'
            ? const Color(0xffff8292)
            : entity['kind'] == 'npc'
                ? const Color(0xffa9e3ef)
                : gold;
      }
    }
    if (t == '%' || t == 'a') label = t == '%' ? '裂' : '机';
    final pv = entity?['kind'] == 'monster' ? e.preview(x, y) : null;
    return GestureDetector(
        onTap: () {
          if (modal) return;
          if (pv != null) {
            inspect(pv);
          } else if ((x - e.hero['x']).abs() + (y - e.hero['y']).abs() == 1) {
            move(x > e.hero['x']
                ? 'right'
                : x < e.hero['x']
                    ? 'left'
                    : y > e.hero['y']
                        ? 'down'
                        : 'up');
          }
        },
        child: Stack(fit: StackFit.expand, children: [
          if (e.floor != 50)
            art(['#', 'w', '%', 'a'].contains(t)
                ? tiles['wall']
                : tiles['floor']),
          if (!skin.classic && e.floor != 50 && t != '*' && t != '~')
            ColoredBox(color: skin.button.withOpacity(.32)),
          if (overlay != null && !(e.floor == 50 && t == '*')) art(overlay),
          if (sprite != null && entity?['id'] != 'endLord')
            Semantics(
                label: e.name(entity!['id']),
                child: Padding(
                    padding: EdgeInsets.all(size * .06), child: art(sprite))),
          if (label != null)
            Center(
                child: Container(
                    padding: const EdgeInsets.all(2),
                    decoration: BoxDecoration(
                        color: Colors.black54,
                        borderRadius: BorderRadius.circular(4)),
                    child: Text(label,
                        style: TextStyle(
                            color: color,
                            fontSize: size * .44,
                            fontWeight: FontWeight.bold)))),
          if (pv != null)
            Positioned(
                right: 0,
                top: 0,
                child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 2),
                    decoration: BoxDecoration(
                        color: pv['canFight'] == true
                            ? const Color(0xe825814d)
                            : const Color(0xe8ae3149),
                        borderRadius:
                            BorderRadius.circular(skin.pixel ? 0 : 3)),
                    child: Text(pv['loss'] == null ? '×' : '${pv['loss']}',
                        style: TextStyle(
                            color: Colors.white,
                            fontSize: math.max(7, size * .27),
                            fontWeight: FontWeight.bold)))),
          if (isHero) art('hero/hero')
        ]));
  }

  void inspect(Json pv) {
    final m = pv['monster'];
    dialog(
        e.name(pv['id']),
        (refresh) => [
              Text('生命 ${m['hp']} · 攻击 ${m['atk']} · 防御 ${pv['def']}'),
              const SizedBox(height: 12),
              Text(
                  pv['canFight'] == true
                      ? '可以击败'
                      : pv['reason'] == 'unpierceable'
                          ? '无法破防'
                          : '会死亡',
                  style: TextStyle(
                      color: pv['canFight'] == true
                          ? Colors.greenAccent
                          : Colors.redAccent,
                      fontSize: 20)),
              const SizedBox(height: 8),
              Text('预计损失 ${pv['loss'] ?? '—'} · 回合数 ${pv['rounds'] ?? '—'}'),
              Text('我方每回合 ${pv['perHit']} · 怪物每回合 ${pv['perRound'] ?? '—'}'),
              if (pv['loss'] != null)
                Text('至少需要 ${pv['loss'] + 1} 生命（当前 ${e.hero['hp']}）'),
              if ((m['traits'] as List).isNotEmpty)
                Text('特性：${(m['traits'] as List).map((t) => {
                      'magic': '魔攻',
                      'firstStrike': '先攻',
                      'doubleHit': '连击',
                      'aura': '灼域',
                      'sea': '海兽',
                      'dragon': '龙',
                      'starVeil': '星幕'
                    }[t['type']]).join('、')}')
            ]);
  }
}
