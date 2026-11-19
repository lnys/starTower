import 'dart:async';
import 'dart:js_interop';

@JS('window.matchMedia')
external _MediaQueryList _matchMedia(JSString query);

extension type _MediaQueryList(JSObject _) implements JSObject {
  external JSBoolean get matches;
  external void addEventListener(JSString type, JSFunction callback);
  external void removeEventListener(JSString type, JSFunction callback);
}

Stream<bool> browserReducedMotion() {
  final media = _matchMedia('(prefers-reduced-motion: reduce)'.toJS);
  late final StreamController<bool> changes;
  final listener = (() => changes.add(media.matches.toDart)).toJS;
  changes = StreamController<bool>(
    onListen: () {
      media.addEventListener('change'.toJS, listener);
      changes.add(media.matches.toDart);
    },
    onCancel: () => media.removeEventListener('change'.toJS, listener),
  );
  return changes.stream;
}
