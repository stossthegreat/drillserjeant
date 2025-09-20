import 'package:flutter/material.dart';
import '../design/glass.dart';
import '../services/api_client.dart';
import '../audio/tts_provider.dart';
import '../models/mentor.dart';
import '../widgets/mentor_selector.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  Mentor selectedMentor = LegendaryMentors.drillSergeant;
  final List<Map<String, String>> chat = [
    {'role': 'sys', 'text': 'Welcome to DrillSergeantX. Choose your legendary mentor above.'},
  ];
  final controller = TextEditingController();
  bool isLoading = false;
  
  List<String> get quicks => selectedMentor.quickResponses;

  final tts = TtsProvider();

  @override
  void initState() {
    super.initState();
    apiClient.setAuthToken('valid-token');
  }

  void _onMentorChanged(Mentor mentor) {
    setState(() {
      selectedMentor = mentor;
      // Add system message about mentor change
      chat.add({
        'role': 'sys', 
        'text': '${mentor.name} has joined you. ${mentor.signature}',
      });
    });
  }

  void _send(String text) async {
    if (text.trim().isEmpty || isLoading) return;
    
    setState(() {
      chat.add({'role': 'user', 'text': text.trim()});
      isLoading = true;
    });
    controller.clear();

    try {
      // Call real API with mentor personality
      final response = await apiClient.sendChatMessage(
        text.trim(),
        mode: _mentorToMode(selectedMentor.id),
      );
      
      final replyText = (response['reply'] ?? 'Acknowledged. Keep pushing.').toString();
      final voiceData = response['voice']; // New format
      final audioPresetId = response['audioPresetId']; // Old format
      
      // Defensive null checking
      if (replyText.isEmpty) {
        throw Exception('Empty reply text received from API');
      }
      
      print('🎯 Chat response received: ${response.keys}');
      print('🎯 Reply text: ${replyText.length > 50 ? replyText.substring(0, 50) + '...' : replyText}');
      print('🎯 Voice data: $voiceData');
      print('🎯 Audio preset ID: $audioPresetId');
      
      setState(() {
        chat.add({
          'role': 'sgt', 
          'text': replyText,
          'voice': voiceData?.toString() ?? '', // Convert to string with null fallback
          'audioPresetId': audioPresetId?.toString() ?? '', // Ensure string type with null fallback
        });
        isLoading = false;
      });
      
      // Auto-play voice if available (try new format first, then old)
      try {
        if (voiceData is Map<String, dynamic> && voiceData['url'] != null) {
          await tts.playFromUrl(voiceData['url'].toString());
        } else if (audioPresetId != null && audioPresetId.toString().isNotEmpty) {
          await tts.playPreset(audioPresetId.toString());
        }
      } catch (e) {
        print('Auto-play voice error: $e');
      }
      
    } catch (e) {
      // Enhanced error debugging
      print('❌ Chat error details: $e');
      print('❌ Error type: ${e.runtimeType}');
      print('❌ API base URL: ${apiClient.getBaseUrl()}');
      
      // Surface error for debugging
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Chat error: $e'),
          duration: Duration(seconds: 5),
        ),
      );
      final reply = _craftReply(text.trim());
      setState(() {
        chat.add({'role': 'sgt', 'text': reply});
        isLoading = false;
      });
    }
  }



  String _mentorToMode(String mentorId) {
    switch (mentorId) {
      case 'drill_sergeant':
        return 'strict';
      case 'marcus_aurelius':
        return 'light';
      case 'miyamoto_musashi':
        return 'strict';
      case 'confucius':
        return 'balanced';
      case 'abraham_lincoln':
        return 'balanced';
      default:
        return 'balanced';
    }
  }

  String _craftReply(String msg) {
    final lower = msg.toLowerCase();
    switch (selectedMentor.id) {
      case 'drill_sergeant':
        if (lower.contains('procrast')) return 'Drop and give me 20! Stop making excuses and GET MOVING! 3 steps: 1) Close distractions. 2) 5‑min starter. 3) 25‑min block. MOVE IT!';
        if (lower.contains('plan')) return 'Orders: 1) Pick ONE mission. 2) 25‑min assault. 3) Report COMPLETE! NO EXCUSES, RECRUIT!';
        return 'Outstanding work, soldier! Keep that fire burning!';
      case 'marcus_aurelius':
        if (lower.contains('procrast')) return 'Consider: What would virtue do here? 1) Accept the moment. 2) Choose reason over emotion. 3) Begin with wisdom.';
        if (lower.contains('plan')) return 'Reflect: 1) What serves the greater good? 2) Focus on what you control. 3) Act with purpose.';
        return 'Well reasoned. The universe rewards virtuous action.';
      case 'miyamoto_musashi':
        if (lower.contains('procrast')) return 'Cut through hesitation like a blade through water. 1) Assess the situation. 2) Choose your strategy. 3) Execute with precision.';
        if (lower.contains('plan')) return 'Strategy: 1) Know your enemy (distraction). 2) Train your mind. 3) Strike when ready.';
        return 'The way is in training. Continue your practice.';
      case 'confucius':
        if (lower.contains('procrast')) return 'Seek harmony within. 1) Small steps, great journey. 2) Balance effort and rest. 3) Progress through patience.';
        if (lower.contains('plan')) return 'Wisdom: 1) Learn through reflection. 2) Apply with humility. 3) Share what you discover.';
        return 'Learning without thinking is useless. You are progressing well.';
      case 'abraham_lincoln':
        if (lower.contains('procrast')) return 'Keep splitting those rails! 1) Honest work beats excuses. 2) Start small, think big. 3) Perseverance conquers all.';
        if (lower.contains('plan')) return 'Simple plan: 1) Pick your task. 2) Work steady and honest. 3) See it through to the end.';
        return 'I am a slow walker, but I never walk back. Keep going!';
      default:
        return 'Acknowledged. Keep pushing forward.';
    }
  }

  Future<void> _speakLastReply() async {
    // Find last sgt message
    for (int i = chat.length - 1; i >= 0; i--) {
      if (chat[i]['role'] == 'sgt') {
        // Try to use stored voice first
        final message = chat[i];
        final voiceData = message['voice'];
        final audioPresetId = message['audioPresetId'];
        
        bool voicePlayed = false;
        
        // Use audioPresetId if available
        if (audioPresetId != null && audioPresetId.toString().isNotEmpty && audioPresetId.toString() != 'null') {
          try {
            await tts.playPreset(audioPresetId.toString());
            voicePlayed = true;
          } catch (e) {
            print('Preset playback error: $e');
          }
        }
        
        if (!voicePlayed) {
          // Fallback to generating new TTS
          final text = (message['text'] ?? '').toString();
          if (text.isNotEmpty) {
            final mode = _mentorToMode(selectedMentor.id);
            await tts.speakDynamic(text, voiceVariant: mode);
          }
        }
        break;
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: GlassAppBar(
        title: '${selectedMentor.name} - ${selectedMentor.title}',
      ),
      body: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            // Legendary Mentors Selector
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    selectedMentor.primaryColor.withOpacity(0.1),
                    selectedMentor.accentColor.withOpacity(0.1),
                  ],
                ),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: selectedMentor.primaryColor.withOpacity(0.3),
                  width: 1,
                ),
              ),
              child: MentorSelector(
                selectedMentor: selectedMentor,
                onMentorChanged: _onMentorChanged,
              ),
            ),
            const SizedBox(height: 8),
            OutlinedButton.icon(
              onPressed: isLoading ? null : _speakLastReply,
              icon: const Icon(Icons.volume_up, size: 16),
              label: const Text('Speak', style: TextStyle(fontSize: 12)),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                visualDensity: VisualDensity.compact,
                minimumSize: const Size(0, 32),
              ),
            ),
            const SizedBox(height: 6),
            Expanded(
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.4),
                  border: Border.all(color: Colors.white.withOpacity(0.12)),
                  borderRadius: BorderRadius.circular(16),
                ),
                padding: const EdgeInsets.all(10),
                child: ListView.builder(
                  itemCount: chat.length + (isLoading ? 1 : 0),
                  itemBuilder: (context, i) {
                    if (isLoading && i == chat.length) {
                      return Align(
                        alignment: Alignment.centerLeft,
                        child: Container(
                          margin: const EdgeInsets.symmetric(vertical: 4),
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.06),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: Colors.white.withOpacity(0.12)),
                          ),
                          child: const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          ),
                        ),
                      );
                    }
                    
                    final m = chat[i];
                    final isUser = m['role'] == 'user';
                    final isSgt = m['role'] == 'sgt';
                    return Align(
                      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                      child: Container(
                        margin: const EdgeInsets.symmetric(vertical: 4),
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: isUser
                              ? Colors.amber
                              : isSgt
                                  ? Colors.white.withOpacity(0.06)
                                  : Colors.white.withOpacity(0.06),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: Colors.white.withOpacity(0.12)),
                        ),
                        child: Text(
                          m['text'] ?? '',
                          style: TextStyle(color: isUser ? Colors.black : Colors.white),
                        ),
                      ),
                    );
                  },
                ),
              ),
            ),
            const SizedBox(height: 6),
            SizedBox(
              height: 36,
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
              children: quicks
                      .map((q) => Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 4),
                            child: OutlinedButton(
                        onPressed: isLoading ? null : () => _send(q),
                              style: OutlinedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                                minimumSize: const Size(0, 30),
                                visualDensity: VisualDensity.compact,
                              ),
                              child: Text(q, style: const TextStyle(fontSize: 11)),
                            ),
                      ))
                  .toList(),
                ),
              ),
            ),
            const SizedBox(height: 6),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: controller,
                    enabled: !isLoading,
                    decoration: const InputDecoration(hintText: 'Type your report...'),
                    onSubmitted: _send,
                  ),
                ),
                const SizedBox(width: 8),
                ElevatedButton(
                  onPressed: isLoading ? null : () => _send(controller.text),
                  style: ElevatedButton.styleFrom(minimumSize: const Size(0, 40)),
                  child: isLoading 
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('Send'),
                ),
              ],
            )
          ],
        ),
      ),
    );
  }
} 