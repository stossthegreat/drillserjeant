  Future<Map<String, dynamic>> tickHabit(String habitId, {String? idempotencyKey}) async {
    final headers = Map<String, String>.from(_headers);
    if (idempotencyKey != null) {
      headers['Idempotency-Key'] = idempotencyKey;
    }

    final response = await http.post(
      Uri.parse('$baseUrl/v1/habits/$habitId/tick'),
      headers: headers,
      body: json.encode({}),
    );
    
    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to tick habit: ${response.body}');
    }
  }
