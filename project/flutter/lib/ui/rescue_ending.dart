import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

/// A keepsake ending, also available when loading an already completed save.
class RescueEnding extends StatefulWidget {
  final int hp, atk, def;
  final VoidCallback onReturn;
  const RescueEnding(
      {super.key,
      required this.hp,
      required this.atk,
      required this.def,
      required this.onReturn});
  @override
  State<RescueEnding> createState() => _RescueEndingState();
}

class _RescueEndingState extends State<RescueEnding>
    with SingleTickerProviderStateMixin {
  late final AnimationController stars =
      AnimationController(vsync: this, duration: const Duration(seconds: 8))
        ..repeat();
  bool opened = false;
  @override
  void dispose() {
    stars.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final still = MediaQuery.of(context).disableAnimations;
    // Bypass AnimatedSize entirely for reduced motion, including layout ticks.
    Widget letterSize(Widget child) => still
        ? child
        : AnimatedSize(
            duration: const Duration(milliseconds: 350), child: child);
    return Scaffold(
        backgroundColor: const Color(0xff100d22),
        body: Stack(children: [
          Positioned.fill(
              child: AnimatedBuilder(
                  animation: stars,
                  builder: (_, __) =>
                      CustomPaint(painter: _Stars(still ? 0 : stars.value)))),
          SafeArea(
              child: Center(
                  child: SingleChildScrollView(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 24, vertical: 32),
                      child: ConstrainedBox(
                          constraints: const BoxConstraints(maxWidth: 440),
                          child:
                              Column(mainAxisSize: MainAxisSize.min, children: [
                            const Text('第五十层 · 重逢',
                                style: TextStyle(
                                    color: Color(0xffffdba1),
                                    letterSpacing: 5,
                                    fontSize: 13)),
                            const SizedBox(height: 16),
                            const Text('终于，等到你',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                    fontSize: 32,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xffffe9d5))),
                            const SizedBox(height: 12),
                            Container(
                                width: 220,
                                height: 250,
                                decoration: const BoxDecoration(
                                    shape: BoxShape.circle,
                                    gradient: RadialGradient(colors: [
                                      Color(0x665f488e),
                                      Colors.transparent
                                    ])),
                                child: Semantics(
                                    label: '获救的女神捧着一颗心，向你微笑',
                                    child: SvgPicture.asset(
                                        'assets/images/hero/goddess.svg'))),
                            const Text('星幕散去，她从星光里走向你。\n“我就知道，你一定会来。”',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                    height: 1.8,
                                    color: Color(0xffe6d6ef),
                                    fontSize: 16)),
                            const SizedBox(height: 24),
                            letterSize(Container(
                                width: double.infinity,
                                padding: const EdgeInsets.all(20),
                                decoration: BoxDecoration(
                                    color: const Color(0xff2c203b),
                                    border: Border.all(
                                        color: const Color(0xff8c6385)),
                                    borderRadius: BorderRadius.circular(20)),
                                child: opened
                                    ? const Column(children: [
                                        Icon(Icons.favorite,
                                            color: Color(0xfff3a6c7), size: 32),
                                        SizedBox(height: 12),
                                        Text('致我的勇者',
                                            style: TextStyle(
                                                color: Color(0xffffdebd),
                                                fontSize: 20)),
                                        SizedBox(height: 12),
                                        Text(
                                            '你走过的每一层，都有一颗星替我记着。\n谢谢你没有放弃。\n这次，换我陪你看遍塔外的星空。',
                                            textAlign: TextAlign.center,
                                            style: TextStyle(
                                                height: 1.9,
                                                color: Color(0xfff1e1ed))),
                                        SizedBox(height: 14),
                                        Text('纪念称号 · 她的唯一勇者',
                                            style: TextStyle(
                                                color: Color(0xffffd56b))),
                                      ])
                                    : Column(children: [
                                        const Icon(Icons.mail_outline,
                                            size: 32, color: Color(0xfff3a6c7)),
                                        const SizedBox(height: 8),
                                        const Text('她为你留了一封信'),
                                        TextButton(
                                            onPressed: () =>
                                                setState(() => opened = true),
                                            child: const Text('拆开这份惊喜')),
                                      ]))),
                            const SizedBox(height: 24),
                            Text(
                                '通关纪念  ·  50 / 50\n生命 ${widget.hp}  ·  攻击 ${widget.atk}  ·  防御 ${widget.def}',
                                textAlign: TextAlign.center,
                                style: const TextStyle(
                                    height: 1.8, color: Color(0xffbfb0ce))),
                            const SizedBox(height: 20),
                            OutlinedButton(
                                onPressed: widget.onReturn,
                                child: const Text('带着约定，返回标题')),
                          ]))))),
        ]));
  }
}

class _Stars extends CustomPainter {
  final double progress;
  _Stars(this.progress);
  @override
  void paint(Canvas canvas, Size size) {
    for (var i = 0; i < 65; i++) {
      final x = ((i * 73.7) % 997) / 997 * size.width;
      final y = (((i * 43.3) % 991) / 991 + progress * (i.isEven ? .16 : .08)) %
          1 *
          size.height;
      final opacity = .25 + .4 * (1 + math.sin(i + progress * math.pi * 2)) / 2;
      canvas.drawCircle(Offset(x, y), i % 3 == 0 ? 2 : 1,
          Paint()..color = const Color(0xffffdfb0).withOpacity(opacity));
    }
  }

  @override
  bool shouldRepaint(_Stars oldDelegate) => oldDelegate.progress != progress;
}
