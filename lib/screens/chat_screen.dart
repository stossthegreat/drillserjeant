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
        if (lower.contains('procrast')) return 'LISTEN UP, MAGGOT! Procrastination is the enemy of excellence! You think the world owes you something? DROP AND GIVE ME 20! Then get your sorry self back to work. NO EXCUSES, NO DELAYS, NO MERCY!';
        if (lower.contains('plan')) return 'ATTENTION! Here are your ORDERS: 1) Identify the mission 2) Execute with PRECISION 3) Report back COMPLETE! I don\'t want to hear "I tried" - I want RESULTS! MOVE OUT!';
        if (lower.contains('tired') || lower.contains('exhausted')) return 'TIRED?! You think Napoleon\'s army was tired at Austerlitz? You think the Navy SEALs get tired during Hell Week? PUSH THROUGH! Champions are made when nobody\'s watching!';
        if (lower.contains('motivation') || lower.contains('inspire')) return 'MOTIVATION?! Motivation is garbage! DISCIPLINE is what separates winners from quitters! You don\'t need to FEEL like doing it - you just DO IT! That\'s what WARRIORS do!';
        return 'OUTSTANDING, SOLDIER! That\'s the spirit I want to see! Keep pushing those limits and show me what you\'re made of! HOORAH!';
      case 'marcus_aurelius':
        if (lower.contains('procrast')) return 'You waste time lamenting over what has passed and fearing what is to come. But consider this: you have power over your mind - not outside events. Realize this, and you will find strength. The present moment is all you possess. Act now with virtue.';
        if (lower.contains('plan')) return 'Remember, you have power over your mind - not outside events. Confine yourself to the present. Ask yourself: What would a rational, virtuous person do? Then do that. Let your actions spring from duty, not from desire for praise.';
        if (lower.contains('difficult') || lower.contains('hard')) return 'The cucumber becomes bitter when it is overripe, and the corn is damaged by the worm. Such things happen, but they are no different from any other loss. Remember: everything we hear is an opinion, not a fact. Everything we see is perspective, not truth.';
        if (lower.contains('stress') || lower.contains('anxiety')) return 'How much trouble he avoids who does not look to see what his neighbor says or does. The best revenge is not to be like your enemy. Confine yourself to the present.';
        return 'You are acting in accordance with reason. Very well. Remember that acceptance of what has happened is the first step to overcoming the consequences of any misfortune. Continue with purpose.';
      case 'miyamoto_musashi':
        if (lower.contains('procrast')) return 'In strategy, you must know when to strike and when to wait. But delay from fear is death. Today, this moment, is your battlefield. Draw your sword of determination and cut down hesitation. The Way is in training - begin now.';
        if (lower.contains('plan')) return 'Study strategy over the years and achieve the spirit of the warrior. Today you will defeat the enemy in yourself. Know your terrain, know your weapons, know your mind. Then act with the precision of a master swordsman.';
        if (lower.contains('fear') || lower.contains('scared')) return 'Fear is not evil. It tells you what weakness is. And once you know your weakness, you can become stronger as well as kinder. Do not let the body influence the mind. Do not let the mind influence the body.';
        if (lower.contains('focus') || lower.contains('concentration')) return 'The ultimate aim of martial arts is not having to use them. Fix your determination, and the way will show itself. From one thing, know ten thousand things. When you have attained the Way, you will understand all things.';
        return 'Good. The Way is found in death and in life. When you have attained the Way of strategy there will not be one thing you cannot understand. Continue your training with single-minded purpose.';
      case 'confucius':
        if (lower.contains('procrast')) return 'Is it not a pleasure, having learned something, to put it into practice? The superior man understands what is right; the inferior man understands what will sell. Do not worry about others not appreciating your work. Worry about your work not being worthy of appreciation.';
        if (lower.contains('plan')) return 'Real knowledge is to know the extent of one\'s ignorance. He who exercises government by means of his virtue may be compared to the north polar star, which keeps its place while all the stars turn around it. Begin with yourself, and others will follow.';
        if (lower.contains('patience') || lower.contains('slow')) return 'It does not matter how slowly you go as long as you do not stop. The man who moves a mountain begins by carrying away small stones. Choose a job you love, and you will never have to work a day in your life.';
        if (lower.contains('wisdom') || lower.contains('learn')) return 'By three methods we may learn wisdom: First, by reflection, which is noblest; Second, by imitation, which is easiest; and third by experience, which is the bitterest.';
        return 'The man who asks a question is a fool for five minutes; the man who does not ask a question remains a fool forever. You are on the path of wisdom. Study the past if you would define the future.';
      case 'abraham_lincoln':
        if (lower.contains('procrast')) return 'My friends, I have learned that a house divided against itself cannot stand - and that includes the house of your own mind. You cannot escape the responsibility of tomorrow by evading it today. The time for action is now, not tomorrow.';
        if (lower.contains('plan')) return 'I am naturally inclined to melancholy, but I have learned that the best way to predict the future is to create it. Whatever you are, be a good one. Determine that the thing can and shall be done, and then find the way.';
        if (lower.contains('failure') || lower.contains('mistake')) return 'My great concern is not whether you have failed, but whether you are content with your failure. I have learned that people will forget what you said, people will forget what you did, but people will never forget how you made them feel.';
        if (lower.contains('persever') || lower.contains('keep going')) return 'That some achieve great success, is proof to all that others can achieve it as well. Always bear in mind that your own resolution to succeed is more important than any other one thing.';
        return 'I am a slow walker, but I never walk backwards. You are doing well - remember that most folks are as happy as they make up their minds to be. Keep moving forward with purpose and integrity.';
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