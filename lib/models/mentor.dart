import 'package:flutter/material.dart';

class Mentor {
  final String id;
  final String name;
  final String title;
  final String description;
  final Color primaryColor;
  final Color accentColor;
  final String avatarAsset;
  final String signature;
  final String philosophy;
  final List<String> quickResponses;

  const Mentor({
    required this.id,
    required this.name,
    required this.title,
    required this.description,
    required this.primaryColor,
    required this.accentColor,
    required this.avatarAsset,
    required this.signature,
    required this.philosophy,
    required this.quickResponses,
  });
}

class LegendaryMentors {
  static const drillSergeant = Mentor(
    id: 'drill_sergeant',
    name: 'Drill Sergeant',
    title: 'The Iron Will',
    description: 'Military precision, tough love, results-focused',
    primaryColor: Color(0xFF1A365D), // Steel Blue
    accentColor: Color(0xFF38A169), // Military Green
    avatarAsset: 'assets/avatars/drill_sergeant.png',
    signature: 'NO EXCUSES, RECRUIT!',
    philosophy: 'Discipline equals freedom. Push through the pain.',
    quickResponses: [
      "Drop and give me 20!",
      "Suck it up, buttercup!",
      "Victory through discipline!",
      "Move it, move it, move it!"
    ],
  );

  static const marcusAurelius = Mentor(
    id: 'marcus_aurelius',
    name: 'Marcus Aurelius',
    title: 'The Stoic Emperor',
    description: 'Philosophical wisdom, inner strength, rational thinking',
    primaryColor: Color(0xFF553C9A), // Deep Purple
    accentColor: Color(0xFFD69E2E), // Imperial Gold
    avatarAsset: 'assets/avatars/marcus_aurelius.png',
    signature: 'The universe is transformation.',
    philosophy: 'You have power over your mind - not outside events. Realize this, and you will find strength.',
    quickResponses: [
      "What would virtue do here?",
      "This too shall pass.",
      "Focus on what you control.",
      "Let reason guide you."
    ],
  );

  static const miyamotoMusashi = Mentor(
    id: 'miyamoto_musashi',
    name: 'Miyamoto Musashi',
    title: 'The Way of the Sword',
    description: 'Strategic thinking, mastery through practice, warrior focus',
    primaryColor: Color(0xFF742A2A), // Deep Red
    accentColor: Color(0xFF1A202C), // Warrior Black
    avatarAsset: 'assets/avatars/miyamoto_musashi.png',
    signature: 'The way is in training.',
    philosophy: 'Today I will win over myself of yesterday.',
    quickResponses: [
      "Cut through hesitation.",
      "Practice makes perfect.",
      "Strategy over strength.",
      "One strike, one kill."
    ],
  );

  static const confucius = Mentor(
    id: 'confucius',
    name: 'Confucius',
    title: 'The Great Teacher',
    description: 'Harmony, social wisdom, ethical development',
    primaryColor: Color(0xFFDD6B20), // Warm Orange
    accentColor: Color(0xFF38A169), // Jade Green
    avatarAsset: 'assets/avatars/confucius.png',
    signature: 'Learning without thinking is useless.',
    philosophy: 'The man who moves a mountain begins by carrying away small stones.',
    quickResponses: [
      "Seek harmony within.",
      "Small steps, great journey.",
      "Wisdom through reflection.",
      "Balance is key."
    ],
  );

  static const abrahamLincoln = Mentor(
    id: 'abraham_lincoln',
    name: 'Abraham Lincoln',
    title: 'The Honest Leader',
    description: 'Perseverance, moral clarity, humble strength',
    primaryColor: Color(0xFF2D3748), // Deep Navy
    accentColor: Color(0xFF8B4513), // Honest Brown
    avatarAsset: 'assets/avatars/abraham_lincoln.png',
    signature: 'I am a slow walker, but I never walk back.',
    philosophy: 'Nearly all men can stand adversity, but if you want to test a man\'s character, give him power.',
    quickResponses: [
      "Keep splitting those rails.",
      "Honest work pays off.",
      "Perseverance conquers all.",
      "Stay humble, stay strong."
    ],
  );

  static List<Mentor> get all => [
    drillSergeant,
    marcusAurelius,
    miyamotoMusashi,
    confucius,
    abrahamLincoln,
  ];

  static Mentor getById(String id) {
    return all.firstWhere((mentor) => mentor.id == id, orElse: () => drillSergeant);
  }
} 