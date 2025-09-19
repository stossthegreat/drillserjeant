import 'dart:convert';
import 'package:audioplayers/audioplayers.dart';
import '../services/api_client.dart';

class TtsProvider {
  String? _lastHash;
  final AudioPlayer _player = AudioPlayer();

  Future<void> playPreset(String id) async {
    final _ = _lastHash; // keep analyzer happy
    try {
      final res = await apiClient.getVoicePreset(id);
      final url = (res['url'] ?? '').toString();
      if (url.isEmpty) return;
      await _player.stop();
      if (url.startsWith('data:audio')) {
        final base64Data = url.split(',').last;
        final bytes = base64Decode(base64Data);
        await _player.play(BytesSource(bytes));
      } else {
        await _player.play(UrlSource(url));
      }
    } catch (e) {
      // ignore: avoid_print
      print('TTS preset error: $e');
    }
  }

  Future<void> speakDynamic(String text, {String voiceVariant = 'balanced'}) async {
    _lastHash = base64Url.encode(utf8.encode('$voiceVariant:$text'));
    try {
      final res = await apiClient.ttsVoice(text, voice: voiceVariant);
      final url = (res['url'] ?? res['audio']?['url'] ?? '').toString();
      if (url.isEmpty) return;
      await _player.stop();
      if (url.startsWith('data:audio')) {
        final base64Data = url.split(',').last;
        final bytes = base64Decode(base64Data);
        await _player.play(BytesSource(bytes));
      } else {
        await _player.play(UrlSource(url));
      }
    } catch (e) {
      // ignore: avoid_print
      print('TTS dynamic error: $e');
    }
  }
} 