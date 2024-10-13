import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Post } from '@/app/api/create-quiz/route'; // Importa la server action

const CreateQuizForm = async() => {
  return (
    <form 
      className="flex flex-col gap-4" 
      action={Post} // Asigna la server action directamente al action del formulario
    >
      <div>
        <Label htmlFor="apiToken">API Token</Label>
        <Input
          type="text"
          id="apiToken"
          name="apiToken"
          className="mt-2"
          required
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
          placeholder='Enter the questions JSON (e.g. [{"question": "What is..."}])'
        />
      </div>

      <Button type="submit">Create Quiz</Button>
    </form>
  );
};

export default CreateQuizForm;
