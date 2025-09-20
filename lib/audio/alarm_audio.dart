import 'dart:async';
import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/material.dart';

class AlarmAudioProvider {
  static final AlarmAudioProvider _instance = AlarmAudioProvider._internal();
  factory AlarmAudioProvider() => _instance;
  AlarmAudioProvider._internal();

  final AudioPlayer _player = AudioPlayer();
  bool _userHasInteracted = false;
  
  void markUserInteraction() {
    _userHasInteracted = true;
  }

  Future<void> playAlarmSound() async {
    if (!_userHasInteracted) {
      print('⚠️ User interaction required before playing alarm audio');
      return;
    }
    
    try {
      await _player.stop();
      
      // Use a simple notification sound URL or asset
      // For web, we need a proper audio file URL
      const soundUrl = 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav';
      await _player.play(UrlSource(soundUrl));
      
      // Set to loop for alarm persistence
      await _player.setReleaseMode(ReleaseMode.loop);
      
    } catch (e) {
      print('Alarm audio error: $e');
      // Fallback: show visual alert if audio fails
      _showVisualAlert();
    }
  }

  Future<void> stopAlarm() async {
    try {
      await _player.stop();
      await _player.setReleaseMode(ReleaseMode.release);
    } catch (e) {
      print('Stop alarm error: $e');
    }
  }

  void _showVisualAlert() {
    print('🚨 ALARM! 🚨 (Audio not available)');
  }

  Future<void> testAlarmSound() async {
    if (!_userHasInteracted) {
      print('⚠️ User interaction required before playing alarm audio');
      return;
    }
    
    try {
      await playAlarmSound();
      // Stop after 3 seconds for test
      Future.delayed(const Duration(seconds: 3), () => stopAlarm());
    } catch (e) {
      print('Test alarm error: $e');
    }
  }
}

// Widget to prompt user interaction for alarm audio
class AlarmAudioPermissionButton extends StatefulWidget {
  final VoidCallback? onPermissionGranted;
  
  const AlarmAudioPermissionButton({
    super.key,
    this.onPermissionGranted,
  });

  @override
  State<AlarmAudioPermissionButton> createState() => _AlarmAudioPermissionButtonState();
}

class _AlarmAudioPermissionButtonState extends State<AlarmAudioPermissionButton> {
  bool _permissionGranted = false;

  @override
  Widget build(BuildContext context) {
    if (_permissionGranted) {
      return const Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.volume_up, color: Colors.green, size: 16),
          SizedBox(width: 4),
          Text('Audio Enabled', style: TextStyle(color: Colors.green, fontSize: 12)),
        ],
      );
    }

    return ElevatedButton.icon(
      onPressed: () async {
        AlarmAudioProvider().markUserInteraction();
        await AlarmAudioProvider().testAlarmSound();
        setState(() {
          _permissionGranted = true;
        });
        widget.onPermissionGranted?.call();
      },
      icon: const Icon(Icons.volume_up, size: 16),
      label: const Text('Enable Alarm Audio', style: TextStyle(fontSize: 12)),
      style: ElevatedButton.styleFrom(
        backgroundColor: Colors.orange.withValues(alpha: 0.2),
        foregroundColor: Colors.orange,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        minimumSize: const Size(0, 32),
      ),
    );
  }
}
 