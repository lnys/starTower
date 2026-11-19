import 'dart:async';
import 'dart:math' as math;
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

import 'browser_motion.dart'
    if (dart.library.js_interop) 'browser_motion_web.dart';
import 'style_catalog.dart';

/// Independent decorative layer: ticks never rebuild the menu or game state.
class TitleBackdrop extends StatefulWidget {
  const TitleBackdrop({super.key, required this.style, this.paused = false});

  final TowerStyle style;
  final bool paused;

  @override
  State<TitleBackdrop> createState() => _TitleBackdropState();
}

class _TitleBackdropState extends State<TitleBackdrop>
    with SingleTickerProviderStateMixin {
  late final _motion = AnimationController(
    vsync: this,
    duration: const Duration(seconds: 48),
    value: .08,
  );

  StreamSubscription<bool>? _browserMotion;
  bool _browserReduced = false;

  @override
  void initState() {
    super.initState();
    _browserMotion = browserReducedMotion().listen((reduced) {
      _browserReduced = reduced;
      _updateMotion();
    });
  }

  void _updateMotion() {
    final reduceMotion = MediaQuery.disableAnimationsOf(context) ||
        WidgetsBinding
            .instance.platformDispatcher.accessibilityFeatures.reduceMotion ||
        _browserReduced;
    if (reduceMotion || widget.paused) {
      _motion.stop();
      if (reduceMotion) _motion.value = .08;
    } else if (!_motion.isAnimating) {
      _motion.repeat();
    }
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _updateMotion();
  }

  @override
  void didUpdateWidget(covariant TitleBackdrop oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.paused != oldWidget.paused) _updateMotion();
  }

  @override
  void dispose() {
    _browserMotion?.cancel();
    _motion.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final style = widget.style;
    final asset = style.classic ? 'menu' : 'style-${style.id}';
    return ExcludeSemantics(
      child: IgnorePointer(
        child: RepaintBoundary(
          child: ClipRect(
            child: Stack(fit: StackFit.expand, children: [
              AnimatedBuilder(
                animation: _motion,
                child: RepaintBoundary(
                  child: SvgPicture.asset('assets/images/bg/$asset.svg',
                      fit: BoxFit.cover),
                ),
                builder: (context, child) {
                  final wave = math.cos(_motion.value * 2 * math.pi);
                  return FractionalTranslation(
                    key: const ValueKey('title-landscape'),
                    translation: Offset(-wave * .016, wave * .012),
                    child: Transform.scale(
                        scale: 1.135 - wave * .055, child: child),
                  );
                },
              ),
              CustomPaint(painter: _SkyPainter(_motion, style)),
            ]),
          ),
        ),
      ),
    );
  }
}

class _SkyPainter extends CustomPainter {
  _SkyPainter(this.motion, this.style) : super(repaint: motion);

  final Animation<double> motion;
  final TowerStyle style;
  static const _tau = 2 * math.pi;

  @override
  void paint(Canvas canvas, Size size) {
    final cycle = motion.value;
    final rect = Offset.zero & size;
    final paint = Paint();
    final sway = math.sin(cycle * _tau * 2);
    final glowCenter =
        Offset(size.width * (.45 + sway * .11), size.height * .23);
    final radius = size.longestSide * .52;
    paint.shader = RadialGradient(colors: [
      style.accent.withOpacity(.10 + sway * .035),
      style.muted.withOpacity(.04),
      Colors.transparent,
    ], stops: const [
      0,
      .5,
      1
    ]).createShader(Rect.fromCircle(center: glowCenter, radius: radius));
    canvas.drawRect(rect, paint);
    paint.shader = LinearGradient(
      begin: Alignment.topCenter,
      end: Alignment.bottomCenter,
      colors: [
        Colors.transparent,
        style.background.withOpacity(.54),
        style.background.withOpacity(.91)
      ],
      stops: const [.10, .57, 1],
    ).createShader(rect);
    canvas.drawRect(rect, paint);
    paint.shader = null;

    for (var i = 0; i < 26; i++) {
      final phase = cycle * _tau * (3 + i % 3) + i * 2.39;
      final wave = math.sin(phase);
      final x = (5 + (i * 37 + 11) % 91) * .01 * size.width + wave * 9;
      final y =
          (4 + (i * 53 + 3) % 88) * .01 * size.height + math.cos(phase) * 16;
      final point = Offset(x, y);
      final dot = 1.0 + (i % 3) * .42;
      final opacity = .32 + wave * .21;
      if (style.pixel) {
        paint.color = style.accent.withOpacity(opacity);
        canvas.drawRect(
            Rect.fromCenter(center: point, width: dot * 2, height: dot * 2),
            paint);
      } else {
        paint.color = style.accent.withOpacity(opacity * .27);
        canvas.drawCircle(point, dot * 2.4, paint);
        paint.color = style.accent.withOpacity(opacity);
        canvas.drawCircle(point, dot, paint);
      }
    }

    final pass = ((cycle * 3) % 1 - .22) / .07;
    if (pass > 0 && pass < 1) {
      final head = Offset(size.width * (.73 - pass * .32),
          size.height * .09 + size.shortestSide * .2 * pass);
      final tail =
          head + Offset(size.shortestSide * .17, -size.shortestSide * .11);
      paint.shader = ui.Gradient.linear(tail, head, [
        Colors.transparent,
        style.accent.withOpacity(math.sin(pass * math.pi) * .85),
      ]);
      paint.strokeWidth = 2;
      paint.strokeCap = style.pixel ? StrokeCap.square : StrokeCap.round;
      canvas.drawLine(head, tail, paint);
    }
  }

  @override
  bool shouldRepaint(covariant _SkyPainter oldDelegate) =>
      style != oldDelegate.style || motion != oldDelegate.motion;
}
