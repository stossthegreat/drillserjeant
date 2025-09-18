import 'dart:convert';

class TtsProvider {
  String? _lastHash;

  Future<void> playPreset(String id) async {
    // Read last hash to avoid unused field warning
    final _ = _lastHash;
    await Future<void>.delayed(const Duration(milliseconds: 10));
  }

  Future<void> speakDynamic(String text, {String voiceVariant = 'default'}) async {
    _lastHash = base64Url.encode(utf8.encode('$voiceVariant:$text'));
    await Future<void>.delayed(const Duration(milliseconds: 10));
  }
} 