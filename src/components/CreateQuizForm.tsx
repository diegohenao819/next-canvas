'use client'; // This is needed since the form includes client-side logic

import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { useState } from 'react';

const CreateQuizForm = () => {
  const [apiToken, setApiToken] = useState('');
  const [courseId, setCourseId] = useState('');
  const [questions, setQuestions] = useState('');
  const [quizTitle, setQuizTitle] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = {
      apiToken,
      courseId,
      quizTitle,
      questions: JSON.parse(questions), // Convert string to JSON
    };

    try {
      const res = await fetch('/api/create-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await res.json();
      console.log('Quiz created successfully:', result);
    } catch (error) {
      console.error('Error creating quiz:', error);
    }
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <div>
        <Label htmlFor="apiToken">API Token</Label>
        <Input
          type="text"
          id="apiToken"
          name="apiToken"
          className="mt-2"
          required
          value={apiToken}
          onChange={(e) => setApiToken(e.target.value)}
          placeholder="Enter your API Token"
        />
      </div>

      <div>
        <Label htmlFor="courseId">Course ID</Label>
        <Input
          type="text"
          id="courseId"
          name="courseId"
          className="mt-2"
          required
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          placeholder="Enter the Course ID"
        />
      </div>

      <div>
        <Label htmlFor="quizTitle">Quiz Title</Label>
        <Input
          type="text"
          id="quizTitle"
          name="quizTitle"
          className="mt-2"
          required
          value={quizTitle}
          onChange={(e) => setQuizTitle(e.target.value)}
          placeholder="Enter the Quiz Title"
        />
      </div>

      <div>
        <Label htmlFor="questions">Questions (JSON Format)</Label>
        <Textarea
          id="questions"
          name="questions"
          className="mt-2"
          required
          value={questions}
          onChange={(e) => setQuestions(e.target.value)}
          placeholder='Enter the questions JSON (e.g. [{"question": "What is..."}])'
        />
      </div>

      <Button type="submit">Create Quiz</Button>
    </form>
  );
};

export default CreateQuizForm;
