json structure:

JSON:
[
{
"question_name": "Multiple Choice Question",
"question_type": "multiple_choice_question",
"question_text": "Which is the correct form of the verb?",
"points_possible": 10,
"answers": [
{
"text": "goes",
"weight": 0
},
{
"text": "goed",
"weight": 0
},
{
"text": "going",
"weight": 0
},
{
"text": "went",
"weight": 100
}
]
},
{
"question_name": "True or False Question",
"question_type": "true_false_question",
"question_text": "The Earth is flat.",
"points_possible": 5,
"answers": [
{
"text": "true",
"weight": 0
},
{
"text": "false",
"weight": 100
}
]
},
{
"question_name": "Short Answer Question",
"question_type": "short_answer_question",
"question_text": "What is the capital of France?",
"points_possible": 5,
"answers": [
{
"text": "Paris",
"weight": 100
}
]
},
{
"question_name": "Essay Question",
"question_type": "essay_question",
"question_text": "Explain the importance of learning a second language.",
"points_possible": 15,
"answers": []
},
{

    "question_name": "Fill in the Blank Question",
    "question_type": "fill_in_multiple_blanks_question",
    "question_text": "The capital of [blank1] is [blank2].",
    "points_possible": 10,
    "variables": ["blank1", "blank2"],
    "match_case": false,
    "answers": [
      {
        "blank_id": "blank1",
        "answer_text": "France",
        "weight": 100
      },
      {
        "blank_id": "blank2",
        "answer_text": "Paris",
        "weight": 100
      }
    ],
    "correct_comments": "Correct! Well done.",
    "incorrect_comments": "Please review the capitals of European countries."

},
{

    "question_name": "Fill in the Blank Question",
    "question_type": "fill_in_multiple_blanks_question",
    "question_text": "The first blank is: [blank1] the second blank is: [blank2].",
    "points_possible": 10,
    "variables": ["blank1", "blank2"],
    "match_case": false,
    "answers": [
      {
        "blank_id": "blank1",
        "answer_text": "blank 1",
        "weight": 100
      },
      {
        "blank_id": "blank2",
        "answer_text": "blank 2",
        "weight": 100
      }
    ],
    "correct_comments": "Correct! Well done.",
    "incorrect_comments": "Please review the capitals of European countries."

},
{
"question_name": "Matching Question",
"question_type": "matching_question",
"question_text": "Match the countries with their capitals.",
"points_possible": 10,
"answers": [
{
"answer_match_left": "France",
"answer_match_right": "Paris"
},
{
"answer_match_left": "Germany",
"answer_match_right": "Berlin"
},
{
"answer_match_left": "Italy",
"answer_match_right": "Rome"
},
{
"answer_match_left": "Spain",
"answer_match_right": "Madrid"
}
]
},
{
"question_name": "Drop-down Question",
"question_type": "multiple_dropdowns_question",
"question_text": "The [animal] jumped over the [object].",
"points_possible": 5,
"variables": ["animal", "object"],
"answers": [
{
"blank_id": "animal",
"answer_text": "cow",
"weight": 100
},
{
"blank_id": "animal",
"answer_text": "dog",
"weight": 0
},
{
"blank_id": "animal",
"answer_text": "cat",
"weight": 0
},
{
"blank_id": "animal",
"answer_text": "fox",
"weight": 0
},
{
"blank_id": "object",
"answer_text": "moon",
"weight": 100
},
{
"blank_id": "object",
"answer_text": "fence",
"weight": 0
},
{
"blank_id": "object",
"answer_text": "river",
"weight": 0
},
{
"blank_id": "object",
"answer_text": "tree",
"weight": 0
}
],
"correct_comments": "¡Correcto!",
"incorrect_comments": "Por favor, inténtalo de nuevo."
}
]
