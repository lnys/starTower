import 'dart:convert';

import 'package:flutter/services.dart';

const towerLanguages = {'zh-CN': '简体中文', 'en': 'English', 'ja': '日本語'};

String resolveTowerLanguage(String? value) =>
    towerLanguages.containsKey(value) ? value! : 'zh-CN';

class TowerTranslations {
  final Map<String, List<String>> entries;
  final List<(String, RegExp)> _patterns;

  TowerTranslations([this.entries = const {}])
      : _patterns = [
          for (final key in entries.keys.toList()
            ..sort((a, b) => b
                .replaceAll(_placeholder, '')
                .length
                .compareTo(a.replaceAll(_placeholder, '').length)))
            if (_placeholder.hasMatch(key))
              (
                key,
                RegExp(
                    '^${key.split(_placeholder).map(RegExp.escape).join('((?:(?! · ).)+?)')}'
                    r'$')
              ),
        ];

  static final _placeholder = RegExp(r'\{(\d+)\}');

  static Future<TowerTranslations> load() async {
    final json =
        jsonDecode(await rootBundle.loadString('assets/data/translations.json'))
            as Map<String, dynamic>;
    return TowerTranslations(json
        .map((key, value) => MapEntry(key, List<String>.from(value as List))));
  }

  String text(String language, String source, [List<Object?> args = const []]) {
    final message = (language == 'zh-CN'
            ? source
            : entries[source]?[language == 'en' ? 0 : 1]) ??
        source;
    return message.replaceAllMapped(_placeholder, (match) {
      final index = int.parse(match[1]!);
      return index < args.length
          ? args[index]?.toString() ?? match[0]!
          : match[0]!;
    });
  }

  // Keep the engine locale-independent; translate its result only for display.
  String message(String language, String source) {
    if (language == 'zh-CN' || source.isEmpty) return source;
    if (entries.containsKey(source)) return text(language, source);
    for (final (key, pattern) in _patterns) {
      final match = pattern.firstMatch(source);
      if (match != null) {
        return text(language, key, [
          for (var i = 1; i <= match.groupCount; i++)
            message(language, match[i]!),
        ]);
      }
    }
    for (final separator in ['\n', ' · ']) {
      if (source.contains(separator)) {
        return source
            .split(separator)
            .map((part) => message(language, part))
            .join(separator);
      }
    }
    return source;
  }
}
